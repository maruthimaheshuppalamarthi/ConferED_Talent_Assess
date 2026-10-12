"""
System Admin API: actions on one staff account. Each action is its own endpoint and its own audit entry.

    PATCH  /admin/staff/{id}/profile             name, login email, 2FA email, phone, department
    POST   /admin/staff/{id}/unlock              lift a lockout caused by failed sign-ins
    POST   /admin/staff/{id}/force-logout        end every session immediately
    POST   /admin/staff/{id}/resend-credentials  new temporary password for an account that never signed in
    DELETE /admin/staff/{id}                     soft delete (kept for the audit trail, cannot sign in)
    POST   /admin/staff/{id}/restore             bring a deleted account back (it stays disabled)

(Role, activate / deactivate and reset-password live in admin.py.)
"""
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.schemas import StaffCredentialsOut
from app.api.staff_models import ActionOut, StaffDetailOut, StaffProfileUpdate, detail_out
from app.core.roles import PORTAL_ADMIN
from app.core.security import generate_temp_password, hash_password
from app.db.session import get_db
from app.models.auth import StaffUser, utcnow
from app.services import audit, staff_admin
from app.services import auth_core as core
from app.services import email as email_service

router = APIRouter(prefix="/admin/staff", tags=["System Admin - staff actions"])
admin_only = require_portal(PORTAL_ADMIN)

_PROFILE_ATTRS = {"name": "full_name", "email": "email", "otpEmail": "otp_email", "phone": "phone",
                  "department": "department"}
_SELF_EDITABLE = {"name", "phone", "department"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _not_self(actor: StaffUser, target: StaffUser, what: str) -> None:
    if actor.id == target.id:
        raise HTTPException(status_code=400, detail=f"You cannot {what} your own account")


# ------------------------------------------------------------------ profile
@router.patch("/{user_id}/profile", response_model=StaffDetailOut, summary="Edit a staff member's details")
def update_profile(user_id: str, body: StaffProfileUpdate, request: Request, background: BackgroundTasks,
                   actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id)
    raw = body.model_dump(exclude_unset=True)
    changes = staff_admin.clean_profile(raw) if raw else {}

    if actor.id == target.id and set(changes) - _SELF_EDITABLE:
        raise HTTPException(status_code=400, detail="You cannot change your own login or 2FA email: "
                                                    "a typo could lock you out. Ask another System Admin.")
    if "email" in changes and changes["email"] != target.email:
        clash = (db.query(StaffUser)
                 .filter(StaffUser.email == changes["email"], StaffUser.role == target.role,
                         StaffUser.id != target.id)
                 .first())
        if clash is not None:
            raise HTTPException(status_code=409, detail=(
                "This email belonged to a deleted account. Restore that account instead."
                if clash.deleted_at is not None else "An account with this email already exists"))

    old_otp_email = target.otp_email
    diffs = {}
    for key, value in changes.items():
        attr = _PROFILE_ATTRS[key]
        current = getattr(target, attr)
        if current != value:
            diffs[key] = {"from": current, "to": value}
            setattr(target, attr, value)
    if not diffs:
        return detail_out(db, target, _now())

    contact_changed = "email" in diffs or "otpEmail" in diffs
    db.commit()
    if contact_changed:
        core.end_all_sessions(db, target, core.REVOKE_ADMIN)  # they must sign in again with the new details
        what = "login email" if "email" in diffs else "2FA email"
        new_value = target.email if "email" in diffs else target.otp_email
        subject, html = email_service.staff_contact_changed_email(target.full_name, what, new_value, actor.email)
        background.add_task(email_service.send_email, old_otp_email, subject, html)

    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.update_profile", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} edited {target.email}: " + ", ".join(sorted(diffs)),
        details={"changes": diffs, "signedOut": contact_changed})
    return detail_out(db, target, _now())


# ------------------------------------------------------------------ unlock
@router.post("/{user_id}/unlock", response_model=StaffDetailOut, summary="Lift a sign-in lockout")
def unlock(user_id: str, request: Request, actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id)
    now = _now()
    was_locked = bool(target.locked_until and target.locked_until > now)
    failures = target.failed_logins
    target.locked_until = None
    target.failed_logins = 0
    db.commit()
    if was_locked or failures:
        audit.record_audit(
            db, category=audit.CAT_STAFF, action="staff.unlock", actor=actor, request=request,
            target_type="staff_user", target_id=target.id,
            summary=f"{actor.email} unlocked {target.email}",
            details={"wasLocked": was_locked, "failedAttemptsCleared": failures})
    return detail_out(db, target, now)


# ------------------------------------------------------------------ force logout
@router.post("/{user_id}/force-logout", response_model=ActionOut, summary="End every session of this user now")
def force_logout(user_id: str, request: Request, actor: StaffUser = Depends(admin_only),
                 db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id)
    _not_self(actor, target, "force-logout")
    revoked = core.end_all_sessions(db, target, core.REVOKE_ADMIN)
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.force_logout", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} signed {target.email} out of {revoked} session(s)",
        details={"sessionsEnded": revoked})
    return ActionOut(message=f"{target.full_name} was signed out everywhere.", revokedSessions=revoked)


# ------------------------------------------------------------------ resend credentials
@router.post("/{user_id}/resend-credentials", response_model=StaffCredentialsOut,
             summary="Send a fresh temporary password to someone who never finished signing up")
def resend_credentials(user_id: str, background: BackgroundTasks, request: Request,
                       actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id)
    _not_self(actor, target, "resend credentials to")
    if not target.is_active:
        raise HTTPException(status_code=409, detail="This account is disabled. Activate it first.")
    if not target.must_change_password:
        raise HTTPException(status_code=409, detail="This person already chose their own password. "
                                                    "If they are locked out, use Reset password.")
    temp_password = generate_temp_password()
    target.password_hash = hash_password(temp_password)
    target.password_changed_at = utcnow()
    target.failed_logins = 0
    target.locked_until = None
    db.commit()
    core.end_all_sessions(db, target, core.REVOKE_ADMIN)  # the old temporary password no longer works anywhere
    emailed = core.queue_credentials_email(background, target, temp_password, is_reset=False)
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.resend_credentials", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} re-sent the sign-in credentials of {target.email}",
        details={"credentialsEmailed": emailed})
    return StaffCredentialsOut(user=core.user_out(target), temporaryPassword=temp_password, emailed=emailed)


# ------------------------------------------------------------------ delete / restore
@router.delete("/{user_id}", response_model=ActionOut, summary="Delete an account (soft delete)")
def delete_staff(user_id: str, request: Request, actor: StaffUser = Depends(admin_only),
                 db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id)
    _not_self(actor, target, "delete")
    if staff_admin.is_active_admin(target):
        staff_admin.ensure_another_active_admin(db, target)

    target.is_active = False
    target.deleted_at = utcnow()
    db.commit()
    revoked = core.end_all_sessions(db, target, core.REVOKE_ADMIN)
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.delete", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} deleted the {target.role} account {target.email}",
        details={"email": target.email, "role": target.role, "sessionsEnded": revoked})
    return ActionOut(message=f"{target.full_name}'s account was deleted. It can be restored.", revokedSessions=revoked)


@router.post("/{user_id}/restore", response_model=StaffDetailOut, summary="Restore a deleted account")
def restore_staff(user_id: str, request: Request, actor: StaffUser = Depends(admin_only),
                  db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id, allow_deleted=True)
    if target.deleted_at is None:
        raise HTTPException(status_code=409, detail="This account is not deleted")
    target.deleted_at = None
    target.is_active = False          # coming back disabled: the admin decides when they may sign in again
    target.must_change_password = True
    db.commit()
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.restore", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} restored the account {target.email} (disabled until activated)",
        details={"email": target.email, "role": target.role})
    return detail_out(db, target, _now())
