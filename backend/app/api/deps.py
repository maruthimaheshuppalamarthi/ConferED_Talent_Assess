from typing import Callable, Optional, Union

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.roles import has_min_role
from app.core.security import TOKEN_ACCESS, TOKEN_CANDIDATE, decode_token
from app.db.session import get_db
from app.models.auth import CandidateInvite, StaffUser, utcnow

_bearer = HTTPBearer(auto_error=False)


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
    if user is None or not user.is_active:
        raise _unauthorized("Account not found or disabled")
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
    if creds is None:
        raise _unauthorized()
    return staff_from_token(creds.credentials, db)


def require_role(minimum: str) -> Callable[..., StaffUser]:
    """Dependency factory: staff user with at least the given role (RBAC)."""

    def checker(user: StaffUser = Depends(get_current_staff)) -> StaffUser:
        if not has_min_role(user.role, minimum):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {minimum} role or higher",
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
            return {"kind": "staff", "id": user.id, "role": user.role}
        if typ == TOKEN_CANDIDATE:
            cand = candidate_from_token(token, db)
            return {"kind": "candidate", "id": cand["candidate_id"], "role": "Candidate"}
    except (HTTPException, jwt.PyJWTError):
        return None
    return None
