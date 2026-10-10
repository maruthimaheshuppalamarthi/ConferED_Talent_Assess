from typing import Callable, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.roles import can_access_portal
from app.core.security import TOKEN_ACCESS, TOKEN_CANDIDATE, decode_token
from app.db.session import get_db
from app.models.auth import CandidateInvite, StaffUser, utcnow

_bearer = HTTPBearer(auto_error=False)

PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED"


def _unauthorized(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


# ------------------------------------------------------------------ lookups
def staff_from_token(token: str, db: Session) -> StaffUser:
    try:
        payload = decode_token(token, TOKEN_ACCESS)
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Access token expired")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid access token")

    user = db.get(StaffUser, payload["sub"])
    if user is None or not user.is_active or user.deleted_at is not None:
        raise _unauthorized("Account not found or disabled")
    # An administrator ended this user's sessions after the token was issued.
    cutoff = user.sessions_valid_after
    if cutoff is not None:
        issued_us = payload.get("iatus") or int(payload.get("iat", 0)) * 1_000_000  # older tokens: whole seconds
        if issued_us < int(cutoff.timestamp() * 1_000_000):
            raise _unauthorized("Your session was ended. Please sign in again.")
    return user  # the DB role is the source of truth, not the token claim


def candidate_from_token(token: str, db: Session) -> dict:
    try:
        payload = decode_token(token, TOKEN_CANDIDATE)
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Candidate session expired")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid candidate session")

    invite = db.get(CandidateInvite, payload.get("invite_id"))
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise _unauthorized("Invitation is no longer valid")
    return {
        "candidate_id": payload["sub"],
        "assessment_id": payload["assessment_id"],
        "invite_id": invite.id,
        "name": invite.name,
        "email": invite.email,
    }


# ------------------------------------------------------------- dependencies
def get_current_staff(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> StaffUser:
    """Any signed-in staff member (does NOT check portal access or a pending password change)."""
    if creds is None:
        raise _unauthorized()
    return staff_from_token(creds.credentials, db)


def require_portal(portal: str) -> Callable[..., StaffUser]:
    """Dependency factory: staff whose role may use `portal` and who has already set their own password."""

    def checker(user: StaffUser = Depends(get_current_staff)) -> StaffUser:
        if not can_access_portal(user.role, portal):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your role ({user.role}) cannot access the {portal} portal",
            )
        if user.must_change_password:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=PASSWORD_CHANGE_REQUIRED,
            )
        return user

    return checker


def get_current_candidate(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> dict:
    if creds is None:
        raise _unauthorized()
    return candidate_from_token(creds.credentials, db)


def get_current_principal(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> dict:
    """Any authenticated principal: staff OR candidate. Returns {'kind': 'staff'|'candidate', ...}."""
    if creds is None:
        raise _unauthorized()
    try:
        typ = decode_token(creds.credentials).get("typ")
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Token expired")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid token")

    if typ == TOKEN_ACCESS:
        user = staff_from_token(creds.credentials, db)
        if user.must_change_password:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=PASSWORD_CHANGE_REQUIRED)
        return {"kind": "staff", "id": user.id, "role": user.role}
    if typ == TOKEN_CANDIDATE:
        cand = candidate_from_token(creds.credentials, db)
        return {"kind": "candidate", "id": cand["candidate_id"], "role": "Candidate", **cand}
    raise _unauthorized("Invalid token")


# --------------------------------------------------------------- websockets
def authenticate_websocket(token: Optional[str], db: Session) -> Optional[dict]:
    """Returns a principal dict, or None when the token is missing/invalid."""
    if not token:
        return None
    try:
        typ = decode_token(token).get("typ")
        if typ == TOKEN_ACCESS:
            user = staff_from_token(token, db)
            if user.must_change_password:
                return None
            return {"kind": "staff", "id": user.id, "role": user.role}
        if typ == TOKEN_CANDIDATE:
            cand = candidate_from_token(token, db)
            return {"kind": "candidate", "id": cand["candidate_id"], "role": "Candidate"}
    except (HTTPException, jwt.PyJWTError):
        return None
    return None
