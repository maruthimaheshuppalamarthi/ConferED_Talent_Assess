"""Response / request models for the staff-management endpoints (directory, account actions, sessions)."""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.api.schemas import UserOut


class StaffItemOut(UserOut):
    """One row of the staff directory."""
    lockedUntil: Optional[str] = None
    deletedAt: Optional[str] = None
    activeSessions: int = 0


class StaffDetailOut(StaffItemOut):
    """Everything the admin can see about one account."""
    otpEmail: str
    failedLogins: int = 0
    updatedAt: Optional[str] = None
    passwordChangedAt: Optional[str] = None
    createdById: Optional[str] = None
    createdByEmail: Optional[str] = None


class StaffPage(BaseModel):
    items: List[StaffItemOut]
    total: int
    page: int
    pageSize: int
    pages: int


class StaffProfileUpdate(BaseModel):
    """Any subset of the profile. Unknown fields and explicit nulls are rejected; '' clears phone / department."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(default=None, min_length=1, max_length=120)
    email: str = Field(default=None, min_length=3, max_length=254, description="Login email")
    otpEmail: str = Field(default=None, min_length=3, max_length=254, description="Where 2FA passcodes are sent")
    phone: str = Field(default=None, max_length=32)
    department: str = Field(default=None, max_length=80)


class ActionOut(BaseModel):
    message: str
    revokedSessions: int = 0


class SessionOut(BaseModel):
    id: str
    startedAt: Optional[str] = None
    lastActiveAt: str
    expiresAt: str
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None


class SessionsOut(BaseModel):
    items: List[SessionOut]
    count: int
    note: str = ("Ending a session blocks new access tokens immediately; a token already issued stops working "
                 "when it expires (see Settings > Security > accessTokenExpireMinutes). Use 'Force logout' to "
                 "end every session at once.")


# ------------------------------------------------------------------ converters
def _iso(value) -> Optional[str]:
    return value.isoformat() if value else None


def item_out(user, session_count: int = 0) -> StaffItemOut:
    from app.services import auth_core as core
    return StaffItemOut(**core.user_out(user).model_dump(), lockedUntil=_iso(user.locked_until),
                        deletedAt=_iso(user.deleted_at), activeSessions=session_count)


def detail_out(db, user, now) -> StaffDetailOut:
    from app.models.auth import StaffUser
    from app.services import staff_admin
    creator = db.get(StaffUser, user.created_by) if user.created_by else None
    base = item_out(user, staff_admin.active_session_counts(db, [user.id], now).get(user.id, 0))
    return StaffDetailOut(**base.model_dump(), otpEmail=user.otp_email, failedLogins=user.failed_logins,
                          updatedAt=_iso(user.updated_at), passwordChangedAt=_iso(user.password_changed_at),
                          createdById=user.created_by, createdByEmail=creator.email if creator else None)
