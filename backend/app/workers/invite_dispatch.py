"""Celery tasks that send bulk invitation emails and update delivery status."""
from __future__ import annotations

import logging

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.auth import Assessment, CandidateInvite, InviteBatch, InviteBatchRow, utcnow
from app.services import email as email_service
from app.services import runtime_settings as rt
from app.workers.celery_app import celery_app

logger = logging.getLogger("nexus.invite_dispatch")


def dispatch_invite_email(row_id: str, invite_token: str, otp_code: str = "") -> str:
    """Send one invitation email. Used by Celery task and sync fallback."""
    db = SessionLocal()
    try:
        row = db.query(InviteBatchRow).filter(InviteBatchRow.id == row_id).first()
        if not row:
            return "missing"
        if row.action == "skip":
            row.delivery_status = "DUPLICATE_SKIPPED"
            db.commit()
            _refresh_batch_counts(db, row.batch_id)
            return "skipped"

        invite = db.query(CandidateInvite).filter(CandidateInvite.id == row.invite_id).first() if row.invite_id else None
        assessment = db.query(Assessment).filter(Assessment.id == (invite.assessment_id if invite else "")).first()
        title = assessment.title if assessment else "Assessment"
        duration = assessment.total_duration_minutes if assessment else 60
        sched_date = getattr(assessment, "scheduled_date", None) or ""
        sched_time = getattr(assessment, "start_time", None) or ""
        aid = assessment.id if assessment else ""
        link = (
            f"{settings.FRONTEND_URL.rstrip('/')}/assessment/take?assessment={aid}&invite={invite_token}"
            if aid else
            f"{settings.FRONTEND_URL.rstrip('/')}/assessment/take?invite={invite_token}"
        )
        deadline = invite.expires_at.strftime("%Y-%m-%d %H:%M UTC") if invite and invite.expires_at else ""
        expires_hours = 48
        if invite and invite.expires_at:
            delta = invite.expires_at - utcnow()
            expires_hours = max(1, int(delta.total_seconds() // 3600) or 1)

        code = otp_code or "------"
        subject, body = email_service.candidate_invite_email(
            row.name or "Candidate",
            link,
            code,
            rt.get_int("otpExpireMinutes"),
            f"in {expires_hours} hours",
            assessment_title=title,
            duration_minutes=duration,
            deadline_label=deadline,
            scheduled_date=sched_date,
            start_time=sched_time,
        )
        ok = email_service.send_email(row.email, subject, body)
        if ok:
            row.delivery_status = "SENT"
            row.sent_at = utcnow()
            row.error_message = None
            if invite:
                invite.delivery_status = "SENT"
            status = "sent"
        else:
            row.delivery_status = "FAILED"
            row.error_message = "SMTP delivery failed"
            if invite:
                invite.delivery_status = "FAILED"
            status = "failed"
        db.commit()
        _refresh_batch_counts(db, row.batch_id)
        return status
    except Exception as exc:  # noqa: BLE001
        logger.exception("dispatch_invite_email failed for %s", row_id)
        try:
            row = db.query(InviteBatchRow).filter(InviteBatchRow.id == row_id).first()
            if row:
                row.delivery_status = "FAILED"
                row.error_message = str(exc)[:500]
                db.commit()
                _refresh_batch_counts(db, row.batch_id)
        except Exception:  # noqa: BLE001
            pass
        return "failed"
    finally:
        db.close()


def _refresh_batch_counts(db, batch_id: str) -> None:
    batch = db.query(InviteBatch).filter(InviteBatch.id == batch_id).first()
    if not batch:
        return
    rows = db.query(InviteBatchRow).filter(InviteBatchRow.batch_id == batch_id).all()
    batch.sent = sum(1 for r in rows if r.delivery_status == "SENT")
    batch.failed = sum(1 for r in rows if r.delivery_status == "FAILED")
    batch.skipped = sum(1 for r in rows if r.delivery_status == "DUPLICATE_SKIPPED")
    pending = sum(1 for r in rows if r.delivery_status == "PENDING" and r.action != "skip")
    if pending == 0 and batch.status in ("queued", "processing"):
        batch.status = "completed"
        batch.completed_at = utcnow()
    elif batch.status == "queued":
        batch.status = "processing"
    db.commit()


@celery_app.task(name="invite.dispatch_row", bind=True, max_retries=3, default_retry_delay=30)
def dispatch_invite_row(self, row_id: str, invite_token: str, otp_code: str = ""):
    result = dispatch_invite_email(row_id, invite_token, otp_code)
    if result == "failed" and self.request.retries < self.max_retries:
        raise self.retry(exc=RuntimeError("invite email failed"))
    return result


def enqueue_invite_row(row_id: str, invite_token: str, otp_code: str = "") -> None:
    """Enqueue via Celery when a broker is configured; otherwise send inline."""
    if settings.CELERY_BROKER_URL:
        dispatch_invite_row.delay(row_id, invite_token, otp_code)
    else:
        dispatch_invite_email(row_id, invite_token, otp_code)
