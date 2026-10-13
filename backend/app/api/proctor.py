"""
Proctor API: identity review, one-way audio, chat, and the live event stream.

    GET  /api/v1/proctor/identity                         candidates who uploaded a photo or ID
    GET  /api/v1/proctor/identity/{id}/photo.jpg          the live photo
    GET  /api/v1/proctor/identity/{id}/id.jpg             the government ID
    POST /api/v1/proctor/identity/{id}/admit              approve and admit the candidate
    WS   /ws/proctoring?token=<access or candidate JWT>

Candidates publish events about themselves only. Chat goes both ways. Audio goes only
from a proctor to that candidate. Only Proctors receive the monitor stream.
"""
import base64
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import authenticate_websocket, require_portal
from app.core.roles import PORTAL_PROCTOR, can_access_portal
from app.db.session import SessionLocal, get_db
from app.models.auth import Assessment, AssessmentSection, AssessmentSession, Candidate, utcnow
from app.services.exam_timing import exam_time_left
from app.services import identity_bucket

router = APIRouter(tags=["Proctor"])
desk = APIRouter(prefix="/proctor", tags=["Proctor"])
_proctor = require_portal(PORTAL_PROCTOR)
_CHAT_LIMIT = 80


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean_text(value: object) -> str:
    return str(value or "").replace("\x00", "").strip()[:500]


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Tuple[WebSocket, dict]] = []
        self.chats: Dict[str, List[dict]] = {}
        self.violations: Dict[str, int] = {}
        self.last_event: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, principal: dict):
        await websocket.accept()
        self.active_connections.append((websocket, principal))

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [(ws, p) for ws, p in self.active_connections if ws is not websocket]

    def remember_chat(self, candidate_id: str, message: dict):
        thread = self.chats.setdefault(candidate_id, [])
        thread.append(message)
        if len(thread) > _CHAT_LIMIT:
            del thread[:-_CHAT_LIMIT]

    async def broadcast_to_monitors(self, message: dict):
        """Proctoring events go only to staff allowed into the Proctor portal."""
        for ws, principal in list(self.active_connections):
            if principal["kind"] == "staff" and can_access_portal(principal["role"], PORTAL_PROCTOR):
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws)

    async def send_to_candidate(self, candidate_id: str, message: dict):
        for ws, principal in list(self.active_connections):
            if principal["kind"] == "candidate" and principal["id"] == candidate_id:
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws)


manager = ConnectionManager()


def _is_proctor(principal: dict) -> bool:
    return principal["kind"] == "staff" and can_access_portal(principal["role"], PORTAL_PROCTOR)


@router.websocket("/ws/proctoring")
async def websocket_proctoring_endpoint(websocket: WebSocket, token: Optional[str] = Query(default=None)):
    db = SessionLocal()
    try:
        principal = authenticate_websocket(token, db)
    finally:
        db.close()

    if principal is None:
        await websocket.close(code=4401)  # unauthenticated
        return

    await manager.connect(websocket, principal)
    try:
        if principal["kind"] == "candidate":
            await websocket.send_json({
                "type": "history",
                "candidateId": principal["id"],
                "messages": list(manager.chats.get(principal["id"], [])),
            })
        elif _is_proctor(principal):
            await websocket.send_json({"type": "inbox", "threads": {k: list(v) for k, v in manager.chats.items()}})

        while True:
            data = await websocket.receive_json()
            if principal["kind"] == "candidate":
                if data.get("type") == "chat":
                    text = _clean_text(data.get("text"))
                    if not text:
                        continue
                    msg = {
                        "type": "chat", "candidateId": principal["id"], "from": "candidate",
                        "text": text, "at": _now(),
                    }
                    manager.remember_chat(principal["id"], msg)
                    await manager.broadcast_to_monitors(msg)
                elif data.get("type") in ("frame", "snapshot"):
                    image = data.get("image")
                    limit = 400_000 if data.get("type") == "snapshot" else 140_000
                    if isinstance(image, str) and image.startswith("data:image/jpeg") and len(image) <= limit:
                        await manager.broadcast_to_monitors({
                            "type": "frame",
                            "candidateId": principal["id"],
                            "image": image,
                            "snapshot": data.get("type") == "snapshot",
                            "reason": data.get("reason"),
                        })
                elif data.get("type") == "finished":
                    await manager.broadcast_to_monitors({
                        "type": "session_ended", "candidateId": principal["id"],
                    })
                elif data.get("type") == "mic":
                    pcm = data.get("pcm")
                    if isinstance(pcm, str) and 0 < len(pcm) <= 80_000:
                        await manager.broadcast_to_monitors({
                            "type": "mic", "candidateId": principal["id"], "pcm": pcm,
                        })
                else:
                    event = str(data.get("event") or "Violation")
                    manager.violations[principal["id"]] = manager.violations.get(principal["id"], 0) + 1
                    manager.last_event[principal["id"]] = event
                    await manager.broadcast_to_monitors({
                        "type": "PROCTORING_EVENT",
                        "candidateId": principal["id"],  # never trust a client-supplied id
                        "event": event,
                        "severity": data.get("severity", "medium"),
                        "timestamp": data.get("timestamp"),
                        "violations": manager.violations[principal["id"]],
                    })
                continue

            if not _is_proctor(principal):
                continue
            candidate_id = str(data.get("candidateId") or "")
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", candidate_id):
                continue
            if data.get("type") == "chat":
                text = _clean_text(data.get("text"))
                if not text:
                    continue
                msg = {
                    "type": "chat", "candidateId": candidate_id, "from": "proctor",
                    "text": text, "at": _now(),
                }
                manager.remember_chat(candidate_id, msg)
                await manager.send_to_candidate(candidate_id, msg)
                await manager.broadcast_to_monitors(msg)
            elif data.get("type") == "audio":
                pcm = data.get("pcm")
                if isinstance(pcm, str) and 0 < len(pcm) <= 80_000:
                    await manager.send_to_candidate(candidate_id, {"type": "audio", "pcm": pcm})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass  # socket already closed by the peer


def _jpeg_bytes(stored: Optional[str]) -> bytes:
    if not stored:
        raise HTTPException(status_code=404, detail="This image has not been uploaded.")
    if stored.startswith("data:image/jpeg;base64,"):
        try:
            return base64.b64decode(stored.split(",", 1)[1], validate=True)
        except Exception:
            raise HTTPException(status_code=404, detail="This image could not be read.")
    try:
        return identity_bucket.read_jpeg(stored)
    except identity_bucket.IdentityBucketError:
        raise HTTPException(status_code=404, detail="This image is not in the bucket.")


def _exam_for(db: Session, cand: Candidate) -> Optional[Assessment]:
    if not cand.assessment_id:
        return None
    return db.get(Assessment, cand.assessment_id)


def _duration_minutes(db: Session, exam: Optional[Assessment]) -> int:
    if exam is None:
        return 60
    if exam.total_duration_minutes:
        return int(exam.total_duration_minutes)
    sections = (
        db.query(AssessmentSection)
        .filter(AssessmentSection.assessment_id == exam.id)
        .all()
    )
    total = sum(int(section.time_limit_minutes or 0) for section in sections)
    return total or 60


def _exam_clock(db: Session, cand: Candidate, exam: Optional[Assessment]) -> dict:
    """Countdown from the moment the candidate enters the exam, for the full allotment."""
    session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.candidate_id == cand.id)
        .order_by(AssessmentSession.created_at.desc())
        .first()
    )
    started = session.exam_started_at if session else None
    seconds, running = exam_time_left(started, _duration_minutes(db, exam), utcnow())
    return {"timeLeftSeconds": seconds, "examStarted": running}


def _queue_row(db: Session, cand: Candidate) -> dict:
    exam = _exam_for(db, cand)
    return {
        "id": cand.id,
        "name": cand.name,
        "email": cand.email,
        "phone": cand.phone or "",
        "examTitle": exam.title if exam else "",
        "idDocumentType": cand.id_document_type,
        "identityStatus": cand.identity_status or "pending_verification",
        "hasPhoto": bool(cand.live_photo_url),
        "hasId": bool(cand.id_proof_url),
        "updatedAt": cand.updated_at.isoformat() if cand.updated_at else None,
    }


@desk.get("/identity")
def identity_queue(_: object = Depends(_proctor), db: Session = Depends(get_db)):
    rows = (
        db.query(Candidate)
        .filter((Candidate.live_photo_url.isnot(None)) | (Candidate.id_proof_url.isnot(None)))
        .order_by(Candidate.updated_at.desc())
        .limit(50)
        .all()
    )
    return {"items": [_queue_row(db, row) for row in rows]}


@desk.get("/live")
def live_sessions(_: object = Depends(_proctor), db: Session = Depends(get_db)):
    """Admitted candidates for the live monitoring grid."""
    rows = (
        db.query(Candidate)
        .filter(Candidate.identity_status == "approved", Candidate.feedback_at.is_(None))
        .order_by(Candidate.updated_at.desc())
        .limit(50)
        .all()
    )
    items = []
    for cand in rows:
        exam = _exam_for(db, cand)
        clock = _exam_clock(db, cand, exam)
        items.append({
            "id": cand.id,
            "name": cand.name,
            "email": cand.email,
            "examTitle": exam.title if exam else "",
            "timeLeftSeconds": clock["timeLeftSeconds"],
            "examStarted": clock["examStarted"],
            "violations": manager.violations.get(cand.id, 0),
            "lastEvent": manager.last_event.get(cand.id, ""),
        })
    return {"items": items}


@desk.get("/identity/{candidate_id}/photo.jpg")
def identity_photo(candidate_id: str, _: object = Depends(_proctor), db: Session = Depends(get_db)):
    cand = db.get(Candidate, candidate_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return Response(content=_jpeg_bytes(cand.live_photo_url), media_type="image/jpeg")


@desk.get("/identity/{candidate_id}/id.jpg")
def identity_id(candidate_id: str, _: object = Depends(_proctor), db: Session = Depends(get_db)):
    cand = db.get(Candidate, candidate_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return Response(content=_jpeg_bytes(cand.id_proof_url), media_type="image/jpeg")


@desk.post("/identity/{candidate_id}/admit")
def admit_candidate(candidate_id: str, _: object = Depends(_proctor), db: Session = Depends(get_db)):
    cand = db.get(Candidate, candidate_id)
    if cand is None:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    if not cand.live_photo_url or not cand.id_proof_url:
        raise HTTPException(status_code=400, detail="The candidate has not uploaded both a photo and a government ID.")
    cand.identity_status = "approved"
    cand.updated_at = utcnow()
    db.commit()
    return {"id": cand.id, "identityStatus": "approved"}
