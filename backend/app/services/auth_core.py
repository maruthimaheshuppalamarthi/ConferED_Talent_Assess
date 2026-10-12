"""
Shared staff-authentication logic used by every portal's login router (admin / recruiter / proctor)
and by the admin account-management API.
"""
import logging
import re
from datetime import timedelta
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.schemas import ChallengeOut, TokenOut, UserOut
from app.core import password_policy
from app.core.config import settings
from app.core.roles import PORTAL_LOGIN_ROLE, portals_for
from app.core.security import (DUMMY_PASSWORD_HASH, create_access_token, create_refresh_token,
                               hash_password, verify_password)
from app.models.auth import OtpChallenge, RefreshToken, StaffUser, new_id, utcnow
from app.services import audit
from app.services import email as email_service
from app.services import runtime_settings as rt
from app.services.otp import issue_otp, staff_login_purpose

logger = logging.getLogger("nexus.auth")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+$")

# One message for "unknown email", "wrong password" and "wrong portal" so nothing can be probed.
INVALID_LOGIN_MESSAGE = "Invalid email or password for this portal."


# ------------------------------------------------------------------ helpers
def norm_email(value: str) -> str:
    value = (value or "").strip().lower()
    if not _EMAIL_RE.match(value):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    return value


def check_password_strength(password: str, email: Optional[str] = None, name: Optional[str] = None) -> None:
    minimum = rt.get_int("minPasswordLength")
    if len(password or "") < minimum:
        raise HTTPException(status_code=422,
                            detail=f"Password must be at least {minimum} characters")
    reason = password_policy.violation(password, email=email, name=name)
    if reason:
        raise HTTPException(status_code=422, detail=f"Choose a stronger password: {reason}.")


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked = local[:1] + "*"
    else:
        masked = local[0] + "*" * (len(local) - 2) + local[-1]
    return masked if not domain else f"{masked}@{domain}"


def user_out(user: StaffUser) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.full_name,
        role=user.role,
        portals=portals_for(user.role),
        isActive=user.is_active,
        mustChangePassword=user.must_change_password,
        createdAt=user.created_at.isoformat() if user.created_at else None,
        lastLoginAt=user.last_login_at.isoformat() if user.last_login_at else None,
        phone=user.phone,
        department=user.department,
    )


def challenge_out(challenge: OtpChallenge, destination: str, code: str) -> ChallengeOut:
    return ChallengeOut(
        challengeId=challenge.id,
        otpDestination=mask_email(destination),
        expiresInSeconds=rt.get_int("otpExpireMinutes") * 60,
        devOtp=code if settings.DEV_EXPOSE_OTP else None,
    )


def log_dev_otp(label: str, code: str) -> None:
    if settings.DEV_EXPOSE_OTP:
        logger.warning("[DEV] %s OTP: %s", label, code)


# ------------------------------------------------------------------ cookies
def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        max_age=rt.get_int("refreshTokenExpireDays") * 86400,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path=settings.REFRESH_COOKIE_PATH)


# ----------------------------------------------------------------- sessions
def issue_session(db: Session, user: StaffUser, response: Response, request: Optional[Request] = None,
                  previous: Optional[RefreshToken] = None) -> TokenOut:
    """
    Start a session (sign-in) or continue one (``previous`` = the token being rotated). Every sign-in gets a
    ``session_id`` that survives rotation, so the admin can list and end individual sessions.
    """
    now = utcnow()
    jti = new_id()
    ip, agent = audit.client_info(request)
    refresh = create_refresh_token(user.id, user.role, jti)
    db.add(RefreshToken(
        jti=jti, user_id=user.id,
        expires_at=now + timedelta(days=rt.get_int("refreshTokenExpireDays")),
        session_id=(previous.session_id or previous.jti) if previous is not None else jti,
        session_started_at=(previous.session_started_at or previous.created_at) if previous is not None else now,
        ip_address=ip, user_agent=agent,
    ))
    db.commit()
    set_refresh_cookie(response, refresh)
    return TokenOut(
        accessToken=create_access_token(user.id, user.role),
        expiresIn=rt.get_int("accessTokenExpireMinutes") * 60,
        user=user_out(user),
    )


# Why a refresh token stopped working. Only a *rotated* token being replayed looks like theft.
REVOKE_ROTATED = "rotated"
REVOKE_LOGOUT = "logout"
REVOKE_ADMIN = "admin"
REVOKE_PASSWORD = "password"
REVOKE_SECURITY = "security"


def revoke_all_refresh_tokens(db: Session, user_id: str, reason: str = REVOKE_ADMIN) -> int:
    """Revoke every live refresh token of a user. Returns how many were revoked."""
    count = db.query(RefreshToken).filter(RefreshToken.user_id == user_id,
                                          RefreshToken.revoked.is_(False)).update(
        {"revoked": True, "revoked_reason": reason})
    db.commit()
    return count


def end_all_sessions(db: Session, user: StaffUser, reason: str = REVOKE_ADMIN) -> int:
    """
    Sign a user out everywhere *now*: refresh tokens are revoked (no new access tokens) and every access token
    issued before this moment is refused too, instead of lingering until it expires.
    """
    user.sessions_valid_after = utcnow()
    db.commit()
    return revoke_all_refresh_tokens(db, user.id, reason)

# -------------------------------------------------------------------- login
def start_staff_login(db: Session, background: BackgroundTasks, portal: str,
                      email: str, password: str, request: Optional[Request] = None) -> ChallengeOut:
    """Step 1/2 for a portal: check password + that the account belongs to this portal, then email an OTP."""
    email = (email or "").strip().lower()
    user = (db.query(StaffUser)
            .filter(StaffUser.email == email,
                    StaffUser.role == PORTAL_LOGIN_ROLE[portal],
                    StaffUser.deleted_at.is_(None))
            .first())

    if user and user.locked_until and user.locked_until > utcnow():
        audit.login_failed(db, request, portal, email, user, "account_locked", event="login_blocked")
        raise HTTPException(status_code=429,
                            detail="Account temporarily locked after repeated failures. Try again later.")

    # Always run bcrypt so response time doesn't reveal whether the account exists.
    password_ok = verify_password(password or "", user.password_hash if user else DUMMY_PASSWORD_HASH)

    if not user or not password_ok or not user.is_active:
        locked_now = False
        if user:
            user.failed_logins += 1
            if user.failed_logins >= rt.get_int("loginMaxFailures"):
                user.locked_until = utcnow() + timedelta(minutes=rt.get_int("loginLockoutMinutes"))
                user.failed_logins = 0
                locked_now = True
            db.commit()
        # The caller always gets the same message; the real reason is only recorded in the trail.
        reason = "unknown_account" if not user else ("inactive_account" if password_ok else "wrong_password")
        audit.login_failed(db, request, portal, email, user, reason)
        if locked_now:
            audit.account_locked(db, request, portal, user, rt.get_int("loginLockoutMinutes"))
        raise HTTPException(status_code=401, detail=INVALID_LOGIN_MESSAGE)

    # Correct password but the account belongs to a different portal: same answer, no OTP.
    if user.role != PORTAL_LOGIN_ROLE[portal]:
        audit.login_failed(db, request, portal, email, user, "wrong_portal")
        raise HTTPException(status_code=401, detail=INVALID_LOGIN_MESSAGE)

    audit.password_verified(db, request, portal, user)
    challenge, code = issue_otp(db, staff_login_purpose(portal), user.id)
    subject, body = email_service.staff_login_otp_email(code, rt.get_int("otpExpireMinutes"))
    email_service.dispatch_otp_email(user.otp_email, subject, body)
    log_dev_otp(f"{portal} login {user.email}", code)
    return challenge_out(challenge, user.otp_email, code)


def staff_for_challenge(db: Session, challenge: OtpChallenge, portal: str) -> StaffUser:
    """Load the account an already-verified challenge belongs to and re-check it still fits the portal."""
    user = db.get(StaffUser, challenge.subject_id)
    if user is None or not user.is_active or user.role != PORTAL_LOGIN_ROLE[portal]:
        raise HTTPException(status_code=401, detail="Account not found or disabled")
    return user


# ---------------------------------------------------------- account creation
def create_staff_user(db: Session, name: str, email: str, password: str, role: str,
                      must_change_password: bool, phone: Optional[str] = None, department: Optional[str] = None,
                      otp_email: Optional[str] = None) -> StaffUser:
    email = norm_email(email)
    otp_email = norm_email(otp_email) if otp_email else email
    check_password_strength(password, email=email, name=name)
    existing = db.query(StaffUser).filter(StaffUser.email == email, StaffUser.role == role).first()
    if existing is not None:
        if existing.deleted_at is not None:
            raise HTTPException(status_code=409,
                                detail="This email belonged to a deleted account. Restore that account instead.")
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = StaffUser(
        email=email,
        otp_email=otp_email,
        full_name=name.strip() or "Staff Member",
        role=role,
        password_hash=hash_password(password),
        must_change_password=must_change_password,
        phone=phone or None,
        department=department or None,
    )
    db.add(user)
    db.commit()
    return user

def portal_path_for_role(role: str) -> str:
    """Frontend path a role should sign in at."""
    for portal, login_role in PORTAL_LOGIN_ROLE.items():
        if login_role == role:
            return f"/{portal}"
    return "/"


def queue_credentials_email(background: Optional[BackgroundTasks], user: StaffUser,
                            temp_password: str, is_reset: bool) -> bool:
    if background is None:
        return False
    url = settings.FRONTEND_URL.rstrip("/") + portal_path_for_role(user.role)
    subject, body = email_service.staff_credentials_email(
        user.full_name, url, user.email, temp_password, is_reset)
    background.add_task(email_service.send_email, user.otp_email, subject, body)
    return True
