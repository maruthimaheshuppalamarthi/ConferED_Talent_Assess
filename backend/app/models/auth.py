"""
Auth + System-Admin tables.

    staff_users       System Admin / Recruiter / Proctor accounts
    otp_challenges    one-time passcodes (hashed)
    refresh_tokens    server-side refresh-token records (rotation + revocation)
    candidate_invites candidate invitation links
    audit_logs        append-only record of who did what (System Admin audit trail)
    login_events      every sign-in attempt / sign-out (login history + security stats)
    system_settings   platform policy and configuration, editable by the System Admin

All timestamps are timezone-aware UTC (``timestamptz`` on Postgres).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, func)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator

AuthBase = declarative_base()


class UTCDateTime(TypeDecorator):
    """Timezone-aware UTC timestamps on every database (SQLite returns naive values; we re-attach UTC)."""
    impl = DateTime
    cache_ok = True

    def __init__(self):
        super().__init__(timezone=True)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:  # naive values are treated as UTC
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)


# JSONB on Postgres (indexable, compact), plain JSON elsewhere (SQLite in tests).
JSONType = JSON().with_variant(JSONB(), "postgresql")


def utcnow() -> datetime:
    """Current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def new_id() -> str:
    return uuid.uuid4().hex


class StaffUser(AuthBase):
    """System Admin / Recruiter / Proctor accounts (created by a System Admin)."""
    __tablename__ = "staff_users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, unique=True, nullable=False, index=True)  # login identifier (lower-case)
    otp_email = Column(String, nullable=False)                      # where 2FA OTPs are delivered
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Recruiter", index=True)  # System Admin | Recruiter | Proctor
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # True after an admin creates the account / resets the password: the user must pick their own.
    must_change_password = Column(Boolean, default=False, nullable=False)
    failed_logins = Column(Integer, default=0, nullable=False)
    locked_until = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)

    # --- profile / lifecycle (admin foundation)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    last_login_at = Column(UTCDateTime, nullable=True)
    created_by = Column(String, ForeignKey("staff_users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)
    password_changed_at = Column(UTCDateTime, nullable=True)
    deleted_at = Column(UTCDateTime, nullable=True)  # soft delete: the row is kept for the audit trail
    # Access tokens issued before this moment are refused (set by force-logout, password reset, delete ...).
    sessions_valid_after = Column(UTCDateTime, nullable=True)


class OtpChallenge(AuthBase):
    """Server-side one-time passcode. Only a keyed hash of the code is stored."""
    __tablename__ = "otp_challenges"
    __table_args__ = (Index("ix_otp_challenges_purpose_subject", "purpose", "subject_id", "consumed"),)

    id = Column(String, primary_key=True, default=new_id)
    purpose = Column(String, nullable=False)       # staff_login:<portal> | candidate_login
    subject_id = Column(String, nullable=False, index=True)  # staff user id / candidate invite id
    code_hash = Column(String, nullable=False)
    expires_at = Column(UTCDateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    consumed = Column(Boolean, default=False, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)


class RefreshToken(AuthBase):
    """Server-side record of issued refresh tokens (enables rotation + revocation)."""
    __tablename__ = "refresh_tokens"
    __table_args__ = (Index("ix_refresh_tokens_user_revoked", "user_id", "revoked"),)

    jti = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("staff_users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(UTCDateTime, nullable=False, index=True)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    # A sign-in is one *session*; every refresh rotates the token but keeps the session_id.
    session_id = Column(String, nullable=True, index=True)       # null on rows created before sessions were tracked
    session_started_at = Column(UTCDateTime, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    # Why the token stopped working: rotated | logout | admin | password | security  (only 'rotated' tokens
    # being replayed is a theft signal).
    revoked_reason = Column(String, nullable=True)


class CandidateInvite(AuthBase):
    """Single-candidate, single-assessment invitation (link token + OTP)."""
    __tablename__ = "candidate_invites"

    id = Column(String, primary_key=True, default=new_id)
    candidate_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    assessment_id = Column(String, nullable=False, index=True)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(UTCDateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    verified_at = Column(UTCDateTime, nullable=True)
    created_by = Column(String, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)


class AuditLog(AuthBase):
    """Append-only audit trail. On Postgres a trigger rejects UPDATE and DELETE (see migration 0002)."""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_actor_created", "actor_id", "created_at"),
        Index("ix_audit_logs_action_created", "action", "created_at"),
        Index("ix_audit_logs_category_created", "category", "created_at"),
        Index("ix_audit_logs_target", "target_type", "target_id"),
    )

    id = Column(String, primary_key=True, default=new_id)
    created_at = Column(UTCDateTime, default=utcnow, server_default=func.now(), nullable=False, index=True)
    # Who. No foreign key on purpose: the log must survive the account being deleted, so the
    # email / role are copied here at the time of the action.
    actor_id = Column(String, nullable=True)
    actor_email = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
    # What.
    category = Column(String, nullable=False)       # auth | staff | settings | security | system
    action = Column(String, nullable=False)         # e.g. staff.create, settings.update, auth.login_failed
    target_type = Column(String, nullable=True)     # staff_user | setting | session ...
    target_id = Column(String, nullable=True)
    summary = Column(Text, nullable=False)          # one human-readable line
    details = Column(JSONType, nullable=True)       # before/after values etc. (never secrets)
    success = Column(Boolean, default=True, nullable=False)
    # From where.
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)


class LoginEvent(AuthBase):
    """Every sign-in attempt and sign-out: login history and failed-login statistics."""
    __tablename__ = "login_events"
    __table_args__ = (
        Index("ix_login_events_user_created", "user_id", "created_at"),
        Index("ix_login_events_email_created", "email", "created_at"),
        Index("ix_login_events_success_created", "success", "created_at"),
    )

    id = Column(String, primary_key=True, default=new_id)
    created_at = Column(UTCDateTime, default=utcnow, server_default=func.now(), nullable=False, index=True)
    user_id = Column(String, nullable=True)         # null when the email did not match any account
    email = Column(String, nullable=True)           # what was typed (lower-cased)
    portal = Column(String, nullable=True)          # admin | recruiter | proctor
    event = Column(String, nullable=False)          # password_ok | otp_verified | login_failed | otp_failed | locked | logout
    success = Column(Boolean, default=True, nullable=False)
    failure_reason = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)


class SystemSetting(AuthBase):
    """One configurable platform setting (key/value, JSON value) edited by the System Admin."""
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    group = Column(String, nullable=False, index=True)   # proctoring | assessment | security | email | general
    value = Column(JSONType, nullable=True)
    value_type = Column(String, nullable=False)          # int | bool | string | enum
    is_secret = Column(Boolean, default=False, nullable=False)  # value is stored encrypted, never returned
    description = Column(Text, nullable=True)
    updated_by = Column(String, nullable=True)
    created_at = Column(UTCDateTime, default=utcnow, server_default=func.now(), nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, server_default=func.now(), nullable=False)
