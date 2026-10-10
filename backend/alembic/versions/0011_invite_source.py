"""Store invite source and the job each bulk-invite row is for.

Revision ID: 0011
Revises: 0010
"""
from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("candidates", sa.Column("source", sa.String(), nullable=True))
    op.add_column("candidate_invites", sa.Column("source", sa.String(), nullable=True))
    op.add_column("invite_batch_rows", sa.Column("source", sa.String(), nullable=True))
    op.add_column("invite_batch_rows", sa.Column("assessment_id", sa.String(), nullable=True))
    op.create_index("ix_invite_batch_rows_assessment_id", "invite_batch_rows", ["assessment_id"])


def downgrade() -> None:
    op.drop_index("ix_invite_batch_rows_assessment_id", table_name="invite_batch_rows")
    op.drop_column("invite_batch_rows", "assessment_id")
    op.drop_column("invite_batch_rows", "source")
    op.drop_column("candidate_invites", "source")
    op.drop_column("candidates", "source")
