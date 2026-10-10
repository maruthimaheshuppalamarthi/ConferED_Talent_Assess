"""
System Admin API: audit trail and sign-in history (read-only).

    GET /admin/audit-logs            filtered, paginated audit entries (newest first)
    GET /admin/audit-logs/meta       categories + actions for the filter drop-downs
    GET /admin/audit-logs/export     the same filters as a CSV download (capped at 50,000 rows)
    GET /admin/login-events          sign-in history (filter by user, email, portal, outcome, date)

Date filters: ``from`` / ``to`` accept an ISO date or datetime (UTC when no zone is given). A ``to`` with no
time of day (e.g. ``2026-10-10``) includes that whole day.
"""
import csv
import io
import json
import math
from datetime import datetime, timedelta, timezone
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy import or_
from sqlalchemy.orm import Query as SAQuery
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.schemas import (AuditLogOut, AuditLogPage, AuditMetaOut, LoginEventOut, LoginEventPage)
from app.core.roles import PORTAL_ADMIN
from app.db.session import get_db
from app.models.auth import AuditLog, LoginEvent, StaffUser
from app.services import audit

router = APIRouter(prefix="/admin", tags=["System Admin - audit & sign-in history"])

MAX_EXPORT_ROWS = 50_000
_CSV_DANGEROUS_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


# ------------------------------------------------------------------ helpers
def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _contains(column: Any, text: str):
    return column.ilike(f"%{_escape_like(text.strip())}%", escape="\\")


def _apply_range(query: SAQuery, column: Any, start: Optional[datetime], end: Optional[datetime]) -> SAQuery:
    if start is not None:
        query = query.filter(column >= _utc(start))
    if end is not None:
        end_utc = _utc(end)
        if end_utc.hour == end_utc.minute == end_utc.second == end_utc.microsecond == 0:
            query = query.filter(column < end_utc + timedelta(days=1))  # a bare date means the whole day
        else:
            query = query.filter(column <= end_utc)
    return query


def _page_meta(total: int, page: int, page_size: int) -> int:
    return max(1, math.ceil(total / page_size)) if total else 1


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


# ------------------------------------------------------------------ audit filters
class AuditFilters:
    """Query-string filters shared by the list and the CSV export."""

    def __init__(
        self,
        date_from: Optional[datetime] = Query(None, alias="from", description="Start (inclusive)"),
        date_to: Optional[datetime] = Query(None, alias="to", description="End (a bare date includes that day)"),
        category: Optional[str] = Query(None, max_length=40),
        action: Optional[str] = Query(None, max_length=80, description="Exact action, e.g. staff.create"),
        actor: Optional[str] = Query(None, max_length=254, description="Actor email contains"),
        actor_id: Optional[str] = Query(None, alias="actorId", max_length=64),
        target_type: Optional[str] = Query(None, alias="targetType", max_length=40),
        target_id: Optional[str] = Query(None, alias="targetId", max_length=64),
        success: Optional[bool] = Query(None),
        search: Optional[str] = Query(None, max_length=200, description="Text in summary / actor / action"),
        order: Literal["asc", "desc"] = Query("desc"),
        include_system_checks: bool = Query(False, alias="includeSystemChecks"),
    ):
        self.date_from, self.date_to = date_from, date_to
        self.category, self.action, self.actor, self.actor_id = category, action, actor, actor_id
        self.target_type, self.target_id, self.success = target_type, target_id, success
        self.search, self.order, self.include_system_checks = search, order, include_system_checks

    def apply(self, db: Session) -> SAQuery:
        q = db.query(AuditLog)
        if not self.include_system_checks:
            q = q.filter(AuditLog.action.notin_(audit.HIDDEN_ACTIONS))
        q = _apply_range(q, AuditLog.created_at, self.date_from, self.date_to)
        if self.category:
            q = q.filter(AuditLog.category == self.category)
        if self.action:
            q = q.filter(AuditLog.action == self.action)
        if self.actor:
            q = q.filter(_contains(AuditLog.actor_email, self.actor))
        if self.actor_id:
            q = q.filter(AuditLog.actor_id == self.actor_id)
        if self.target_type:
            q = q.filter(AuditLog.target_type == self.target_type)
        if self.target_id:
            q = q.filter(AuditLog.target_id == self.target_id)
        if self.success is not None:
            q = q.filter(AuditLog.success.is_(self.success))
        if self.search and self.search.strip():
            q = q.filter(or_(_contains(AuditLog.summary, self.search),
                             _contains(AuditLog.actor_email, self.search),
                             _contains(AuditLog.action, self.search)))
        newest_first = self.order == "desc"
        return q.order_by(AuditLog.created_at.desc() if newest_first else AuditLog.created_at.asc(),
                          AuditLog.id.desc() if newest_first else AuditLog.id.asc())


def _audit_out(row: AuditLog) -> AuditLogOut:
    return AuditLogOut(
        id=row.id, createdAt=row.created_at.isoformat(), category=row.category, action=row.action,
        actorId=row.actor_id, actorEmail=row.actor_email, actorRole=row.actor_role,
        targetType=row.target_type, targetId=row.target_id, summary=row.summary,
        details=row.details, success=row.success, ipAddress=row.ip_address, userAgent=row.user_agent,
    )


# ------------------------------------------------------------------ audit endpoints
@router.get("/audit-logs", response_model=AuditLogPage)
def list_audit_logs(
    filters: AuditFilters = Depends(),
    page: int = Query(1, ge=1, le=100_000),
    page_size: int = Query(25, alias="pageSize", ge=1, le=100),
    _: StaffUser = Depends(require_portal(PORTAL_ADMIN)),
    db: Session = Depends(get_db),
):
    query = filters.apply(db)
    total = query.order_by(None).count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return AuditLogPage(items=[_audit_out(r) for r in rows], total=total, page=page, pageSize=page_size,
                        pages=_page_meta(total, page, page_size))


@router.get("/audit-logs/meta", response_model=AuditMetaOut)
def audit_meta(_: StaffUser = Depends(require_portal(PORTAL_ADMIN)), db: Session = Depends(get_db)):
    categories = {c for (c,) in db.query(AuditLog.category).distinct().all()} | set(audit.CATEGORIES)
    actions = {a for (a,) in db.query(AuditLog.action).distinct().all()} - set(audit.HIDDEN_ACTIONS)
    return AuditMetaOut(categories=sorted(categories), actions=sorted(actions))


def _csv_cell(value: Any) -> str:
    """Neutralise spreadsheet formulas (CSV injection): a leading = + - @ would be executed by Excel."""
    text = "" if value is None else str(value)
    return "'" + text if text.startswith(_CSV_DANGEROUS_PREFIXES) else text


@router.get("/audit-logs/export")
def export_audit_logs(
    request: Request,
    filters: AuditFilters = Depends(),
    actor_user: StaffUser = Depends(require_portal(PORTAL_ADMIN)),
    db: Session = Depends(get_db),
):
    rows = filters.apply(db).limit(MAX_EXPORT_ROWS + 1).all()
    truncated = len(rows) > MAX_EXPORT_ROWS
    rows = rows[:MAX_EXPORT_ROWS]

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Timestamp (UTC)", "Category", "Action", "Actor", "Actor role", "Target type", "Target id",
                     "Success", "Summary", "IP address", "Details"])
    for r in rows:
        writer.writerow([_csv_cell(v) for v in (
            r.created_at.isoformat(), r.category, r.action, r.actor_email, r.actor_role, r.target_type,
            r.target_id, "yes" if r.success else "no", r.summary, r.ip_address,
            json.dumps(r.details, separators=(",", ":")) if r.details else "")])

    audit.record_audit(db, category=audit.CAT_SYSTEM, action="audit.export", actor=actor_user, request=request,
                       summary=f"{actor_user.email} exported {len(rows)} audit log entr{'y' if len(rows) == 1 else 'ies'}",
                       details={"rows": len(rows), "truncated": truncated})

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    headers = {"Content-Disposition": f'attachment; filename="audit-logs-{stamp}.csv"',
               "X-Export-Truncated": "true" if truncated else "false"}
    # utf-8 with BOM so Excel reads non-ASCII names correctly
    return Response(content="\ufeff" + out.getvalue(), media_type="text/csv; charset=utf-8", headers=headers)


# ------------------------------------------------------------------ sign-in history
@router.get("/login-events", response_model=LoginEventPage)
def list_login_events(
    date_from: Optional[datetime] = Query(None, alias="from"),
    date_to: Optional[datetime] = Query(None, alias="to"),
    email: Optional[str] = Query(None, max_length=254, description="Email contains"),
    user_id: Optional[str] = Query(None, alias="userId", max_length=64),
    portal: Optional[Literal["admin", "recruiter", "proctor"]] = Query(None),
    event: Optional[str] = Query(None, max_length=40),
    success: Optional[bool] = Query(None),
    order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1, le=100_000),
    page_size: int = Query(25, alias="pageSize", ge=1, le=100),
    _: StaffUser = Depends(require_portal(PORTAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = _apply_range(db.query(LoginEvent), LoginEvent.created_at, date_from, date_to)
    if email:
        q = q.filter(_contains(LoginEvent.email, email))
    if user_id:
        q = q.filter(LoginEvent.user_id == user_id)
    if portal:
        q = q.filter(LoginEvent.portal == portal)
    if event:
        q = q.filter(LoginEvent.event == event)
    if success is not None:
        q = q.filter(LoginEvent.success.is_(success))

    total = q.count()
    newest_first = order == "desc"
    q = q.order_by(LoginEvent.created_at.desc() if newest_first else LoginEvent.created_at.asc(),
                   LoginEvent.id.desc() if newest_first else LoginEvent.id.asc())
    rows: List[LoginEvent] = q.offset((page - 1) * page_size).limit(page_size).all()
    return LoginEventPage(
        items=[LoginEventOut(id=r.id, createdAt=r.created_at.isoformat(), userId=r.user_id, email=r.email,
                             portal=r.portal, event=r.event, success=r.success, failureReason=r.failure_reason,
                             ipAddress=r.ip_address, userAgent=r.user_agent) for r in rows],
        total=total, page=page, pageSize=page_size, pages=_page_meta(total, page, page_size))
