"""
System Admin API: platform settings, one endpoint pair per group so each screen section loads and saves on its own.

    GET   /admin/settings                      every group at once (read-only overview)
    GET   /admin/settings/proctoring           PATCH  violation limits, camera / mic / AI detection toggles
    GET   /admin/settings/assessment           PATCH  OTP method, default invite lifetime, section revisit
    GET   /admin/settings/security             PATCH  OTP + lockout + session lifetimes, password length
    GET   /admin/settings/email                PATCH  SMTP host / port / sender / password (write-only)
    GET   /admin/settings/general              PATCH  platform name, support contact
    DELETE /admin/settings/email/password      forget the saved SMTP password (the .env fallback applies again)
    POST  /admin/settings/email/test           send a test email through the saved gateway

PATCH accepts any subset of the group's fields. Unknown fields, wrong types and out-of-range values are rejected,
every effective change is written to the audit trail, and the new values apply immediately.
The SMTP password is stored encrypted and is never returned by any endpoint.
"""
import time
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import require_portal
from app.api.settings_models import (OUT_MODELS, UPDATE_MODELS, AllSettingsOut, EmailTestOut, EmailTestRequest,
                                     SettingsSchemaOut, build_schema)
from app.core.default_settings import GROUP_EMAIL, GROUPS
from app.core.roles import PORTAL_ADMIN
from app.db.session import get_db
from app.models.auth import StaffUser
from app.services import audit
from app.services import email as email_service
from app.services import runtime_settings as rt
from app.services import settings_store as store
from app.services.auth_core import mask_email

router = APIRouter(prefix="/admin/settings", tags=["System Admin - settings"])
admin_only = require_portal(PORTAL_ADMIN)

EMAIL_TEST_COOLDOWN_SECONDS = 10.0
_last_email_test: Dict[str, float] = {}


@router.get("", response_model=AllSettingsOut, summary="All settings groups")
def get_all_settings(_: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    return {group: store.group_for_admin(db, group) for group in GROUPS}


@router.get("/schema", response_model=SettingsSchemaOut,
            summary="Every setting with its type, range and help text (the Admin UI builds its forms from this)")
def settings_schema(_: StaffUser = Depends(admin_only)):
    return build_schema()


def _register_group(group: str) -> None:
    update_model = UPDATE_MODELS[group]
    out_model = OUT_MODELS[group]

    @router.get(f"/{group}", response_model=out_model, name=f"get_{group}_settings",
                summary=f"Read the {group} settings")
    def read(_: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
        return store.group_for_admin(db, group)

    @router.patch(f"/{group}", response_model=out_model, name=f"update_{group}_settings",
                  summary=f"Change some of the {group} settings")
    def update(body: update_model, request: Request,  # type: ignore[valid-type]
               actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
        changes = body.model_dump(exclude_unset=True)
        diffs = store.update_group(db, group, changes, actor) if changes else {}
        if diffs:
            audit.record_audit(
                db, category=audit.CAT_SETTINGS, action="settings.update", actor=actor, request=request,
                target_type="settings_group", target_id=group,
                summary=f"{actor.email} changed {group} settings: {store.describe(diffs)}",
                details={"group": group, "changes": diffs})
        return store.group_for_admin(db, group)


for _group in GROUPS:
    _register_group(_group)


# ------------------------------------------------------------------ email gateway extras
@router.delete("/email/password", response_model=OUT_MODELS[GROUP_EMAIL], summary="Forget the saved SMTP password")
def clear_smtp_password(request: Request, actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    if store.clear_secret(db, store.SECRET_KEY_NAME, actor):
        audit.record_audit(
            db, category=audit.CAT_SETTINGS, action="settings.email_password_cleared", actor=actor,
            request=request, target_type="settings_group", target_id=GROUP_EMAIL,
            summary=f"{actor.email} removed the saved SMTP password")
    return store.group_for_admin(db, GROUP_EMAIL)


@router.post("/email/test", response_model=EmailTestOut, summary="Send a test email through the saved gateway")
def send_test_email(req: EmailTestRequest, request: Request,
                    actor: StaffUser = Depends(admin_only), db: Session = Depends(get_db)):
    recipient = (req.to or actor.otp_email or "").strip().lower()
    if not store.is_valid_email(recipient):
        raise HTTPException(status_code=422, detail="Enter a valid recipient email address")

    now = time.monotonic()
    wait = EMAIL_TEST_COOLDOWN_SECONDS - (now - _last_email_test.get(actor.id, -1e9))
    if wait > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {int(wait) + 1}s before sending another test email")
    _last_email_test[actor.id] = now

    cfg = rt.email_config()
    platform = rt.get_str("platformName") or "ConferEd Talent Assess"
    test_subject, test_body = email_service.test_email(platform, cfg.host, cfg.port)
    ok, message = email_service.send_email_detailed(
        recipient, test_subject, test_body)

    audit.record_audit(
        db, category=audit.CAT_SETTINGS, action="settings.email_test", actor=actor, request=request, success=ok,
        summary=f"{actor.email} sent a test email to {mask_email(recipient)}" + ("" if ok else f" - failed: {message}"),
        details={"host": cfg.host, "port": cfg.port, "sender": cfg.sender_email, "passwordSource": cfg.password_source})
    return EmailTestOut(ok=ok, message=message, sentTo=mask_email(recipient), host=cfg.host, port=cfg.port,
                        sender=cfg.sender_email, passwordSource=cfg.password_source)
