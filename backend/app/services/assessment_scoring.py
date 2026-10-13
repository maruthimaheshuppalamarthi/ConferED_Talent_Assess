"""Grade candidate answers against recruiter-authored correct answers (server-side only)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.auth import (
    Assessment, AssessmentSection, AssessmentSectionQuestion, Candidate,
    CandidateInvite, CandidateResult, InviteBatchRow, Question, new_id, utcnow,
)
from app.services import code_exec, sql_exec


def question_for_candidate(q: Question, option_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """Public question payload — never includes correct answers or hidden expected outputs."""
    options = q.options or []
    safe_options = []
    for opt in options:
        if isinstance(opt, dict):
            safe_options.append({
                "id": opt.get("id"),
                "text": opt.get("text") or "",
                # deliberately omit isCorrect / explanation that reveals the key
            })
        else:
            safe_options.append({"id": str(opt), "text": str(opt)})
    if option_ids:
        by_id = {opt["id"]: opt for opt in safe_options if opt.get("id")}
        ordered = [by_id[oid] for oid in option_ids if oid in by_id]
        ordered.extend(opt for opt in safe_options if opt.get("id") not in set(option_ids))
        safe_options = ordered

    visible_cases = []
    for tc in (q.test_cases or []):
        if not isinstance(tc, dict):
            continue
        if tc.get("isHidden"):
            visible_cases.append({
                "id": tc.get("id"),
                "isHidden": True,
                "weight": tc.get("weight", 1),
                # no input/expected for hidden cases
            })
        else:
            visible_cases.append({
                "id": tc.get("id"),
                "input": tc.get("input"),
                "inputs": tc.get("inputs") if isinstance(tc.get("inputs"), list) else None,
                "expectedOutput": tc.get("expectedOutput"),
                "isHidden": False,
                "weight": tc.get("weight", 1),
            })

    return {
        "id": q.id,
        "type": q.type,
        "title": q.title,
        "content": q.content,
        "options": safe_options,
        "sampleCode": q.sample_code,
        "language": q.language,
        "testCases": visible_cases,
        "essayMinWords": q.essay_min_words,
        "essayMaxWords": q.essay_max_words,
        "difficulty": q.difficulty,
        "points": q.points,
        "category": q.section_category or q.category,
        "sectionCategory": q.section_category or q.category,
        "jobRole": q.job_role,
        "selectionMode": q.selection_mode,
        "stemFormat": q.stem_format or "plain",
        "constraints": (q.coding_meta or {}).get("constraints"),
        "ioFormat": (q.coding_meta or {}).get("io_format"),
        "tags": q.tags or [],
        # correctAnswers / rubric intentionally omitted
    }


def _grade_objective(q: Question, answer: Any) -> Tuple[float, float]:
    """Return (score, max) for mcq/msq/drag_drop."""
    max_pts = float(q.points or 0)
    correct = list(q.correct_answers or [])
    if not correct:
        return 0.0, max_pts

    if q.type == "mcq":
        chosen = answer if isinstance(answer, str) else (answer[0] if isinstance(answer, list) and answer else None)
        return (max_pts if chosen in correct else 0.0), max_pts

    if q.type == "msq":
        chosen = set(answer if isinstance(answer, list) else ([answer] if answer else []))
        expected = set(correct)
        if not expected:
            return 0.0, max_pts
        if chosen == expected:
            return max_pts, max_pts
        # partial credit by overlap
        overlap = len(chosen & expected) / len(expected)
        penalty = len(chosen - expected) / max(len(expected), 1)
        return max(0.0, max_pts * (overlap - penalty * 0.5)), max_pts

    if q.type == "drag_drop":
        order = answer if isinstance(answer, list) else []
        if order == correct:
            return max_pts, max_pts
        # partial: fraction of items in correct position
        if not correct:
            return 0.0, max_pts
        hits = sum(1 for i, cid in enumerate(correct) if i < len(order) and order[i] == cid)
        return max_pts * (hits / len(correct)), max_pts

    return 0.0, max_pts


def _grade_coding(q: Question, answer: Any) -> Tuple[float, float]:
    """Grade programming solution against test cases."""
    max_pts = float(q.points or 0)
    if not answer:
        return 0.0, max_pts

    if isinstance(answer, dict):
        code = str(answer.get("code") or "")
        language = str(answer.get("language") or q.language or "python")
    else:
        code = str(answer or "")
        language = str(q.language or "python")

    if not code.strip():
        return 0.0, max_pts

    test_cases = q.test_cases or []
    res = code_exec.execute(language, code, test_cases)
    test_results = res.get("testResults") or []
    if not test_results:
        return (max_pts if res.get("passed") else 0.0), max_pts

    total_weight = sum(float(tc.get("weight", 1)) for tc in test_cases) or float(len(test_results))
    passed_weight = 0.0
    for idx, r in enumerate(test_results):
        tc_def = test_cases[idx] if idx < len(test_cases) else {}
        w = float(tc_def.get("weight", 1))
        if r.get("passed"):
            passed_weight += w

    ratio = min(1.0, max(0.0, passed_weight / total_weight)) if total_weight > 0 else 0.0
    return round(max_pts * ratio, 2), max_pts


def _grade_sql(q: Question, answer: Any) -> Tuple[float, float]:
    """Grade SQL query against SQLite test cases."""
    max_pts = float(q.points or 0)
    if not answer:
        return 0.0, max_pts

    if isinstance(answer, dict):
        code = str(answer.get("code") or answer.get("sql") or "")
    else:
        code = str(answer or "")

    if not code.strip():
        return 0.0, max_pts

    correct = (q.correct_answers or [None])[0] if q.correct_answers else None
    res = sql_exec.execute_sql(code, q.test_cases or [], correct)
    test_results = res.get("testResults") or []
    if not test_results:
        return (max_pts if res.get("passed") else 0.0), max_pts

    passed_count = sum(1 for r in test_results if r.get("passed"))
    ratio = passed_count / len(test_results)
    return round(max_pts * ratio, 2), max_pts


def _grade_essay(q: Question, answer: Any) -> Tuple[float, float, Dict[str, Any]]:
    """Grade written essay using the AI Evaluation Engine."""
    from app.services import ai_evaluator
    max_pts = float(q.points or 0)
    text = str(answer or "").strip() if not isinstance(answer, dict) else str(answer.get("text") or answer.get("content") or "").strip()
    result = ai_evaluator.evaluate_essay(
        question_content=q.content or q.title,
        candidate_essay=text,
        points=max_pts,
        min_words=q.essay_min_words,
        max_words=q.essay_max_words,
        rubric=q.rubric or "",
        tags=q.tags or [],
    )
    return result["score"], max_pts, result


def grade_submission(
    db: Session,
    *,
    invite: CandidateInvite,
    answers: Dict[str, Any],
    drawn_question_ids: Optional[Dict[str, List[str]]] = None,
) -> Dict[str, Any]:
    assessment = db.query(Assessment).filter(Assessment.id == invite.assessment_id).first()
    sections = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == invite.assessment_id)
        .order_by(AssessmentSection.sort_order.asc())
        .all()
    )

    section_scores: Dict[str, Any] = {}
    question_evaluations: Dict[str, Any] = {}
    total = 0.0
    max_total = 0.0

    for sec in sections:
        if drawn_question_ids and sec.id in drawn_question_ids:
            qids = drawn_question_ids[sec.id]
        else:
            links = (
                db.query(AssessmentSectionQuestion)
                .filter(AssessmentSectionQuestion.section_id == sec.id)
                .order_by(AssessmentSectionQuestion.sort_order.asc())
                .all()
            )
            qids = [lnk.question_id for lnk in links] or list(sec.question_ids or [])

        questions = db.query(Question).filter(Question.id.in_(qids)).all() if qids else []
        by_id = {q.id: q for q in questions}
        sec_score = 0.0
        sec_max = 0.0
        for qid in qids:
            q = by_id.get(qid)
            if not q:
                continue
            if q.type in ("mcq", "msq", "drag_drop"):
                s, m = _grade_objective(q, answers.get(qid))
            elif q.type == "coding":
                s, m = _grade_coding(q, answers.get(qid))
            elif q.type == "sql":
                s, m = _grade_sql(q, answers.get(qid))
            elif q.type == "essay":
                s, m, ai_eval = _grade_essay(q, answers.get(qid))
                if ai_eval:
                    question_evaluations[qid] = ai_eval
            else:
                m = float(q.points or 0)
                s = 0.0
            sec_score += s
            sec_max += m
        total += sec_score
        max_total += sec_max
        pct = round((sec_score / sec_max) * 100, 1) if sec_max else 0.0
        section_scores[sec.name] = {"score": round(sec_score, 2), "maxScore": round(sec_max, 2), "percentage": pct}

    if question_evaluations:
        section_scores["_aiEvaluations"] = question_evaluations
    if answers:
        section_scores["_submittedAnswers"] = answers

    percentage = round((total / max_total) * 100, 1) if max_total else 0.0
    passing = assessment.passing_percentage if assessment else 70
    pass_status = "Pass" if percentage >= passing else "Fail"

    result = CandidateResult(
        id=new_id(),
        candidate_id=invite.candidate_id,
        assessment_id=invite.assessment_id,
        completed_at=utcnow().isoformat(),
        total_score=round(total, 2),
        max_score=round(max_total, 2),
        percentage=percentage,
        pass_status=pass_status,
        section_scores=section_scores,
        ai_confidence_score=95.0,
        total_violations=0,
        recruiter_notes="Auto-scored: Objective, Coding, SQL, and Essay questions evaluated successfully.",
        recruiter_decision="Under Review",
    )
    db.add(result)

    cand = db.query(Candidate).filter(Candidate.id == invite.candidate_id).first()
    if cand:
        cand.status = "Completed"
        cand.assessment_completed = True
        cand.updated_at = utcnow()

    invite.delivery_status = "COMPLETED"
    db.query(InviteBatchRow).filter(InviteBatchRow.invite_id == invite.id).update(
        {"delivery_status": "COMPLETED"}, synchronize_session=False,
    )
    db.commit()

    return {
        "resultId": result.id,
        "totalScore": result.total_score,
        "maxScore": result.max_score,
        "percentage": result.percentage,
        "passStatus": result.pass_status,
        # Candidate API must not return sectionScores to the browser for the candidate portal.
        # Recruiters fetch via /recruiter/candidates/{id}.
    }
