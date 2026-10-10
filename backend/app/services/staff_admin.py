"""
Rules and queries behind the System Admin's staff-management endpoints.

    get_target                    load an account for an admin action (404 / 409 for deleted accounts)
    ensure_another_active_admin   never let the platform end up with no active System Admin
    clean_profile                 validate and normalise profile edits
    search_staff                  filtered / sorted / paginated directory
    active_session_counts         live sessions per user
    live_sessions                 the sessions of one user that are still usable
"""
import math
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Query, Session

from app.core.roles import ROLE_SYSTEM_ADMIN
from app.models.auth import RefreshToken, StaffUser
from app.services.auth_core import norm_email
from app.services.settings_store import is_valid_email

_PHONE_RE = re.compile(r"^\+?[0-9][0-9 ()\-.]{4,30}[0-9]$")
_BAD_TEXT = re.compile(r"[\x00-\x1f\x7f<>]")

STATUS_FILTERS = ("all", "active", "disabled", "locked", "pendingPassword", "neverSignedIn", "deleted")
SORT_FIELDS = {
    "name": StaffUser.full_name, "email": StaffUser.email, "role": StaffUser.role,
    "createdAt": StaffUser.created_at, "lastLoginAt": StaffUser.last_login_at,
}


# ------------------------------------------------------------------ loading + guards
def get_target(db: Session, user_id: str, allow_deleted: bool = False) -> StaffUser:
    target = db.get(StaffUser, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.deleted_at is not None and not allow_deleted:
        raise HTTPException(status_code=409, detail="This account is deleted. Restore it first.")
    return target


def ensure_another_active_admin(db: Session, target: StaffUser) -> None:
    """Raise 409 unless some *other* active, non-deleted System Admin exists."""
    others = (db.query(func.count(StaffUser.id))
              .filter(StaffUser.role == ROLE_SYSTEM_ADMIN, StaffUser.is_active.is_(True),
                      StaffUser.deleted_at.is_(None), StaffUser.id != target.id).scalar() or 0)
    if others == 0:
        raise HTTPException(status_code=409,
                            detail="This is the last active System Admin. Create or activate another one first.")


def is_active_admin(user: StaffUser) -> bool:
    return user.role == ROLE_SYSTEM_ADMIN and user.is_active and user.deleted_at is None


# ------------------------------------------------------------------ profile validation
def _invalid(message: str) -> HTTPException:
    return HTTPException(status_code=422, detail=message)


def clean_profile(changes: Dict[str, Any]) -> Dict[str, Any]:
    """Normalise the fields of a profile edit. '' clears phone / department. Raises 422 on bad input."""
    out: Dict[str, Any] = {}
    if "name" in changes:
        name = " ".join(str(changes["name"]).split())
        if not name or _BAD_TEXT.search(name):
            raise _invalid("name must not be empty or contain special characters")
        out["name"] = name
    if "email" in changes:
        out["email"] = norm_email(changes["email"])  # the login id: lenient on purpose (e.g. the built-in admin@7666)
    if "otpEmail" in changes:  # receives the 2FA codes, so it must be a real, deliverable-looking address
        otp_email = str(changes["otpEmail"]).strip().lower()
        if not is_valid_email(otp_email):
            raise _invalid("otpEmail must be a valid email address")
        out["otpEmail"] = otp_email
    if "phone" in changes:
        phone = str(changes["phone"]).strip()
        if phone and not _PHONE_RE.match(phone):
            raise _invalid("phone must look like +91 98765 43210 (digits, spaces, dashes, brackets)")
        out["phone"] = phone or None
    if "department" in changes:
        department = " ".join(str(changes["department"]).split())
        if _BAD_TEXT.search(department):
            raise _invalid("department contains characters that are not allowed")
        out["department"] = department or None
    return out


# ------------------------------------------------------------------ directory
def _filtered(db: Session, now: datetime, q: Optional[str], role: Optional[str], status: str,
              department: Optional[str]) -> Query:
    query = db.query(StaffUser)
    if status == "deleted":
        query = query.filter(StaffUser.deleted_at.isnot(None))
    else:
        query = query.filter(StaffUser.deleted_at.is_(None))
    if status == "active":
        query = query.filter(StaffUser.is_active.is_(True))
    elif status == "disabled":
        query = query.filter(StaffUser.is_active.is_(False))
    elif status == "locked":
        query = query.filter(StaffUser.locked_until > now)
    elif status == "pendingPassword":
        query = query.filter(StaffUser.is_active.is_(True), StaffUser.must_change_password.is_(True))
    elif status == "neverSignedIn":
        query = query.filter(StaffUser.is_active.is_(True), StaffUser.last_login_at.is_(None))
    if role:
        query = query.filter(StaffUser.role == role)
    if department:
        query = query.filter(StaffUser.department.ilike(_like(department), escape="\\"))
    if q and q.strip():
        pattern = _like(q)
        query = query.filter(or_(StaffUser.full_name.ilike(pattern, escape="\\"),
                                 StaffUser.email.ilike(pattern, escape="\\"),
                                 StaffUser.department.ilike(pattern, escape="\\")))
    return query


def _like(text: str) -> str:
    escaped = text.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def search_staff(db: Session, now: datetime, *, q: Optional[str], role: Optional[str], status: str,
                 department: Optional[str], sort: str, descending: bool, page: int,
                 page_size: int) -> Tuple[List[StaffUser], int, int]:
    """Returns (rows of this page, total matches, number of pages)."""
    query = _filtered(db, now, q, role, status, department)
    total = query.count()
    column = SORT_FIELDS[sort]
    ordering = [column.desc() if descending else column.asc(), StaffUser.id.asc()]
    if sort == "lastLoginAt":  # people who never signed in always sort last, whatever the direction
        ordering.insert(0, StaffUser.last_login_at.is_(None))
    rows = query.order_by(*ordering).offset((page - 1) * page_size).limit(page_size).all()
    return rows, total, max(1, math.ceil(total / page_size)) if total else 1


# ------------------------------------------------------------------ sessions
def active_session_counts(db: Session, user_ids: List[str], now: datetime) -> Dict[str, int]:
    if not user_ids:
        return {}
    rows = (db.query(RefreshToken.user_id, func.count(RefreshToken.jti))
            .filter(RefreshToken.user_id.in_(user_ids), RefreshToken.revoked.is_(False),
                    RefreshToken.expires_at > now)
            .group_by(RefreshToken.user_id).all())
    return {user_id: count for user_id, count in rows}


def live_sessions(db: Session, user_id: str, now: datetime) -> List[RefreshToken]:
    """One refresh token per live session (the newest of its family), most recently active first."""
    return (db.query(RefreshToken)
            .filter(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False),
                    RefreshToken.expires_at > now)
            .order_by(RefreshToken.created_at.desc()).all())


def session_key(token: RefreshToken) -> str:
    return token.session_id or token.jti
