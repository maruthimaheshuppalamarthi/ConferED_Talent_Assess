"""Freeze the option order each candidate saw.

Revision ID: 0010
Revises: 0009
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

JSONType = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.add_column("assessment_sessions", sa.Column("option_order", JSONType, nullable=True))


def downgrade() -> None:
    op.drop_column("assessment_sessions", "option_order")
