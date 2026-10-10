"""Request / response models shared by the auth, admin, recruiter and candidate routers."""
from typing import List, Optional

from pydantic import BaseModel, Field

from app.core.roles import ROLE_RECRUITER


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    portals: List[str]                 # portals this role may open (admin / recruiter / proctor)
    isActive: bool = True
    mustChangePassword: bool = False
    createdAt: Optional[str] = None
    lastLoginAt: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ChallengeOut(BaseModel):
    challengeId: str
    otpDestination: str
    expiresInSeconds: int
    devOtp: Optional[str] = None  # only populated when DEV_EXPOSE_OTP=true


class VerifyOtpRequest(BaseModel):
    challengeId: str
    otp: str


class ResendOtpRequest(BaseModel):
    challengeId: str


class TokenOut(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int
    user: UserOut


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


# ---------------------------------------------------------------- admin
class StaffCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    role: str = ROLE_RECRUITER
    # Optional: when omitted the server generates a temporary password.
    password: Optional[str] = None
    # Optional profile fields (otpEmail defaults to the login email).
    phone: Optional[str] = Field(default=None, max_length=32)
    department: Optional[str] = Field(default=None, max_length=80)
    otpEmail: Optional[str] = Field(default=None, max_length=254)


class StaffUpdateRequest(BaseModel):
    role: Optional[str] = None
    isActive: Optional[bool] = None


class StaffCredentialsOut(BaseModel):
    """Returned once to the admin after creating an account / resetting a password."""
    user: UserOut
    temporaryPassword: str
    emailed: bool = False  # True when the credentials email was queued for delivery


# ------------------------------------------------------------ candidates
class InviteCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    phone: Optional[str] = None
    assessmentId: str
    candidateId: Optional[str] = None
    # Omitted -> the System Admin's "linkExpirationHours" setting.
    expiresInHours: Optional[int] = Field(default=None, ge=1, le=24 * 14)


class InviteOut(BaseModel):
    inviteId: str
    candidateId: str
    link: str
    expiresAt: str
    otpDestination: str
    devOtp: Optional[str] = None


class CandidateVerifyRequest(BaseModel):
    inviteToken: str
    otp: str


class CandidateResendRequest(BaseModel):
    inviteToken: str


class CandidateOut(BaseModel):
    id: str
    name: str
    email: str
    assessmentId: str


class CandidateTokenOut(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int
    candidate: CandidateOut


# ------------------------------------------------------------ audit / login history
class AuditLogOut(BaseModel):
    id: str
    createdAt: str
    category: str
    action: str
    actorId: Optional[str] = None
    actorEmail: Optional[str] = None
    actorRole: Optional[str] = None
    targetType: Optional[str] = None
    targetId: Optional[str] = None
    summary: str
    details: Optional[dict] = None
    success: bool = True
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None


class AuditLogPage(BaseModel):
    items: List[AuditLogOut]
    total: int
    page: int
    pageSize: int
    pages: int


class AuditMetaOut(BaseModel):
    """Values for the filter drop-downs of the audit viewer."""
    categories: List[str]
    actions: List[str]


class LoginEventOut(BaseModel):
    id: str
    createdAt: str
    userId: Optional[str] = None
    email: Optional[str] = None
    portal: Optional[str] = None
    event: str
    success: bool
    failureReason: Optional[str] = None
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None


class LoginEventPage(BaseModel):
    items: List[LoginEventOut]
    total: int
    page: int
    pageSize: int
    pages: int
