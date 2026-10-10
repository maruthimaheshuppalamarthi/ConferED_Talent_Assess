"""Recruiter hiring tables: candidates, assessments, questions, results.

Revision ID: 0004
Revises: 0003
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

TSTZ = sa.DateTime(timezone=True)
JSONType = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "assessments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("role_title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("total_duration_minutes", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("passing_percentage", sa.Integer(), nullable=False, server_default="70"),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("created_date", sa.String(), nullable=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TSTZ, nullable=True),
    )
    op.create_table(
        "assessment_sections",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("assessment_id", sa.String(), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("time_limit_minutes", sa.Integer(), nullable=False, server_default="15"),
        sa.Column("passing_marks", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("is_mandatory", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("randomize_questions", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("question_ids", JSONType, nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_assessment_sections_assessment_id", "assessment_sections", ["assessment_id"])

    op.create_table(
        "questions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("options", JSONType, nullable=True),
        sa.Column("correct_answers", JSONType, nullable=True),
        sa.Column("sample_code", JSONType, nullable=True),
        sa.Column("language", sa.String(), nullable=True),
        sa.Column("test_cases", JSONType, nullable=True),
        sa.Column("essay_min_words", sa.Integer(), nullable=True),
        sa.Column("essay_max_words", sa.Integer(), nullable=True),
        sa.Column("difficulty", sa.String(), nullable=False, server_default="medium"),
        sa.Column("points", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("category", sa.String(), nullable=False, server_default="General"),
        sa.Column("tags", JSONType, nullable=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TSTZ, nullable=True),
    )

    op.create_table(
        "candidates",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("experience_years", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skills", JSONType, nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="Applied"),
        sa.Column("assessment_id", sa.String(), nullable=True),
        sa.Column("invited_at", sa.String(), nullable=True),
        sa.Column("otp_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("system_check_passed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("assessment_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("live_photo_url", sa.Text(), nullable=True),
        sa.Column("id_proof_url", sa.Text(), nullable=True),
        sa.Column("identity_status", sa.String(), nullable=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TSTZ, nullable=True),
    )
    op.create_index("ix_candidates_email", "candidates", ["email"])
    op.create_index("ix_candidates_status", "candidates", ["status"])
    op.create_index("ix_candidates_assessment_id", "candidates", ["assessment_id"])

    op.create_table(
        "candidate_results",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("candidate_id", sa.String(), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessment_id", sa.String(), nullable=False),
        sa.Column("completed_at", sa.String(), nullable=True),
        sa.Column("total_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("max_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("percentage", sa.Float(), nullable=False, server_default="0"),
        sa.Column("section_scores", JSONType, nullable=True),
        sa.Column("ai_confidence_score", sa.Float(), nullable=False, server_default="95"),
        sa.Column("total_violations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pass_status", sa.String(), nullable=False, server_default="Fail"),
        sa.Column("proctoring_logs", JSONType, nullable=True),
        sa.Column("recruiter_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("recruiter_decision", sa.String(), nullable=False, server_default="Under Review"),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TSTZ, nullable=True),
    )
    op.create_index("ix_candidate_results_candidate_id", "candidate_results", ["candidate_id"], unique=True)
    op.create_index("ix_candidate_results_assessment_id", "candidate_results", ["assessment_id"])


def downgrade() -> None:
    op.drop_table("candidate_results")
    op.drop_table("candidates")
    op.drop_table("questions")
    op.drop_table("assessment_sections")
    op.drop_table("assessments")
