"""Add job_role to questions and assessment_sections.

Revision ID: 0006
Revises: 0005
"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("job_role", sa.String(), nullable=True))
    op.create_index("ix_questions_job_role", "questions", ["job_role"])
    op.add_column("assessment_sections", sa.Column("job_role", sa.String(), nullable=True))
    op.create_index("ix_assessment_sections_job_role", "assessment_sections", ["job_role"])


def downgrade() -> None:
    op.drop_index("ix_assessment_sections_job_role", table_name="assessment_sections")
    op.drop_column("assessment_sections", "job_role")
    op.drop_index("ix_questions_job_role", table_name="questions")
    op.drop_column("questions", "job_role")
