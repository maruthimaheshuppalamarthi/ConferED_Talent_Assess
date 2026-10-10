"""
Catalogue of every System-Admin-editable setting: key, group, default, type and allowed range.

This is the single source of truth. On startup any key missing from the ``system_settings`` table is
inserted with its default (existing values are never overwritten); the settings API builds its request /
response models and its validation from the ``type`` / ``min`` / ``max`` / ``choices`` / ``fmt`` declared here.

Keys use camelCase so they match the frontend's ``SystemSettings`` type one to one.
Where a value used to come from an environment variable, that variable is the *initial* default.
"""
from typing import Any, Dict, List, Optional

from app.core.config import settings as _env

GROUP_PROCTORING = "proctoring"
GROUP_ASSESSMENT = "assessment"
GROUP_SECURITY = "security"
GROUP_EMAIL = "email"
GROUP_GENERAL = "general"
GROUPS = [GROUP_PROCTORING, GROUP_ASSESSMENT, GROUP_SECURITY, GROUP_EMAIL, GROUP_GENERAL]

# Heading and one-line explanation of each group, for the Admin settings screen.
GROUP_INFO = {
    GROUP_PROCTORING: ("Proctoring & lockdown", "Violation limits and what the AI proctor watches for during an assessment."),
    GROUP_ASSESSMENT: ("Assessment defaults", "How candidates receive their passcode and how long an invitation stays valid."),
    GROUP_SECURITY: ("Security policy", "Passcodes, lockouts, session lifetimes, password rules and sign-in rate limits."),
    GROUP_EMAIL: ("Email gateway", "The SMTP account that sends passcodes, invitations and account credentials."),
    GROUP_GENERAL: ("General", "Names and contacts shown to staff and candidates."),
}

# string formats understood by the settings service
FMT_EMAIL = "email"        # an email address (may be empty when allow_empty)
FMT_HOSTNAME = "hostname"  # a DNS host name
FMT_TEXT = "text"          # printable single-line text (no control characters or <>")


def _s(key: str, group: str, default: Any, value_type: str, description: str,
       min: Optional[int] = None, max: Optional[int] = None,
       choices: Optional[List[str]] = None, secret: bool = False,
       fmt: Optional[str] = None, min_length: int = 0, max_length: int = 200,
       allow_empty: bool = False) -> Dict[str, Any]:
    if value_type == "int" and default is not None:  # an out-of-range env override must not break seeding
        default = _clamp(default, min, max)
    return {
        "key": key, "group": group, "default": default, "type": value_type,
        "description": description, "min": min, "max": max, "choices": choices, "secret": secret,
        "fmt": fmt, "min_length": min_length, "max_length": max_length, "allow_empty": allow_empty,
    }


def _clamp(value: int, lower: Optional[int], upper: Optional[int]) -> int:
    if upper is not None and value > upper:
        return upper
    if lower is not None and value < lower:
        return lower
    return value


DEFAULT_SETTINGS: List[Dict[str, Any]] = [
    # ---- proctoring policy
    _s("maxTabSwitches", GROUP_PROCTORING, 3, "int", "Tab-switch warnings before action is taken", 1, 20),
    _s("maxViolationsBeforeTerminate", GROUP_PROCTORING, 5, "int",
       "Violations before the assessment is terminated automatically", 1, 50),
    _s("proctoringSensitivity", GROUP_PROCTORING, "high", "enum", "AI proctoring sensitivity",
       choices=["low", "medium", "high"]),
    _s("requireCamera", GROUP_PROCTORING, True, "bool", "Candidate must share their camera"),
    _s("requireMicrophone", GROUP_PROCTORING, True, "bool", "Candidate must share their microphone"),
    _s("requireScreenShare", GROUP_PROCTORING, False, "bool", "Candidate must share their screen"),
    _s("detectPhone", GROUP_PROCTORING, True, "bool", "Detect mobile phones in the camera frame"),
    _s("detectMultipleFaces", GROUP_PROCTORING, True, "bool", "Detect more than one face in the camera frame"),
    _s("detectFaceMissing", GROUP_PROCTORING, True, "bool", "Detect when the candidate leaves the frame"),
    _s("enableFullscreenLock", GROUP_PROCTORING, True, "bool", "Force full-screen during the assessment"),

    # ---- assessment defaults
    _s("otpMethod", GROUP_ASSESSMENT, "both", "enum", "How candidates receive their one-time passcode",
       choices=["email", "phone", "both"]),
    _s("linkExpirationHours", GROUP_ASSESSMENT, 48, "int", "Default lifetime of a candidate invite link (hours)", 1, 336),
    _s("allowSectionRevisit", GROUP_ASSESSMENT, False, "bool", "Let candidates go back to a finished section"),

    # ---- security policy (initial values come from the environment, see core/config.py)
    _s("otpExpireMinutes", GROUP_SECURITY, _env.OTP_EXPIRE_MINUTES, "int", "Minutes a one-time passcode stays valid", 1, 60),
    _s("otpMaxAttempts", GROUP_SECURITY, _env.OTP_MAX_ATTEMPTS, "int", "Wrong passcode attempts before it is voided", 1, 10),
    _s("otpResendCooldownSeconds", GROUP_SECURITY, _env.OTP_RESEND_COOLDOWN_SECONDS, "int",
       "Seconds between passcode resends", 0, 600),
    _s("loginMaxFailures", GROUP_SECURITY, _env.LOGIN_MAX_FAILURES, "int",
       "Failed sign-ins before the account is locked", 1, 20),
    _s("loginLockoutMinutes", GROUP_SECURITY, _env.LOGIN_LOCKOUT_MINUTES, "int",
       "Minutes a locked account stays locked", 1, 1440),
    _s("accessTokenExpireMinutes", GROUP_SECURITY, _env.ACCESS_TOKEN_EXPIRE_MINUTES, "int",
       "Access-token (session) lifetime in minutes", 5, 1440),
    _s("refreshTokenExpireDays", GROUP_SECURITY, _env.REFRESH_TOKEN_EXPIRE_DAYS, "int",
       "Days before a staff member must sign in again", 1, 90),
    _s("minPasswordLength", GROUP_SECURITY, 8, "int", "Minimum staff password length", 8, 64),
    _s("authRateLimitPerMinute", GROUP_SECURITY, _env.RATE_LIMIT_AUTH_PER_MINUTE, "int",
       "Sign-in requests allowed per minute per IP address (resend / password change: a quarter)", 1, 10000),

    # ---- email gateway
    _s("smtpHost", GROUP_EMAIL, _env.SMTP_HOST, "string", "SMTP server host",
       fmt=FMT_HOSTNAME, min_length=1, max_length=253),
    _s("smtpPort", GROUP_EMAIL, _env.SMTP_PORT, "int", "SMTP server port (587 = STARTTLS, 465 = SSL)", 1, 65535),
    _s("senderEmail", GROUP_EMAIL, _env.GMAIL_SENDER_EMAIL, "string", "Address emails are sent from",
       fmt=FMT_EMAIL, max_length=254, allow_empty=True),
    _s("senderName", GROUP_EMAIL, "NexusAssess", "string", "Display name on outgoing emails",
       fmt=FMT_TEXT, min_length=1, max_length=80),
    _s("smtpPassword", GROUP_EMAIL, None, "string", "SMTP / Gmail app password (stored encrypted)",
       secret=True, min_length=1, max_length=200),

    # ---- general
    _s("platformName", GROUP_GENERAL, "NexusAssess", "string", "Platform name shown in emails and the UI",
       fmt=FMT_TEXT, min_length=1, max_length=80),
    _s("supportEmail", GROUP_GENERAL, "", "string", "Support contact shown to candidates",
       fmt=FMT_EMAIL, max_length=254, allow_empty=True),
]

SETTINGS_BY_KEY: Dict[str, Dict[str, Any]] = {s["key"]: s for s in DEFAULT_SETTINGS}
SETTINGS_BY_GROUP: Dict[str, List[Dict[str, Any]]] = {g: [s for s in DEFAULT_SETTINGS if s["group"] == g] for g in GROUPS}
