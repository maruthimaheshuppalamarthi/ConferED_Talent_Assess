"""Jobs: one hiring job owns one exam.

Revision ID: 0008
Revises: 0007
"""
import uuid

from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

TSTZ = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("assessment_id", sa.String(), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", TSTZ, nullable=True),
    )
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.create_index("ix_jobs_assessment_id", "jobs", ["assessment_id"], unique=True)

    # Wrap every existing exam in a job so the builder does not start empty.
    bind = op.get_bind()
    rows = bind.execute(sa.text(
        "SELECT id, title, role_title, description, status FROM assessments"
    )).fetchall()
    for row in rows:
        assessment_status = (row.status or "draft").lower()
        if assessment_status == "active":
            job_status = "open"
        elif assessment_status == "archived":
            job_status = "closed"
        else:
            job_status = "draft"
        title = (row.role_title or row.title or "Untitled job").strip() or "Untitled job"
        bind.execute(
            sa.text(
                "INSERT INTO jobs (id, title, description, status, assessment_id, created_at) "
                "VALUES (:id, :title, :description, :status, :assessment_id, CURRENT_TIMESTAMP)"
            ),
            {
                "id": uuid.uuid4().hex,
                "title": title,
                "description": row.description or "",
                "status": job_status,
                "assessment_id": row.id,
            },
        )


def downgrade() -> None:
    op.drop_index("ix_jobs_assessment_id", table_name="jobs")
    op.drop_index("ix_jobs_status", table_name="jobs")
    op.drop_table("jobs")
