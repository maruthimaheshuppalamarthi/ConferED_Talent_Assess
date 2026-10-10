"""Per-job question banks: categories and questions belong to one job or the library.

Revision ID: 0009
Revises: 0008
"""
from alembic import op
import sqlalchemy as sa

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("job_id", sa.String(), nullable=True))
    op.create_foreign_key("fk_questions_job_id", "questions", "jobs", ["job_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_questions_job_id", "questions", ["job_id"])

    op.add_column("question_categories", sa.Column("job_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_question_categories_job_id", "question_categories", "jobs", ["job_id"], ["id"], ondelete="CASCADE",
    )
    op.create_index("ix_question_categories_job_id", "question_categories", ["job_id"])
    op.drop_constraint("question_categories_label_key", "question_categories", type_="unique")
    op.create_index(
        "uq_qcat_library_label", "question_categories", ["label"], unique=True,
        postgresql_where=sa.text("job_id IS NULL"), sqlite_where=sa.text("job_id IS NULL"),
    )
    op.create_index(
        "uq_qcat_job_label", "question_categories", ["job_id", "label"], unique=True,
        postgresql_where=sa.text("job_id IS NOT NULL"), sqlite_where=sa.text("job_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_qcat_job_label", table_name="question_categories")
    op.drop_index("uq_qcat_library_label", table_name="question_categories")
    op.create_unique_constraint("question_categories_label_key", "question_categories", ["label"])
    op.drop_index("ix_question_categories_job_id", table_name="question_categories")
    op.drop_constraint("fk_question_categories_job_id", "question_categories", type_="foreignkey")
    op.drop_column("question_categories", "job_id")

    op.drop_index("ix_questions_job_id", table_name="questions")
    op.drop_constraint("fk_questions_job_id", "questions", type_="foreignkey")
    op.drop_column("questions", "job_id")
