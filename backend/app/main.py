from contextlib import asynccontextmanager
from typing import Any, Dict, List

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.api import admin as admin_api
from app.api import admin_audit as admin_audit_api
from app.api import admin_dashboard as admin_dashboard_api
from app.api import admin_staff_actions as admin_staff_actions_api
from app.api import admin_staff_directory as admin_staff_directory_api
from app.api import admin_staff_sessions as admin_staff_sessions_api
from app.api import admin_settings as admin_settings_api
from app.api import candidate as candidate_api
from app.api import policy as policy_api
from app.api import proctor as proctor_api
from app.api import recruiter as recruiter_api
from app.api import recruiter_extended as recruiter_extended_api
from app.api.deps import get_current_principal
from app.api.staff_auth import build_staff_auth_router
from app.core.config import settings
from app.core.prod_checks import enforce_startup_checks
from app.core.roles import PORTAL_ADMIN, PORTAL_PROCTOR, PORTAL_RECRUITER
from app.services.bootstrap import init_auth_db
from app.services.docker_sandbox import DockerSandboxService


@asynccontextmanager
async def lifespan(_: FastAPI):
    enforce_startup_checks()   # production: refuse to start on unsafe configuration
    init_auth_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Online Assessment Platform REST & WebSocket API",
    version="5.0.0",
    # The interactive docs are off in production (ENABLE_DOCS=true to override).
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
    lifespan=lifespan,
)

# Configure CORS - explicit origins are required because the refresh cookie is sent credentialed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    # the browser app may read these (rate-limit back-off, CSV download name / truncation flag)
    expose_headers=["Retry-After", "Content-Disposition", "X-Export-Truncated"],
)

_DOC_PATHS = ("/docs", "/redoc", "/openapi.json")


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    """Reject oversized bodies early (declared Content-Length; the server also bounds what it reads)."""
    declared = request.headers.get("content-length", "")
    if declared.isdigit() and int(declared) > settings.MAX_REQUEST_BYTES:
        return JSONResponse(status_code=413, content={"detail": "The request body is too large."})
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Defensive headers on every response (the interactive docs need scripts, so they only get the basics)."""
    response = await call_next(request)
    headers = response.headers
    headers.setdefault("X-Content-Type-Options", "nosniff")
    headers.setdefault("X-Frame-Options", "DENY")
    headers.setdefault("Referrer-Policy", "no-referrer")
    headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if not request.url.path.startswith(_DOC_PATHS):
        headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        headers.setdefault("Cache-Control", "no-store")  # tokens, staff data and audit logs must not be cached
    if settings.COOKIE_SECURE:
        headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


if settings.ALLOWED_HOSTS:  # outermost: unknown Host headers never reach the app
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# One login/session API per portal, plus the portal-specific feature APIs.
for _portal in (PORTAL_ADMIN, PORTAL_RECRUITER, PORTAL_PROCTOR):
    app.include_router(build_staff_auth_router(_portal), prefix=settings.API_V1_STR)
app.include_router(admin_api.router, prefix=settings.API_V1_STR)
app.include_router(admin_staff_directory_api.router, prefix=settings.API_V1_STR)  # /search before /{id}
app.include_router(admin_staff_actions_api.router, prefix=settings.API_V1_STR)
app.include_router(admin_staff_sessions_api.router, prefix=settings.API_V1_STR)
app.include_router(admin_audit_api.router, prefix=settings.API_V1_STR)
app.include_router(admin_settings_api.router, prefix=settings.API_V1_STR)
app.include_router(admin_dashboard_api.router, prefix=settings.API_V1_STR)
app.include_router(admin_dashboard_api.public_router)  # /health, /health/ready (no auth, no details)
app.include_router(policy_api.router, prefix=settings.API_V1_STR)
app.include_router(recruiter_api.router, prefix=settings.API_V1_STR)
app.include_router(recruiter_extended_api.router, prefix=settings.API_V1_STR)
app.include_router(candidate_api.router, prefix=settings.API_V1_STR)
app.include_router(proctor_api.router)  # WebSocket: /ws/proctoring
app.include_router(proctor_api.desk, prefix=settings.API_V1_STR)


class CodeRunRequest(BaseModel):
    language: str
    code: str
    testCases: List[Dict[str, Any]]


@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "5.0.0",
        "docs": "/docs" if settings.ENABLE_DOCS else None,
    }


@app.post("/api/v1/code/execute")
def execute_code_endpoint(req: CodeRunRequest, principal: dict = Depends(get_current_principal)):
    """
    Executes submitted code safely in runner.
    Requires any authenticated principal (verified candidate or staff).
    """
    from app.services.docker_sandbox import DockerSandboxService
    return DockerSandboxService.execute(req.language, req.code, req.testCases)
