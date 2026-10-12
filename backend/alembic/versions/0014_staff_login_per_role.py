"""Allow the same staff login id on admin, recruiter and proctor.

Revision ID: 0014
Revises: 0013
"""
from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_staff_users_email", table_name="staff_users")
    op.create_index("ix_staff_users_email", "staff_users", ["email"], unique=False)
    op.create_unique_constraint("uq_staff_users_email_role", "staff_users", ["email", "role"])


def downgrade() -> None:
    op.drop_constraint("uq_staff_users_email_role", "staff_users", type_="unique")
    op.drop_index("ix_staff_users_email", table_name="staff_users")
    op.create_index("ix_staff_users_email", "staff_users", ["email"], unique=True)
