"""
Recruiter API (Recruiter role only; System Admins have their own portal and cannot call it).

    POST /recruiter/candidates/invites   create an invite link + emailed OTP for a candidate
    POST /recruiter/send-email           send an email through the configured SMTP gateway
"""
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.schemas import InviteCreateRequest, InviteOut
from app.core.config import settings
from app.core.roles import PORTAL_RECRUITER
from app.core.security import generate_opaque_token, hash_opaque_token
from app.db.session import get_db
from app.models.auth import CandidateInvite, StaffUser, utcnow
from app.services import audit
from app.services import email as email_service
from app.services import runtime_settings as rt
from app.services.auth_core import log_dev_otp, mask_email, norm_email
from app.services.otp import PURPOSE_CANDIDATE_LOGIN, issue_otp

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])


class EmailSendRequest(BaseModel):
    recipientEmail: str
    recipientName: Optional[str] = "Candidate"
    subject: str
    bodyHtml: str
    # Accepted for backwards compatibility but IGNORED - the SMTP gateway is configured by the System Admin.
    smtpHost: Optional[str] = None
    smtpPort: Optional[int] = None
    smtpUser: Optional[str] = None
    smtpPassword: Optional[str] = None


@router.post("/candidates/invites", response_model=InviteOut, status_code=201)
def create_invite(req: InviteCreateRequest, background: BackgroundTasks, request: Request,
                  actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    email = norm_email(req.email)
    token = generate_opaque_token()
    candidate_id = req.candidateId or f"cand-{int(utcnow().timestamp() * 1000)}"
    expires_in_hours = req.expiresInHours or rt.get_int("linkExpirationHours")  # default is a System-Admin setting
    invite = CandidateInvite(
        candidate_id=candidate_id,
        name=req.name.strip(),
        email=email,
        phone=req.phone,
        assessment_id=req.assessmentId,
        token_hash=hash_opaque_token(token),
        expires_at=utcnow() + timedelta(hours=expires_in_hours),
        created_by=actor.id,
    )
    db.add(invite)
    db.commit()

    challenge, code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/?assessment={req.assessmentId}&invite={token}"
    subject, body = email_service.candidate_invite_email(
        invite.name, link, code, rt.get_int("otpExpireMinutes"), f"in {expires_in_hours} hours")
    background.add_task(email_service.send_email, email, subject, body)
    log_dev_otp(f"candidate invite {email}", code)
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="candidate.invite_create", actor=actor, request=request,
        target_type="candidate_invite", target_id=invite.id,
        summary=f"{actor.email} invited {invite.name} ({mask_email(email)}) to assessment {req.assessmentId}",
        details={"candidateId": candidate_id, "assessmentId": req.assessmentId,
                 "expiresInHours": expires_in_hours})

    return InviteOut(
        inviteId=invite.id,
        candidateId=candidate_id,
        link=link,
        expiresAt=invite.expires_at.isoformat(),  # timezone-aware UTC (+00:00)
        otpDestination=mask_email(email),
        devOtp=code if settings.DEV_EXPOSE_OTP else None,
    )


@router.post("/send-email")
def send_email_endpoint(req: EmailSendRequest, request: Request,
                        actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    """
    Delivers an email through the platform's SMTP gateway (System Admin > Settings > Email).
    SMTP host / user / password sent by the client are ignored: a caller must not be able to choose the gateway.
    """
    ok = email_service.send_email(req.recipientEmail, req.subject, req.bodyHtml)
    audit.record_audit(
        db, category=audit.CAT_SYSTEM, action="email.send", actor=actor, request=request, success=bool(ok),
        summary=f"{actor.email} sent an email to {mask_email(req.recipientEmail.strip().lower())}"
                + ("" if ok else " (delivery failed)"),
        details={"subject": req.subject[:200]})
    if ok:
        return {"status": "success", "message": f"Email dispatched via SMTP to {req.recipientEmail}"}
    return {"status": "error", "message": f"SMTP delivery attempted for {req.recipientEmail} but failed"}
