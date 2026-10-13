import os
import sys
import tempfile
import pytest

_tmp = tempfile.mkdtemp()
os.environ["AUTH_DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp, 'test_scoring.db').replace(os.sep, '/')}"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.session import SessionLocal
from app.services.bootstrap import init_auth_db
from app.models.auth import (
    Assessment, AssessmentSection, AssessmentSectionQuestion, Candidate,
    CandidateInvite, Question, new_id, utcnow,
)
from app.services.assessment_scoring import (
    _grade_coding, _grade_essay, _grade_objective, _grade_sql, grade_submission,
)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_auth_db()


def test_grade_coding_full_credit_when_all_pass():
    q = Question(
        id=new_id(),
        type="coding",
        title="Sum Array",
        content="Sum numbers in list",
        points=20,
        language="python",
        test_cases=[
            {"id": "tc-1", "input": "[1, 2, 3]", "expectedOutput": "6", "weight": 10},
            {"id": "tc-2", "input": "[10, -5]", "expectedOutput": "5", "weight": 10},
        ],
    )
    code = "def sum_list(nums):\n    return sum(nums)\n"
    score, max_score = _grade_coding(q, {"code": code, "language": "python"})
    assert max_score == 20.0
    assert score == 20.0


def test_grade_coding_partial_credit_when_some_fail():
    q = Question(
        id=new_id(),
        type="coding",
        title="Max Positive",
        content="Max positive number",
        points=30,
        language="python",
        test_cases=[
            {"id": "tc-1", "input": "[1, 5, 2]", "expectedOutput": "5", "weight": 15},
            {"id": "tc-2", "input": "[-1, -2]", "expectedOutput": "0", "weight": 15},
        ],
    )
    # This code only passes tc-1, but returns -1 on tc-2 instead of 0
    code = "def max_pos(nums):\n    return max(nums)\n"
    score, max_score = _grade_coding(q, {"code": code, "language": "python"})
    assert max_score == 30.0
    assert score == 15.0


def test_grade_sql_evaluates_against_sqlite():
    setup = (
        "CREATE TABLE sales (id INT, amount INT);\n"
        "INSERT INTO sales VALUES (1, 100), (2, 250), (3, 50);\n"
    )
    q = Question(
        id=new_id(),
        type="sql",
        title="Total Sales",
        content="Get sum of sales",
        points=15,
        test_cases=[
            {"id": "tc-sql-1", "setup": setup, "expectedOutput": "(400,)"},
        ],
    )
    query = "SELECT SUM(amount) FROM sales;"
    score, max_score = _grade_sql(q, query)
    assert max_score == 15.0
    assert score == 15.0


def test_grade_essay_scores_by_length_and_tags():
    q = Question(
        id=new_id(),
        type="essay",
        title="Microservices vs Monolith",
        content="Explain trade-offs",
        points=25,
        essay_min_words=20,
        essay_max_words=100,
        tags=["saga", "cap", "monolith"],
    )
    essay = (
        "In a microservices architecture, managing distributed transactions often requires "
        "implementing the Saga pattern to handle eventual consistency. In contrast, a monolith "
        "relies on ACID transactions. Understanding the CAP theorem helps engineers decide "
        "the trade-offs between consistency and availability."
    )
    score, max_score, ai_eval = _grade_essay(q, essay)
    assert max_score == 25.0
    assert score > 15.0  # Earned high rubric credit
    assert "feedback" in ai_eval


def test_grade_submission_end_to_end():
    with SessionLocal() as db:
        # Create Assessment with 2 sections: Coding & SQL
        assess = Assessment(id=new_id(), title="Full Assessment", role_title="Dev", passing_percentage=70)
        sec_code = AssessmentSection(id=new_id(), assessment_id=assess.id, name="Coding", sort_order=0)
        sec_sql = AssessmentSection(id=new_id(), assessment_id=assess.id, name="SQL", sort_order=1)

        q_code = Question(
            id=new_id(), type="coding", title="Multiply", content="Multiply", points=20, language="python",
            test_cases=[{"id": "tc-1", "input": "[3, 4]", "expectedOutput": "12", "weight": 20}],
        )
        q_sql = Question(
            id=new_id(), type="sql", title="Counts", content="Counts", points=10,
            test_cases=[{
                "id": "tc-1",
                "setup": "CREATE TABLE t (x INT); INSERT INTO t VALUES (1), (2);",
                "expectedOutput": "(2,)",
            }],
        )

        db.add_all([assess, sec_code, sec_sql, q_code, q_sql])
        db.add(AssessmentSectionQuestion(section_id=sec_code.id, question_id=q_code.id, sort_order=0))
        db.add(AssessmentSectionQuestion(section_id=sec_sql.id, question_id=q_sql.id, sort_order=0))

        cand = Candidate(id=new_id(), name="Bob Candidate", email="bob@test.com")
        invite = CandidateInvite(
            id=new_id(), candidate_id=cand.id, assessment_id=assess.id,
            name=cand.name, email=cand.email, token_hash="test-hash",
            expires_at=utcnow(), created_by="recruiter",
        )
        db.add_all([cand, invite])
        db.commit()

        # Candidate submits correct answers for both questions
        answers = {
            q_code.id: "def mul(pair):\n    return pair[0] * pair[1]\n",
            q_sql.id: "SELECT COUNT(*) FROM t;",
        }

        result = grade_submission(db, invite=invite, answers=answers)
        assert result["totalScore"] == 30.0
        assert result["maxScore"] == 30.0
        assert result["percentage"] == 100.0
        assert result["passStatus"] == "Pass"
