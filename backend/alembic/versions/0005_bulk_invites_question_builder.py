"""Bulk invites, question categories, section pools, assessment sessions.

Revision ID: 0005
Revises: 0004
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

TSTZ = sa.DateTime(timezone=True)
JSONType = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "invite_batches",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("assessment_id", sa.String(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("total_rows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("valid_rows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duplicate_in_file", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duplicate_in_db", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("queued", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="preview"),
        sa.Column("force_resend", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("expires_in_hours", sa.Integer(), nullable=False, server_default="48"),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", TSTZ, nullable=True),
    )
    op.create_index("ix_invite_batches_assessment_id", "invite_batches", ["assessment_id"])
    op.create_index("ix_invite_batches_status", "invite_batches", ["status"])

    op.create_table(
        "invite_batch_rows",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("batch_id", sa.String(), sa.ForeignKey("invite_batches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("row_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False, server_default=""),
        sa.Column("email", sa.String(), nullable=False, server_default=""),
        sa.Column("registration_number", sa.String(), nullable=True),
        sa.Column("organization", sa.String(), nullable=True),
        sa.Column("role_title", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("validation_errors", JSONType, nullable=True),
        sa.Column("dedupe_reason", sa.String(), nullable=True),
        sa.Column("action", sa.String(), nullable=False, server_default="skip"),
        sa.Column("invite_id", sa.String(), nullable=True),
        sa.Column("candidate_id", sa.String(), nullable=True),
        sa.Column("delivery_status", sa.String(), nullable=False, server_default="PENDING"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_at", TSTZ, nullable=True),
    )
    op.create_index("ix_invite_batch_rows_batch_id", "invite_batch_rows", ["batch_id"])
    op.create_index("ix_invite_batch_rows_batch_email", "invite_batch_rows", ["batch_id", "email"])
    op.create_index("ix_invite_batch_rows_invite_id", "invite_batch_rows", ["invite_id"])
    op.create_index("ix_invite_batch_rows_delivery_status", "invite_batch_rows", ["delivery_status"])

    op.add_column("candidate_invites", sa.Column("batch_id", sa.String(), nullable=True))
    op.add_column("candidate_invites", sa.Column("registration_number", sa.String(), nullable=True))
    op.add_column("candidate_invites", sa.Column("organization", sa.String(), nullable=True))
    op.add_column("candidate_invites", sa.Column("role_title", sa.String(), nullable=True))
    op.add_column("candidate_invites", sa.Column("delivery_status", sa.String(), nullable=False, server_default="PENDING"))
    op.create_foreign_key("fk_candidate_invites_batch_id", "candidate_invites", "invite_batches", ["batch_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_candidate_invites_batch_id", "candidate_invites", ["batch_id"])
    op.create_index("ix_candidate_invites_delivery_status", "candidate_invites", ["delivery_status"])

    op.add_column("candidates", sa.Column("registration_number", sa.String(), nullable=True))
    op.add_column("candidates", sa.Column("organization", sa.String(), nullable=True))
    op.add_column("candidates", sa.Column("role_title", sa.String(), nullable=True))

    op.create_table(
        "question_categories",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("label", sa.String(), nullable=False, unique=True),
        sa.Column("allowed_types", JSONType, nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.add_column("questions", sa.Column("section_category", sa.String(), nullable=True))
    op.add_column("questions", sa.Column("selection_mode", sa.String(), nullable=True))
    op.add_column("questions", sa.Column("stem_format", sa.String(), nullable=False, server_default="plain"))
    op.add_column("questions", sa.Column("coding_meta", JSONType, nullable=True))
    op.add_column("questions", sa.Column("rubric", sa.Text(), nullable=True))
    op.add_column("questions", sa.Column("status", sa.String(), nullable=False, server_default="published"))
    op.create_index("ix_questions_section_category", "questions", ["section_category"])

    op.add_column("assessment_sections", sa.Column("allowed_types", JSONType, nullable=True))
    op.add_column("assessment_sections", sa.Column("allowed_categories", JSONType, nullable=True))
    op.add_column("assessment_sections", sa.Column("pool_size", sa.Integer(), nullable=True))
    op.add_column("assessment_sections", sa.Column("pick_count", sa.Integer(), nullable=True))

    op.create_table(
        "assessment_section_questions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("section_id", sa.String(), sa.ForeignKey("assessment_sections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_assessment_section_questions_section_id", "assessment_section_questions", ["section_id"])
    op.create_index("ix_assessment_section_questions_question_id", "assessment_section_questions", ["question_id"])
    op.create_index("ix_asq_section_sort", "assessment_section_questions", ["section_id", "sort_order"])

    # Backfill junction from legacy question_ids JSON.
    conn = op.get_bind()
    sections = conn.execute(sa.text("SELECT id, question_ids FROM assessment_sections")).fetchall()
    import uuid
    for section_id, qids in sections:
        if not qids:
            continue
        # qids may already be a Python list (JSONB) or a JSON string
        if isinstance(qids, str):
            import json
            try:
                qids = json.loads(qids)
            except Exception:
                continue
        if not isinstance(qids, list):
            continue
        for i, qid in enumerate(qids):
            if not qid:
                continue
            conn.execute(sa.text(
                "INSERT INTO assessment_section_questions (id, section_id, question_id, sort_order) "
                "VALUES (:id, :sid, :qid, :ord)"
            ), {"id": uuid.uuid4().hex, "sid": section_id, "qid": qid, "ord": i})

    # Seed default question categories.
    cats = [
        ("Quantitative Aptitude", ["mcq", "msq"], 0),
        ("Logical Reasoning", ["mcq", "msq"], 1),
        ("Verbal", ["mcq", "msq", "essay"], 2),
        ("Technical/Coding", ["coding", "sql", "mcq"], 3),
        ("Core CS", ["mcq", "msq", "coding"], 4),
        ("System Design", ["essay", "mcq"], 5),
        ("General", ["mcq", "msq", "coding", "sql", "essay"], 6),
    ]
    import json as _json
    for label, types, order in cats:
        conn.execute(sa.text(
            "INSERT INTO question_categories (id, label, allowed_types, sort_order) "
            "VALUES (:id, :label, :types, :ord)"
        ), {"id": uuid.uuid4().hex, "label": label, "types": _json.dumps(types), "ord": order})

    # Backfill section_category from legacy category where missing.
    conn.execute(sa.text(
        "UPDATE questions SET section_category = category "
        "WHERE section_category IS NULL AND category IS NOT NULL"
    ))

    op.create_table(
        "assessment_sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("invite_id", sa.String(), sa.ForeignKey("candidate_invites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", sa.String(), nullable=False),
        sa.Column("assessment_id", sa.String(), nullable=False),
        sa.Column("drawn_question_ids", JSONType, nullable=True),
        sa.Column("started_at", TSTZ, nullable=True),
        sa.Column("completed_at", TSTZ, nullable=True),
        sa.Column("created_at", TSTZ, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_assessment_sessions_invite_id", "assessment_sessions", ["invite_id"], unique=True)
    op.create_index("ix_assessment_sessions_candidate_id", "assessment_sessions", ["candidate_id"])
    op.create_index("ix_assessment_sessions_assessment_id", "assessment_sessions", ["assessment_id"])


def downgrade() -> None:
    op.drop_table("assessment_sessions")
    op.drop_table("assessment_section_questions")
    op.drop_column("assessment_sections", "pick_count")
    op.drop_column("assessment_sections", "pool_size")
    op.drop_column("assessment_sections", "allowed_categories")
    op.drop_column("assessment_sections", "allowed_types")
    op.drop_index("ix_questions_section_category", table_name="questions")
    for col in ("status", "rubric", "coding_meta", "stem_format", "selection_mode", "section_category"):
        op.drop_column("questions", col)
    op.drop_table("question_categories")
    for col in ("role_title", "organization", "registration_number"):
        op.drop_column("candidates", col)
    op.drop_index("ix_candidate_invites_delivery_status", table_name="candidate_invites")
    op.drop_index("ix_candidate_invites_batch_id", table_name="candidate_invites")
    op.drop_constraint("fk_candidate_invites_batch_id", "candidate_invites", type_="foreignkey")
    for col in ("delivery_status", "role_title", "organization", "registration_number", "batch_id"):
        op.drop_column("candidate_invites", col)
    op.drop_table("invite_batch_rows")
    op.drop_table("invite_batches")
