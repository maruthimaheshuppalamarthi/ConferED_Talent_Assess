"""
Candidate API (invite link + emailed OTP -> candidate-scoped JWT).

    POST /candidate/verify       invite token + OTP -> candidate JWT
    POST /candidate/resend-otp   invite token       -> new OTP
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.schemas import (CandidateOut, CandidateResendRequest, CandidateTokenOut,
                             CandidateVerifyRequest, ChallengeOut)
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security import create_candidate_token, hash_opaque_token
from app.db.session import get_db
from app.models.auth import CandidateInvite, OtpChallenge, utcnow
from app.services import email as email_service
from app.services import runtime_settings as rt
from app.services.auth_core import challenge_out, log_dev_otp
from app.services.otp import (PURPOSE_CANDIDATE_LOGIN, check_resend_cooldown, issue_otp,
                              verify_challenge)

router = APIRouter(prefix="/candidate", tags=["Candidate"])


def _invite_from_token(db: Session, token: str) -> CandidateInvite:
    invite = db.query(CandidateInvite).filter(
        CandidateInvite.token_hash == hash_opaque_token(token or "")).first()
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")
    return invite


def _latest_challenge(db: Session, invite: CandidateInvite):
    return (db.query(OtpChallenge)
            .filter(OtpChallenge.purpose == PURPOSE_CANDIDATE_LOGIN, OtpChallenge.subject_id == invite.id)
            .order_by(OtpChallenge.created_at.desc()).first())


@router.post("/verify", response_model=CandidateTokenOut, dependencies=[Depends(rate_limit("candidate"))])
def candidate_verify(req: CandidateVerifyRequest, db: Session = Depends(get_db)):
    invite = _invite_from_token(db, req.inviteToken)
    verify_challenge(db, _latest_challenge(db, invite), PURPOSE_CANDIDATE_LOGIN, req.otp)

    invite.verified_at = utcnow()
    db.commit()
    return CandidateTokenOut(
        accessToken=create_candidate_token(invite.candidate_id, invite.assessment_id, invite.id),
        expiresIn=settings.CANDIDATE_TOKEN_EXPIRE_MINUTES * 60,
        candidate=CandidateOut(id=invite.candidate_id, name=invite.name,
                               email=invite.email, assessmentId=invite.assessment_id),
    )


@router.post("/resend-otp", response_model=ChallengeOut, dependencies=[Depends(rate_limit("candidate"))])
def candidate_resend(req: CandidateResendRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    invite = _invite_from_token(db, req.inviteToken)
    latest = _latest_challenge(db, invite)
    if latest:
        check_resend_cooldown(latest)

    challenge, code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
    subject, body = email_service.candidate_resend_otp_email(invite.name, code, rt.get_int("otpExpireMinutes"))
    background.add_task(email_service.send_email, invite.email, subject, body)
    log_dev_otp(f"candidate resend {invite.email}", code)
    return challenge_out(challenge, invite.email, code)
