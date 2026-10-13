"""Exam start clock, saved attempt progress, and question explanations.

Revision ID: 0015
Revises: 0014
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None

TSTZ = sa.DateTime(timezone=True)
JSONType = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.add_column("questions", sa.Column("explanation", sa.Text(), nullable=True))
    op.add_column("assessment_sessions", sa.Column("exam_started_at", TSTZ, nullable=True))
    op.add_column("assessment_sessions", sa.Column("progress", JSONType, nullable=True))


def downgrade() -> None:
    op.drop_column("assessment_sessions", "progress")
    op.drop_column("assessment_sessions", "exam_started_at")
    op.drop_column("questions", "explanation")
