"""
System Admin API: a staff member's sign-in sessions.

    GET    /admin/staff/{id}/sessions               the sessions that are still usable (when, where from, which browser)
    DELETE /admin/staff/{id}/sessions/{session_id}  end one session (the others keep working)

A session is one sign-in; refreshing keeps the same session id. Ending a session stops it from getting new access
tokens at once; an access token already issued works until it expires (accessTokenExpireMinutes). To cut everything
off immediately use POST /admin/staff/{id}/force-logout.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.staff_models import ActionOut, SessionOut, SessionsOut
from app.core.roles import PORTAL_ADMIN
from app.db.session import get_db
from app.models.auth import RefreshToken, StaffUser
from app.services import audit, staff_admin
from app.services import auth_core as core

router = APIRouter(prefix="/admin/staff", tags=["System Admin - staff sessions"])
admin_only = require_portal(PORTAL_ADMIN)


@router.get("/{user_id}/sessions", response_model=SessionsOut, summary="Live sessions of one staff member")
def list_sessions(user_id: str, _: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id, allow_deleted=True)
    tokens = staff_admin.live_sessions(db, target.id, datetime.now(timezone.utc))
    items = [SessionOut(
        id=staff_admin.session_key(t),
        startedAt=(t.session_started_at or t.created_at).isoformat(),
        lastActiveAt=t.created_at.isoformat(),
        expiresAt=t.expires_at.isoformat(),
        ipAddress=t.ip_address, userAgent=t.user_agent) for t in tokens]
    return SessionsOut(items=items, count=len(items))


@router.delete("/{user_id}/sessions/{session_id}", response_model=ActionOut, summary="End one session")
def end_session(user_id: str, session_id: str, request: Request,
                actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id, allow_deleted=True)
    now = datetime.now(timezone.utc)
    live = db.query(RefreshToken).filter(
        RefreshToken.user_id == target.id, RefreshToken.revoked.is_(False), RefreshToken.expires_at > now,
        or_(RefreshToken.session_id == session_id, RefreshToken.jti == session_id)).all()
    if not live:
        raise HTTPException(status_code=404, detail="Session not found (it may already have ended)")
    for token in live:
        token.revoked = True
        token.revoked_reason = core.REVOKE_ADMIN
    db.commit()
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.session_end", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} ended a session of {target.email}",
        details={"sessionId": session_id, "ipAddress": live[0].ip_address})
    return ActionOut(message="Session ended.", revokedSessions=len(live))
