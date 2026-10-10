"""Staff management: tracked sessions (id, start, IP, browser, revoke reason) and instant force-logout.

Revision ID: 0003
Revises: 0002
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

TSTZ = sa.DateTime(timezone=True)


def upgrade() -> None:
    # Access tokens issued before this moment are refused (force-logout / reset / delete take effect at once).
    op.add_column("staff_users", sa.Column("sessions_valid_after", TSTZ, nullable=True))

    op.add_column("refresh_tokens", sa.Column("session_id", sa.String(), nullable=True))
    op.add_column("refresh_tokens", sa.Column("session_started_at", TSTZ, nullable=True))
    op.add_column("refresh_tokens", sa.Column("ip_address", sa.String(), nullable=True))
    op.add_column("refresh_tokens", sa.Column("user_agent", sa.String(), nullable=True))
    op.add_column("refresh_tokens", sa.Column("revoked_reason", sa.String(), nullable=True))
    op.create_index("ix_refresh_tokens_session_id", "refresh_tokens", ["session_id"])

    # Tokens that already exist each count as their own session.
    op.execute("UPDATE refresh_tokens SET session_id = jti, session_started_at = created_at WHERE session_id IS NULL")


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_session_id", table_name="refresh_tokens")
    for column in ("revoked_reason", "user_agent", "ip_address", "session_started_at", "session_id"):
        op.drop_column("refresh_tokens", column)
    op.drop_column("staff_users", "sessions_valid_after")
