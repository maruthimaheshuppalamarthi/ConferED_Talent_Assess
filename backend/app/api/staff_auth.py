"""
Per-portal staff authentication.

One router is built for each portal, so the same set of endpoints exists three times:

    /api/v1/admin/auth/...       System Admin only
    /api/v1/recruiter/auth/...   Recruiter only
    /api/v1/proctor/auth/...     Proctor only

    POST login            email + password          -> OTP emailed, returns challengeId
    POST verify-otp       challengeId + OTP         -> access JWT (body) + refresh JWT (HttpOnly cookie)
    POST resend-otp       challengeId               -> new OTP (cooldown enforced)
    POST refresh          refresh cookie            -> rotated refresh cookie + new access JWT
    POST logout           revokes the refresh token
    GET  me
    POST change-password  current + new password    -> new session (required after an admin reset)

There is deliberately no public registration or "forgot password": a System Admin creates accounts
and resets passwords (see app/api/admin.py).
"""
import logging
from datetime import timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_staff
from app.api.schemas import (ChallengeOut, ChangePasswordRequest, LoginRequest, ResendOtpRequest,
                             TokenOut, UserOut, VerifyOtpRequest)
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.roles import PORTAL_LOGIN_ROLE, can_access_portal
from app.core.security import (TOKEN_REFRESH, decode_token, hash_password, verify_password)
from app.db.session import get_db
from app.models.auth import OtpChallenge, RefreshToken, StaffUser, utcnow
from app.services import audit
from app.services import auth_core as core
from app.services import email as email_service
from app.services import runtime_settings as rt
from app.services.otp import (check_resend_cooldown, issue_otp, staff_login_purpose,
                              verify_challenge)

logger = logging.getLogger("nexus.auth")

PORTAL_TITLES = {"admin": "System Admin", "recruiter": "Recruiter", "proctor": "Proctor"}


def build_staff_auth_router(portal: str) -> APIRouter:
    if portal not in PORTAL_LOGIN_ROLE:
        raise ValueError(f"Unknown portal '{portal}'")

    router = APIRouter(prefix=f"/{portal}/auth", tags=[f"{PORTAL_TITLES[portal]} authentication"])
    purpose = staff_login_purpose(portal)

    def portal_staff(user: StaffUser = Depends(get_current_staff)) -> StaffUser:
        """Signed-in staff whose role may use this portal (a pending password change is still allowed)."""
        if not can_access_portal(user.role, portal):
            raise HTTPException(status_code=403, detail=f"Your role ({user.role}) cannot access this portal")
        return user

    @router.post("/login", response_model=ChallengeOut, dependencies=[Depends(rate_limit("login"))])
    def login(req: LoginRequest, background: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
        """Step 1/2: verify password, then email a one-time passcode."""
        return core.start_staff_login(db, background, portal, req.email, req.password, request)

    @router.post("/verify-otp", response_model=TokenOut, dependencies=[Depends(rate_limit("verify"))])
    def verify_login_otp(req: VerifyOtpRequest, request: Request, response: Response,
                         db: Session = Depends(get_db)):
        """Step 2/2: exchange a valid OTP for an access token + refresh cookie."""
        challenge = db.get(OtpChallenge, req.challengeId)
        try:
            verify_challenge(db, challenge, purpose, req.otp)
        except HTTPException as exc:
            who = db.get(StaffUser, challenge.subject_id) if challenge is not None else None
            audit.otp_failed(db, request, portal, who,
                             "too_many_attempts" if exc.status_code == 429 else "wrong_or_expired_code")
            raise

        user = core.staff_for_challenge(db, challenge, portal)
        user.failed_logins = 0
        user.locked_until = None
        user.last_login_at = utcnow()
        db.commit()
        audit.login_success(db, request, portal, user)
        return core.issue_session(db, user, response, request)

    @router.post("/resend-otp", response_model=ChallengeOut, dependencies=[Depends(rate_limit("resend"))])
    def resend_otp(req: ResendOtpRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
        challenge = db.get(OtpChallenge, req.challengeId)
        if challenge is None or challenge.purpose != purpose:
            raise HTTPException(status_code=400, detail="Unknown verification session. Start again.")
        check_resend_cooldown(challenge)

        try:
            user = core.staff_for_challenge(db, challenge, portal)
        except HTTPException:
            raise HTTPException(status_code=400, detail="Unknown verification session. Start again.")

        new_challenge, code = issue_otp(db, purpose, user.id)
        subject, body = email_service.staff_login_otp_email(code, rt.get_int("otpExpireMinutes"))
        background.add_task(email_service.send_email, user.otp_email, subject, body)
        core.log_dev_otp(f"{portal} resend {user.email}", code)
        return core.challenge_out(new_challenge, user.otp_email, code)

    # ------------------------------------------------------------ session mgmt
    @router.post("/refresh", response_model=TokenOut, dependencies=[Depends(rate_limit("refresh"))])
    def refresh_session(
        request: Request,
        response: Response,
        db: Session = Depends(get_db),
        refresh_cookie: Optional[str] = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
    ):
        """Rotate the refresh token and return a fresh access token (only if the account may use this portal)."""
        def fail(detail: str = "Session expired. Please sign in again.", code: int = 401):
            return HTTPException(status_code=code, detail=detail)

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
            # A token that was already *rotated* being replayed means someone copied it: kill every session of this
            # user. A token revoked by a logout / admin action / password change is just an ended session.
            if record.revoked_reason in (None, core.REVOKE_ROTATED):
                logger.warning("Refresh token reuse detected for user %s", record.user_id)
                victim = db.get(StaffUser, record.user_id)
                if victim is not None:
                    core.end_all_sessions(db, victim, core.REVOKE_SECURITY)
                    audit.record_audit(
                        db, category=audit.CAT_SECURITY, action="security.token_reuse", actor=victim,
                        request=request, target_type="staff_user", target_id=victim.id, success=False,
                        summary=f"A rotated session token was replayed for {victim.email}; every session was signed out",
                        details={"portal": portal})
            raise fail()
        if record.expires_at < utcnow():
            raise fail()

        user = db.get(StaffUser, record.user_id)
        if user is None or not user.is_active or user.deleted_at is not None:
            raise fail("Account not found or disabled")
        if not can_access_portal(user.role, portal):
            # Signed in, but for a different portal: leave the session untouched.
            raise fail("This account cannot use this portal.", 403)

        record.revoked = True
        record.revoked_reason = core.REVOKE_ROTATED
        db.commit()
        return core.issue_session(db, user, response, request, previous=record)

    @router.post("/logout")
    def logout(
        request: Request,
        response: Response,
        db: Session = Depends(get_db),
        refresh_cookie: Optional[str] = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
    ):
        if refresh_cookie:
            try:
                payload = decode_token(refresh_cookie, TOKEN_REFRESH)
                record = db.get(RefreshToken, payload["jti"])
                if record:
                    was_open = not record.revoked
                    record.revoked = True
                    record.revoked_reason = record.revoked_reason or core.REVOKE_LOGOUT
                    db.commit()
                    who = db.get(StaffUser, record.user_id)
                    if was_open and who is not None:
                        audit.logout(db, request, portal, who)
            except jwt.PyJWTError:
                pass
        core.clear_refresh_cookie(response)
        return {"status": "ok"}

    @router.get("/me", response_model=UserOut)
    def me(user: StaffUser = Depends(portal_staff)):
        return core.user_out(user)

    @router.post("/change-password", response_model=TokenOut, dependencies=[Depends(rate_limit("password"))])
    def change_password(req: ChangePasswordRequest, request: Request, response: Response,
                        user: StaffUser = Depends(portal_staff), db: Session = Depends(get_db)):
        """Choose your own password. Mandatory after an administrator created the account or reset the password."""
        if not verify_password(req.currentPassword or "", user.password_hash):
            user.failed_logins += 1
            locked_now = user.failed_logins >= rt.get_int("loginMaxFailures")
            if locked_now:
                user.locked_until = utcnow() + timedelta(minutes=rt.get_int("loginLockoutMinutes"))
                user.failed_logins = 0
            db.commit()
            audit.record_audit(
                db, category=audit.CAT_AUTH, action="auth.password_change_failed", actor=user, request=request,
                target_type="staff_user", target_id=user.id, success=False,
                summary=f"{user.email} gave the wrong current password while changing their password")
            if locked_now:
                audit.account_locked(db, request, portal, user, rt.get_int("loginLockoutMinutes"))
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        core.check_password_strength(req.newPassword, email=user.email, name=user.full_name)
        if req.newPassword == req.currentPassword:
            raise HTTPException(status_code=422, detail="Choose a password different from the current one")

        forced = user.must_change_password
        user.password_hash = hash_password(req.newPassword)
        user.must_change_password = False
        user.password_changed_at = utcnow()
        user.failed_logins = 0
        user.locked_until = None
        db.commit()
        audit.record_audit(
            db, category=audit.CAT_AUTH, action="auth.password_changed", actor=user, request=request,
            target_type="staff_user", target_id=user.id,
            summary=f"{user.email} set a new password" + (" (required after an admin reset)" if forced else ""),
            details={"wasForced": forced})
        core.end_all_sessions(db, user, core.REVOKE_PASSWORD)  # sign out every other device, immediately
        return core.issue_session(db, user, response, request)

    return router
