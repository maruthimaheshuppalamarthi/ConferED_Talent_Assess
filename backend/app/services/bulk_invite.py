"""Parse Excel/CSV candidate lists, dedupe, and create invite batches."""
from __future__ import annotations

import csv
import io
import re
from datetime import timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_opaque_token, hash_opaque_token
from app.models.auth import (
    Assessment, Candidate, CandidateInvite, InviteBatch, InviteBatchRow, Job, new_id, utcnow,
)
from app.services import recruiter_pipeline as pipeline
from app.services.otp import PURPOSE_CANDIDATE_LOGIN, issue_otp
from app.services.auth_core import log_dev_otp
from app.workers.invite_dispatch import enqueue_invite_row

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _soft_norm_email(value: str) -> str:
    """Lowercase/trim without raising — validation errors stay on the row."""
    return (value or "").strip().lower()

HEADER_ALIASES = {
    "name": "name", "full name": "name", "candidate name": "name", "candidate": "name",
    "email": "email", "email address": "email", "e-mail": "email",
    "registrationnumber": "registration_number", "registration number": "registration_number",
    "roll no": "registration_number", "roll number": "registration_number", "roll": "registration_number",
    "organization": "organization", "organisation": "organization", "college": "organization",
    "college/organization": "organization", "company": "organization",
    "role": "role_title", "role title": "role_title", "position": "role_title", "job": "role_title",
    "phone": "phone", "mobile": "phone", "phone number": "phone",
    "source": "source", "hiring source": "source", "channel": "source",
}


def _normalize_header(h: str) -> str:
    key = re.sub(r"\s+", " ", (h or "").strip().lower())
    key_compact = key.replace(" ", "")
    return HEADER_ALIASES.get(key) or HEADER_ALIASES.get(key_compact) or key


def _read_rows(filename: str, raw: bytes) -> List[Dict[str, str]]:
    name = (filename or "").lower()
    if name.endswith(".csv"):
        text = raw.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        rows = []
        for r in reader:
            mapped = {_normalize_header(k): (v or "").strip() for k, v in r.items() if k}
            rows.append(mapped)
        return rows

    if name.endswith(".xlsx") or name.endswith(".xls"):
        try:
            from openpyxl import load_workbook
        except ImportError as exc:
            raise ValueError("openpyxl is required for Excel uploads") from exc
        wb = load_workbook(filename=io.BytesIO(raw), read_only=True, data_only=True)
        ws = wb.active
        data = list(ws.iter_rows(values_only=True))
        if not data:
            return []
        headers = [_normalize_header(str(c or "")) for c in data[0]]
        rows = []
        for line in data[1:]:
            mapped = {}
            for i, h in enumerate(headers):
                if not h:
                    continue
                val = line[i] if i < len(line) else ""
                mapped[h] = "" if val is None else str(val).strip()
            if any(mapped.values()):
                rows.append(mapped)
        return rows

    raise ValueError("Unsupported file type. Upload .xlsx, .xls, or .csv")


def _active_invite(db: Session, email: str, assessment_id: str) -> Optional[CandidateInvite]:
    now = utcnow()
    return (
        db.query(CandidateInvite)
        .filter(
            CandidateInvite.email == email,
            CandidateInvite.assessment_id == assessment_id,
            CandidateInvite.revoked.is_(False),
            CandidateInvite.expires_at > now,
        )
        .order_by(CandidateInvite.created_at.desc())
        .first()
    )


def _assessment_for_role(db: Session, role: str, fallback_assessment_id: str) -> Tuple[Optional[str], Optional[str]]:
    """Role names the job. A blank role uses the job chosen in the invite dialog."""
    title = (role or "").strip()
    if not title:
        return fallback_assessment_id, None
    job = db.query(Job).filter(Job.title.ilike(title)).first()
    if job is None:
        return None, f"Role '{title}' does not match a job"
    if job.status != "open":
        return None, f"Job '{job.title}' is not open. Invitations go only to open jobs."
    return job.assessment_id, None


def preview_bulk_upload(
    db: Session, *, assessment_id: str, actor_id: str, filename: str, raw: bytes,
) -> Dict[str, Any]:
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise ValueError("Assessment not found")

    parsed = _read_rows(filename, raw)
    if len(parsed) > settings.BULK_INVITE_MAX_ROWS:
        raise ValueError(f"File has more than {settings.BULK_INVITE_MAX_ROWS} rows")

    batch = InviteBatch(
        id=new_id(), assessment_id=assessment_id, created_by=actor_id,
        filename=filename or "upload.csv", status="preview",
        total_rows=len(parsed),
    )
    db.add(batch)

    seen: Dict[str, int] = {}
    file_dupes = db_dupes = valid = 0
    out_rows: List[Dict[str, Any]] = []

    for idx, raw_row in enumerate(parsed, start=2):  # 1-based spreadsheet row (header = 1)
        name = (raw_row.get("name") or "").strip()
        email_raw = (raw_row.get("email") or "").strip()
        email = _soft_norm_email(email_raw) if email_raw else ""
        role_title = (raw_row.get("role_title") or "").strip() or None
        source = (raw_row.get("source") or "").strip() or None
        row_assessment_id, role_error = _assessment_for_role(db, role_title or "", assessment_id)
        errors: List[str] = []
        if not name:
            errors.append("Name is required")
        if not email:
            errors.append("Email is required")
        elif not EMAIL_RE.match(email):
            errors.append("Invalid email format")
        if role_error:
            errors.append(role_error)

        dedupe_reason = None
        action = "invite"
        delivery = "PENDING"
        dedupe_key = f"{email}|{row_assessment_id or assessment_id}"

        if email and dedupe_key in seen:
            dedupe_reason = "file_duplicate"
            action = "skip"
            delivery = "DUPLICATE_SKIPPED"
            file_dupes += 1
        elif email and not errors:
            seen[dedupe_key] = idx
            active = _active_invite(db, email, row_assessment_id or assessment_id)
            if active:
                dedupe_reason = "active_invite"
                action = "skip"
                delivery = "DUPLICATE_SKIPPED"
                db_dupes += 1
            else:
                valid += 1
        else:
            action = "skip"
            if errors:
                delivery = "FAILED"

        row = InviteBatchRow(
            id=new_id(), batch_id=batch.id, row_number=idx,
            name=name, email=email or email_raw,
            registration_number=(raw_row.get("registration_number") or None),
            organization=(raw_row.get("organization") or None),
            role_title=role_title,
            phone=(raw_row.get("phone") or None),
            source=source,
            assessment_id=row_assessment_id,
            validation_errors=errors or None,
            dedupe_reason=dedupe_reason,
            action=action,
            delivery_status=delivery if action == "skip" else "PENDING",
        )
        db.add(row)
        out_rows.append(_row_out(row))

    batch.valid_rows = valid
    batch.duplicate_in_file = file_dupes
    batch.duplicate_in_db = db_dupes
    batch.skipped = file_dupes + db_dupes
    db.commit()

    return {
        "batchId": batch.id,
        "assessmentId": assessment_id,
        "filename": batch.filename,
        "status": batch.status,
        "totalRows": batch.total_rows,
        "validRows": batch.valid_rows,
        "duplicateInFile": batch.duplicate_in_file,
        "duplicateInDb": batch.duplicate_in_db,
        "skipped": batch.skipped,
        "forceResend": batch.force_resend,
        "rows": out_rows,
    }


def confirm_batch(
    db: Session, *, batch_id: str, actor_id: str,
    force_resend: bool = False, expires_in_hours: Optional[int] = None,
) -> Dict[str, Any]:
    batch = db.query(InviteBatch).filter(InviteBatch.id == batch_id).first()
    if not batch:
        raise ValueError("Batch not found")
    if batch.status not in ("preview", "failed"):
        raise ValueError(f"Batch cannot be confirmed from status '{batch.status}'")

    batch.force_resend = bool(force_resend)
    if expires_in_hours:
        batch.expires_in_hours = int(expires_in_hours)
    rows = (
        db.query(InviteBatchRow)
        .filter(InviteBatchRow.batch_id == batch_id)
        .order_by(InviteBatchRow.row_number.asc())
        .all()
    )

    queued = 0
    tokens: List[Tuple[str, str, str]] = []  # (row_id, token, otp_code)

    for row in rows:
        if row.validation_errors:
            row.action = "skip"
            row.delivery_status = "FAILED"
            row.error_message = "; ".join(row.validation_errors)
            continue

        if row.dedupe_reason == "file_duplicate":
            row.action = "skip"
            row.delivery_status = "DUPLICATE_SKIPPED"
            continue

        if row.dedupe_reason == "active_invite" and not force_resend:
            row.action = "skip"
            row.delivery_status = "DUPLICATE_SKIPPED"
            continue

        target_assessment = row.assessment_id or batch.assessment_id
        if row.dedupe_reason == "active_invite" and force_resend:
            row.action = "force_resend"
            active = _active_invite(db, row.email, target_assessment)
            if active:
                active.revoked = True

        # Create / upsert candidate + invite
        cand_id = f"cand-{new_id()[:12]}"
        existing = db.query(Candidate).filter(
            Candidate.email == row.email, Candidate.assessment_id == target_assessment,
        ).first()
        if existing:
            cand_id = existing.id
            existing.name = row.name or existing.name
            existing.phone = row.phone or existing.phone
            existing.registration_number = row.registration_number or existing.registration_number
            existing.organization = row.organization or existing.organization
            existing.role_title = row.role_title or existing.role_title
            existing.source = row.source or existing.source
            existing.status = "Assessment Sent"
            existing.updated_at = utcnow()
        else:
            pipeline.upsert_invited_candidate(
                db, candidate_id=cand_id, name=row.name, email=row.email,
                phone=row.phone, assessment_id=target_assessment,
            )
            cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
            if cand:
                cand.registration_number = row.registration_number
                cand.organization = row.organization
                cand.role_title = row.role_title
                cand.source = row.source

        token = generate_opaque_token()
        invite = CandidateInvite(
            id=new_id(),
            candidate_id=cand_id,
            name=row.name,
            email=row.email,
            phone=row.phone,
            assessment_id=target_assessment,
            token_hash=hash_opaque_token(token),
            expires_at=utcnow() + timedelta(hours=batch.expires_in_hours),
            created_by=actor_id,
            batch_id=batch.id,
            registration_number=row.registration_number,
            organization=row.organization,
            role_title=row.role_title,
            source=row.source,
            delivery_status="PENDING",
        )
        db.add(invite)
        db.flush()
        _, otp_code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
        row.invite_id = invite.id
        row.candidate_id = cand_id
        row.action = row.action if row.action == "force_resend" else "invite"
        row.delivery_status = "PENDING"
        queued += 1
        tokens.append((row.id, token, otp_code))
        log_dev_otp(f"bulk invite {row.email}", otp_code)

    batch.queued = queued
    batch.status = "queued"
    db.commit()

    for row_id, token, otp_code in tokens:
        enqueue_invite_row(row_id, token, otp_code)

    # Workers (sync or Celery) commit in their own sessions — drop cached rows.
    db.expire_all()
    return batch_status(db, batch_id)


def retry_failed(db: Session, batch_id: str) -> Dict[str, Any]:
    batch = db.query(InviteBatch).filter(InviteBatch.id == batch_id).first()
    if not batch:
        raise ValueError("Batch not found")
    rows = (
        db.query(InviteBatchRow)
        .filter(InviteBatchRow.batch_id == batch_id, InviteBatchRow.delivery_status == "FAILED")
        .all()
    )
    # Failed rows that never got an invite can't be retried without re-confirm; only email failures.
    for row in rows:
        if not row.invite_id:
            continue
        invite = db.query(CandidateInvite).filter(CandidateInvite.id == row.invite_id).first()
        if not invite:
            continue
        # Issue a fresh token by rotating invite hash is destructive for the candidate link.
        # Re-send using a new invite record instead.
        token = generate_opaque_token()
        invite.token_hash = hash_opaque_token(token)
        invite.delivery_status = "PENDING"
        invite.revoked = False
        invite.expires_at = utcnow() + timedelta(hours=batch.expires_in_hours)
        _, otp_code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
        row.delivery_status = "PENDING"
        row.error_message = None
        db.commit()
        enqueue_invite_row(row.id, token, otp_code)
    batch.status = "processing"
    db.commit()
    db.expire_all()
    return batch_status(db, batch_id)


def batch_status(db: Session, batch_id: str) -> Dict[str, Any]:
    batch = db.query(InviteBatch).filter(InviteBatch.id == batch_id).first()
    if not batch:
        raise ValueError("Batch not found")
    rows = (
        db.query(InviteBatchRow)
        .filter(InviteBatchRow.batch_id == batch_id)
        .order_by(InviteBatchRow.row_number.asc())
        .all()
    )
    return {
        "batchId": batch.id,
        "assessmentId": batch.assessment_id,
        "filename": batch.filename,
        "status": batch.status,
        "forceResend": batch.force_resend,
        "expiresInHours": batch.expires_in_hours,
        "totalRows": batch.total_rows,
        "validRows": batch.valid_rows,
        "duplicateInFile": batch.duplicate_in_file,
        "duplicateInDb": batch.duplicate_in_db,
        "queued": batch.queued,
        "sent": batch.sent,
        "failed": batch.failed,
        "skipped": batch.skipped,
        "createdAt": batch.created_at.isoformat() if batch.created_at else None,
        "completedAt": batch.completed_at.isoformat() if batch.completed_at else None,
        "rows": [_row_out(r) for r in rows],
    }


def _row_out(row: InviteBatchRow) -> Dict[str, Any]:
    return {
        "id": row.id,
        "rowNumber": row.row_number,
        "name": row.name,
        "email": row.email,
        "registrationNumber": row.registration_number,
        "organization": row.organization,
        "roleTitle": row.role_title,
        "phone": row.phone,
        "source": row.source,
        "assessmentId": row.assessment_id,
        "validationErrors": row.validation_errors or [],
        "dedupeReason": row.dedupe_reason,
        "action": row.action,
        "deliveryStatus": row.delivery_status,
        "errorMessage": row.error_message,
        "inviteId": row.invite_id,
        "candidateId": row.candidate_id,
        "sentAt": row.sent_at.isoformat() if row.sent_at else None,
    }
