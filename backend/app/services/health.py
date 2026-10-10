"""
System health for the Admin dashboard (and the public liveness / readiness probes).

Every check returns {"name", "status": ok|warning|error, "message", "details"}. Nothing here ever returns a
secret value: the security-posture check only says *that* a default is in use, not what it is.
"""
import os
import platform
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core import crypto
from app.core.config import KNOWN_LEAKED_SECRET_KEYS, MIN_SECRET_KEY_LENGTH, settings
from app.core.password_policy import is_weak_for_admin
from app.core.default_settings import DEFAULT_SETTINGS
from app.core.security import verify_password
from app.db.session import engine
from app.models.auth import StaffUser, SystemSetting
from app.services import bootstrap
from app.services.bootstrap import LEGACY_DEFAULT_ADMIN_PASSWORDS
from app.services import runtime_settings as rt

STARTED_AT = datetime.now(timezone.utc)
_STARTED_MONOTONIC = time.monotonic()

OK, WARNING, ERROR = "ok", "warning", "error"


def _check(name: str, status: str, message: str, **details: Any) -> Dict[str, Any]:
    return {"name": name, "status": status, "message": message, "details": details}


# ------------------------------------------------------------------ individual checks
def ping_database() -> Dict[str, Any]:
    started = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        return _check("database", ERROR, "The database cannot be reached.", error=type(exc).__name__)
    ms = round((time.perf_counter() - started) * 1000, 1)
    # a slow round trip is the first sign of trouble with a hosted database
    status = OK if ms < 1000 else WARNING
    return _check("database", status, f"Reachable ({ms} ms)" if status == OK else f"Slow response ({ms} ms)",
                  engine=engine.dialect.name, latencyMs=ms)


def check_migrations() -> Dict[str, Any]:
    try:
        current, expected = bootstrap.schema_revisions()
    except Exception as exc:
        return _check("migrations", ERROR, "Could not read the database schema version.", error=type(exc).__name__)
    if current == expected:
        return _check("migrations", OK, f"Schema is up to date ({current})", current=current, expected=expected)
    return _check("migrations", ERROR, "The database schema is out of date. Run: alembic upgrade head",
                  current=current, expected=expected)


def check_settings(db: Session) -> Dict[str, Any]:
    stored = {key for (key,) in db.query(SystemSetting.key).all()}
    missing = sorted({s["key"] for s in DEFAULT_SETTINGS} - stored)
    if not missing:
        return _check("settings", OK, f"{len(stored)} settings stored", count=len(stored))
    return _check("settings", WARNING, "Some settings are missing and are using their defaults.", missing=missing)


def check_email_gateway() -> Dict[str, Any]:
    cfg = rt.email_config()
    details = {"host": cfg.host, "port": cfg.port, "sender": cfg.sender_email,
               "passwordSource": cfg.password_source}
    if not cfg.sender_email or cfg.password_source == "none":
        return _check("emailGateway", WARNING,
                      "Email is not configured: staff passcodes and candidate invitations cannot be delivered.",
                      **details)
    return _check("emailGateway", OK, f"Configured ({cfg.host}:{cfg.port}). Use 'Check connection' to verify it.",
                  **details)


def check_encryption(db: Session) -> Dict[str, Any]:
    row = db.get(SystemSetting, "smtpPassword")
    if row is not None and row.value and crypto.decrypt_secret(row.value) is None:
        return _check("encryption", ERROR,
                      "The saved SMTP password cannot be decrypted (the encryption key changed). Enter it again.")
    dedicated = bool((settings.SETTINGS_ENCRYPTION_KEY or "").strip())
    if dedicated:
        return _check("encryption", OK, "Secrets are encrypted with a dedicated key.", dedicatedKey=True)
    return _check("encryption", OK, "Secrets are encrypted with a key derived from SECRET_KEY.", dedicatedKey=False)


def security_findings(db: Session) -> List[Dict[str, str]]:
    """Things that are fine for development but must be fixed before going live."""
    findings: List[Dict[str, str]] = []

    def add(finding_id: str, message: str) -> None:
        findings.append({"id": finding_id, "message": message})

    if "SECRET_KEY" not in os.environ:
        add("default-secret-key", "SECRET_KEY is not set: tokens are signed with an auto-generated local development key.")
    if settings.SECRET_KEY in KNOWN_LEAKED_SECRET_KEYS:
        add("leaked-secret-key", "SECRET_KEY is a key that was published in the source code. Anyone can forge tokens: replace it.")
    elif len(settings.SECRET_KEY) < MIN_SECRET_KEY_LENGTH:
        add("weak-secret-key", f"SECRET_KEY is shorter than {MIN_SECRET_KEY_LENGTH} characters.")
    if settings.DEV_EXPOSE_OTP:
        add("dev-otp-exposed", "DEV_EXPOSE_OTP is on: one-time passcodes are returned in API responses.")
    if not settings.COOKIE_SECURE:
        add("insecure-cookies", "COOKIE_SECURE is off: the session cookie is also sent over plain HTTP.")
    if not (settings.SETTINGS_ENCRYPTION_KEY or "").strip():
        add("derived-encryption-key", "SETTINGS_ENCRYPTION_KEY is not set (a key is derived from SECRET_KEY).")

    seed = db.query(StaffUser).filter(StaffUser.email == settings.SEED_ADMIN_EMAIL.strip().lower()).first()
    known_weak = [p for p in (settings.SEED_ADMIN_PASSWORD, *LEGACY_DEFAULT_ADMIN_PASSWORDS) if p and is_weak_for_admin(p)]
    if seed is not None and seed.is_active and any(verify_password(p, seed.password_hash) for p in known_weak):
        add("default-admin-password", f"The built-in admin account ({seed.email}) still has a known-weak password.")
    return findings


def check_security_posture(db: Session) -> Dict[str, Any]:
    findings = security_findings(db)
    if not findings:
        return _check("securityPosture", OK, "No unsafe defaults detected.", findings=[])
    return _check("securityPosture", WARNING,
                  f"{len(findings)} item(s) to fix before going live.", findings=findings)


# ------------------------------------------------------------------ report
def uptime_seconds() -> int:
    return int(time.monotonic() - _STARTED_MONOTONIC)


def overall_status(components: List[Dict[str, Any]]) -> str:
    statuses = {c["status"] for c in components}
    if ERROR in statuses:
        return "unhealthy"
    if WARNING in statuses:
        return "degraded"
    return "healthy"


def build_report(db: Session) -> Dict[str, Any]:
    components = [ping_database()]
    if components[0]["status"] != ERROR:  # the other checks all need the database
        components += [check_migrations(), check_settings(db), check_email_gateway(),
                       check_encryption(db), check_security_posture(db)]
    return {
        "status": overall_status(components),
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "startedAt": STARTED_AT.isoformat(),
        "uptimeSeconds": uptime_seconds(),
        "version": "5.0.0",
        "environment": settings.APP_ENV,
        "python": platform.python_version(),
        "components": components,
    }
