"""
System Admin API: the staff directory (read-only).

    GET /admin/staff/search       filtered, sorted, paginated list (the table of the Staff Management screen)
    GET /admin/staff/{id}         everything about one account

(`GET /admin/staff` in admin.py still returns the plain full list for simple callers.)
"""
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.staff_models import StaffDetailOut, StaffPage, detail_out, item_out
from app.core.roles import PORTAL_ADMIN
from app.db.session import get_db
from app.models.auth import StaffUser
from app.services import staff_admin

router = APIRouter(prefix="/admin/staff", tags=["System Admin - staff directory"])
admin_only = require_portal(PORTAL_ADMIN)


@router.get("/search", response_model=StaffPage, summary="Search, filter, sort and page through staff accounts")
def search(
    q: Optional[str] = Query(None, max_length=120, description="Name, email or department contains"),
    role: Optional[Literal["System Admin", "Recruiter", "Proctor"]] = Query(None),
    status: Literal["all", "active", "disabled", "locked", "pendingPassword", "neverSignedIn", "deleted"] = Query(
        "all", description="'all' = every account that is not deleted"),
    department: Optional[str] = Query(None, max_length=80),
    sort: Literal["name", "email", "role", "createdAt", "lastLoginAt"] = Query("createdAt"),
    order: Literal["asc", "desc"] = Query("desc"),
    page: int = Query(1, ge=1, le=100_000),
    page_size: int = Query(25, alias="pageSize", ge=1, le=100),
    _: StaffUser = Depends(admin_only),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    rows, total, pages = staff_admin.search_staff(
        db, now, q=q, role=role, status=status, department=department, sort=sort,
        descending=order == "desc", page=page, page_size=page_size)
    sessions = staff_admin.active_session_counts(db, [u.id for u in rows], now)
    return StaffPage(items=[item_out(u, sessions.get(u.id, 0)) for u in rows], total=total, page=page,
                     pageSize=page_size, pages=pages)


@router.get("/{user_id}", response_model=StaffDetailOut, summary="One staff account in full")
def detail(user_id: str, _: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id, allow_deleted=True)
    return detail_out(db, target, datetime.now(timezone.utc))
