import os
import secrets
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load backend/.env (then repo-root .env as a fallback). Real environment variables win.
_BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(_BACKEND_DIR / ".env")
load_dotenv(_BACKEND_DIR.parent / ".env")


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


def _list(name: str, default: str = "") -> List[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


# APP_ENV: development (default) | test | production.  Production refuses to start on unsafe settings
# (see app/core/prod_checks.py) and switches off the API docs.
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"

# Signing keys that were once hardcoded in this repository (and are therefore public). Never accepted.
KNOWN_LEAKED_SECRET_KEYS = {"nexus_assess_enterprise_super_secret_jwt_key_2026"}
MIN_SECRET_KEY_LENGTH = 32
DEV_SECRET_FILE = _BACKEND_DIR / ".dev_secret_key"


def load_secret_key(dev_file: Path = DEV_SECRET_FILE, environ=os.environ, production: bool = IS_PRODUCTION) -> str:
    """
    The JWT signing key. It comes from SECRET_KEY. Nothing is hardcoded:
      * development: if SECRET_KEY is not set, a random key is generated once and kept in an ignored local file,
        so sessions survive server reloads;
      * production: a missing key is returned as '' and the startup check refuses to run.
    """
    configured = (environ.get("SECRET_KEY") or "").strip()
    if configured or production:
        return configured
    try:
        if dev_file.exists():
            stored = dev_file.read_text(encoding="utf-8").strip()
            if stored:
                return stored
        generated = secrets.token_urlsafe(48)
        dev_file.write_text(generated, encoding="utf-8")
        return generated
    except OSError:  # read-only file system: a per-process key still works, sessions just do not survive restarts
        return secrets.token_urlsafe(48)


class Settings:
    PROJECT_NAME: str = "NexusAssess Enterprise AI Assessment Platform"
    API_V1_STR: str = "/api/v1"

    APP_ENV: str = APP_ENV
    IS_PRODUCTION: bool = IS_PRODUCTION
    ENABLE_DOCS: bool = _bool("ENABLE_DOCS", not IS_PRODUCTION)   # /docs, /redoc, /openapi.json

    # ------------------------------------------------------------------
    # Secrets come from the environment (backend/.env, never committed). There are no hardcoded fallbacks.
    # ------------------------------------------------------------------
    SECRET_KEY: str = load_secret_key()
    # Key for secrets stored in the database (SMTP password). Empty = derive one from SECRET_KEY.
    SETTINGS_ENCRYPTION_KEY: str = os.getenv("SETTINGS_ENCRYPTION_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "nexus-assess"

    # Token lifetimes
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    CANDIDATE_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("CANDIDATE_TOKEN_EXPIRE_MINUTES", "240"))

    # OTP policy (server side)
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
    OTP_MAX_ATTEMPTS: int = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    OTP_RESEND_COOLDOWN_SECONDS: int = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "30"))

    # Login throttling
    LOGIN_MAX_FAILURES: int = int(os.getenv("LOGIN_MAX_FAILURES", "5"))
    LOGIN_LOCKOUT_MINUTES: int = int(os.getenv("LOGIN_LOCKOUT_MINUTES", "15"))
    # Requests per minute per IP to the sign-in endpoints (editable later in System Admin > Settings > Security)
    RATE_LIMIT_AUTH_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_AUTH_PER_MINUTE", "20"))

    # Refresh-token cookie
    REFRESH_COOKIE_NAME: str = "nexus_refresh"
    COOKIE_SECURE: bool = _bool("COOKIE_SECURE", False)  # must be True behind HTTPS (production requires it)
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    # One session cookie per browser, sent to every portal's /auth/refresh|logout endpoint.
    REFRESH_COOKIE_PATH: str = "/api/v1"

    # CORS - must be explicit origins because we use credentialed requests
    CORS_ORIGINS: list = _list(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    )
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Host names this API answers to (Host header). Empty = any (development). Set it in production.
    ALLOWED_HOSTS: list = _list("ALLOWED_HOSTS")
    MAX_REQUEST_BYTES: int = int(os.getenv("MAX_REQUEST_BYTES", str(1_000_000)))

    # Only trust X-Forwarded-For (for audit-log IP addresses and rate limiting) behind your own reverse proxy.
    TRUST_PROXY: bool = _bool("TRUST_PROXY", False)

    # Development conveniences - production refuses to start with DEV_EXPOSE_OTP on.
    DEV_EXPOSE_OTP: bool = _bool("DEV_EXPOSE_OTP", not IS_PRODUCTION)   # include OTP in API response + server log

    # First System Admin. If SEED_ADMIN_PASSWORD is empty a random one is generated and shown ONCE in the server
    # log, and the admin must choose their own password at first sign-in.
    SEED_ADMIN_EMAIL: str = os.getenv("SEED_ADMIN_EMAIL", "admin@7666")
    SEED_ADMIN_PASSWORD: str = os.getenv("SEED_ADMIN_PASSWORD", "")
    SEED_ADMIN_NAME: str = os.getenv("SEED_ADMIN_NAME", "System Administrator")

    # Auth database (SQLite for local tests; Supabase Postgres via AUTH_DATABASE_URL)
    AUTH_DATABASE_URL: str = os.getenv("AUTH_DATABASE_URL", "sqlite:///./nexus_auth_dev.db")

    # Email gateway bootstrap values. The System Admin can override them in Settings > Email (stored encrypted).
    GMAIL_SENDER_EMAIL: str = os.getenv("GMAIL_SENDER_EMAIL", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))

    # Database & Redis
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/nexus_assess")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Code Sandbox Limits
    MAX_EXECUTION_TIME_SECONDS: int = 5
    MAX_MEMORY_MB: int = 128


settings = Settings()
