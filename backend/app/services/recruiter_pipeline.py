"""Hiring pipeline reads/writes for the Recruiter portal."""
from __future__ import annotations

import random
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.auth import (
    Assessment, AssessmentSection, AssessmentSectionQuestion, AssessmentSession,
    Candidate, CandidateInvite, CandidateResult, InviteBatchRow, Job, Question, QuestionCategory,
    new_id, utcnow,
)
from app.services.question_bank import question_out, validate_question_body, apply_question_fields

STAGES = [
    "Applied", "Screened", "Assessment Sent", "Completed", "Under Review", "Selected", "Rejected",
]

STAGE_SLUGS = {
    "applied": "Applied",
    "screened": "Screened",
    "assessment-sent": "Assessment Sent",
    "completed": "Completed",
    "under-review": "Under Review",
    "selected": "Selected",
    "rejected": "Rejected",
}

SECTION_KEYS = (
    ("Technical MCQs & Aptitude", "mcq"),
    ("Database & SQL Engineering", "sql"),
    ("Algorithmic Coding Challenge", "coding"),
    ("Architectural Essay", "essay"),
)


def resolve_stage(slug: Optional[str]) -> Optional[str]:
    if not slug:
        return None
    return STAGE_SLUGS.get(slug.lower())


def _section_cells(section_scores: Optional[dict]) -> Dict[str, Optional[str]]:
    scores = section_scores or {}
    out: Dict[str, Optional[str]] = {}
    for full, short in SECTION_KEYS:
        cell = scores.get(full)
        if not cell:
            out[short] = None
        else:
            out[short] = f"{cell.get('score', 0)}/{cell.get('maxScore', 0)}"
    return out


def candidate_row(cand: Candidate, result: Optional[CandidateResult] = None) -> Dict[str, Any]:
    cells = _section_cells(result.section_scores if result else None)
    return {
        "id": cand.id,
        "name": cand.name,
        "email": cand.email,
        "phone": cand.phone or "",
        "experienceYears": cand.experience_years or 0,
        "skills": cand.skills or [],
        "status": cand.status,
        "assessmentId": cand.assessment_id or "",
        "invitedAt": cand.invited_at or "",
        "otpVerified": bool(cand.otp_verified),
        "systemCheckPassed": bool(cand.system_check_passed),
        "assessmentCompleted": bool(cand.assessment_completed),
        "livePhotoUrl": cand.live_photo_url,
        "idProofUrl": cand.id_proof_url,
        "idDocumentType": cand.id_document_type,
        "systemCheck": cand.system_check,
        "identityStatus": cand.identity_status,
        "organization": cand.organization,
        "roleTitle": cand.role_title,
        "source": cand.source,
        "totalScore": result.total_score if result else None,
        "maxScore": result.max_score if result else None,
        "percentage": result.percentage if result else None,
        "passStatus": result.pass_status if result else None,
        "mcq": cells["mcq"],
        "sql": cells["sql"],
        "coding": cells["coding"],
        "essay": cells["essay"],
        "violations": result.total_violations if result else 0,
        "sectionScores": result.section_scores if result else None,
    }


def _results_map(db: Session, candidate_ids: List[str]) -> Dict[str, CandidateResult]:
    if not candidate_ids:
        return {}
    rows = db.query(CandidateResult).filter(CandidateResult.candidate_id.in_(candidate_ids)).all()
    return {r.candidate_id: r for r in rows}


def stage_counts(db: Session) -> Dict[str, int]:
    rows = db.query(Candidate.status, Candidate.id).all()
    counts = {s: 0 for s in STAGES}
    total = 0
    for status, _ in rows:
        total += 1
        if status in counts:
            counts[status] += 1
    return {
        "all": total,
        "applied": counts["Applied"],
        "screened": counts["Screened"],
        "assessmentSent": counts["Assessment Sent"],
        "completed": counts["Completed"],
        "underReview": counts["Under Review"],
        "selected": counts["Selected"],
        "rejected": counts["Rejected"],
    }


def list_pipeline(db: Session, status: Optional[str] = None, job_id: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
    q = db.query(Candidate).order_by(Candidate.created_at.desc(), Candidate.name.asc())
    if status:
        q = q.filter(Candidate.status == status)
    if job_id:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            q = q.filter((Candidate.assessment_id == job.assessment_id) | (Candidate.role_title == job.title))
    cands = q.all()
    results = _results_map(db, [c.id for c in cands])

    aids = list({c.assessment_id for c in cands if c.assessment_id})
    job_titles: Dict[str, str] = {}
    if aids:
        for aid, title in db.query(Job.assessment_id, Job.title).filter(Job.assessment_id.in_(aids)).all():
            job_titles[aid] = title
        for aid, title in db.query(Assessment.id, Assessment.title).filter(Assessment.id.in_(aids)).all():
            if aid not in job_titles:
                job_titles[aid] = title

    items = []
    for c in cands:
        row = candidate_row(c, results.get(c.id))
        if not row.get("roleTitle") and c.assessment_id and c.assessment_id in job_titles:
            row["roleTitle"] = job_titles[c.assessment_id]
        items.append(row)
    return items, len(items)


def paper_for_candidate(db: Session, cand: Candidate) -> Optional[List[Dict[str, Any]]]:
    """The question and option order this candidate was shown."""
    aid = cand.assessment_id
    if not aid:
        inv = db.query(CandidateInvite).filter(CandidateInvite.candidate_id == cand.id).first()
        if inv and inv.assessment_id:
            aid = inv.assessment_id
    if not aid:
        return None

    session = (
        db.query(AssessmentSession)
        .filter(
            AssessmentSession.candidate_id == cand.id,
            AssessmentSession.assessment_id == aid,
        )
        .order_by(AssessmentSession.created_at.desc())
        .first()
    )
    result = db.query(CandidateResult).filter(CandidateResult.candidate_id == cand.id).first()
    submitted_from_result = {}
    if result and result.section_scores and isinstance(result.section_scores, dict):
        submitted_from_result = result.section_scores.get("_submittedAnswers") or {}

    drawn = (session.drawn_question_ids or {}) if session else {}
    option_order = (session.option_order or {}) if session else {}
    prog = (session.progress or {}) if session else {}
    cand_answers = dict(prog.get("answers") or {})
    if not cand_answers and submitted_from_result:
        cand_answers = dict(submitted_from_result)
    code_drafts = dict(prog.get("codeDrafts") or {})

    sections = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == aid)
        .order_by(AssessmentSection.sort_order.asc())
        .all()
    )
    paper: List[Dict[str, Any]] = []
    for section in sections:
        qids = drawn.get(section.id) or _section_question_ids(db, section) or []
        questions = db.query(Question).filter(Question.id.in_(qids)).all() if qids else []
        by_id = {q.id: q for q in questions}
        items = []
        for number, qid in enumerate(qids, start=1):
            question = by_id.get(qid)
            if not question:
                continue
            opts = []
            by_opt = {}
            for idx, opt in enumerate(question.options or []):
                if isinstance(opt, dict):
                    oid = str(opt.get("id") or f"opt-{idx+1}")
                    by_opt[oid] = opt.get("text") or ""
                elif isinstance(opt, str):
                    oid = f"opt-{idx+1}"
                    by_opt[oid] = opt
            correct = {str(cid) for cid in (question.correct_answers or [])}
            order = (option_order.get(qid) if option_order else None) or list(by_opt.keys())
            if not order:
                order = list(by_opt.keys())
            for oid in order:
                if oid in by_opt:
                    opts.append({"id": oid, "text": by_opt[oid], "correct": oid in correct})
            for oid, text in by_opt.items():
                if not any(o["id"] == oid for o in opts):
                    opts.append({"id": oid, "text": text, "correct": oid in correct})

            ans = cand_answers.get(qid)
            if ans is None and qid in code_drafts:
                draft = code_drafts[qid]
                if isinstance(draft, dict):
                    lang = draft.get("language")
                    files = draft.get("files") or {}
                    ans = {"code": files.get(lang, ""), "language": lang}

            items.append({
                "number": number,
                "id": question.id,
                "type": question.type,
                "title": question.title,
                "content": question.content or question.title,
                "points": question.points or 10,
                "explanation": question.explanation or "",
                "options": opts,
                "candidateAnswer": ans,
                "correctAnswers": [str(c) for c in (question.correct_answers or [])],
                "sampleCode": question.sample_code,
                "language": question.language,
                "difficulty": question.difficulty or "medium",
                "testCases": question.test_cases,
            })
        if items:
            paper.append({"id": section.id, "name": section.name, "questions": items})
    return paper or None


def get_candidate_detail(db: Session, candidate_id: str) -> Optional[Dict[str, Any]]:
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        return None
    result = db.query(CandidateResult).filter(CandidateResult.candidate_id == candidate_id).first()
    row = candidate_row(cand, result)
    if result:
        row["result"] = {
            "id": result.id,
            "candidateId": result.candidate_id,
            "assessmentId": result.assessment_id,
            "completedAt": result.completed_at,
            "totalScore": result.total_score,
            "maxScore": result.max_score,
            "percentage": result.percentage,
            "passStatus": result.pass_status,
            "sectionScores": result.section_scores or {},
            "aiConfidenceScore": result.ai_confidence_score,
            "totalViolations": result.total_violations,
            "proctoringLogs": result.proctoring_logs or [],
            "recruiterNotes": result.recruiter_notes or "",
            "recruiterDecision": result.recruiter_decision,
        }
    else:
        row["result"] = None
    if not row.get("roleTitle") and cand.assessment_id:
        job = db.query(Job).filter(Job.assessment_id == cand.assessment_id).first()
        if job:
            row["roleTitle"] = job.title
        else:
            assessment = db.query(Assessment).filter(Assessment.id == cand.assessment_id).first()
            if assessment:
                row["roleTitle"] = assessment.role_title or assessment.title
    row["paper"] = paper_for_candidate(db, cand)
    return row


def update_candidate_decision(db: Session, candidate_id: str, decision: str, notes: str) -> Optional[Dict[str, Any]]:
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        return None
    result = db.query(CandidateResult).filter(CandidateResult.candidate_id == candidate_id).first()
    if result is None:
        result = CandidateResult(
            id=new_id(), candidate_id=candidate_id, assessment_id=cand.assessment_id or "",
            recruiter_decision=decision, recruiter_notes=notes or "",
        )
        db.add(result)
    else:
        result.recruiter_decision = decision
        result.recruiter_notes = notes or ""
        result.updated_at = utcnow()

    if decision in ("Selected", "Rejected", "Under Review"):
        cand.status = decision
        cand.updated_at = utcnow()
    db.commit()
    return get_candidate_detail(db, candidate_id)


def upsert_invited_candidate(
    db: Session, *, candidate_id: str, name: str, email: str, phone: Optional[str], assessment_id: str,
) -> Candidate:
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    today = utcnow().date().isoformat()
    if cand is None:
        cand = Candidate(
            id=candidate_id, name=name, email=email, phone=phone or "",
            experience_years=0, skills=[], status="Assessment Sent",
            assessment_id=assessment_id, invited_at=today,
            otp_verified=False, system_check_passed=False, assessment_completed=False,
            identity_status="pending_verification",
        )
        db.add(cand)
    else:
        cand.name = name
        cand.email = email
        if phone is not None:
            cand.phone = phone
        cand.assessment_id = assessment_id
        cand.status = "Assessment Sent"
        cand.invited_at = today
        cand.assessment_completed = False
        cand.updated_at = utcnow()
    db.commit()
    db.refresh(cand)
    return cand


# ------------------------------------------------------------------ questions
def list_questions(db: Session) -> List[Dict[str, Any]]:
    return [question_out(q) for q in db.query(Question).order_by(Question.created_at.desc()).all()]


def get_question(db: Session, qid: str) -> Optional[Question]:
    return db.query(Question).filter(Question.id == qid).first()


FIXED_SECTIONS = (
    "Quantitative Aptitude",
    "Logical Reasoning",
    "English",
    "Technical",
)
_SECTION_MINUTES = {
    "Quantitative Aptitude": 15,
    "Logical Reasoning": 15,
    "English": 10,
    "Technical": 20,
}


def _category_label_for_job(db: Session, job_id: Optional[str], label: str) -> str:
    """A question section is one of the fixed sections, or an older catalog label."""
    cleaned = (label or "").strip()
    for name in FIXED_SECTIONS:
        if cleaned.lower() == name.lower():
            return name
    if not job_id:
        return cleaned or "General"
    on_job = (
        db.query(QuestionCategory)
        .filter(QuestionCategory.job_id == job_id, QuestionCategory.label.ilike(cleaned))
        .first()
    )
    if on_job:
        return on_job.label
    shared = (
        db.query(QuestionCategory)
        .filter(QuestionCategory.job_id.is_(None), QuestionCategory.label.ilike(cleaned))
        .first()
    )
    if shared:
        return shared.label
    raise ValueError("Choose a category from the question bank.")


def place_question(
    db: Session, question: Question, *, job_id: Optional[str], section_id: Optional[str],
) -> None:
    """Link a question onto a job and, when chosen, one of that job's sections."""
    if not job_id:
        question.job_id = None
        question.job_role = None
        db.query(AssessmentSectionQuestion).filter(
            AssessmentSectionQuestion.question_id == question.id
        ).delete(synchronize_session=False)
        return

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError("Job not found.")
    if job.status == "closed" and question.job_id != job.id:
        raise ValueError("This job is closed. Questions cannot be assigned to it.")
    question.job_id = job.id
    question.job_role = job.title
    sections = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == job.assessment_id)
        .all()
    )
    section_ids = [s.id for s in sections]
    if section_ids:
        db.query(AssessmentSectionQuestion).filter(
            AssessmentSectionQuestion.question_id == question.id,
            AssessmentSectionQuestion.section_id.in_(section_ids),
        ).delete(synchronize_session=False)
        db.flush()
        for section in sections:
            section.question_ids = [qid for qid in (section.question_ids or []) if qid != question.id]
            section.pool_size = len(_section_question_ids(db, section))
    if not section_id:
        label = (question.section_category or question.category or "").strip().lower()
        match = next((s for s in sections if (s.name or "").strip().lower() == label), None)
        if match:
            section_id = match.id
        else:
            return

    section = next((s for s in sections if s.id == section_id), None)
    if not section:
        raise ValueError("That section is not on this job.")
    ids = [qid for qid in _section_question_ids(db, section) if qid != question.id]
    ids.append(question.id)
    section.question_ids = ids
    section.pool_size = len(ids)
    _set_section_pool(db, section.id, ids)


def claim_questions_by_job_title(db: Session) -> None:
    """Questions saved with a job name in the old tag field belong on that job."""
    jobs = db.query(Job).all()
    changed = False
    for job in jobs:
        title = (job.title or "").strip()
        if not title:
            continue
        rows = (
            db.query(Question)
            .filter(Question.job_id.is_(None), Question.job_role.ilike(title))
            .all()
        )
        for question in rows:
            question.job_id = job.id
            question.job_role = job.title
            changed = True
    if changed:
        db.commit()


def ensure_job_is_open(db: Session, assessment_id: str) -> None:
    """Invites go out only for a job whose status is open."""
    job = db.query(Job).filter(Job.assessment_id == assessment_id).first()
    if job and job.status != "open":
        raise ValueError("Invitations can be sent only for an open job.")


def add_job_section(db: Session, job: Job, body: Dict[str, Any]) -> Dict[str, Any]:
    if job.status == "closed":
        raise ValueError("This job is closed. Sections cannot be added to it.")
    name = (body.get("name") or "").strip()
    if not name:
        raise ValueError("Section name is required.")
    order = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == job.assessment_id)
        .count()
    )
    section = AssessmentSection(
        id=new_id(),
        assessment_id=job.assessment_id,
        name=name,
        description=body.get("description") or name,
        instructions=body.get("instructions") or "",
        time_limit_minutes=int(body.get("timeLimitMinutes") or 15),
        passing_marks=int(body.get("passingMarks") or 10),
        is_mandatory=True,
        randomize_questions=True,
        question_ids=[],
        sort_order=order,
        pool_size=0,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return _section_out(db, section)


def create_question(db: Session, body: Dict[str, Any]) -> Dict[str, Any]:
    job_id = (body.get("jobId") or "").strip() or None
    if job_id:
        body["sectionCategory"] = _category_label_for_job(
            db, job_id, body.get("sectionCategory") or body.get("category") or "",
        )
    errs = validate_question_body(body)
    if errs:
        raise ValueError("; ".join(errs))
    q = Question(
        id=body.get("id") or new_id(),
        type=body["type"], title=body["title"], content=body.get("content") or body["title"],
        options=body.get("options"), correct_answers=body.get("correctAnswers"),
        sample_code=body.get("sampleCode"), language=body.get("language"),
        test_cases=body.get("testCases"), essay_min_words=body.get("essayMinWords"),
        essay_max_words=body.get("essayMaxWords"), difficulty=body.get("difficulty") or "medium",
        points=int(body.get("points") or 10),
        category=body.get("category") or body.get("sectionCategory") or "General",
        tags=body.get("tags") or [],
        section_category=body.get("sectionCategory") or body.get("category") or "General",
        job_role=(body.get("jobRole") or "").strip() or None,
        selection_mode=body.get("selectionMode"),
        stem_format=body.get("stemFormat") or "plain",
        rubric=body.get("rubric"),
        status=body.get("status") or "published",
    )
    apply_question_fields(q, body)
    db.add(q)
    db.flush()
    section_id = (body.get("sectionId") or "").strip() or None
    if job_id or section_id:
        place_question(db, q, job_id=job_id, section_id=section_id)
    db.commit()
    db.refresh(q)
    return question_out(q)


def update_question(db: Session, q: Question, body: Dict[str, Any]) -> Dict[str, Any]:
    if "jobId" in body:
        job_id = (body.get("jobId") or "").strip() or None
    else:
        job_id = q.job_id
    if job_id and ("sectionCategory" in body or "category" in body):
        label = _category_label_for_job(
            db, job_id, body.get("sectionCategory") or body.get("category") or q.section_category or "",
        )
        body["sectionCategory"] = label
        body["category"] = label
    merged = {**question_out(q), **{k: v for k, v in body.items() if v is not None}}
    errs = validate_question_body(merged, partial=False)
    if errs:
        raise ValueError("; ".join(errs))
    apply_question_fields(q, body)
    if "jobId" in body or "sectionId" in body or "sectionCategory" in body:
        place_question(
            db, q,
            job_id=(body.get("jobId") if "jobId" in body else q.job_id) or None,
            section_id=(body.get("sectionId") or "").strip() or None if "sectionId" in body else None,
        )
    db.commit()
    db.refresh(q)
    return question_out(q)


def delete_question(db: Session, q: Question) -> None:
    db.delete(q)
    db.commit()


# ------------------------------------------------------------------ jobs
JOB_STATUSES = ("draft", "open", "closed")
# The exam row keeps the older assessment status vocabulary.
_ASSESSMENT_STATUS = {"draft": "draft", "open": "active", "closed": "archived"}
_JOB_STATUS_FROM_ASSESSMENT = {"active": "open", "draft": "draft", "archived": "closed"}


class JobInUseError(Exception):
    """A job cannot be deleted because candidates or invites already use its exam."""


def _job_status(value: Optional[str], *, default: str = "draft") -> str:
    status = (value or default).strip().lower()
    if status not in JOB_STATUSES:
        raise ValueError("Status must be draft, open, or closed.")
    return status


def job_out(db: Session, job: Job) -> Dict[str, Any]:
    section_count = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == job.assessment_id)
        .count()
    )
    assessment = db.query(Assessment).filter(Assessment.id == job.assessment_id).first()
    total_dur = getattr(job, "total_duration_minutes", None) or (assessment.total_duration_minutes if assessment else 60)
    sched_date = getattr(job, "scheduled_date", None) or (assessment.scheduled_date if assessment else None)
    sched_time = getattr(job, "start_time", None) or (assessment.start_time if assessment else None)
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description or "",
        "status": job.status,
        "assessmentId": job.assessment_id,
        "sectionCount": section_count,
        "totalDurationMinutes": total_dur,
        "scheduledDate": sched_date,
        "startTime": sched_time,
        "createdAt": job.created_at.isoformat() if job.created_at else None,
    }


def ensure_jobs_for_assessments(db: Session) -> None:
    """Give every exam a job. Existing databases predate the jobs table."""
    orphans = (
        db.query(Assessment)
        .outerjoin(Job, Job.assessment_id == Assessment.id)
        .filter(Job.id.is_(None))
        .all()
    )
    if not orphans:
        return
    for assessment in orphans:
        status = _JOB_STATUS_FROM_ASSESSMENT.get((assessment.status or "draft").lower(), "draft")
        title = (assessment.role_title or assessment.title or "Untitled job").strip() or "Untitled job"
        db.add(Job(
            id=new_id(),
            title=title,
            description=assessment.description or "",
            status=status,
            assessment_id=assessment.id,
            total_duration_minutes=assessment.total_duration_minutes or 60,
            scheduled_date=getattr(assessment, "scheduled_date", None),
            start_time=getattr(assessment, "start_time", None),
        ))
    db.commit()


def list_jobs(db: Session) -> List[Dict[str, Any]]:
    ensure_jobs_for_assessments(db)
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return [job_out(db, job) for job in jobs]


def get_job(db: Session, job_id: str) -> Optional[Job]:
    return db.query(Job).filter(Job.id == job_id).first()


def create_job(db: Session, body: Dict[str, Any]) -> Dict[str, Any]:
    title = (body.get("title") or "").strip()
    if not title:
        raise ValueError("Job title is required.")
    status = _job_status(body.get("status"))
    description = (body.get("description") or "").strip()
    assessment_id = new_id()
    total_duration = int(body.get("totalDurationMinutes") or 60)
    scheduled_date = (body.get("scheduledDate") or "").strip() or None
    if scheduled_date and scheduled_date < utcnow().date().isoformat():
        raise ValueError("Assessment date cannot be in the past. Please select today or a future date.")
    start_time = (body.get("startTime") or "").strip() or None
    db.add(Assessment(
        id=assessment_id,
        title=title,
        role_title=title,
        description=description,
        total_duration_minutes=total_duration,
        scheduled_date=scheduled_date,
        start_time=start_time,
        total_questions=0,
        passing_percentage=int(body.get("passingPercentage") or 70),
        status=_ASSESSMENT_STATUS[status],
        created_date=utcnow().date().isoformat(),
    ))
    job = Job(
        id=new_id(),
        title=title,
        description=description,
        status=status,
        assessment_id=assessment_id,
        total_duration_minutes=total_duration,
        scheduled_date=scheduled_date,
        start_time=start_time,
    )
    db.add(job)
    db.flush()
    ensure_standard_exam_sections(db, assessment_id)
    db.commit()
    db.refresh(job)
    return job_out(db, job)


def update_job(db: Session, job: Job, body: Dict[str, Any]) -> Dict[str, Any]:
    if "title" in body and body["title"] is not None:
        title = body["title"].strip()
        if not title:
            raise ValueError("Job title is required.")
        job.title = title
    if "description" in body and body["description"] is not None:
        job.description = body["description"].strip()
    if "status" in body and body["status"] is not None:
        job.status = _job_status(body["status"], default=job.status)
    if "totalDurationMinutes" in body and body["totalDurationMinutes"] is not None:
        job.total_duration_minutes = int(body["totalDurationMinutes"])
    if "scheduledDate" in body:
        s_date = (body["scheduledDate"] or "").strip() or None
        if s_date and s_date < utcnow().date().isoformat():
            raise ValueError("Assessment date cannot be in the past. Please select today or a future date.")
        job.scheduled_date = s_date
    if "startTime" in body:
        job.start_time = (body["startTime"] or "").strip() or None
    job.updated_at = utcnow()

    assessment = db.query(Assessment).filter(Assessment.id == job.assessment_id).first()
    if assessment:
        assessment.title = job.title
        assessment.role_title = job.title
        assessment.description = job.description or ""
        assessment.status = _ASSESSMENT_STATUS[job.status]
        if "totalDurationMinutes" in body and body["totalDurationMinutes"] is not None:
            assessment.total_duration_minutes = int(body["totalDurationMinutes"])
        if "scheduledDate" in body:
            assessment.scheduled_date = job.scheduled_date
        if "startTime" in body:
            assessment.start_time = job.start_time
        assessment.updated_at = utcnow()
    db.commit()
    db.refresh(job)
    return job_out(db, job)


def delete_job(db: Session, job: Job) -> None:
    aid = job.assessment_id
    in_use = (
        db.query(Candidate.id).filter(Candidate.assessment_id == aid).first()
        or db.query(CandidateInvite.id).filter(CandidateInvite.assessment_id == aid).first()
    )
    if in_use:
        raise JobInUseError(
            "This job already has candidates or invitations. Close it instead of deleting it."
        )
    assessment = db.query(Assessment).filter(Assessment.id == aid).first()
    if assessment:
        delete_assessment(db, assessment)
        return
    db.delete(job)
    db.commit()


# ------------------------------------------------------------------ assessments
def _section_question_ids(db: Session, section: AssessmentSection) -> List[str]:
    links = (
        db.query(AssessmentSectionQuestion)
        .filter(AssessmentSectionQuestion.section_id == section.id)
        .order_by(AssessmentSectionQuestion.sort_order.asc())
        .all()
    )
    if links:
        return [l.question_id for l in links]
    return list(section.question_ids or [])


def _questions_by_ids(db: Session, ids: List[str]) -> List[Dict[str, Any]]:
    if not ids:
        return []
    found = {q.id: q for q in db.query(Question).filter(Question.id.in_(ids)).all()}
    return [question_out(found[i]) for i in ids if i in found]


def _set_section_pool(db: Session, section_id: str, qids: List[str]) -> None:
    db.query(AssessmentSectionQuestion).filter(AssessmentSectionQuestion.section_id == section_id).delete()
    for i, qid in enumerate(qids):
        if qid:
            db.add(AssessmentSectionQuestion(
                id=new_id(), section_id=section_id, question_id=qid, sort_order=i,
            ))


def _section_out(db: Session, s: AssessmentSection) -> Dict[str, Any]:
    qids = _section_question_ids(db, s)
    return {
        "id": s.id,
        "name": s.name,
        "description": s.description or "",
        "instructions": s.instructions or "",
        "timeLimitMinutes": s.time_limit_minutes,
        "passingMarks": s.passing_marks,
        "isMandatory": bool(s.is_mandatory),
        "randomizeQuestions": bool(s.randomize_questions),
        "allowedTypes": s.allowed_types or [],
        "allowedCategories": s.allowed_categories or [],
        "poolSize": s.pool_size if s.pool_size is not None else len(qids),
        "pickCount": s.pick_count,
        "jobRole": s.job_role,
        "questions": _questions_by_ids(db, qids),
    }


def assessment_out(db: Session, a: Assessment) -> Dict[str, Any]:
    sections = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == a.id)
        .order_by(AssessmentSection.sort_order.asc())
        .all()
    )
    return {
        "id": a.id,
        "title": a.title,
        "roleTitle": a.role_title,
        "description": a.description or "",
        "totalDurationMinutes": a.total_duration_minutes,
        "scheduledDate": getattr(a, "scheduled_date", None),
        "startTime": getattr(a, "start_time", None),
        "totalQuestions": a.total_questions,
        "passingPercentage": a.passing_percentage,
        "status": a.status,
        "createdDate": a.created_date or (a.created_at.date().isoformat() if a.created_at else ""),
        "sections": [_section_out(db, s) for s in sections],
    }


def list_assessments(db: Session) -> List[Dict[str, Any]]:
    return [assessment_out(db, a) for a in db.query(Assessment).order_by(Assessment.created_at.desc()).all()]


def get_assessment(db: Session, aid: str) -> Optional[Assessment]:
    return db.query(Assessment).filter(Assessment.id == aid).first()


def create_assessment(db: Session, body: Dict[str, Any]) -> Dict[str, Any]:
    aid = body.get("id") or new_id()
    sections = body.get("sections") or []
    total_dur = int(body.get("totalDurationMinutes") or 60)
    scheduled_date = (body.get("scheduledDate") or "").strip() or None
    if scheduled_date and scheduled_date < utcnow().date().isoformat():
        raise ValueError("Assessment date cannot be in the past. Please select today or a future date.")
    start_time = (body.get("startTime") or "").strip() or None
    a = Assessment(
        id=aid,
        title=body["title"],
        role_title=body.get("roleTitle") or body["title"],
        description=body.get("description") or "",
        total_duration_minutes=total_dur,
        scheduled_date=scheduled_date,
        start_time=start_time,
        total_questions=int(body.get("totalQuestions") or sum(len(s.get("questions") or []) for s in sections)),
        passing_percentage=int(body.get("passingPercentage") or 70),
        status=body.get("status") or "draft",
        created_date=body.get("createdDate") or utcnow().date().isoformat(),
    )
    db.add(a)
    for i, s in enumerate(sections):
        qids = [q.get("id") if isinstance(q, dict) else q for q in (s.get("questions") or [])]
        qids = [qid for qid in qids if qid]
        sid = s.get("id") or new_id()
        db.add(AssessmentSection(
            id=sid, assessment_id=aid, name=s.get("name") or f"Section {i + 1}",
            description=s.get("description") or "", instructions=s.get("instructions") or "",
            time_limit_minutes=int(s.get("timeLimitMinutes") or 15),
            passing_marks=int(s.get("passingMarks") or 10),
            is_mandatory=bool(s.get("isMandatory", True)),
            randomize_questions=bool(s.get("randomizeQuestions", False)),
            question_ids=qids, sort_order=i,
            allowed_types=s.get("allowedTypes"),
            allowed_categories=s.get("allowedCategories"),
            pool_size=s.get("poolSize"),
            pick_count=s.get("pickCount"),
            job_role=(s.get("jobRole") or "").strip() or None,
        ))
        db.flush()
        _set_section_pool(db, sid, qids)
    db.commit()
    return assessment_out(db, a)


def update_assessment(db: Session, a: Assessment, body: Dict[str, Any]) -> Dict[str, Any]:
    if "title" in body and body["title"] is not None:
        a.title = body["title"]
    if "roleTitle" in body and body["roleTitle"] is not None:
        a.role_title = body["roleTitle"]
    if "description" in body and body["description"] is not None:
        a.description = body["description"]
    if "totalDurationMinutes" in body and body["totalDurationMinutes"] is not None:
        a.total_duration_minutes = int(body["totalDurationMinutes"])
    if "scheduledDate" in body:
        s_date = (body["scheduledDate"] or "").strip() or None
        if s_date and s_date < utcnow().date().isoformat():
            raise ValueError("Assessment date cannot be in the past. Please select today or a future date.")
        a.scheduled_date = s_date
    if "startTime" in body:
        a.start_time = (body["startTime"] or "").strip() or None
    if "passingPercentage" in body and body["passingPercentage"] is not None:
        a.passing_percentage = int(body["passingPercentage"])
    if "status" in body and body["status"] is not None:
        a.status = body["status"]
    a.updated_at = utcnow()

    job = db.query(Job).filter(Job.assessment_id == a.id).first()
    if job:
        if "totalDurationMinutes" in body and body["totalDurationMinutes"] is not None:
            job.total_duration_minutes = a.total_duration_minutes
        if "scheduledDate" in body:
            job.scheduled_date = a.scheduled_date
        if "startTime" in body:
            job.start_time = a.start_time
        job.updated_at = utcnow()

    if "sections" in body and body["sections"] is not None:
        old_ids = [s.id for s in db.query(AssessmentSection).filter(AssessmentSection.assessment_id == a.id).all()]
        if old_ids:
            db.query(AssessmentSectionQuestion).filter(AssessmentSectionQuestion.section_id.in_(old_ids)).delete(synchronize_session=False)
        db.query(AssessmentSection).filter(AssessmentSection.assessment_id == a.id).delete()
        for i, s in enumerate(body["sections"]):
            qids = [q.get("id") if isinstance(q, dict) else q for q in (s.get("questions") or [])]
            qids = [qid for qid in qids if qid]
            sid = s.get("id") or new_id()
            db.add(AssessmentSection(
                id=sid, assessment_id=a.id, name=s.get("name") or f"Section {i + 1}",
                description=s.get("description") or "", instructions=s.get("instructions") or "",
                time_limit_minutes=int(s.get("timeLimitMinutes") or 15),
                passing_marks=int(s.get("passingMarks") or 10),
                is_mandatory=bool(s.get("isMandatory", True)),
                randomize_questions=bool(s.get("randomizeQuestions", False)),
                question_ids=qids, sort_order=i,
                allowed_types=s.get("allowedTypes"),
                allowed_categories=s.get("allowedCategories"),
                pool_size=s.get("poolSize"),
                pick_count=s.get("pickCount"),
                job_role=(s.get("jobRole") or "").strip() or None,
            ))
            db.flush()
            _set_section_pool(db, sid, qids)
        a.total_questions = sum(len(s.get("questions") or []) for s in body["sections"])

    db.commit()
    return assessment_out(db, a)


def delete_assessment(db: Session, a: Assessment) -> None:
    job = db.query(Job).filter(Job.assessment_id == a.id).first()
    if job:
        qids = [row[0] for row in db.query(Question.id).filter(Question.job_id == job.id).all()]
        if qids:
            db.query(AssessmentSectionQuestion).filter(
                AssessmentSectionQuestion.question_id.in_(qids)
            ).delete(synchronize_session=False)
            db.query(Question).filter(Question.id.in_(qids)).delete(synchronize_session=False)
        db.query(QuestionCategory).filter(QuestionCategory.job_id == job.id).delete(synchronize_session=False)
        db.delete(job)
        db.flush()
    sections = db.query(AssessmentSection).filter(AssessmentSection.assessment_id == a.id).all()
    for s in sections:
        db.query(AssessmentSectionQuestion).filter(AssessmentSectionQuestion.section_id == s.id).delete()
    db.query(AssessmentSection).filter(AssessmentSection.assessment_id == a.id).delete()
    db.delete(a)
    db.commit()


def get_section(db: Session, assessment_id: str, section_id: str) -> Optional[AssessmentSection]:
    return (
        db.query(AssessmentSection)
        .filter(AssessmentSection.id == section_id, AssessmentSection.assessment_id == assessment_id)
        .first()
    )


def update_section(db: Session, section: AssessmentSection, body: Dict[str, Any]) -> Dict[str, Any]:
    for src, dest in (
        ("name", "name"), ("description", "description"), ("instructions", "instructions"),
    ):
        if src in body and body[src] is not None:
            setattr(section, dest, body[src])
    if "timeLimitMinutes" in body and body["timeLimitMinutes"] is not None:
        section.time_limit_minutes = int(body["timeLimitMinutes"])
    if "passingMarks" in body and body["passingMarks"] is not None:
        section.passing_marks = int(body["passingMarks"])
    if "isMandatory" in body and body["isMandatory"] is not None:
        section.is_mandatory = bool(body["isMandatory"])
    if "randomizeQuestions" in body and body["randomizeQuestions"] is not None:
        section.randomize_questions = bool(body["randomizeQuestions"])
    if "allowedTypes" in body:
        section.allowed_types = body["allowedTypes"]
    if "allowedCategories" in body:
        section.allowed_categories = body["allowedCategories"]
    if "pickCount" in body:
        section.pick_count = body["pickCount"]
    if "poolSize" in body:
        section.pool_size = body["poolSize"]
    if "jobRole" in body:
        section.job_role = (body["jobRole"] or "").strip() or None

    if "questionIds" in body and body["questionIds"] is not None:
        qids = [qid for qid in body["questionIds"] if qid]
        _validate_pool(db, section, qids)
        section.question_ids = qids
        section.pool_size = len(qids)
        _set_section_pool(db, section.id, qids)

    db.commit()
    return _section_out(db, section)


def _owning_job(db: Session, section: AssessmentSection) -> Optional[Job]:
    return db.query(Job).filter(Job.assessment_id == section.assessment_id).first()


def _question_belongs_on_job(q: Question, job: Optional[Job]) -> bool:
    """A section may link this job's questions and company-library questions."""
    if q.job_id is None:
        return True
    return bool(job and q.job_id == job.id)


def _validate_pool(db: Session, section: AssessmentSection, qids: List[str]) -> None:
    if not qids:
        return
    questions = db.query(Question).filter(Question.id.in_(qids)).all()
    by_id = {q.id: q for q in questions}
    allowed_types = set(section.allowed_types or [])
    allowed_cats = set(section.allowed_categories or [])
    job = _owning_job(db, section)
    for qid in qids:
        q = by_id.get(qid)
        if not q:
            raise ValueError(f"Unknown question id {qid}")
        if not _question_belongs_on_job(q, job):
            raise ValueError("That question belongs to another job.")
        if allowed_types and q.type not in allowed_types:
            raise ValueError(f"Question {qid} type '{q.type}' is not allowed in this section")
        cat = q.section_category or q.category
        if allowed_cats and cat not in allowed_cats:
            raise ValueError(f"Question {qid} category '{cat}' is not allowed in this section")


def eligible_questions(
    db: Session, section: AssessmentSection, *, search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Questions HR may assign: this job's bank plus the company library."""
    job = _owning_job(db, section)
    query = db.query(Question).filter(Question.status != "draft")
    if job:
        query = query.filter((Question.job_id == job.id) | (Question.job_id.is_(None)))
    else:
        query = query.filter(Question.job_id.is_(None))
    if section.allowed_types:
        query = query.filter(Question.type.in_(section.allowed_types))
    if section.allowed_categories:
        query = query.filter(
            (Question.section_category.in_(section.allowed_categories))
            | (Question.category.in_(section.allowed_categories))
        )
    if search:
        like = f"%{search}%"
        query = query.filter((Question.title.ilike(like)) | (Question.content.ilike(like)))
    return [question_out(q) for q in query.order_by(Question.title.asc()).all()]


def attach_section_questions(db: Session, section: AssessmentSection, question_ids: List[str]) -> Dict[str, Any]:
    existing = _section_question_ids(db, section)
    merged = existing + [qid for qid in question_ids if qid and qid not in existing]
    _validate_pool(db, section, merged)
    section.question_ids = merged
    section.pool_size = len(merged)
    _set_section_pool(db, section.id, merged)
    db.commit()
    return _section_out(db, section)


_PINNED_OPTIONS = (
    "all of the above",
    "none of the above",
    "all of these",
    "none of these",
    "all the above",
    "none of them",
)


def _pinned_option(text: str) -> bool:
    cleaned = re.sub(r"^[\W_]+", "", (text or "").strip().lower())
    cleaned = re.sub(r"^[a-d][\)\.\s]+", "", cleaned).strip()
    return any(cleaned == phrase or cleaned.startswith(phrase) for phrase in _PINNED_OPTIONS)


def draw_question_ids(questions: List[Question], pick: int, rng: random.Random) -> List[str]:
    """Serve `pick` questions, keeping the pool's easy/medium/hard mix, then shuffle order."""
    if not questions:
        return []
    pick = max(1, min(pick, len(questions))) if pick else len(questions)
    if pick >= len(questions):
        ids = [q.id for q in questions]
        rng.shuffle(ids)
        return ids

    buckets: Dict[str, List[Question]] = {"easy": [], "medium": [], "hard": []}
    for question in questions:
        key = (question.difficulty or "medium").lower()
        buckets[key if key in buckets else "medium"].append(question)
    for items in buckets.values():
        rng.shuffle(items)

    total = len(questions)
    raw = {key: pick * len(items) / total for key, items in buckets.items()}
    quotas = {key: int(raw[key]) for key in buckets}
    leftover = pick - sum(quotas.values())
    for key in sorted(buckets, key=lambda name: raw[name] - quotas[name], reverse=True):
        if leftover <= 0:
            break
        room = len(buckets[key]) - quotas[key]
        if room > 0:
            quotas[key] += 1
            leftover -= 1

    chosen = [q.id for key, items in buckets.items() for q in items[: min(quotas[key], len(items))]]
    if len(chosen) < pick:
        used = set(chosen)
        rest = [q.id for q in questions if q.id not in used]
        rng.shuffle(rest)
        chosen.extend(rest[: pick - len(chosen)])
    rng.shuffle(chosen)
    return chosen[:pick]


def option_order_for(question: Question, rng: random.Random) -> Optional[List[str]]:
    """Shuffle MCQ, multi-select, and drag items. Pin 'all/none of the above' at the end."""
    if question.type not in ("mcq", "msq", "drag_drop"):
        return None
    movable: List[str] = []
    pinned: List[str] = []
    for opt in question.options or []:
        if isinstance(opt, dict):
            oid = opt.get("id")
            text = opt.get("text") or ""
        else:
            oid, text = str(opt), str(opt)
        if not oid:
            continue
        if question.type != "drag_drop" and _pinned_option(text):
            pinned.append(str(oid))
        else:
            movable.append(str(oid))
    if len(movable) + len(pinned) < 2:
        return None
    rng.shuffle(movable)
    return movable + pinned


def _session_out(session: AssessmentSession) -> Dict[str, Any]:
    return {
        "id": session.id,
        "inviteId": session.invite_id,
        "candidateId": session.candidate_id,
        "assessmentId": session.assessment_id,
        "drawnQuestionIds": session.drawn_question_ids or {},
        "optionOrder": session.option_order or {},
        "startedAt": session.started_at.isoformat() if session.started_at else None,
        "completedAt": session.completed_at.isoformat() if session.completed_at else None,
    }


def ensure_standard_exam_sections(db: Session, assessment_id: str) -> List[AssessmentSection]:
    """Create the four builder sections only when this exam has none yet."""
    existing = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == assessment_id)
        .order_by(AssessmentSection.sort_order.asc())
        .all()
    )
    if existing:
        return _collapse_duplicate_sections(db, existing)
    for i, name in enumerate(FIXED_SECTIONS):
        db.add(AssessmentSection(
            id=new_id(),
            assessment_id=assessment_id,
            name=name,
            description=name,
            instructions=f"Complete all questions in {name}.",
            time_limit_minutes=_SECTION_MINUTES.get(name, 15),
            passing_marks=10,
            is_mandatory=True,
            randomize_questions=True,
            question_ids=[],
            sort_order=i,
            pool_size=0,
        ))
    db.flush()
    created = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == assessment_id)
        .order_by(AssessmentSection.sort_order.asc())
        .all()
    )
    return _collapse_duplicate_sections(db, created)


def _collapse_duplicate_sections(db: Session, sections: List[AssessmentSection]) -> List[AssessmentSection]:
    """Drop empty standard-section clones created if two processes seeded at once."""
    standard = {name.lower() for name in FIXED_SECTIONS}
    seen: Dict[str, AssessmentSection] = {}
    extras: List[AssessmentSection] = []
    for section in sections:
        key = (section.name or "").strip().lower()
        if key not in standard or key not in seen:
            if key in standard:
                seen[key] = section
            continue
        current = seen[key]
        current_n = len(_section_question_ids(db, current))
        other_n = len(_section_question_ids(db, section))
        if other_n == 0:
            extras.append(section)
        elif current_n == 0:
            extras.append(current)
            seen[key] = section
    for section in extras:
        db.query(AssessmentSectionQuestion).filter(
            AssessmentSectionQuestion.section_id == section.id
        ).delete(synchronize_session=False)
        db.delete(section)
    if extras:
        db.flush()
        return (
            db.query(AssessmentSection)
            .filter(AssessmentSection.assessment_id == sections[0].assessment_id)
            .order_by(AssessmentSection.sort_order.asc())
            .all()
        )
    return sections


def sync_job_questions_into_sections(db: Session, assessment_id: str) -> List[AssessmentSection]:
    """Put job-bank questions onto the matching exam section so the candidate paper is not empty."""
    sections = ensure_standard_exam_sections(db, assessment_id)
    job = db.query(Job).filter(Job.assessment_id == assessment_id).first()
    if not job:
        return sections
    questions = (
        db.query(Question)
        .filter(Question.job_id == job.id, Question.status != "draft")
        .all()
    )
    if not questions:
        return sections
    already: set[str] = set()
    for section in sections:
        already.update(_section_question_ids(db, section))
    by_name = {(s.name or "").strip().lower(): s for s in sections}
    fallback = by_name.get("technical") or (sections[0] if sections else None)
    additions: Dict[str, List[str]] = {s.id: [] for s in sections}
    for question in questions:
        if question.id in already:
            continue
        label = (question.section_category or question.category or "").strip().lower()
        section = by_name.get(label) or fallback
        if not section:
            continue
        additions[section.id].append(question.id)
        already.add(question.id)
    changed = False
    for section in sections:
        extra = additions.get(section.id) or []
        if not extra:
            continue
        current = _section_question_ids(db, section)
        merged = current + [qid for qid in extra if qid not in current]
        section.question_ids = merged
        section.pool_size = len(merged)
        _set_section_pool(db, section.id, merged)
        changed = True
    if changed:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if assessment:
            assessment.total_questions = sum(len(_section_question_ids(db, s)) for s in sections)
            assessment.total_duration_minutes = sum(s.time_limit_minutes or 0 for s in sections) or assessment.total_duration_minutes
        db.flush()
    return sections


def sync_all_job_exam_papers(db: Session) -> int:
    """Backfill every job so existing invites get a non-empty paper."""
    jobs = db.query(Job).all()
    for job in jobs:
        if job.assessment_id:
            sync_job_questions_into_sections(db, job.assessment_id)
    db.commit()
    return len(jobs)


def _draw_section_ids(db: Session, sections: List[AssessmentSection]) -> tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    rng = random.Random()
    drawn: Dict[str, List[str]] = {}
    option_order: Dict[str, List[str]] = {}
    for section in sections:
        ids = _section_question_ids(db, section)
        questions = db.query(Question).filter(Question.id.in_(ids)).all() if ids else []
        by_id = {q.id: q for q in questions}
        pool = [by_id[qid] for qid in ids if qid in by_id]
        pick = section.pick_count if section.pick_count and section.pick_count > 0 else len(pool)
        chosen = draw_question_ids(pool, pick, rng)
        drawn[section.id] = chosen
        for qid in chosen:
            order = option_order_for(by_id[qid], rng)
            if order:
                option_order[qid] = order
    return drawn, option_order


def ensure_assessment_session(db: Session, invite: CandidateInvite) -> Dict[str, Any]:
    """Freeze one paper for this invite the first time it is opened."""
    sections = sync_job_questions_into_sections(db, invite.assessment_id)
    session = db.query(AssessmentSession).filter(AssessmentSession.invite_id == invite.id).first()
    if session:
        drawn = session.drawn_question_ids or {}
        if any(drawn.get(s.id) for s in sections):
            return _session_out(session)
        fresh, option_order = _draw_section_ids(db, sections)
        session.drawn_question_ids = fresh
        session.option_order = {**(session.option_order or {}), **option_order}
        db.commit()
        return _session_out(session)

    drawn, option_order = _draw_section_ids(db, sections)
    session = AssessmentSession(
        id=new_id(),
        invite_id=invite.id,
        candidate_id=invite.candidate_id,
        assessment_id=invite.assessment_id,
        drawn_question_ids=drawn,
        option_order=option_order,
        started_at=utcnow(),
    )
    db.add(session)
    invite.delivery_status = "STARTED"
    db.query(InviteBatchRow).filter(InviteBatchRow.invite_id == invite.id).update(
        {"delivery_status": "STARTED"}, synchronize_session=False,
    )
    db.commit()
    return _session_out(session)
