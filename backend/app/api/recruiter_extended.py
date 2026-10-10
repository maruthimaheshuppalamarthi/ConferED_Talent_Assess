"""Bulk invites, question categories, and smart assessment-builder endpoints."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.core.roles import PORTAL_RECRUITER
from app.db.session import get_db
from app.models.auth import StaffUser
from app.services import audit
from app.services import bulk_invite
from app.services import question_bank
from app.services import recruiter_pipeline as pipeline

router = APIRouter(prefix="/recruiter", tags=["Recruiter Extended"])


class ConfirmBatchBody(BaseModel):
    forceResend: bool = False
    expiresInHours: Optional[int] = None


class SectionUpdateBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    timeLimitMinutes: Optional[int] = None
    passingMarks: Optional[int] = None
    isMandatory: Optional[bool] = None
    randomizeQuestions: Optional[bool] = None
    allowedTypes: Optional[List[str]] = None
    allowedCategories: Optional[List[str]] = None
    pickCount: Optional[int] = None
    poolSize: Optional[int] = None
    jobRole: Optional[str] = None
    questionIds: Optional[List[str]] = None


class AttachQuestionsBody(BaseModel):
    questionIds: List[str]


class JobRoleBody(BaseModel):
    name: str
    description: Optional[str] = None


# ------------------------------------------------------------------ bulk invites
@router.post("/assessments/{assessment_id}/invites/bulk/preview")
async def bulk_preview(
    assessment_id: str,
    request: Request,
    file: UploadFile = File(...),
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    raw = await file.read()
    try:
        pipeline.ensure_job_is_open(db, assessment_id)
        out = bulk_invite.preview_bulk_upload(
            db, assessment_id=assessment_id, actor_id=actor.id,
            filename=file.filename or "upload.csv", raw=raw,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="invite.bulk_preview", actor=actor, request=request,
        target_type="invite_batch", target_id=out["batchId"],
        summary=f"{actor.email} previewed bulk invite ({out['totalRows']} rows) for {assessment_id}")
    return out


@router.post("/invites/batches/{batch_id}/confirm")
def bulk_confirm(
    batch_id: str, body: ConfirmBatchBody, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    try:
        out = bulk_invite.confirm_batch(
            db, batch_id=batch_id, actor_id=actor.id,
            force_resend=body.forceResend, expires_in_hours=body.expiresInHours,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="invite.bulk_confirm", actor=actor, request=request,
        target_type="invite_batch", target_id=batch_id,
        summary=f"{actor.email} confirmed bulk invite batch {batch_id}")
    return out


@router.get("/invites/batches/{batch_id}")
def bulk_status(
    batch_id: str,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    try:
        return bulk_invite.batch_status(db, batch_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("/invites/batches/{batch_id}/retry-failed")
def bulk_retry(
    batch_id: str, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    try:
        out = bulk_invite.retry_failed(db, batch_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="invite.bulk_retry", actor=actor, request=request,
        target_type="invite_batch", target_id=batch_id,
        summary=f"{actor.email} retried failed rows in batch {batch_id}")
    return out


# ------------------------------------------------------------------ question categories + filters
class CategoryBody(BaseModel):
    label: str


@router.get("/question-categories")
def get_question_categories(
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    return {"items": question_bank.list_categories(db)}


@router.post("/question-categories", status_code=status.HTTP_201_CREATED)
def post_question_category(
    body: CategoryBody, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    try:
        out = question_bank.create_library_category(db, body.label)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="question_category.create", actor=actor, request=request,
        target_type="question_category", target_id=out["id"],
        summary=f"{actor.email} added category '{out['label']}'")
    return out


@router.get("/job-roles")
def get_job_roles(
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    items = question_bank.list_job_roles(db)
    return {"items": items, "names": [r["name"] for r in items]}


@router.post("/job-roles", status_code=status.HTTP_201_CREATED)
def post_job_role(
    body: JobRoleBody, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    try:
        out = question_bank.create_job_role(db, name=body.name, description=body.description)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job_role.create", actor=actor, request=request,
        target_type="job_role", target_id=out["id"],
        summary=f"{actor.email} created job role '{out['name']}'")
    return out


@router.delete("/job-roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_role(
    role_id: str, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    try:
        question_bank.delete_job_role(db, role_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="job_role.delete", actor=actor, request=request,
        target_type="job_role", target_id=role_id,
        summary=f"{actor.email} deleted job role {role_id}")
    return None


@router.get("/questions/bulk/sample")
def bulk_question_sample(
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
):
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(
        question_bank.SAMPLE_QUESTION_CSV,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="question_bank_sample.csv"'},
    )


@router.post("/questions/bulk/import")
async def bulk_question_import(
    request: Request,
    file: UploadFile = File(...),
    jobId: Optional[str] = Form(None),
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    raw = await file.read()
    chosen_job = (jobId or request.query_params.get("jobId") or "").strip() or None
    try:
        out = question_bank.import_questions_from_file(
            db, filename=file.filename or "questions.csv", raw=raw, default_job=chosen_job,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="question.bulk_import", actor=actor, request=request,
        target_type="question", target_id=None,
        summary=f"{actor.email} imported {out['created']}/{out['totalRows']} questions")
    return out


# ------------------------------------------------------------------ smart builder
@router.get("/assessments/{assessment_id}/sections/{section_id}/eligible-questions")
def get_eligible_questions(
    assessment_id: str, section_id: str,
    q: Optional[str] = Query(None),
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    section = pipeline.get_section(db, assessment_id, section_id)
    if not section:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Section not found")
    items = pipeline.eligible_questions(db, section, search=q)
    return {"items": items, "total": len(items)}


@router.put("/assessments/{assessment_id}/sections/{section_id}")
def put_section(
    assessment_id: str, section_id: str, body: SectionUpdateBody, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    section = pipeline.get_section(db, assessment_id, section_id)
    if not section:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Section not found")
    try:
        out = pipeline.update_section(db, section, body.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="assessment.section_update", actor=actor, request=request,
        target_type="assessment_section", target_id=section_id,
        summary=f"{actor.email} updated section {out['name']}")
    return out


@router.post("/assessments/{assessment_id}/sections/{section_id}/questions")
def post_section_questions(
    assessment_id: str, section_id: str, body: AttachQuestionsBody, request: Request,
    actor: StaffUser = Depends(require_portal(PORTAL_RECRUITER)),
    db: Session = Depends(get_db),
):
    section = pipeline.get_section(db, assessment_id, section_id)
    if not section:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Section not found")
    try:
        out = pipeline.attach_section_questions(db, section, body.questionIds)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    audit.record_audit(
        db, category=audit.CAT_CANDIDATE, action="assessment.section_attach", actor=actor, request=request,
        target_type="assessment_section", target_id=section_id,
        summary=f"{actor.email} attached {len(body.questionIds)} question(s) to section {section_id}")
    return out
