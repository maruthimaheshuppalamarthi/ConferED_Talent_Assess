"""Assessment overall duration, scheduled date, and test start time.

Revision ID: 0016
Revises: 0015
"""
import sqlalchemy as sa
from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("assessments", sa.Column("scheduled_date", sa.String(), nullable=True))
    op.add_column("assessments", sa.Column("start_time", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("scheduled_date", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("start_time", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("total_duration_minutes", sa.Integer(), nullable=True, server_default="60"))


def downgrade() -> None:
    op.drop_column("jobs", "total_duration_minutes")
    op.drop_column("jobs", "start_time")
    op.drop_column("jobs", "scheduled_date")
    op.drop_column("assessments", "start_time")
    op.drop_column("assessments", "scheduled_date")
