"""
Runtime access to the System-Admin settings stored in ``system_settings``.

Every part of the backend that used to read a fixed constant (OTP lifetime, lockout rules, token lifetimes,
SMTP gateway, ...) now asks this module. Values are cached in memory for ``CACHE_SECONDS`` and the cache is
cleared immediately when the settings API saves a change in this process, so an admin's change applies
at once here and within ``CACHE_SECONDS`` on any other server process.

If the database cannot be read, the last known values (or the catalogue defaults) are used, so a database
hiccup never takes sign-in down.
"""
import logging
import threading
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

from app.core import crypto
from app.core.config import settings as env
from app.core.default_settings import SETTINGS_BY_GROUP, SETTINGS_BY_KEY
from app.db.session import SessionLocal
from app.models.auth import SystemSetting

logger = logging.getLogger("nexus.settings")

CACHE_SECONDS = 15.0
_RETRY_AFTER_FAILURE = 5.0

_lock = threading.Lock()
_raw: Optional[Dict[str, Any]] = None
_loaded_at = 0.0


def _fetch() -> Dict[str, Any]:
    with SessionLocal() as db:
        return {row.key: row.value for row in db.query(SystemSetting).all()}


def _snapshot() -> Dict[str, Any]:
    global _raw, _loaded_at
    if _raw is not None and time.monotonic() - _loaded_at <= CACHE_SECONDS:
        return _raw
    # Fetch outside the lock. Holding it across a slow database call made every
    # other sign-in wait behind that one query.
    try:
        fetched = _fetch()
    except Exception:
        logger.exception("Could not read system settings; using the last known values")
        with _lock:
            if _raw is None:
                _raw = {}
            _loaded_at = time.monotonic() - CACHE_SECONDS + _RETRY_AFTER_FAILURE
            return dict(_raw)
    with _lock:
        _raw = fetched
        _loaded_at = time.monotonic()
        return dict(_raw)


def invalidate() -> None:
    """Forget the cache (called after the settings API writes)."""
    global _raw
    with _lock:
        _raw = None


# ------------------------------------------------------------------ typed getters
def get(key: str) -> Any:
    """Current value of a setting: the stored one, else the catalogue default. Secrets are decrypted."""
    spec = SETTINGS_BY_KEY[key]
    value = _snapshot().get(key)
    if spec["secret"]:
        return crypto.decrypt_secret(value) if value else None
    return spec["default"] if value is None else value


def get_int(key: str) -> int:
    try:
        return int(get(key))
    except (TypeError, ValueError):
        return int(SETTINGS_BY_KEY[key]["default"])


def get_bool(key: str) -> bool:
    value = get(key)
    return value if isinstance(value, bool) else bool(SETTINGS_BY_KEY[key]["default"])


def get_str(key: str) -> str:
    value = get(key)
    return value if isinstance(value, str) else str(SETTINGS_BY_KEY[key]["default"] or "")


def has_secret(key: str) -> bool:
    return get(key) is not None


def group_values(group: str) -> Dict[str, Any]:
    """All non-secret values of a group, ready to return to a client."""
    return {s["key"]: get(s["key"]) for s in SETTINGS_BY_GROUP[group] if not s["secret"]}


# ------------------------------------------------------------------ email gateway
@dataclass(frozen=True)
class EmailConfig:
    host: str
    port: int
    sender_email: str
    sender_name: str
    password: str
    password_source: str  # "database" | "environment" | "none"


def email_config() -> EmailConfig:
    """SMTP settings: the admin's saved values, falling back to the .env bootstrap values."""
    stored_password = get("smtpPassword")
    if stored_password:
        password, source = stored_password, "database"
    elif env.GMAIL_APP_PASSWORD:
        password, source = env.GMAIL_APP_PASSWORD, "environment"
    else:
        password, source = "", "none"
    return EmailConfig(
        host=get_str("smtpHost") or env.SMTP_HOST,
        port=get_int("smtpPort") or env.SMTP_PORT,
        sender_email=get_str("senderEmail") or env.GMAIL_SENDER_EMAIL,
        sender_name=get_str("senderName") or "NexusAssess",
        password=password,
        password_source=source,
    )
