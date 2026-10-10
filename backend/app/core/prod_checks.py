"""
Startup safety check.

With APP_ENV=production the server REFUSES TO START while any of these is unsafe (a clear list is printed):
a missing / weak / leaked signing key, OTPs returned in API responses, cookies without the Secure flag, plain-HTTP or
localhost CORS / frontend URLs, a SQLite database, or a weak seeded-admin password.
In other environments the same problems are only logged as a short summary (the dashboard health report shows them too).
"""
import logging
from typing import Any, List, Tuple
from urllib.parse import urlparse

from app.core.config import KNOWN_LEAKED_SECRET_KEYS, MIN_SECRET_KEY_LENGTH, settings
from app.core.password_policy import is_weak_for_admin

logger = logging.getLogger("nexus.config")

_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}


def _bad_origin(origin: str) -> str:
    if origin.strip() == "*":
        return "a wildcard (*)"
    parsed = urlparse(origin)
    if parsed.scheme != "https":
        return "not https"
    if (parsed.hostname or "") in _LOCAL_HOSTS:
        return "a localhost address"
    return ""


def config_problems(s: Any = settings) -> Tuple[List[str], List[str]]:
    """Returns (errors, warnings). Errors block a production start; warnings never do."""
    errors: List[str] = []
    warnings: List[str] = []

    key = s.SECRET_KEY or ""
    if not key:
        errors.append("SECRET_KEY is not set. Generate one:  python -c \"import secrets; print(secrets.token_urlsafe(48))\"")
    elif key in KNOWN_LEAKED_SECRET_KEYS:
        errors.append("SECRET_KEY is a key that was published in the source code. Generate a new one.")
    elif len(key) < MIN_SECRET_KEY_LENGTH:
        errors.append(f"SECRET_KEY is too short ({len(key)} characters); use at least {MIN_SECRET_KEY_LENGTH}.")

    if s.DEV_EXPOSE_OTP:
        errors.append("DEV_EXPOSE_OTP must be false: it returns one-time passcodes in API responses.")
    if not s.COOKIE_SECURE:
        errors.append("COOKIE_SECURE must be true (the session cookie must only travel over HTTPS).")
    if (s.COOKIE_SAMESITE or "").lower() == "none" and not s.COOKIE_SECURE:
        errors.append("COOKIE_SAMESITE=none requires COOKIE_SECURE=true.")
    for origin in s.CORS_ORIGINS:
        why = _bad_origin(origin)
        if why:
            errors.append(f"CORS_ORIGINS contains '{origin}', which is {why}.")
    if not s.CORS_ORIGINS:
        errors.append("CORS_ORIGINS is empty: the browser app could not call this API.")
    front = _bad_origin(s.FRONTEND_URL)
    if front:
        errors.append(f"FRONTEND_URL ('{s.FRONTEND_URL}') is {front}; invitation links would be unsafe.")
    if s.AUTH_DATABASE_URL.startswith("sqlite"):
        errors.append("AUTH_DATABASE_URL points at SQLite; use the Postgres (Supabase) database.")
    if s.SEED_ADMIN_PASSWORD and is_weak_for_admin(s.SEED_ADMIN_PASSWORD):
        errors.append("SEED_ADMIN_PASSWORD is weak. Leave it empty to get a random one, or use 12+ unusual characters.")

    if not (s.SETTINGS_ENCRYPTION_KEY or "").strip():
        warnings.append("SETTINGS_ENCRYPTION_KEY is not set: stored secrets are encrypted with a key derived from SECRET_KEY.")
    if not s.ALLOWED_HOSTS:
        warnings.append("ALLOWED_HOSTS is empty: the API answers to any Host header.")
    if not s.TRUST_PROXY:
        warnings.append("TRUST_PROXY is off: behind a reverse proxy every client will look like the proxy's IP "
                        "(audit logs and rate limits). Turn it on only if a proxy you control sets X-Forwarded-For.")
    if s.ENABLE_DOCS:
        warnings.append("The interactive API docs (/docs) are enabled.")
    return errors, warnings


def enforce_startup_checks(s: Any = settings) -> None:
    """Called once at startup. Raises RuntimeError in production when anything unsafe is configured."""
    errors, warnings = config_problems(s)
    if s.IS_PRODUCTION:
        for warning in warnings:
            logger.warning("Configuration warning: %s", warning)
        if errors:
            raise RuntimeError(
                "Refusing to start in production with unsafe configuration:\n  - " + "\n  - ".join(errors))
        logger.info("Production configuration checks passed")
        return
    if errors:
        logger.warning("Development mode: %d setting(s) would block a production start (see System Admin > Health).",
                       len(errors))
