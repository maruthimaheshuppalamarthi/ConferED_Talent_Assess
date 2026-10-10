"""
Authentication & authorisation API.

Staff (Recruiter / Admin / Super Admin):
    POST /auth/login            email + password  -> OTP emailed, returns challengeId
    POST /auth/verify-otp       challengeId + OTP -> access JWT (body) + refresh JWT (HttpOnly cookie)
    POST /auth/resend-otp       challengeId       -> new OTP (cooldown enforced)
    POST /auth/refresh          refresh cookie    -> rotated refresh cookie + new access JWT
    POST /auth/logout           revokes refresh token
    GET  /auth/me
    POST /auth/register         public self-signup (Recruiter only, can be switched off)
    POST /auth/password-reset/request | /confirm
    GET/POST/PATCH /auth/staff  Admin+ account management

Candidates:
    POST /auth/candidate/invites      (Recruiter+) create invite link + emailed OTP
    POST /auth/candidate/verify       invite token + OTP -> candidate-scoped JWT
    POST /auth/candidate/resend-otp   invite token -> new OTP
"""
import logging
import re
from datetime import timedelta
from typing import List, Optional

import jwt
from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff, require_role
from app.core.config import settings
from app.core.roles import (ROLE_ADMIN, ROLE_RECRUITER, ROLE_SUPER_ADMIN, STAFF_ROLES,
                            has_min_role, rank, workspaces_for)
from app.core.security import (DUMMY_PASSWORD_HASH, TOKEN_REFRESH, create_access_token,
                               create_candidate_token, create_refresh_token, decode_token,
                               generate_opaque_token, hash_opaque_token, hash_password,
                               verify_password)
from app.db.session import get_db
from app.models.auth import (CandidateInvite, OtpChallenge, RefreshToken, StaffUser, new_id,
                             utcnow)
from app.services import email as email_service
from app.services.otp import (PURPOSE_CANDIDATE_LOGIN, PURPOSE_PASSWORD_RESET,
                              PURPOSE_STAFF_LOGIN, check_resend_cooldown, issue_otp,
                              verify_challenge)

logger = logging.getLogger("nexus.auth")
router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


# ------------------------------------------------------------------ schemas
class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    workspaces: List[str]
    isActive: bool = True
    createdAt: Optional[str] = None


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


class TokenOut(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int
    user: UserOut


class ResendOtpRequest(BaseModel):
    challengeId: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    challengeId: str
    otp: str
    newPassword: str


class StaffCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    password: str
    role: str = ROLE_RECRUITER


class StaffUpdateRequest(BaseModel):
    role: Optional[str] = None
    isActive: Optional[bool] = None


class InviteCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    phone: Optional[str] = None
    assessmentId: str
    candidateId: Optional[str] = None
    expiresInHours: int = Field(default=48, ge=1, le=24 * 14)


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


# ------------------------------------------------------------------ helpers
def _norm_email(value: str) -> str:
    value = (value or "").strip().lower()
    if not _EMAIL_RE.match(value):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    return value


def _check_password_strength(password: str) -> None:
    if len(password or "") < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=422,
                            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked = local[:1] + "*"
    else:
        masked = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked}@{domain}"


def _user_out(user: StaffUser) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.full_name,
        role=user.role,
        workspaces=workspaces_for(user.role),
        isActive=user.is_active,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )


def _challenge_out(challenge: OtpChallenge, destination: str, code: str) -> ChallengeOut:
    return ChallengeOut(
        challengeId=challenge.id,
        otpDestination=_mask_email(destination),
        expiresInSeconds=settings.OTP_EXPIRE_MINUTES * 60,
        devOtp=code if settings.DEV_EXPOSE_OTP else None,
    )


def _log_dev_otp(label: str, code: str) -> None:
    if settings.DEV_EXPOSE_OTP:
        logger.warning("[DEV] %s OTP: %s", label, code)


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path=f"{settings.API_V1_STR}/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=f"{settings.API_V1_STR}/auth")


def _issue_session(db: Session, user: StaffUser, response: Response) -> TokenOut:
    jti = new_id()
    refresh = create_refresh_token(user.id, user.role, jti)
    db.add(RefreshToken(jti=jti, user_id=user.id,
                        expires_at=utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)))
    db.commit()
    _set_refresh_cookie(response, refresh)
    return TokenOut(
        accessToken=create_access_token(user.id, user.role),
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=_user_out(user),
    )


def _revoke_all_refresh_tokens(db: Session, user_id: str) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id,
                                  RefreshToken.revoked.is_(False)).update({"revoked": True})
    db.commit()


# -------------------------------------------------------------- staff login
@router.post("/login", response_model=ChallengeOut)
def login(req: LoginRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Step 1/2: verify password, then email a one-time passcode."""
    email = (req.email or "").strip().lower()
    user = db.query(StaffUser).filter(StaffUser.email == email).first()

    if user and user.locked_until and user.locked_until > utcnow():
        raise HTTPException(status_code=429,
                            detail="Account temporarily locked after repeated failures. Try again later.")

    # Always run bcrypt so response time doesn't reveal whether the account exists.
    password_ok = verify_password(req.password or "", user.password_hash if user else DUMMY_PASSWORD_HASH)

    if not user or not password_ok or not user.is_active:
        if user:
            user.failed_logins += 1
            if user.failed_logins >= settings.LOGIN_MAX_FAILURES:
                user.locked_until = utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
                user.failed_logins = 0
            db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    challenge, code = issue_otp(db, PURPOSE_STAFF_LOGIN, user.id)
    subject, body = email_service.staff_login_otp_email(code, settings.OTP_EXPIRE_MINUTES)
    background.add_task(email_service.send_email, user.otp_email, subject, body)
    _log_dev_otp(f"staff login {user.email}", code)
    return _challenge_out(challenge, user.otp_email, code)


@router.post("/verify-otp", response_model=TokenOut)
def verify_login_otp(req: VerifyOtpRequest, response: Response, db: Session = Depends(get_db)):
    """Step 2/2: exchange a valid OTP for an access token + refresh cookie."""
    challenge = db.get(OtpChallenge, req.challengeId)
    verify_challenge(db, challenge, PURPOSE_STAFF_LOGIN, req.otp)

    user = db.get(StaffUser, challenge.subject_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Account not found or disabled")

    user.failed_logins = 0
    user.locked_until = None
    db.commit()
    return _issue_session(db, user, response)


@router.post("/resend-otp", response_model=ChallengeOut)
def resend_staff_otp(req: ResendOtpRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    challenge = db.get(OtpChallenge, req.challengeId)
    if challenge is None or challenge.purpose not in (PURPOSE_STAFF_LOGIN, PURPOSE_PASSWORD_RESET):
        raise HTTPException(status_code=400, detail="Unknown verification session. Start again.")
    check_resend_cooldown(challenge)

    user = db.get(StaffUser, challenge.subject_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=400, detail="Unknown verification session. Start again.")

    new_challenge, code = issue_otp(db, challenge.purpose, user.id)
    builder = (email_service.staff_login_otp_email if challenge.purpose == PURPOSE_STAFF_LOGIN
               else email_service.password_reset_otp_email)
    subject, body = builder(code, settings.OTP_EXPIRE_MINUTES)
    background.add_task(email_service.send_email, user.otp_email, subject, body)
    _log_dev_otp(f"resend {challenge.purpose} {user.email}", code)
    return _challenge_out(new_challenge, user.otp_email, code)


# ----------------------------------------------------------- session mgmt
@router.post("/refresh", response_model=TokenOut)
def refresh_session(
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: Optional[str] = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    """Rotate the refresh token and return a fresh access token."""
    def fail(detail: str = "Session expired. Please sign in again."):
        return HTTPException(status_code=401, detail=detail)

    if not refresh_cookie:
        raise fail("No active session")
    try:
        payload = decode_token(refresh_cookie, TOKEN_REFRESH)
    except jwt.PyJWTError:
        raise fail()

    record = db.get(RefreshToken, payload["jti"])
    if record is None:
        raise fail()
    if record.revoked:
        # A rotated/revoked token was replayed -> assume theft, kill every session of this user.
        logger.warning("Refresh token reuse detected for user %s", record.user_id)
        _revoke_all_refresh_tokens(db, record.user_id)
        raise fail()
    if record.expires_at < utcnow():
        raise fail()

    user = db.get(StaffUser, record.user_id)
    if user is None or not user.is_active:
        raise fail("Account not found or disabled")

    record.revoked = True
    db.commit()
    return _issue_session(db, user, response)


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_cookie: Optional[str] = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if refresh_cookie:
        try:
            payload = decode_token(refresh_cookie, TOKEN_REFRESH)
            record = db.get(RefreshToken, payload["jti"])
            if record:
                record.revoked = True
                db.commit()
        except jwt.PyJWTError:
            pass
    _clear_refresh_cookie(response)
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
def me(user: StaffUser = Depends(get_current_staff)):
    return _user_out(user)


# ------------------------------------------------------ registration / reset
@router.post("/register", response_model=UserOut, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Public self-signup. Always creates a *Recruiter*; elevated roles are granted by an Admin."""
    if not settings.ALLOW_PUBLIC_STAFF_REGISTRATION:
        raise HTTPException(status_code=403, detail="Self-registration is disabled. Ask an administrator.")
    return _create_staff(db, req.name, req.email, req.password, ROLE_RECRUITER)


@router.post("/password-reset/request", response_model=ChallengeOut)
def password_reset_request(req: PasswordResetRequest, background: BackgroundTasks,
                           db: Session = Depends(get_db)):
    """Always answers the same way so it can't be used to discover which emails have accounts."""
    email = (req.email or "").strip().lower()
    user = db.query(StaffUser).filter(StaffUser.email == email).first()
    if user and user.is_active:
        challenge, code = issue_otp(db, PURPOSE_PASSWORD_RESET, user.id)
        subject, body = email_service.password_reset_otp_email(code, settings.OTP_EXPIRE_MINUTES)
        background.add_task(email_service.send_email, user.otp_email, subject, body)
        _log_dev_otp(f"password reset {user.email}", code)
        return _challenge_out(challenge, user.otp_email, code)

    return ChallengeOut(
        challengeId=new_id(),
        otpDestination=_mask_email(email) if _EMAIL_RE.match(email) else "your email",
        expiresInSeconds=settings.OTP_EXPIRE_MINUTES * 60,
    )


@router.post("/password-reset/confirm")
def password_reset_confirm(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    _check_password_strength(req.newPassword)
    challenge = db.get(OtpChallenge, req.challengeId)
    verify_challenge(db, challenge, PURPOSE_PASSWORD_RESET, req.otp)

    user = db.get(StaffUser, challenge.subject_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Account not found")
    user.password_hash = hash_password(req.newPassword)
    user.failed_logins = 0
    user.locked_until = None
    db.commit()
    _revoke_all_refresh_tokens(db, user.id)  # sign out everywhere
    return {"status": "ok", "message": "Password updated. Please sign in."}


# ---------------------------------------------------------- staff admin (RBAC)
def _create_staff(db: Session, name: str, email: str, password: str, role: str) -> UserOut:
    email = _norm_email(email)
    _check_password_strength(password)
    if db.query(StaffUser).filter(StaffUser.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = StaffUser(
        email=email,
        otp_email=email,
        full_name=name.strip() or "Staff Member",
        role=role,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    return _user_out(user)


@router.get("/staff", response_model=List[UserOut])
def list_staff(_: StaffUser = Depends(require_role(ROLE_ADMIN)), db: Session = Depends(get_db)):
    return [_user_out(u) for u in db.query(StaffUser).order_by(StaffUser.created_at.desc()).all()]


@router.post("/staff", response_model=UserOut, status_code=201)
def create_staff(req: StaffCreateRequest, actor: StaffUser = Depends(require_role(ROLE_ADMIN)),
                 db: Session = Depends(get_db)):
    if req.role not in STAFF_ROLES:
        raise HTTPException(status_code=422, detail=f"Role must be one of {STAFF_ROLES}")
    if rank(req.role) > rank(actor.role) or (req.role == ROLE_SUPER_ADMIN and actor.role != ROLE_SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="You cannot grant a role higher than your own")
    return _create_staff(db, req.name, req.email, req.password, req.role)


@router.patch("/staff/{user_id}", response_model=UserOut)
def update_staff(user_id: str, req: StaffUpdateRequest, actor: StaffUser = Depends(require_role(ROLE_ADMIN)),
                 db: Session = Depends(get_db)):
    target = db.get(StaffUser, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role or status")
    if rank(target.role) > rank(actor.role) or (target.role == actor.role and actor.role != ROLE_SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="You cannot modify an account of equal or higher role")

    if req.role is not None:
        if req.role not in STAFF_ROLES:
            raise HTTPException(status_code=422, detail=f"Role must be one of {STAFF_ROLES}")
        if rank(req.role) > rank(actor.role) or (req.role == ROLE_SUPER_ADMIN and actor.role != ROLE_SUPER_ADMIN):
            raise HTTPException(status_code=403, detail="You cannot grant a role higher than your own")
        target.role = req.role
    if req.isActive is not None:
        target.is_active = req.isActive
        if not req.isActive:
            _revoke_all_refresh_tokens(db, target.id)
    db.commit()
    return _user_out(target)


# --------------------------------------------------------------- candidates
@router.post("/candidate/invites", response_model=InviteOut, status_code=201)
def create_invite(req: InviteCreateRequest, background: BackgroundTasks,
                  actor: StaffUser = Depends(require_role(ROLE_RECRUITER)), db: Session = Depends(get_db)):
    email = _norm_email(req.email)
    token = generate_opaque_token()
    candidate_id = req.candidateId or f"cand-{int(utcnow().timestamp() * 1000)}"
    invite = CandidateInvite(
        candidate_id=candidate_id,
        name=req.name.strip(),
        email=email,
        phone=req.phone,
        assessment_id=req.assessmentId,
        token_hash=hash_opaque_token(token),
        expires_at=utcnow() + timedelta(hours=req.expiresInHours),
        created_by=actor.id,
    )
    db.add(invite)
    db.commit()

    challenge, code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/?assessment={req.assessmentId}&invite={token}"
    subject, body = email_service.candidate_invite_email(
        invite.name, link, code, settings.OTP_EXPIRE_MINUTES, f"in {req.expiresInHours} hours")
    background.add_task(email_service.send_email, email, subject, body)
    _log_dev_otp(f"candidate invite {email}", code)

    return InviteOut(
        inviteId=invite.id,
        candidateId=candidate_id,
        link=link,
        expiresAt=invite.expires_at.isoformat() + "Z",
        otpDestination=_mask_email(email),
        devOtp=code if settings.DEV_EXPOSE_OTP else None,
    )


def _invite_from_token(db: Session, token: str) -> CandidateInvite:
    invite = db.query(CandidateInvite).filter(
        CandidateInvite.token_hash == hash_opaque_token(token or "")).first()
    if invite is None or invite.revoked or invite.expires_at < utcnow():
        raise HTTPException(status_code=401, detail="This invitation link is invalid or has expired.")
    return invite


@router.post("/candidate/verify", response_model=CandidateTokenOut)
def candidate_verify(req: CandidateVerifyRequest, db: Session = Depends(get_db)):
    invite = _invite_from_token(db, req.inviteToken)
    challenge = (db.query(OtpChallenge)
                 .filter(OtpChallenge.purpose == PURPOSE_CANDIDATE_LOGIN,
                         OtpChallenge.subject_id == invite.id)
                 .order_by(OtpChallenge.created_at.desc()).first())
    verify_challenge(db, challenge, PURPOSE_CANDIDATE_LOGIN, req.otp)

    invite.verified_at = utcnow()
    db.commit()
    return CandidateTokenOut(
        accessToken=create_candidate_token(invite.candidate_id, invite.assessment_id, invite.id),
        expiresIn=settings.CANDIDATE_TOKEN_EXPIRE_MINUTES * 60,
        candidate=CandidateOut(id=invite.candidate_id, name=invite.name,
                               email=invite.email, assessmentId=invite.assessment_id),
    )


@router.post("/candidate/resend-otp", response_model=ChallengeOut)
def candidate_resend(req: CandidateResendRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    invite = _invite_from_token(db, req.inviteToken)
    latest = (db.query(OtpChallenge)
              .filter(OtpChallenge.purpose == PURPOSE_CANDIDATE_LOGIN, OtpChallenge.subject_id == invite.id)
              .order_by(OtpChallenge.created_at.desc()).first())
    if latest:
        check_resend_cooldown(latest)

    challenge, code = issue_otp(db, PURPOSE_CANDIDATE_LOGIN, invite.id)
    subject, body = email_service.candidate_resend_otp_email(invite.name, code, settings.OTP_EXPIRE_MINUTES)
    background.add_task(email_service.send_email, invite.email, subject, body)
    _log_dev_otp(f"candidate resend {invite.email}", code)
    return _challenge_out(challenge, invite.email, code)
