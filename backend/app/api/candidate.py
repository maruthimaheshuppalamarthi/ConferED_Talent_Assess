"""
Candidate API (invite link + emailed OTP -> candidate-scoped JWT).

    POST /candidate/verify       invite token + OTP -> candidate JWT
    POST /candidate/resend-otp   invite token       -> new OTP
    GET  /candidate/assessment   sanitized exam (no correct answers)
    POST /candidate/identity     store the live photo or government ID as JPEG
    POST /candidate/submit       grade objective answers server-side
"""
import base64
import os
import re
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_candidate
from app.api.schemas import (CandidateOut, CandidateResendRequest, CandidateTokenOut,
                             CandidateVerifyRequest, ChallengeOut)
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security import create_candidate_token, hash_opaque_token
from app.db.session import get_db
from app.models.auth import (
    Assessment, AssessmentSection, AssessmentSession, Candidate, CandidateInvite, OtpChallenge, Question, utcnow,
)
from app.services import assessment_scoring as scoring
from app.services import code_exec
from app.services import email as email_service
from app.services import identity_bucket
from app.services import recruiter_pipeline as pipeline
from app.services import runtime_settings as rt
from app.services.auth_core import challenge_out, log_dev_otp
from app.services.otp import (PURPOSE_CANDIDATE_LOGIN, check_resend_cooldown, issue_otp,
                              verify_challenge)

router = APIRouter(prefix="/candidate", tags=["Candidate"])

# Incompressible sample so the browser can measure real download speed. About 2 MB.
_SPEED_SAMPLE = os.urandom(2 * 1024 * 1024)


@router.get("/speed-sample")
def speed_sample(_: dict = Depends(get_current_candidate)):
    """Fixed download used only to measure the candidate's internet speed."""
    return Response(
        content=_SPEED_SAMPLE,
        media_type="application/octet-stream",
        headers={"Cache-Control": "no-store", "Content-Encoding": "identity"},
    )


class SubmitBody(BaseModel):
    answers: Dict[str, Any] = {}


class ProgressBody(BaseModel):
    sectionIndex: int = 0
    questionIndex: int = 0
    sectionEndsAt: Optional[str] = None
    answers: Dict[str, Any] = {}
    codeDrafts: Dict[str, Any] = {}
    flagged: Optional[list] = None


class RunBody(BaseModel):
    questionId: str
    language: str
    code: str = ""


class FeedbackBody(BaseModel):
    rating: int
    comment: str = ""


# Live-captured government IDs only. The type is stored on the candidate; the JPEG goes to the bucket.
GOVT_ID_TYPES = {
    "aadhaar": "Aadhaar",
    "pan": "PAN card",
    "voter_id": "Voter ID",
}
_JPEG_DATA_URL = re.compile(r"^data:image/jpeg;base64,([A-Za-z0-9+/=\s]+)$", re.IGNORECASE)
_MAX_JPEG_BYTES = 600_000


class SystemCheckIn(BaseModel):
    cameraPassed: bool = False
    microphonePassed: bool = False
    microphoneDb: Optional[float] = None
    networkPassed: bool = False
    pingMs: Optional[int] = None
    downloadMbps: Optional[float] = None
    browserPassed: bool = False
    screenWidth: int = 0
    screenHeight: int = 0
    singleMonitor: Optional[bool] = None


class IdentityBody(BaseModel):
    kind: Literal["photo", "id", "checks"]
    image: Optional[str] = None
    idDocumentType: Optional[str] = None
    systemCheck: Optional[SystemCheckIn] = None


def _jpeg_bytes(data_url: str) -> bytes:
    """Accept a live-captured JPEG data URL and return the raw bytes for the bucket."""
    match = _JPEG_DATA_URL.match((data_url or "").strip())
    if not match:
        raise HTTPException(status_code=400, detail="The image must be a JPEG (image/jpeg).")
    try:
        raw = base64.b64decode(re.sub(r"\s+", "", match.group(1)), validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="The image data is not valid base64.")
    if len(raw) < 32 or not raw.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="The file is not a JPEG image.")
    if len(raw) > _MAX_JPEG_BYTES:
        raise HTTPException(status_code=400, detail="The image is too large. Move closer and capture it again.")
    return raw


def _store_jpeg(candidate_id: str, name: str, raw: bytes) -> str:
    try:
        return identity_bucket.put_jpeg(candidate_id, name, raw)
    except identity_bucket.IdentityBucketError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def _candidate_for_session(db: Session, cand: dict) -> Candidate:
    row = db.get(Candidate, cand["candidate_id"])
    if row is None:
        raise HTTPException(status_code=404, detail="Candidate record was not found for this invitation.")
    return row


def _invite_from_token(db: Session, token: str) -> CandidateInvite:
    invite = db.query(CandidateInvite).filter(
        CandidateInvite.token_hash == hash_opaque_token(token or "")).first()
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")
    return invite


def _latest_challenge(db: Session, invite: CandidateInvite):
    return (db.query(OtpChallenge)
            .filter(OtpChallenge.purpose == PURPOSE_CANDIDATE_LOGIN, OtpChallenge.subject_id == invite.id)
            .order_by(OtpChallenge.created_at.desc()).first())


@router.post("/verify", response_model=CandidateTokenOut, dependencies=[Depends(rate_limit("candidate"))])
def candidate_verify(req: CandidateVerifyRequest, db: Session = Depends(get_db)):
    invite = _invite_from_token(db, req.inviteToken)
    verify_challenge(db, _latest_challenge(db, invite), PURPOSE_CANDIDATE_LOGIN, req.otp)

    invite.verified_at = utcnow()
    db.commit()
    # Freeze per-candidate question draw (pick_count / randomize) on first verified open.
    pipeline.ensure_assessment_session(db, invite)
    return CandidateTokenOut(
        accessToken=create_candidate_token(invite.candidate_id, invite.assessment_id, invite.id),
        expiresIn=settings.CANDIDATE_TOKEN_EXPIRE_MINUTES * 60,
        candidate=CandidateOut(id=invite.candidate_id, name=invite.name,
                               email=invite.email, assessmentId=invite.assessment_id),
    )


@router.post("/resend-otp", response_model=ChallengeOut, dependencies=[Depends(rate_limit("candidate"))])
def candidate_resend(req: CandidateResendRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    invite = _invite_from_token(db, req.inviteToken)
    latest = _latest_challenge(db, invite)
    if latest:
        check_resend_cooldown(latest)

    challenge, code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
    assessment = db.get(Assessment, invite.assessment_id) if invite.assessment_id else None
    assessment_title = assessment.title if assessment else ""
    subject, body = email_service.candidate_resend_otp_email(
        invite.name, code, rt.get_int("otpExpireMinutes"), assessment_title=assessment_title
    )
    background.add_task(email_service.send_email, invite.email, subject, body)
    log_dev_otp(f"candidate resend {invite.email}", code)
    return challenge_out(challenge, invite.email, code)


@router.get("/gate")
def candidate_gate(cand: dict = Depends(get_current_candidate), db: Session = Depends(get_db)):
    """Whether the proctor has admitted this candidate into the exam."""
    row = db.get(Candidate, cand["candidate_id"])
    status = row.identity_status if row else None
    return {"identityStatus": status, "admitted": status == "approved"}


@router.get("/assessment")
def get_candidate_assessment(
    cand: dict = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Assessment + sections + questions with answers stripped (candidate JWT required)."""
    invite = db.get(CandidateInvite, cand["invite_id"])
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")

    assessment = db.query(Assessment).filter(Assessment.id == invite.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    session = pipeline.ensure_assessment_session(db, invite)
    drawn = session.get("drawnQuestionIds") or {}
    option_order = session.get("optionOrder") or {}

    sections_out = []
    secs = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == assessment.id)
        .order_by(AssessmentSection.sort_order.asc())
        .all()
    )
    for sec in secs:
        qids = drawn.get(sec.id) or pipeline._section_question_ids(db, sec)
        questions = db.query(Question).filter(Question.id.in_(qids)).all() if qids else []
        by_id = {q.id: q for q in questions}
        sections_out.append({
            "id": sec.id,
            "name": sec.name,
            "description": sec.description or "",
            "instructions": sec.instructions or "",
            "timeLimitMinutes": sec.time_limit_minutes,
            "passingMarks": sec.passing_marks,
            "isMandatory": bool(sec.is_mandatory),
            "questions": [
                scoring.question_for_candidate(by_id[qid], option_order.get(qid))
                for qid in qids if qid in by_id
            ],
        })

    row = db.query(AssessmentSession).filter(AssessmentSession.invite_id == invite.id).first()
    return {
        "id": assessment.id,
        "title": assessment.title,
        "roleTitle": assessment.role_title,
        "description": assessment.description,
        "totalDurationMinutes": assessment.total_duration_minutes,
        "scheduledDate": getattr(assessment, "scheduled_date", None),
        "startTime": getattr(assessment, "start_time", None),
        "passingPercentage": assessment.passing_percentage,
        "expiresAt": invite.expires_at.isoformat() if invite.expires_at else None,
        "sections": sections_out,
        "sessionId": session.get("id"),
        "examStartedAt": row.exam_started_at.isoformat() if row and row.exam_started_at else None,
        "serverNow": utcnow().isoformat(),
        "progress": (row.progress if row else None) or None,
    }


def _session_row(db: Session, invite: CandidateInvite) -> AssessmentSession:
    pipeline.ensure_assessment_session(db, invite)
    row = db.query(AssessmentSession).filter(AssessmentSession.invite_id == invite.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Assessment session was not found.")
    return row


@router.post("/exam/start")
def start_exam(cand: dict = Depends(get_current_candidate), db: Session = Depends(get_db)):
    """Start the exam clock once. Later calls keep the original start."""
    invite = db.get(CandidateInvite, cand["invite_id"])
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")
    row = _session_row(db, invite)
    if row.completed_at is not None:
        raise HTTPException(status_code=409, detail="This assessment is already submitted.")
    if row.exam_started_at is None:
        row.exam_started_at = utcnow()
        db.commit()
    return {
        "examStartedAt": row.exam_started_at.isoformat(),
        "serverNow": utcnow().isoformat(),
    }


def _trim_drafts(drafts: Dict[str, Any]) -> Dict[str, Any]:
    cleaned: Dict[str, Any] = {}
    for question_id, draft in list((drafts or {}).items())[:80]:
        if not isinstance(draft, dict):
            continue
        files = draft.get("files") if isinstance(draft.get("files"), dict) else {}
        kept = {}
        for language, text in list(files.items())[:20]:
            if isinstance(text, str):
                kept[str(language)[:40]] = text[:100_000]
        cleaned[str(question_id)[:80]] = {
            "language": str(draft.get("language") or "")[:40],
            "files": kept,
        }
    return cleaned


@router.put("/progress")
def save_progress(
    body: ProgressBody,
    cand: dict = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Remember answers and editor text so a refresh restores the attempt exactly."""
    invite = db.get(CandidateInvite, cand["invite_id"])
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")
    row = _session_row(db, invite)
    if row.completed_at is not None:
        raise HTTPException(status_code=409, detail="This assessment is already submitted.")
    if row.exam_started_at is None:
        row.exam_started_at = utcnow()
    row.progress = {
        "sectionIndex": max(0, int(body.sectionIndex or 0)),
        "questionIndex": max(0, int(body.questionIndex or 0)),
        "sectionEndsAt": body.sectionEndsAt,
        "answers": body.answers or {},
        "codeDrafts": _trim_drafts(body.codeDrafts or {}),
        "flagged": [str(item)[:80] for item in (body.flagged or [])][:200],
        "updatedAt": utcnow().isoformat(),
    }
    db.commit()
    return {"saved": True, "updatedAt": row.progress["updatedAt"]}


@router.post("/run")
def run_code(
    body: RunBody,
    cand: dict = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Compile and run the candidate's program against the question's test cases."""
    invite = db.get(CandidateInvite, cand["invite_id"])
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")
    question = db.get(Question, (body.questionId or "").strip())
    if question is None or question.type not in ("coding", "sql"):
        raise HTTPException(status_code=404, detail="Coding question not found.")
    session = _session_row(db, invite)
    drawn = session.drawn_question_ids or {}
    allowed = {qid for ids in drawn.values() if isinstance(ids, list) for qid in ids}
    if allowed and question.id not in allowed:
        raise HTTPException(status_code=403, detail="This question is not on your paper.")

    # Save latest running code draft & answer in DB so runs are never lost
    prog = dict(session.progress or {})
    code_drafts = dict(prog.get("codeDrafts") or {})
    lang = body.language or question.language or "python"
    prev_draft = dict(code_drafts.get(question.id) or {})
    files = dict(prev_draft.get("files") or {})
    files[lang] = body.code or ""
    code_drafts[question.id] = {
        "language": lang,
        "files": files,
    }
    prog["codeDrafts"] = code_drafts

    answers = dict(prog.get("answers") or {})
    answers[question.id] = {"code": body.code or "", "language": lang}
    prog["answers"] = answers
    prog["updatedAt"] = utcnow().isoformat()
    session.progress = prog
    db.commit()

    return code_exec.execute(lang, body.code or "", question.test_cases or [])


@router.post("/submit")
def submit_assessment(
    body: SubmitBody,
    cand: dict = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    invite = db.get(CandidateInvite, cand["invite_id"])
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")

    sess = db.query(AssessmentSession).filter(AssessmentSession.invite_id == invite.id).first()
    drawn = (sess.drawn_question_ids if sess else None) or {}
    if sess:
        prog = dict(sess.progress or {})
        submitted_answers = dict(body.answers or {})
        # Merge submitted answers with existing answers
        existing_answers = dict(prog.get("answers") or {})
        existing_answers.update(submitted_answers)
        prog["answers"] = existing_answers
        prog["updatedAt"] = utcnow().isoformat()
        sess.progress = prog
        if not sess.completed_at:
            sess.completed_at = utcnow()
        db.commit()

    out = scoring.grade_submission(
        db, invite=invite, answers=body.answers or {}, drawn_question_ids=drawn,
    )
    # Candidate only gets a receipt — not section scores or keys.
    return {
        "status": "submitted",
        "message": "Your assessment was submitted successfully. Scores are reviewed by the hiring team.",
        "resultId": out["resultId"],
    }



@router.post("/feedback")
def save_candidate_feedback(
    body: FeedbackBody,
    cand: dict = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Star rating is required. The comment is optional. Both are stored on the candidate."""
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Choose a star rating from 1 to 5.")
    row = _candidate_for_session(db, cand)
    row.feedback_rating = body.rating
    row.feedback_text = (body.comment or "").strip()[:2000]
    row.feedback_at = utcnow()
    row.updated_at = utcnow()
    db.commit()
    return {"saved": True, "rating": row.feedback_rating}


@router.post("/identity")
def save_candidate_identity(
    body: IdentityBody,
    cand: dict = Depends(get_current_candidate),
    db: Session = Depends(get_db),
):
    """Store the ID type on the candidate and the JPEG in the identity bucket."""
    row = _candidate_for_session(db, cand)
    stored_bytes = 0

    if body.kind == "photo":
        if not body.image:
            raise HTTPException(status_code=400, detail="A candidate photo is required.")
        raw = _jpeg_bytes(body.image)
        row.live_photo_url = _store_jpeg(row.id, "photo", raw)
        row.identity_status = "pending_verification"
        stored_bytes = len(raw)
    elif body.kind == "id":
        doc_type = (body.idDocumentType or "").strip().lower()
        if doc_type not in GOVT_ID_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Only a government ID is accepted: Aadhaar, PAN card, or Voter ID.",
            )
        if not body.image:
            raise HTTPException(status_code=400, detail="A live photo of the government ID is required.")
        raw = _jpeg_bytes(body.image)
        row.id_proof_url = _store_jpeg(row.id, "id", raw)
        row.id_document_type = doc_type
        row.identity_status = "pending_verification"
        stored_bytes = len(raw)
    elif body.systemCheck is None:
        raise HTTPException(status_code=400, detail="System check measurements are required.")

    if body.systemCheck is not None:
        check = body.systemCheck
        row.system_check = {
            "cameraPassed": check.cameraPassed,
            "microphonePassed": check.microphonePassed,
            "microphoneDb": check.microphoneDb,
            "networkPassed": check.networkPassed,
            "pingMs": check.pingMs,
            "downloadMbps": check.downloadMbps,
            "browserPassed": check.browserPassed,
            "screenWidth": check.screenWidth,
            "screenHeight": check.screenHeight,
            "singleMonitor": check.singleMonitor,
            "recordedAt": utcnow().isoformat(),
        }
        row.system_check_passed = bool(
            check.cameraPassed and check.microphonePassed and check.networkPassed and check.browserPassed
        )

    row.updated_at = utcnow()
    db.commit()
    return {
        "candidateId": row.id,
        "name": row.name,
        "email": row.email,
        "kind": body.kind,
        "format": "image/jpeg" if body.kind in ("photo", "id") else None,
        "bytes": stored_bytes,
        "idDocumentType": row.id_document_type,
        "livePhotoKey": row.live_photo_url if identity_bucket.exists(row.live_photo_url) else None,
        "idProofKey": row.id_proof_url if identity_bucket.exists(row.id_proof_url) else None,
        "livePhotoStored": identity_bucket.exists(row.live_photo_url),
        "idProofStored": identity_bucket.exists(row.id_proof_url),
        "identityStatus": row.identity_status,
        "systemCheckPassed": bool(row.system_check_passed),
    }
