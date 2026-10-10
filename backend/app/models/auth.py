import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import declarative_base

AuthBase = declarative_base()


def utcnow() -> datetime:
    """Naive UTC timestamp (SQLite-friendly, consistent across the auth layer)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_id() -> str:
    return uuid.uuid4().hex


class StaffUser(AuthBase):
    """Admin / Recruiter / Super Admin accounts."""
    __tablename__ = "staff_users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, unique=True, nullable=False, index=True)  # login identifier (lower-case)
    otp_email = Column(String, nullable=False)                      # where 2FA / reset OTPs are delivered
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Recruiter")      # Recruiter | Admin | Super Admin
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    failed_logins = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class OtpChallenge(AuthBase):
    """Server-side one-time passcode. Only a keyed hash of the code is stored."""
    __tablename__ = "otp_challenges"

    id = Column(String, primary_key=True, default=new_id)
    purpose = Column(String, nullable=False)       # staff_login | password_reset | candidate_login
    subject_id = Column(String, nullable=False, index=True)  # staff user id / candidate invite id
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    consumed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class RefreshToken(AuthBase):
    """Server-side record of issued refresh tokens (enables rotation + revocation)."""
    __tablename__ = "refresh_tokens"

    jti = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class CandidateInvite(AuthBase):
    """Single-candidate, single-assessment invitation (link token + OTP)."""
    __tablename__ = "candidate_invites"

    id = Column(String, primary_key=True, default=new_id)
    candidate_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    assessment_id = Column(String, nullable=False)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
