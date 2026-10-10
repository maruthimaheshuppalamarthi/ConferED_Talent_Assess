"""Store the government-ID type and the measured system check on the candidate.

Revision ID: 0012
Revises: 0011
"""
from alembic import op
import sqlalchemy as sa

from app.models.auth import JSONType

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("candidates", sa.Column("id_document_type", sa.String(), nullable=True))
    op.add_column("candidates", sa.Column("system_check", JSONType, nullable=True))


def downgrade() -> None:
    op.drop_column("candidates", "system_check")
    op.drop_column("candidates", "id_document_type")
