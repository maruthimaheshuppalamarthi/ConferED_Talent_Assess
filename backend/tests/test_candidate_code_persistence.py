from app.main import app
from app.db.session import SessionLocal, engine
from app.models.auth import (
    AuthBase, Candidate, CandidateInvite, Assessment, AssessmentSection, Question,
    AssessmentSession, CandidateResult, AssessmentSectionQuestion, utcnow,
)
from app.services import recruiter_pipeline, assessment_scoring
from app.api.candidate import run_code, submit_assessment, RunBody, SubmitBody
from app.core.security import hash_opaque_token


def test_candidate_code_persists_on_run_and_submit():
    AuthBase.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Create test assessment & question
        assessment = Assessment(
            id="test-assess-persistence",
            title="Persistence Test",
            role_title="Software Engineer",
            description="Testing code persistence",
            total_duration_minutes=60,
            passing_percentage=70,
        )
        db.add(assessment)

        sec = AssessmentSection(
            id="test-sec-persistence",
            assessment_id=assessment.id,
            name="Coding Section",
            sort_order=1,
            time_limit_minutes=30,
        )
        db.add(sec)

        q = Question(
            id="q-persistence-code",
            type="coding",
            title="Reverse String",
            content="Reverse a string from stdin",
            language="python",
            points=10.0,
            test_cases=[
                {"id": "tc1", "input": "hello\n", "expectedOutput": "olleh", "isHidden": False}
            ],
        )
        db.add(q)

        link = AssessmentSectionQuestion(
            section_id=sec.id,
            question_id=q.id,
            sort_order=1,
        )
        db.add(link)

        cand = Candidate(
            id="cand-persistence-1",
            name="Test Coder",
            email="testcoder@example.com",
            assessment_id=assessment.id,
            status="Assessment Sent",
        )
        db.add(cand)

        from datetime import timedelta
        token_raw = "pers-token-12345"
        invite = CandidateInvite(
            id="inv-persistence-1",
            candidate_id=cand.id,
            assessment_id=assessment.id,
            token_hash=hash_opaque_token(token_raw),
            name=cand.name,
            email=cand.email,
            expires_at=utcnow() + timedelta(days=2),
            created_by="recruiter-test-1",
        )
        db.add(invite)
        db.commit()

        # Initialize session
        recruiter_pipeline.ensure_assessment_session(db, invite)
        sess = db.query(AssessmentSession).filter(AssessmentSession.invite_id == invite.id).first()
        sess.drawn_question_ids = {sec.id: [q.id]}
        db.commit()

        cand_jwt = {"candidate_id": cand.id, "assessment_id": assessment.id, "invite_id": invite.id}

        # 1. Candidate runs code run #1
        run1_body = RunBody(
            questionId=q.id,
            language="python",
            code="import sys\nprint('run1')",
        )
        res1 = run_code(run1_body, cand=cand_jwt, db=db)
        db.refresh(sess)

        # Check DB session has saved run #1
        assert sess.progress is not None
        assert sess.progress["answers"][q.id]["code"] == "import sys\nprint('run1')"
        assert sess.progress["codeDrafts"][q.id]["files"]["python"] == "import sys\nprint('run1')"

        # 2. Candidate changes code and runs run #2 (latest run must overwrite)
        run2_body = RunBody(
            questionId=q.id,
            language="python",
            code="import sys\nprint(sys.stdin.read().strip()[::-1])",
        )
        res2 = run_code(run2_body, cand=cand_jwt, db=db)
        assert res2["passed"] is True
        db.refresh(sess)

        assert sess.progress["answers"][q.id]["code"] == "import sys\nprint(sys.stdin.read().strip()[::-1])"
        assert sess.progress["codeDrafts"][q.id]["files"]["python"] == "import sys\nprint(sys.stdin.read().strip()[::-1])"

        # 3. Candidate submits assessment
        submit_body = SubmitBody(
            answers={
                q.id: {
                    "code": "import sys\nprint(sys.stdin.read().strip()[::-1])",
                    "language": "python",
                }
            }
        )
        submit_res = submit_assessment(submit_body, cand=cand_jwt, db=db)
        assert submit_res["status"] == "submitted"

        db.refresh(sess)
        assert sess.completed_at is not None
        assert sess.progress["answers"][q.id]["code"] == "import sys\nprint(sys.stdin.read().strip()[::-1])"

        # 4. Check CandidateResult in DB
        result_row = db.query(CandidateResult).filter(CandidateResult.candidate_id == cand.id).first()
        assert result_row is not None
        assert result_row.pass_status == "Pass"
        assert result_row.section_scores.get("_submittedAnswers") is not None
        assert result_row.section_scores["_submittedAnswers"][q.id]["code"] == "import sys\nprint(sys.stdin.read().strip()[::-1])"

        # 5. Check recruiter detail view includes submitted code
        recruiter_view = recruiter_pipeline.get_candidate_detail(db, cand.id)
        assert recruiter_view is not None
        paper = recruiter_view.get("paper")
        assert paper is not None
        assert len(paper) == 1
        q_item = paper[0]["questions"][0]
        assert q_item["candidateAnswer"] is not None
        assert q_item["candidateAnswer"]["code"] == "import sys\nprint(sys.stdin.read().strip()[::-1])"
        assert q_item["candidateAnswer"]["language"] == "python"

    finally:
        # Cleanup
        try:
            db.rollback()
        except Exception:
            pass
        db.query(CandidateResult).filter(CandidateResult.candidate_id == "cand-persistence-1").delete()
        db.query(AssessmentSession).filter(AssessmentSession.candidate_id == "cand-persistence-1").delete()
        db.query(CandidateInvite).filter(CandidateInvite.id == "inv-persistence-1").delete()
        db.query(Candidate).filter(Candidate.id == "cand-persistence-1").delete()
        db.query(AssessmentSectionQuestion).filter(AssessmentSectionQuestion.section_id == "test-sec-persistence").delete()
        db.query(Question).filter(Question.id == "q-persistence-code").delete()
        db.query(AssessmentSection).filter(AssessmentSection.id == "test-sec-persistence").delete()
        db.query(Assessment).filter(Assessment.id == "test-assess-persistence").delete()
        db.commit()
        db.close()
