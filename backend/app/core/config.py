import os

def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


class Settings:
    PROJECT_NAME: str = "NexusAssess Enterprise AI Assessment Platform"
    API_V1_STR: str = "/api/v1"

    # ------------------------------------------------------------------
    # DEV-PHASE DEFAULTS
    # Hardcoded fallbacks below are acceptable for development only.
    # See docs/auth.md ("Before going to production") for the checklist.
    # ------------------------------------------------------------------
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexus_assess_enterprise_super_secret_jwt_key_2026")
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

    # Refresh-token cookie
    REFRESH_COOKIE_NAME: str = "nexus_refresh"
    COOKIE_SECURE: bool = _bool("COOKIE_SECURE", False)  # True behind HTTPS in production
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # CORS - must be explicit origins because we use credentialed requests
    CORS_ORIGINS: list = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Dev conveniences (turn OFF for production)
    DEV_EXPOSE_OTP: bool = _bool("DEV_EXPOSE_OTP", True)          # include OTP in API response + server log
    ALLOW_PUBLIC_STAFF_REGISTRATION: bool = _bool("ALLOW_PUBLIC_STAFF_REGISTRATION", True)  # Recruiter role only
    SEED_ADMIN_EMAIL: str = os.getenv("SEED_ADMIN_EMAIL", "admin@7666")
    SEED_ADMIN_PASSWORD: str = os.getenv("SEED_ADMIN_PASSWORD", "970598")
    SEED_ADMIN_NAME: str = os.getenv("SEED_ADMIN_NAME", "System Administrator")

    # Auth database (SQLite for dev; point at Postgres later via AUTH_DATABASE_URL)
    AUTH_DATABASE_URL: str = os.getenv("AUTH_DATABASE_URL", "sqlite:///./nexus_auth_dev.db")

    # Gmail SMTP Configuration from .env file
    GMAIL_SENDER_EMAIL: str = os.getenv("GMAIL_SENDER_EMAIL", "udayrise7666@gmail.com")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "fjacucsgfnfbiemd")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))

    # Database & Redis
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/nexus_assess")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Code Sandbox Limits
    MAX_EXECUTION_TIME_SECONDS: int = 5
    MAX_MEMORY_MB: int = 128

settings = Settings()
