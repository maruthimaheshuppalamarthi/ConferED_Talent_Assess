"""Admin foundation: timestamptz, staff profile columns, audit_logs, login_events, system_settings, RLS.

Postgres (Supabase) migration.

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

ALL_TABLES = [
    "staff_users", "otp_challenges", "refresh_tokens", "candidate_invites",
    "audit_logs", "login_events", "system_settings", "alembic_version",
]

# (table, column, nullable) - naive UTC timestamps -> timestamptz
TIMESTAMP_COLUMNS = [
    ("staff_users", "locked_until", True),
    ("staff_users", "created_at", False),
    ("otp_challenges", "expires_at", False),
    ("otp_challenges", "created_at", False),
    ("refresh_tokens", "expires_at", False),
    ("refresh_tokens", "created_at", False),
    ("candidate_invites", "expires_at", False),
    ("candidate_invites", "verified_at", True),
    ("candidate_invites", "created_at", False),
]

TSTZ = sa.DateTime(timezone=True)


def _now():
    return sa.text("now()")


def upgrade() -> None:
    # ---- 1. every timestamp becomes timezone-aware (existing values were UTC)
    for table, column, nullable in TIMESTAMP_COLUMNS:
        op.alter_column(table, column, existing_type=sa.DateTime(), type_=TSTZ, existing_nullable=nullable,
                        postgresql_using=f"{column} AT TIME ZONE 'UTC'")

    # ---- 2. staff_users: profile + lifecycle columns
    op.add_column("staff_users", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("staff_users", sa.Column("department", sa.String(), nullable=True))
    op.add_column("staff_users", sa.Column("last_login_at", TSTZ, nullable=True))
    op.add_column("staff_users", sa.Column("created_by", sa.String(), nullable=True))
    op.add_column("staff_users", sa.Column("updated_at", TSTZ, nullable=True))
    op.add_column("staff_users", sa.Column("password_changed_at", TSTZ, nullable=True))
    op.add_column("staff_users", sa.Column("deleted_at", TSTZ, nullable=True))
    op.create_foreign_key("fk_staff_users_created_by", "staff_users", "staff_users",
                          ["created_by"], ["id"], ondelete="SET NULL")
    op.create_index("ix_staff_users_role", "staff_users", ["role"])

    # ---- 3. refresh_tokens: real foreign key + indexes
    op.execute("DELETE FROM refresh_tokens WHERE user_id NOT IN (SELECT id FROM staff_users)")
    op.create_foreign_key("fk_refresh_tokens_user_id", "refresh_tokens", "staff_users",
                          ["user_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])
    op.create_index("ix_refresh_tokens_user_revoked", "refresh_tokens", ["user_id", "revoked"])

    # ---- 4. other indexes
    op.create_index("ix_otp_challenges_purpose_subject", "otp_challenges", ["purpose", "subject_id", "consumed"])
    op.create_index("ix_candidate_invites_assessment_id", "candidate_invites", ["assessment_id"])

    # ---- 5. audit_logs (append-only)
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=_now()),
        sa.Column("actor_id", sa.String(), nullable=True),
        sa.Column("actor_email", sa.String(), nullable=True),
        sa.Column("actor_role", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("target_type", sa.String(), nullable=True),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("details", postgresql.JSONB(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
    )
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_audit_logs_actor_created", "audit_logs", ["actor_id", "created_at"])
    op.create_index("ix_audit_logs_action_created", "audit_logs", ["action", "created_at"])
    op.create_index("ix_audit_logs_category_created", "audit_logs", ["category", "created_at"])
    op.create_index("ix_audit_logs_target", "audit_logs", ["target_type", "target_id"])

    # The trail must not be editable: reject UPDATE and DELETE at the database level.
    op.execute("""
        CREATE OR REPLACE FUNCTION public.audit_logs_immutable() RETURNS trigger
        LANGUAGE plpgsql SET search_path = public AS $$
        BEGIN
            RAISE EXCEPTION 'audit_logs is append-only (% is not allowed)', TG_OP;
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON public.audit_logs
        FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable()
    """)

    # ---- 6. login_events
    op.create_table(
        "login_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=_now()),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("portal", sa.String(), nullable=True),
        sa.Column("event", sa.String(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("failure_reason", sa.String(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
    )
    op.create_index("ix_login_events_created_at", "login_events", ["created_at"])
    op.create_index("ix_login_events_user_created", "login_events", ["user_id", "created_at"])
    op.create_index("ix_login_events_email_created", "login_events", ["email", "created_at"])
    op.create_index("ix_login_events_success_created", "login_events", ["success", "created_at"])

    # ---- 7. system_settings
    op.create_table(
        "system_settings",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("group", sa.String(), nullable=False),
        sa.Column("value", postgresql.JSONB(), nullable=True),
        sa.Column("value_type", sa.String(), nullable=False),
        sa.Column("is_secret", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=_now()),
        sa.Column("updated_at", TSTZ, nullable=False, server_default=_now()),
    )
    op.create_index("ix_system_settings_group", "system_settings", ["group"])

    # ---- 8. lock the tables down: only the backend (a privileged role) may touch them.
    # Row Level Security on + no policies = the public Data API (anon / authenticated) sees nothing.
    for table in ALL_TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                    REVOKE ALL ON TABLE public.{table} FROM anon;
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    REVOKE ALL ON TABLE public.{table} FROM authenticated;
                END IF;
            END $$
        """)


def downgrade() -> None:
    for table in ALL_TABLES:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")

    op.drop_table("system_settings")
    op.drop_table("login_events")
    op.execute("DROP TRIGGER IF EXISTS audit_logs_append_only ON public.audit_logs")
    op.drop_table("audit_logs")
    op.execute("DROP FUNCTION IF EXISTS public.audit_logs_immutable()")

    op.drop_index("ix_candidate_invites_assessment_id", table_name="candidate_invites")
    op.drop_index("ix_otp_challenges_purpose_subject", table_name="otp_challenges")
    op.drop_index("ix_refresh_tokens_user_revoked", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_expires_at", table_name="refresh_tokens")
    op.drop_constraint("fk_refresh_tokens_user_id", "refresh_tokens", type_="foreignkey")

    op.drop_index("ix_staff_users_role", table_name="staff_users")
    op.drop_constraint("fk_staff_users_created_by", "staff_users", type_="foreignkey")
    for column in ("deleted_at", "password_changed_at", "updated_at", "created_by",
                   "last_login_at", "department", "phone"):
        op.drop_column("staff_users", column)

    for table, column, nullable in reversed(TIMESTAMP_COLUMNS):
        op.alter_column(table, column, existing_type=TSTZ, type_=sa.DateTime(), existing_nullable=nullable,
                        postgresql_using=f"{column} AT TIME ZONE 'UTC'")
