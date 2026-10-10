"""Store the candidate's star rating and optional comment.

Revision ID: 0013
Revises: 0012
"""
from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("candidates", sa.Column("feedback_rating", sa.Integer(), nullable=True))
    op.add_column("candidates", sa.Column("feedback_text", sa.Text(), nullable=True))
    op.add_column("candidates", sa.Column("feedback_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("candidates", "feedback_at")
    op.drop_column("candidates", "feedback_text")
    op.drop_column("candidates", "feedback_rating")
