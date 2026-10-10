"""
Reading and writing the System-Admin settings in the database (used by the admin settings API).

Reads here go straight to the database (an admin always sees the truth); the rest of the backend reads
through ``runtime_settings`` (cached). Every write is validated, stored, and clears that cache.
"""
import re
from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core import crypto
from app.core.config import settings as env
from app.core.default_settings import (FMT_EMAIL, FMT_HOSTNAME, FMT_TEXT, GROUP_EMAIL, GROUP_PROCTORING,
                                       GROUP_SECURITY, SETTINGS_BY_GROUP, SETTINGS_BY_KEY)
from app.models.auth import StaffUser, SystemSetting
from app.services import runtime_settings as rt

SECRET_KEY_NAME = "smtpPassword"
_EMAIL_RE = re.compile(r"^[^@\s<>\"',;]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$")
_HOST_RE = re.compile(r"^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$")
_BAD_TEXT_CHARS = re.compile(r"[\x00-\x1f\x7f<>\"]")


def _invalid(message: str) -> HTTPException:
    return HTTPException(status_code=422, detail=message)


def is_valid_email(value: str) -> bool:
    return bool(_EMAIL_RE.match(value or "")) and len(value) <= 254


# ------------------------------------------------------------------ validation
def clean_value(spec: Dict[str, Any], value: Any) -> Any:
    """Normalise and validate one value that already passed type / range checks. Raises 422."""
    if spec["type"] != "string":
        return value
    label = spec["key"]
    text = value.strip() if not spec["secret"] else value  # never alter a password
    if not text:
        if spec["allow_empty"]:
            return ""
        raise _invalid(f"{label} must not be empty")
    if spec["secret"]:
        if any(ord(c) < 0x20 for c in text):
            raise _invalid(f"{label} contains invalid characters")
        return text
    if spec["fmt"] == FMT_EMAIL and not is_valid_email(text):
        raise _invalid(f"{label} must be a valid email address")
    if spec["fmt"] == FMT_HOSTNAME and not _HOST_RE.match(text):
        raise _invalid(f"{label} must be a valid host name such as smtp.gmail.com")
    if spec["fmt"] == FMT_TEXT and _BAD_TEXT_CHARS.search(text):
        raise _invalid(f"{label} contains characters that are not allowed")
    return text


def _cross_check(group: str, merged: Dict[str, Any]) -> None:
    """Rules that involve more than one value, checked on the values as they will be after the change."""
    if group == GROUP_PROCTORING:
        if merged["maxViolationsBeforeTerminate"] < merged["maxTabSwitches"]:
            raise _invalid(
                f"maxViolationsBeforeTerminate ({merged['maxViolationsBeforeTerminate']}) cannot be lower than "
                f"maxTabSwitches ({merged['maxTabSwitches']}): the tab-switch warnings would never be reached")
    if group == GROUP_SECURITY:
        if merged["otpResendCooldownSeconds"] >= merged["otpExpireMinutes"] * 60:
            raise _invalid("otpResendCooldownSeconds must be shorter than the passcode lifetime (otpExpireMinutes)")


# ------------------------------------------------------------------ reading
def _rows(db: Session, group: str) -> Dict[str, SystemSetting]:
    return {r.key: r for r in db.query(SystemSetting).filter(SystemSetting.group == group).all()}


def read_group(db: Session, group: str) -> Dict[str, Any]:
    """Non-secret values of a group exactly as stored (catalogue default when a row is missing)."""
    rows = _rows(db, group)
    values: Dict[str, Any] = {}
    for spec in SETTINGS_BY_GROUP[group]:
        if spec["secret"]:
            continue
        row = rows.get(spec["key"])
        values[spec["key"]] = spec["default"] if row is None or row.value is None else row.value
    return values


def email_password_status(db: Session) -> Dict[str, Any]:
    row = db.get(SystemSetting, SECRET_KEY_NAME)
    if row is not None and crypto.decrypt_secret(row.value):
        return {"smtpPasswordSet": True, "smtpPasswordSource": "database"}
    if env.GMAIL_APP_PASSWORD:
        return {"smtpPasswordSet": True, "smtpPasswordSource": "environment"}
    return {"smtpPasswordSet": False, "smtpPasswordSource": "none"}


def group_for_admin(db: Session, group: str) -> Dict[str, Any]:
    values = read_group(db, group)
    if group == GROUP_EMAIL:
        values.update(email_password_status(db))
    return values


# ------------------------------------------------------------------ writing
def update_group(db: Session, group: str, changes: Dict[str, Any], actor: StaffUser) -> Dict[str, Dict[str, Any]]:
    """
    Validate and store a partial update of one group. Returns {key: {"from": old, "to": new}} for the values
    that really changed (secrets: {"changed": True}). Nothing is written when nothing changed.
    """
    specs = {s["key"]: s for s in SETTINGS_BY_GROUP[group]}
    cleaned = {key: clean_value(specs[key], value) for key, value in changes.items()}

    rows = _rows(db, group)
    merged = read_group(db, group)
    merged.update({k: v for k, v in cleaned.items() if not specs[k]["secret"]})
    _cross_check(group, merged)

    diffs: Dict[str, Dict[str, Any]] = {}
    for key, new in cleaned.items():
        spec = specs[key]
        row = rows.get(key)
        if row is None:  # a key added to the catalogue after the table was seeded
            row = SystemSetting(key=key, group=group, value=None, value_type=spec["type"],
                                is_secret=spec["secret"], description=spec["description"])
            db.add(row)
        if spec["secret"]:
            if crypto.decrypt_secret(row.value) == new:
                continue
            row.value = crypto.encrypt_secret(new)
            diffs[key] = {"changed": True}
        else:
            old = spec["default"] if row.value is None else row.value
            if old == new and row.value is not None:
                continue
            row.value = new
            diffs[key] = {"from": old, "to": new}
        row.updated_by = actor.id

    if diffs:
        db.commit()
        rt.invalidate()
    else:
        db.rollback()
    return diffs


def clear_secret(db: Session, key: str, actor: StaffUser) -> bool:
    """Remove a stored secret (the .env fallback applies again). Returns True if something was removed."""
    row = db.get(SystemSetting, key)
    if row is None or not SETTINGS_BY_KEY[key]["secret"] or row.value is None:
        return False
    row.value = None
    row.updated_by = actor.id
    db.commit()
    rt.invalidate()
    return True


def describe(diffs: Dict[str, Dict[str, Any]]) -> str:
    """One readable line for the audit summary."""
    parts = []
    for key, change in diffs.items():
        parts.append(f"{key} changed" if change.get("changed") else f"{key}: {change['from']} -> {change['to']}")
    return "; ".join(parts)
