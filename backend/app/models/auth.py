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

from sqlalchemy import (JSON, Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text,
                        UniqueConstraint, func, text)
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
    __table_args__ = (
        UniqueConstraint("email", "role", name="uq_staff_users_email_role"),
    )

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, nullable=False, index=True)  # login identifier (lower-case), unique per portal role
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
    batch_id = Column(String, ForeignKey("invite_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    registration_number = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    role_title = Column(String, nullable=True)
    source = Column(String, nullable=True)  # campus hire | regular | referral | …
    # PENDING | SENT | FAILED | DUPLICATE_SKIPPED | STARTED | COMPLETED
    delivery_status = Column(String, default="PENDING", nullable=False, index=True)


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


# ------------------------------------------------------------------ recruiter hiring data
class Assessment(AuthBase):
    """Assessment definition owned by the Recruiter portal."""
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=new_id)
    title = Column(String, nullable=False)
    role_title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    total_duration_minutes = Column(Integer, default=60, nullable=False)
    total_questions = Column(Integer, default=0, nullable=False)
    passing_percentage = Column(Integer, default=70, nullable=False)
    status = Column(String, default="active", nullable=False)  # active | draft | archived
    created_date = Column(String, nullable=True)               # YYYY-MM-DD display stamp
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)


class AssessmentSection(AuthBase):
    __tablename__ = "assessment_sections"

    id = Column(String, primary_key=True, default=new_id)
    assessment_id = Column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    time_limit_minutes = Column(Integer, default=15, nullable=False)
    passing_marks = Column(Integer, default=10, nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    randomize_questions = Column(Boolean, default=False, nullable=False)
    question_ids = Column(JSONType, nullable=True)  # legacy pool; prefer assessment_section_questions
    sort_order = Column(Integer, default=0, nullable=False)
    allowed_types = Column(JSONType, nullable=True)       # e.g. ["mcq","msq"]
    allowed_categories = Column(JSONType, nullable=True)  # section_category labels
    pool_size = Column(Integer, nullable=True)
    pick_count = Column(Integer, nullable=True)
    job_role = Column(String, nullable=True, index=True)  # e.g. Campus Hire, Senior Java Developer


class AssessmentSectionQuestion(AuthBase):
    """Ordered question pool membership for an assessment section."""
    __tablename__ = "assessment_section_questions"
    __table_args__ = (Index("ix_asq_section_sort", "section_id", "sort_order"),)

    id = Column(String, primary_key=True, default=new_id)
    section_id = Column(String, ForeignKey("assessment_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False)


class QuestionCategory(AuthBase):
    """Category labels. job_id null is the company library; a job id is that job's bank."""
    __tablename__ = "question_categories"
    __table_args__ = (
        Index(
            "uq_qcat_library_label", "label", unique=True,
            sqlite_where=text("job_id IS NULL"), postgresql_where=text("job_id IS NULL"),
        ),
        Index(
            "uq_qcat_job_label", "job_id", "label", unique=True,
            sqlite_where=text("job_id IS NOT NULL"), postgresql_where=text("job_id IS NOT NULL"),
        ),
    )

    id = Column(String, primary_key=True, default=new_id)
    label = Column(String, nullable=False)
    allowed_types = Column(JSONType, nullable=True)  # types that belong in this category
    sort_order = Column(Integer, default=0, nullable=False)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)


class JobRole(AuthBase):
    """Hiring-track labels (Campus Hire, Senior Java Developer, …) for sections & questions."""
    __tablename__ = "job_roles"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)


class Job(AuthBase):
    """A hiring job. Each job owns exactly one exam (assessment)."""
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=new_id)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="draft", nullable=False, index=True)  # draft | open | closed
    assessment_id = Column(
        String, ForeignKey("assessments.id", ondelete="CASCADE"), unique=True, nullable=False, index=True,
    )
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)


class Question(AuthBase):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=new_id)
    type = Column(String, nullable=False)  # mcq | msq | coding | sql | essay
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    options = Column(JSONType, nullable=True)
    correct_answers = Column(JSONType, nullable=True)
    sample_code = Column(JSONType, nullable=True)
    language = Column(String, nullable=True)
    test_cases = Column(JSONType, nullable=True)
    essay_min_words = Column(Integer, nullable=True)
    essay_max_words = Column(Integer, nullable=True)
    difficulty = Column(String, default="medium", nullable=False)
    points = Column(Integer, default=10, nullable=False)
    category = Column(String, default="General", nullable=False)
    tags = Column(JSONType, nullable=True)
    section_category = Column(String, nullable=True, index=True)
    job_role = Column(String, nullable=True, index=True)  # optional library tag; not the owning job
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    selection_mode = Column(String, nullable=True)  # single | multi
    stem_format = Column(String, default="plain", nullable=False)  # plain | markdown
    coding_meta = Column(JSONType, nullable=True)  # constraints, io_format, time_limit_ms, memory_limit_kb
    rubric = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)  # recruiter notes; never sent to the candidate exam
    status = Column(String, default="published", nullable=False)  # draft | published
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)


class Candidate(AuthBase):
    """Hiring-pipeline candidate row (Recruiter portal)."""
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    experience_years = Column(Integer, default=0, nullable=False)
    skills = Column(JSONType, nullable=True)
    status = Column(String, default="Applied", nullable=False, index=True)
    assessment_id = Column(String, nullable=True, index=True)
    invited_at = Column(String, nullable=True)  # YYYY-MM-DD
    otp_verified = Column(Boolean, default=False, nullable=False)
    system_check_passed = Column(Boolean, default=False, nullable=False)
    assessment_completed = Column(Boolean, default=False, nullable=False)
    live_photo_url = Column(Text, nullable=True)  # data:image/jpeg;base64,... captured at system check
    id_proof_url = Column(Text, nullable=True)  # government ID, stored as JPEG
    id_document_type = Column(String, nullable=True)  # aadhaar | passport | driving_licence | voter_id
    system_check = Column(JSONType, nullable=True)  # measured camera, mic, ping, and screen
    identity_status = Column(String, nullable=True)  # pending_verification | approved | rejected
    feedback_rating = Column(Integer, nullable=True)
    feedback_text = Column(Text, nullable=True)
    feedback_at = Column(UTCDateTime, nullable=True)
    registration_number = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    role_title = Column(String, nullable=True)
    source = Column(String, nullable=True)  # campus hire | regular | referral | …
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)


class InviteBatch(AuthBase):
    """One bulk Excel/CSV upload for inviting candidates to an assessment."""
    __tablename__ = "invite_batches"

    id = Column(String, primary_key=True, default=new_id)
    assessment_id = Column(String, nullable=False, index=True)
    created_by = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    valid_rows = Column(Integer, default=0, nullable=False)
    duplicate_in_file = Column(Integer, default=0, nullable=False)
    duplicate_in_db = Column(Integer, default=0, nullable=False)
    queued = Column(Integer, default=0, nullable=False)
    sent = Column(Integer, default=0, nullable=False)
    failed = Column(Integer, default=0, nullable=False)
    skipped = Column(Integer, default=0, nullable=False)
    # preview | queued | processing | completed | failed
    status = Column(String, default="preview", nullable=False, index=True)
    force_resend = Column(Boolean, default=False, nullable=False)
    expires_in_hours = Column(Integer, default=48, nullable=False)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    completed_at = Column(UTCDateTime, nullable=True)


class InviteBatchRow(AuthBase):
    """One spreadsheet row inside an invite batch."""
    __tablename__ = "invite_batch_rows"
    __table_args__ = (Index("ix_invite_batch_rows_batch_email", "batch_id", "email"),)

    id = Column(String, primary_key=True, default=new_id)
    batch_id = Column(String, ForeignKey("invite_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    name = Column(String, nullable=False, default="")
    email = Column(String, nullable=False, default="")
    registration_number = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    role_title = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    source = Column(String, nullable=True)
    assessment_id = Column(String, nullable=True, index=True)
    validation_errors = Column(JSONType, nullable=True)
    # null | file_duplicate | active_invite | completed_attempt
    dedupe_reason = Column(String, nullable=True)
    # invite | skip | force_resend
    action = Column(String, default="skip", nullable=False)
    invite_id = Column(String, nullable=True, index=True)
    candidate_id = Column(String, nullable=True, index=True)
    # PENDING | SENT | FAILED | DUPLICATE_SKIPPED | STARTED | COMPLETED
    delivery_status = Column(String, default="PENDING", nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(UTCDateTime, nullable=True)


class AssessmentSession(AuthBase):
    """Per-candidate frozen question draw for an assessment attempt."""
    __tablename__ = "assessment_sessions"

    id = Column(String, primary_key=True, default=new_id)
    invite_id = Column(String, ForeignKey("candidate_invites.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    candidate_id = Column(String, nullable=False, index=True)
    assessment_id = Column(String, nullable=False, index=True)
    drawn_question_ids = Column(JSONType, nullable=True)  # { sectionId: [questionId, ...] }
    option_order = Column(JSONType, nullable=True)  # { questionId: [optionId, ...] } frozen display order
    started_at = Column(UTCDateTime, nullable=True)  # when the paper was frozen, not when the clock starts
    exam_started_at = Column(UTCDateTime, nullable=True)  # when the candidate entered the exam
    progress = Column(JSONType, nullable=True)  # answers, code drafts, section position
    completed_at = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)


class CandidateResult(AuthBase):
    """Scorecard for a completed (or reviewed) candidate assessment."""
    __tablename__ = "candidate_results"

    id = Column(String, primary_key=True, default=new_id)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    assessment_id = Column(String, nullable=False, index=True)
    completed_at = Column(String, nullable=True)
    total_score = Column(Float, default=0, nullable=False)
    max_score = Column(Float, default=0, nullable=False)
    percentage = Column(Float, default=0, nullable=False)
    section_scores = Column(JSONType, nullable=True)
    ai_confidence_score = Column(Float, default=95.0, nullable=False)
    total_violations = Column(Integer, default=0, nullable=False)
    pass_status = Column(String, default="Fail", nullable=False)  # Pass | Fail
    proctoring_logs = Column(JSONType, nullable=True)
    recruiter_notes = Column(Text, default="", nullable=False)
    recruiter_decision = Column(String, default="Under Review", nullable=False)
    created_at = Column(UTCDateTime, default=utcnow, nullable=False)
    updated_at = Column(UTCDateTime, default=utcnow, onupdate=utcnow, nullable=True)
