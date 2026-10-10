from datetime import timedelta
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_otp, hash_otp, verify_otp_hash
from app.models.auth import OtpChallenge, new_id, utcnow

PURPOSE_STAFF_LOGIN = "staff_login"
PURPOSE_PASSWORD_RESET = "password_reset"
PURPOSE_CANDIDATE_LOGIN = "candidate_login"


def issue_otp(db: Session, purpose: str, subject_id: str) -> Tuple[OtpChallenge, str]:
    """Create a fresh challenge (invalidating older open ones). Returns (challenge, plaintext_code)."""
    db.query(OtpChallenge).filter(
        OtpChallenge.purpose == purpose,
        OtpChallenge.subject_id == subject_id,
        OtpChallenge.consumed.is_(False),
    ).update({"consumed": True})

    challenge_id = new_id()
    code = generate_otp()
    challenge = OtpChallenge(
        id=challenge_id,
        purpose=purpose,
        subject_id=subject_id,
        code_hash=hash_otp(challenge_id, code),
        expires_at=utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(challenge)
    db.commit()
    return challenge, code


def check_resend_cooldown(challenge: OtpChallenge) -> None:
    wait = settings.OTP_RESEND_COOLDOWN_SECONDS - (utcnow() - challenge.created_at).total_seconds()
    if wait > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {int(wait) + 1}s before requesting another code.",
        )


def verify_challenge(db: Session, challenge: Optional[OtpChallenge], purpose: str, code: str) -> OtpChallenge:
    """Validate a submitted OTP. Enforces expiry, attempt limit, single use. Raises HTTPException."""
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired passcode. Please request a new one.")

    if challenge is None or challenge.purpose != purpose or challenge.consumed:
        raise invalid
    if challenge.expires_at < utcnow():
        challenge.consumed = True
        db.commit()
        raise invalid
    if challenge.attempts >= settings.OTP_MAX_ATTEMPTS:
        challenge.consumed = True
        db.commit()
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail="Too many incorrect attempts. Please request a new passcode.")

    code = (code or "").strip()
    if not (code.isdigit() and len(code) == settings.OTP_LENGTH and verify_otp_hash(challenge.id, code, challenge.code_hash)):
        challenge.attempts += 1
        left = settings.OTP_MAX_ATTEMPTS - challenge.attempts
        if left <= 0:
            challenge.consumed = True
        db.commit()
        detail = "Incorrect passcode." + (f" {left} attempt(s) left." if left > 0 else " Please request a new passcode.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    challenge.consumed = True  # single use
    db.commit()
    return challenge
