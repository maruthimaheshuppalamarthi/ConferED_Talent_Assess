"""
Recruiter API (Recruiter role only; System Admins have their own portal and cannot call it).

Pipeline / stage tabs:
    GET  /recruiter/pipeline
    GET  /recruiter/pipeline/stages/{stage}

Candidate detail:
    GET    /recruiter/candidates/{id}
    PATCH  /recruiter/candidates/{id}/decision

Jobs (one exam each):
    GET/POST       /recruiter/jobs
    GET/PATCH/DELETE /recruiter/jobs/{id}

Assessments (Assessment Builder):
    GET/POST       /recruiter/assessments
    GET/PATCH/DELETE /recruiter/assessments/{id}

Questions (Question Bank):
    GET/POST       /recruiter/questions
    GET/PATCH/DELETE /recruiter/questions/{id}

Invites / email:
    POST /recruiter/candidates/invites
    POST /recruiter/send-email
"""
from datetime import timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.schemas import InviteCreateRequest, InviteOut
from app.core.config import settings
from app.core.roles import PORTAL_RECRUITER
from app.core.security import generate_opaque_token, hash_opaque_token
from app.db.session import get_db
from app.models.auth import Assessment, CandidateInvite, StaffUser, utcnow
from app.services import audit
from app.services import email as email_service
from app.services import question_bank
from app.services import recruiter_pipeline as pipeline
from app.services import runtime_settings as rt
from app.services.auth_core import log_dev_otp, mask_email, norm_email
from app.services.otp import PURPOSE_CANDIDATE_LOGIN, issue_otp

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])


class EmailSendRequest(BaseModel):
    recipientEmail: str
    recipientName: Optional[str] = "Candidate"
    subject: str
    bodyHtml: str
    smtpHost: Optional[str] = None
    smtpPort: Optional[int] = None
    smtpUser: Optional[str] = None
    smtpPassword: Optional[str] = None


class DecisionRequest(BaseModel):
    decision: str = Field(pattern="^(Selected|Rejected|Shortlisted|Under Review)$")
    notes: str = ""


class QuestionBody(BaseModel):
    id: Optional[str] = None
    type: str
    title: str
    content: Optional[str] = None
    options: Optional[Any] = None
    correctAnswers: Optional[Any] = None
    sampleCode: Optional[Any] = None
    language: Optional[str] = None
    testCases: Optional[Any] = None
    essayMinWords: Optional[int] = None
    essayMaxWords: Optional[int] = None
    difficulty: Optional[str] = "medium"
    points: Optional[int] = 10
    category: Optional[str] = "General"
    sectionCategory: Optional[str] = None
    jobRole: Optional[str] = None
    jobId: Optional[str] = None
    sectionId: Optional[str] = None
    selectionMode: Optional[str] = None
    stemFormat: Optional[str] = "plain"
    codingMeta: Optional[Dict[str, Any]] = None
    constraints: Optional[str] = None
    ioFormat: Optional[str] = None
    timeLimitMs: Optional[int] = None
    memoryLimitKb: Optional[int] = None
    rubric: Optional[str] = None
    status: Optional[str] = "published"
    tags: Optional[List[str]] = None


class QuestionPatch(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    options: Optional[Any] = None
    correctAnswers: Optional[Any] = None
    sampleCode: Optional[Any] = None
    language: Optional[str] = None
    testCases: Optional[Any] = None
    essayMinWords: Optional[int] = None
    essayMaxWords: Optional[int] = None
    difficulty: Optional[str] = None
    points: Optional[int] = None
    category: Optional[str] = None
    sectionCategory: Optional[str] = None
    jobRole: Optional[str] = None
    jobId: Optional[str] = None
    sectionId: Optional[str] = None
    selectionMode: Optional[str] = None
    stemFormat: Optional[str] = None
    codingMeta: Optional[Dict[str, Any]] = None
    constraints: Optional[str] = None
    ioFormat: Optional[str] = None
    timeLimitMs: Optional[int] = None
    memoryLimitKb: Optional[int] = None
    rubric: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None


class JobBody(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "draft"
    totalDurationMinutes: Optional[int] = 60
    passingPercentage: Optional[int] = 70


class JobPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class AssessmentBody(BaseModel):
    id: Optional[str] = None
    title: str
    roleTitle: Optional[str] = None
    description: Optional[str] = None
    totalDurationMinutes: Optional[int] = 60
    totalQuestions: Optional[int] = None
    passingPercentage: Optional[int] = 70
    status: Optional[str] = "draft"
    createdDate: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None


class AssessmentPatch(BaseModel):
    title: Optional[str] = None
    roleTitle: Optional[str] = None
    description: Optional[str] = None
    totalDurationMinutes: Optional[int] = None
    passingPercentage: Optional[int] = None
    status: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None


# ------------------------------------------------------------------ pipeline / stages
@router.get("/pipeline")
def get_pipeline(actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    items, total = pipeline.list_pipeline(db)
    return {"items": items, "total": total, "counts": pipeline.stage_counts(db)}


@router.get("/pipeline/stages/{stage}")
def get_pipeline_stage(stage: str, actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                       db: Session = Depends(get_db)):
    status_label = pipeline.resolve_stage(stage)
    if not status_label:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Unknown stage '{stage}'")
    items, total = pipeline.list_pipeline(db, status=status_label)
    return {"stage": status_label, "slug": stage, "items": items, "total": total,
            "counts": pipeline.stage_counts(db)}


# ------------------------------------------------------------------ candidates
@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str, actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                  db: Session = Depends(get_db)):
    detail = pipeline.get_candidate_detail(db, candidate_id)
    if not detail:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return detail


@router.patch("/candidates/{candidate_id}/decision")
def patch_candidate_decision(candidate_id: str, req: DecisionRequest, request: Request,
                             actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                             db: Session = Depends(get_db)):
    detail = pipeline.update_candidate_decision(db, candidate_id, req.decision, req.notes)
    if not detail:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="candidate.decision", actor=actor, request=request,
        target_type="candidate", target_id=candidate_id,
        summary=f"{actor.email} set decision {req.decision} for {detail['name']}",
        details={"decision": req.decision})
    return detail


# ------------------------------------------------------------------ jobs
@router.get("/jobs")
def get_jobs(actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    items = pipeline.list_jobs(db)
    return {"items": items, "total": len(items)}


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
def post_job(req: JobBody, request: Request,
             actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
             db: Session = Depends(get_db)):
    try:
        out = pipeline.create_job(db, req.model_dump())
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job.create", actor=actor, request=request,
        target_type="job", target_id=out["id"],
        summary=f"{actor.email} created job {out['title']}")
    return out


@router.get("/jobs/{job_id}")
def get_job(job_id: str, actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
            db: Session = Depends(get_db)):
    job = pipeline.get_job(db, job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found")
    return pipeline.job_out(db, job)


@router.patch("/jobs/{job_id}")
def patch_job(job_id: str, req: JobPatch, request: Request,
              actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
              db: Session = Depends(get_db)):
    job = pipeline.get_job(db, job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found")
    try:
        out = pipeline.update_job(db, job, req.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job.update", actor=actor, request=request,
        target_type="job", target_id=job_id,
        summary=f"{actor.email} updated job {out['title']}")
    return out


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: str, request: Request,
               actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
               db: Session = Depends(get_db)):
    job = pipeline.get_job(db, job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found")
    title = job.title
    try:
        pipeline.delete_job(db, job)
    except pipeline.JobInUseError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job.delete", actor=actor, request=request,
        target_type="job", target_id=job_id,
        summary=f"{actor.email} deleted job {title}")
    return None


def _job_or_404(db: Session, job_id: str):
    job = pipeline.get_job(db, job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


class JobCategoryBody(BaseModel):
    label: str
    allowedTypes: Optional[List[str]] = None


@router.get("/jobs/{job_id}/categories")
def get_job_categories(job_id: str, actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                       db: Session = Depends(get_db)):
    _job_or_404(db, job_id)
    return {"items": question_bank.list_categories(db, job_id)}


@router.post("/jobs/{job_id}/categories", status_code=status.HTTP_201_CREATED)
def post_job_category(job_id: str, body: JobCategoryBody, request: Request,
                      actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                      db: Session = Depends(get_db)):
    _job_or_404(db, job_id)
    try:
        out = question_bank.create_job_category(db, job_id, body.label, body.allowedTypes)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job_category.create", actor=actor, request=request,
        target_type="question_category", target_id=out["id"],
        summary=f"{actor.email} added category '{out['label']}' to job {job_id}")
    return out


@router.delete("/jobs/{job_id}/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_category(job_id: str, category_id: str, request: Request,
                        actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                        db: Session = Depends(get_db)):
    _job_or_404(db, job_id)
    try:
        question_bank.delete_job_category(db, job_id, category_id)
    except question_bank.CategoryInUseError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job_category.delete", actor=actor, request=request,
        target_type="question_category", target_id=category_id,
        summary=f"{actor.email} deleted category {category_id} from job {job_id}")
    return None


class JobSectionBody(BaseModel):
    name: str
    instructions: Optional[str] = ""
    timeLimitMinutes: Optional[int] = 15
    passingMarks: Optional[int] = 10


@router.post("/jobs/{job_id}/sections", status_code=status.HTTP_201_CREATED)
def post_job_section(job_id: str, body: JobSectionBody, request: Request,
                     actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                     db: Session = Depends(get_db)):
    job = _job_or_404(db, job_id)
    try:
        out = pipeline.add_job_section(db, job, body.model_dump())
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job.section_create", actor=actor, request=request,
        target_type="assessment_section", target_id=out["id"],
        summary=f"{actor.email} added section {out['name']} to job {job.title}")
    return out


@router.get("/jobs/{job_id}/questions")
def get_job_questions(
    job_id: str,
    category: Optional[str] = Query(None),
    qtype: Optional[str] = Query(None, alias="type"),
    difficulty: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    _job_or_404(db, job_id)
    pipeline.claim_questions_by_job_title(db)
    items = question_bank.list_questions_filtered(
        db, category=category, qtype=qtype, difficulty=difficulty, q=q, job_id=job_id,
    )
    return {"items": items, "total": len(items)}


@router.post("/jobs/{job_id}/questions", status_code=status.HTTP_201_CREATED)
def post_job_question(job_id: str, req: QuestionBody, request: Request,
                      actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                      db: Session = Depends(get_db)):
    _job_or_404(db, job_id)
    body = req.model_dump()
    body["jobId"] = job_id
    if not body.get("sectionCategory"):
        body["sectionCategory"] = body.get("category") or ""
    try:
        out = pipeline.create_question(db, body)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="question.create", actor=actor, request=request,
        target_type="question", target_id=out["id"],
        summary=f"{actor.email} created question {out['title']} on job {job_id}")
    return out


# ------------------------------------------------------------------ assessments
@router.get("/assessments")
def get_assessments(actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    items = pipeline.list_assessments(db)
    return {"items": items, "total": len(items)}


@router.post("/assessments", status_code=201)
def post_assessment(req: AssessmentBody, request: Request,
                    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                    db: Session = Depends(get_db)):
    out = pipeline.create_assessment(db, req.model_dump())
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="assessment.create", actor=actor, request=request,
        target_type="assessment", target_id=out["id"],
        summary=f"{actor.email} created assessment {out['title']}")
    return out


@router.get("/assessments/{assessment_id}")
def get_assessment(assessment_id: str, actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                   db: Session = Depends(get_db)):
    a = pipeline.get_assessment(db, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return pipeline.assessment_out(db, a)


@router.patch("/assessments/{assessment_id}")
def patch_assessment(assessment_id: str, req: AssessmentPatch, request: Request,
                     actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                     db: Session = Depends(get_db)):
    a = pipeline.get_assessment(db, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    out = pipeline.update_assessment(db, a, req.model_dump(exclude_unset=True))
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="assessment.update", actor=actor, request=request,
        target_type="assessment", target_id=assessment_id,
        summary=f"{actor.email} updated assessment {out['title']}")
    return out


@router.delete("/assessments/{assessment_id}", status_code=204)
def delete_assessment(assessment_id: str, request: Request,
                      actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                      db: Session = Depends(get_db)):
    a = pipeline.get_assessment(db, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    title = a.title
    pipeline.delete_assessment(db, a)
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="assessment.delete", actor=actor, request=request,
        target_type="assessment", target_id=assessment_id,
        summary=f"{actor.email} deleted assessment {title}")
    return None


# ------------------------------------------------------------------ questions
@router.get("/questions")
def get_questions(
    category: Optional[str] = Query(None),
    qtype: Optional[str] = Query(None, alias="type"),
    difficulty: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    jobRole: Optional[str] = Query(None),
    jobId: Optional[str] = Query(None),
    scope: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    if scope == "all" or jobId:
        pipeline.claim_questions_by_job_title(db)
    items = question_bank.list_questions_filtered(
        db, category=category, qtype=qtype, difficulty=difficulty, status=status_filter,
        job_role=jobRole, q=q, job_id=jobId, library_only=not jobId and scope != "all",
    )
    return {"items": items, "total": len(items)}


@router.post("/questions", status_code=201)
def post_question(req: QuestionBody, request: Request,
                  actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                  db: Session = Depends(get_db)):
    body = req.model_dump()
    if not body.get("sectionCategory"):
        body["sectionCategory"] = body.get("category") or "General"
    try:
        out = pipeline.create_question(db, body)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="question.create", actor=actor, request=request,
        target_type="question", target_id=out["id"],
        summary=f"{actor.email} created question {out['title']}")
    return out


@router.get("/questions/{question_id}")
def get_question(question_id: str, actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                 db: Session = Depends(get_db)):
    q = pipeline.get_question(db, question_id)
    if not q:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question_bank.question_out(q)


@router.patch("/questions/{question_id}")
def patch_question(question_id: str, req: QuestionPatch, request: Request,
                   actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                   db: Session = Depends(get_db)):
    q = pipeline.get_question(db, question_id)
    if not q:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    try:
        out = pipeline.update_question(db, q, req.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="question.update", actor=actor, request=request,
        target_type="question", target_id=question_id,
        summary=f"{actor.email} updated question {out['title']}")
    return out


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: str, request: Request,
                    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
                    db: Session = Depends(get_db)):
    q = pipeline.get_question(db, question_id)
    if not q:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    title = q.title
    pipeline.delete_question(db, q)
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="question.delete", actor=actor, request=request,
        target_type="question", target_id=question_id,
        summary=f"{actor.email} deleted question {title}")
    return None


# ------------------------------------------------------------------ invites / email
@router.post("/candidates/invites", response_model=InviteOut, status_code=201)
def create_invite(req: InviteCreateRequest, background: BackgroundTasks, request: Request,
                  actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    try:
        pipeline.ensure_job_is_open(db, req.assessmentId)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    email = norm_email(req.email)
    token = generate_opaque_token()
    candidate_id = req.candidateId or f"cand-{int(utcnow().timestamp() * 1000)}"
    expires_in_hours = req.expiresInHours or rt.get_int("linkExpirationHours")
    invite = CandidateInvite(
        candidate_id=candidate_id,
        name=req.name.strip(),
        email=email,
        phone=req.phone,
        assessment_id=req.assessmentId,
        token_hash=hash_opaque_token(token),
        expires_at=utcnow() + timedelta(hours=expires_in_hours),
        created_by=actor.id,
        delivery_status="PENDING",
    )
    db.add(invite)
    db.commit()

    pipeline.upsert_invited_candidate(
        db, candidate_id=candidate_id, name=req.name.strip(), email=email,
        phone=req.phone, assessment_id=req.assessmentId,
    )

    challenge, code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
    # invite= last so existing clients that split on "invite=" still get a clean token
    link = f"{settings.FRONTEND_URL.rstrip('/')}/assessment/take?assessment={req.assessmentId}&invite={token}"
    assessment = db.query(Assessment).filter(Assessment.id == req.assessmentId).first()
    title = assessment.title if assessment else "Online Assessment"
    duration = assessment.total_duration_minutes if assessment else 60
    deadline_label = invite.expires_at.strftime("%Y-%m-%d %H:%M UTC")
    subject, body = email_service.candidate_invite_email(
        invite.name, link, code, rt.get_int("otpExpireMinutes"), f"in {expires_in_hours} hours",
        assessment_title=title, duration_minutes=duration, deadline_label=deadline_label,
    )

    def _send_and_mark():
        ok = email_service.send_email(email, subject, body)
        from app.db.session import SessionLocal
        s = SessionLocal()
        try:
            inv = s.query(CandidateInvite).filter(CandidateInvite.id == invite.id).first()
            if inv:
                inv.delivery_status = "SENT" if ok else "FAILED"
                s.commit()
        finally:
            s.close()

    background.add_task(_send_and_mark)
    log_dev_otp(f"candidate invite {email}", code)
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="candidate.invite_create", actor=actor, request=request,
        target_type="candidate_invite", target_id=invite.id,
        summary=f"{actor.email} invited {invite.name} ({mask_email(email)}) to assessment {req.assessmentId}",
        details={"candidateId": candidate_id, "assessmentId": req.assessmentId,
                 "expiresInHours": expires_in_hours})

    return InviteOut(
        inviteId=invite.id,
        candidateId=candidate_id,
        link=link,
        expiresAt=invite.expires_at.isoformat(),
        otpDestination=mask_email(email),
        assessmentTitle=title,
        durationMinutes=duration,
        devOtp=code if settings.DEV_EXPOSE_OTP else None,
    )


@router.post("/send-email")
def send_email_endpoint(req: EmailSendRequest, request: Request,
                        actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)), db: Session = Depends(get_db)):
    ok = email_service.send_email(req.recipientEmail, req.subject, req.bodyHtml)
    audit.record_audit(
        db, category=audit.CAT_SYSTEM, action="email.send", actor=actor, request=request, success=bool(ok),
        summary=f"{actor.email} sent an email to {mask_email(req.recipientEmail.strip().lower())}"
                + ("" if ok else " (delivery failed)"),
        details={"subject": req.subject[:200]})
    if ok:
        return {"status": "success", "message": f"Email dispatched via SMTP to {req.recipientEmail}"}
    return {"status": "error", "message": f"SMTP delivery attempted for {req.recipientEmail} but failed"}
