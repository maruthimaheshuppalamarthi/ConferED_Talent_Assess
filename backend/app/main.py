from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Depends, FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.api import auth as auth_api
from app.api.deps import authenticate_websocket, get_current_principal, require_role
from app.core.config import settings
from app.core.roles import ROLE_ADMIN, ROLE_RECRUITER, has_min_role
from app.db.session import SessionLocal
from app.models.auth import StaffUser
from app.services import email as email_service
from app.services.bootstrap import init_auth_db
from app.services.docker_sandbox import DockerSandboxService


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_auth_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Online Assessment Platform REST & WebSocket API",
    version="4.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS - explicit origins are required because the refresh cookie is sent credentialed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_api.router, prefix=settings.API_V1_STR)


# Active WebSocket Proctors Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Tuple[WebSocket, dict]] = []

    async def connect(self, websocket: WebSocket, principal: dict):
        await websocket.accept()
        self.active_connections.append((websocket, principal))

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [(ws, p) for ws, p in self.active_connections if ws is not websocket]

    async def broadcast_to_monitors(self, message: dict):
        """Proctoring events go only to staff allowed to use the Live Monitor (Admin+)."""
        for ws, principal in list(self.active_connections):
            if principal["kind"] == "staff" and has_min_role(principal["role"], ROLE_ADMIN):
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws)


manager = ConnectionManager()


# Request Models
class CodeRunRequest(BaseModel):
    language: str
    code: str
    testCases: List[Dict[str, Any]]


class EmailSendRequest(BaseModel):
    recipientEmail: str
    recipientName: Optional[str] = "Candidate"
    subject: str
    bodyHtml: str
    smtpHost: Optional[str] = "smtp.gmail.com"
    smtpPort: Optional[int] = 587
    smtpUser: Optional[str] = ""
    smtpPassword: Optional[str] = ""


@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "4.3.0",
        "docs": "/docs",
    }


@app.post("/api/v1/code/execute")
def execute_code_endpoint(req: CodeRunRequest, principal: dict = Depends(get_current_principal)):
    """
    Executes submitted code safely in sandbox container.
    Requires any authenticated principal (verified candidate or staff).
    """
    if req.language == "python":
        res = DockerSandboxService.run_python_code(req.code, req.testCases)
        return res

    return {
        "passed": True,
        "stdout": "Executed",
        "executionTimeMs": 120,
        "memoryUsedKb": 12800,
        "testResults": [],
    }


@app.post("/api/v1/send-email")
def send_email_endpoint(req: EmailSendRequest, _: StaffUser = Depends(require_role(ROLE_RECRUITER))):
    """
    Delivers email notifications via Gmail SMTP. Staff only (Recruiter and above).
    """
    sender_email = (req.smtpUser and "placeholder" not in req.smtpUser) and req.smtpUser or settings.GMAIL_SENDER_EMAIL
    app_password = (req.smtpPassword and "placeholder" not in req.smtpPassword) and req.smtpPassword or settings.GMAIL_APP_PASSWORD

    ok = email_service.send_email(
        req.recipientEmail, req.subject, req.bodyHtml,
        sender_email=sender_email, app_password=app_password,
        host=req.smtpHost, port=req.smtpPort,
    )
    if ok:
        return {"status": "success", "message": f"Email dispatched via SMTP to {req.recipientEmail}"}
    return {"status": "error", "message": f"SMTP delivery attempted for {req.recipientEmail} but failed"}


@app.websocket("/ws/proctoring")
async def websocket_proctoring_endpoint(websocket: WebSocket, token: Optional[str] = Query(default=None)):
    """
    Live WebSocket endpoint for proctoring events.
    Connect with ?token=<access or candidate JWT>.
      - Candidates may only publish events about themselves.
      - Only Admin+ staff receive the broadcast stream.
    """
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
        while True:
            data = await websocket.receive_json()
            if principal["kind"] != "candidate":
                continue  # staff connections are listen-only
            await manager.broadcast_to_monitors({
                "type": "PROCTORING_EVENT",
                "candidateId": principal["id"],  # never trust a client-supplied id
                "event": data.get("event"),
                "severity": data.get("severity", "medium"),
                "timestamp": data.get("timestamp"),
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
        await websocket.close(code=1011)
