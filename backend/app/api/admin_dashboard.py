"""
System Admin API: dashboard, one endpoint per panel so each card loads (and fails) on its own.

    GET  /admin/dashboard/staff              staff accounts by role / state, locked, recent sign-ins
    GET  /admin/dashboard/security           sign-in outcomes for the last N hours + time series + noisy emails / IPs
    GET  /admin/dashboard/activity           latest audit entries + a 7-day count per category
    GET  /admin/dashboard/invites            candidate invitations by state
    GET  /admin/dashboard/health             database, migrations, settings, email gateway, encryption, security posture
    POST /admin/dashboard/health/email-probe connect to the SMTP gateway and sign in, without sending anything

Public probes for load balancers / uptime monitors (no details, no secrets):  GET /health   GET /health/ready
"""
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.core.roles import PORTAL_ADMIN
from app.db.session import get_db
from app.models.auth import StaffUser
from app.services import audit, dashboard, health
from app.services import email as email_service
from app.services import runtime_settings as rt

router = APIRouter(prefix="/admin/dashboard", tags=["System Admin - dashboard"])
public_router = APIRouter(tags=["Health probes (public)"])
admin_only = require_portal(PORTAL_ADMIN)

PROBE_COOLDOWN_SECONDS = 10.0
_last_probe: Dict[str, float] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ------------------------------------------------------------------ models
class RoleCount(BaseModel):
    role: str
    active: int
    disabled: int


class StaffStatsOut(BaseModel):
    total: int
    active: int
    disabled: int
    byRole: List[RoleCount]
    lockedNow: int
    pendingPasswordChange: int
    neverSignedIn: int
    signedInLast24h: int
    signedInLast7d: int
    createdLast7d: int


class SignInTotals(BaseModel):
    successfulSignIns: int
    failedSignIns: int
    blockedAttempts: int
    otpFailures: int
    lockouts: int
    signOuts: int
    uniqueUsers: int
    tokenReuseAlerts: int
    rateLimited: int = 0


class PreviousPeriod(BaseModel):
    successfulSignIns: int
    failedSignIns: int


class ReasonCount(BaseModel):
    reason: str
    count: int


class ValueCount(BaseModel):
    value: str
    count: int


class SeriesPoint(BaseModel):
    start: str
    successful: int
    failed: int


class SecurityStatsOut(BaseModel):
    hours: int
    since: str
    until: str
    bucket: Literal["hour", "day"]
    totals: SignInTotals
    previousPeriod: PreviousPeriod
    failuresByReason: List[ReasonCount]
    topFailingEmails: List[ValueCount]
    topFailingIps: List[ValueCount]
    series: List[SeriesPoint]
    lockedAccountsNow: int
    truncated: bool


class ActivityItem(BaseModel):
    id: str
    createdAt: str
    category: str
    action: str
    actorEmail: Optional[str] = None
    summary: str
    success: bool


class CategoryCount(BaseModel):
    category: str
    count: int


class ActivityOut(BaseModel):
    items: List[ActivityItem]
    last7DaysByCategory: List[CategoryCount]


class InviteStatsOut(BaseModel):
    total: int
    active: int
    verified: int
    awaitingCandidate: int
    expired: int
    revoked: int
    expiringWithin24h: int
    createdLast7d: int


class HealthComponent(BaseModel):
    name: str
    status: Literal["ok", "warning", "error"]
    message: str
    details: Dict[str, Any] = {}


class HealthOut(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    checkedAt: str
    startedAt: str
    uptimeSeconds: int
    version: str
    environment: str
    python: str
    components: List[HealthComponent]


class ProbeOut(BaseModel):
    ok: bool
    message: str
    host: str
    port: int
    sender: str
    passwordSource: Literal["database", "environment", "none"]


# ------------------------------------------------------------------ panels
@router.get("/staff", response_model=StaffStatsOut, summary="Staff accounts at a glance")
def staff_panel(_: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    return dashboard.staff_stats(db, _now())


@router.get("/security", response_model=SecurityStatsOut, summary="Sign-in and security statistics")
def security_panel(hours: int = Query(24, ge=1, le=168, description="Window size (1-168 hours)"),
                   _: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    return dashboard.security_stats(db, _now(), hours)


@router.get("/activity", response_model=ActivityOut, summary="Latest audit entries")
def activity_panel(limit: int = Query(10, ge=1, le=50),
                   category: Optional[str] = Query(None, max_length=40),
                   _: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    return dashboard.activity_feed(db, _now(), limit, category)


@router.get("/invites", response_model=InviteStatsOut, summary="Candidate invitations by state")
def invites_panel(_: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    return dashboard.invite_stats(db, _now())


@router.get("/health", response_model=HealthOut, summary="System health report")
def health_panel(_: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    return health.build_report(db)


@router.post("/health/email-probe", response_model=ProbeOut,
             summary="Check the SMTP gateway (connect + sign in, nothing is sent)")
def email_probe(request: Request, actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    now = time.monotonic()
    wait = PROBE_COOLDOWN_SECONDS - (now - _last_probe.get(actor.id, -1e9))
    if wait > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {int(wait) + 1}s before checking again")
    _last_probe[actor.id] = now

    cfg = rt.email_config()
    ok, message = email_service.probe_gateway()
    audit.record_audit(
        db, category=audit.CAT_SYSTEM, action="system.email_probe", actor=actor, request=request, success=ok,
        summary=f"{actor.email} checked the email gateway: " + ("connected" if ok else f"failed - {message}"),
        details={"host": cfg.host, "port": cfg.port, "passwordSource": cfg.password_source})
    return ProbeOut(ok=ok, message=message, host=cfg.host, port=cfg.port, sender=cfg.sender_email,
                    passwordSource=cfg.password_source)


# ------------------------------------------------------------------ public probes
@public_router.get("/health", summary="Liveness: the process is running")
def liveness():
    return {"status": "ok"}


@public_router.get("/health/ready", summary="Readiness: the database answers")
def readiness():
    result = health.ping_database()
    if result["status"] == health.ERROR:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ready"}
