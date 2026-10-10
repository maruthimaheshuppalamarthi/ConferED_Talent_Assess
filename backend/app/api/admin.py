"""
System Admin API: staff accounts - the core lifecycle.

    GET   /admin/staff                       the full list of accounts that are not deleted
    POST  /admin/staff                       create an account (temporary password, emailed + returned once)
    PATCH /admin/staff/{id}                  change role / activate / deactivate
    POST  /admin/staff/{id}/reset-password   issue a new temporary password

More staff endpoints, each in its own module:
    admin_staff_directory.py   search / filter / paginate, account detail
    admin_staff_actions.py     edit profile, unlock, force-logout, resend credentials, delete, restore
    admin_staff_sessions.py    list and end sign-in sessions

Every staff member gets their account here - there is no self-service registration or reset.
Every change is written to the audit trail (see app/services/audit.py).
"""
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.schemas import StaffCreateRequest, StaffCredentialsOut, StaffUpdateRequest, UserOut
from app.core.roles import PORTAL_ADMIN, ROLE_SYSTEM_ADMIN, STAFF_ROLES
from app.core.security import generate_temp_password, hash_password
from app.db.session import get_db
from app.models.auth import StaffUser, utcnow
from app.services import audit, staff_admin
from app.services import auth_core as core

router = APIRouter(prefix="/admin/staff", tags=["System Admin - staff accounts"])


def _check_role(role: str) -> None:
    if role not in STAFF_ROLES:
        raise HTTPException(status_code=422, detail=f"Role must be one of {STAFF_ROLES}")


@router.get("", response_model=List[UserOut])
def list_staff(_: StaffUser = Depends(require_portal(PORTAL_ADMIN)), db: Session = Depends(get_db)):
    rows = db.query(StaffUser).filter(StaffUser.deleted_at.is_(None)).order_by(StaffUser.created_at.desc()).all()
    return [core.user_out(u) for u in rows]


@router.post("", response_model=StaffCredentialsOut, status_code=201)
def create_staff(req: StaffCreateRequest, background: BackgroundTasks, request: Request,
                 actor: StaffUser = Depends(require_portal(PORTAL_ADMIN)), db: Session = Depends(get_db)):
    _check_role(req.role)
    profile = staff_admin.clean_profile({k: v for k, v in (("phone", req.phone), ("department", req.department),
                                                           ("otpEmail", req.otpEmail)) if v is not None})
    temp_password = req.password or generate_temp_password()
    user = core.create_staff_user(db, req.name, req.email, temp_password, req.role, must_change_password=True,
                                  phone=profile.get("phone"), department=profile.get("department"),
                                  otp_email=profile.get("otpEmail"))
    user.created_by = actor.id
    user.password_changed_at = utcnow()
    db.commit()
    emailed = core.queue_credentials_email(background, user, temp_password, is_reset=False)
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.create", actor=actor, request=request,
        target_type="staff_user", target_id=user.id,
        summary=f"{actor.email} created the {user.role} account {user.email}",
        details={"email": user.email, "name": user.full_name, "role": user.role,
                 "department": user.department, "adminChoseCredentials": bool(req.password),
                 "credentialsEmailed": emailed})
    return StaffCredentialsOut(user=core.user_out(user), temporaryPassword=temp_password, emailed=emailed)


@router.patch("/{user_id}", response_model=UserOut)
def update_staff(user_id: str, req: StaffUpdateRequest, request: Request,
                 actor: StaffUser = Depends(require_portal(PORTAL_ADMIN)), db: Session = Depends(get_db)):
    target = staff_admin.get_target(db, user_id)
    if target.id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role or status")

    old_role, old_active = target.role, target.is_active
    if req.role is not None:
        _check_role(req.role)
    new_role = req.role if req.role is not None else target.role
    new_active = req.isActive if req.isActive is not None else target.is_active

    # Never leave the platform without an active System Admin.
    if staff_admin.is_active_admin(target) and (new_role != ROLE_SYSTEM_ADMIN or not new_active):
        staff_admin.ensure_another_active_admin(db, target)

    target.role, target.is_active = new_role, new_active
    db.commit()
    if target.role != old_role or not target.is_active:
        core.end_all_sessions(db, target, core.REVOKE_ADMIN)  # sign in again under the new role / not at all

    if target.role != old_role:
        audit.record_audit(
            db, category=audit.CAT_STAFF, action="staff.role_change", actor=actor, request=request,
            target_type="staff_user", target_id=target.id,
            summary=f"{actor.email} changed the role of {target.email} from {old_role} to {target.role}",
            details={"email": target.email, "from": old_role, "to": target.role})
    if target.is_active != old_active:
        audit.record_audit(
            db, category=audit.CAT_STAFF,
            action="staff.activate" if target.is_active else "staff.deactivate",
            actor=actor, request=request, target_type="staff_user", target_id=target.id,
            summary=f"{actor.email} {'re-activated' if target.is_active else 'deactivated'} {target.email}",
            details={"email": target.email, "role": target.role})
    return core.user_out(target)


@router.post("/{user_id}/reset-password", response_model=StaffCredentialsOut)
def reset_staff_password(user_id: str, background: BackgroundTasks, request: Request,
                         actor: StaffUser = Depends(require_portal(PORTAL_ADMIN)), db: Session = Depends(get_db)):
    """New temporary password; the user must replace it at next sign-in and is signed out everywhere now."""
    target = staff_admin.get_target(db, user_id)
    if target.id == actor.id:
        raise HTTPException(status_code=400, detail="Change your own password from the account menu instead")

    temp_password = generate_temp_password()
    target.password_hash = hash_password(temp_password)
    target.must_change_password = True
    target.password_changed_at = utcnow()
    target.failed_logins = 0
    target.locked_until = None
    db.commit()
    core.end_all_sessions(db, target, core.REVOKE_PASSWORD)

    emailed = core.queue_credentials_email(background, target, temp_password, is_reset=True)
    audit.record_audit(
        db, category=audit.CAT_STAFF, action="staff.reset_password", actor=actor, request=request,
        target_type="staff_user", target_id=target.id,
        summary=f"{actor.email} reset the password of {target.email}",
        details={"email": target.email, "credentialsEmailed": emailed})
    return StaffCredentialsOut(user=core.user_out(target), temporaryPassword=temp_password, emailed=emailed)
