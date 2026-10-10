"""
Audit trail + login history.

    record_audit(...)       one append-only row in ``audit_logs``      (who did what, to what, from where)
    record_login_event(...) one row in ``login_events``                 (every sign-in attempt / sign-out)

Both write through the caller's session, *after* the real change has been committed, and never raise:
a failure to write the trail is logged but must not break (or roll back) the action being audited.

What goes in ``audit_logs`` is limited on purpose. The table is append-only (rows can never be removed), so
only events tied to a real account or a signed-in actor are written there. Sign-in attempts for an
unknown email only go to ``login_events``, so an anonymous caller cannot grow the immutable log.
"""
import functools
import logging
from typing import Any, Callable, Dict, Optional, Tuple

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.auth import AuditLog, LoginEvent, StaffUser

logger = logging.getLogger("nexus.audit")

# --- categories
CAT_AUTH = "auth"
CAT_STAFF = "staff"
CAT_SETTINGS = "settings"
CAT_SECURITY = "security"
CAT_SYSTEM = "system"
CAT_CANDIDATE = "candidate"
CATEGORIES = [CAT_AUTH, CAT_STAFF, CAT_SETTINGS, CAT_SECURITY, CAT_SYSTEM, CAT_CANDIDATE]

# Self-test rows written by `python -m app.scripts.check_db`; hidden from the audit viewer by default.
HIDDEN_ACTIONS = ("db.selftest",)

_SENSITIVE_PARTS = ("password", "passwd", "otp", "token", "secret", "authorization", "cookie", "apikey", "api_key")
_MAX_TEXT = 500
_MAX_DEPTH = 4


# --------------------------------------------------------------------------- helpers
def client_info(request: Optional[Request]) -> Tuple[Optional[str], Optional[str]]:
    """(ip address, user agent) of the caller. X-Forwarded-For is only honoured when TRUST_PROXY is on."""
    if request is None:
        return None, None
    ip = request.client.host if request.client else None
    if settings.TRUST_PROXY:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            ip = forwarded.split(",")[0].strip() or ip
    agent = request.headers.get("user-agent")
    return (ip[:64] if ip else None), (agent[:300] if agent else None)


def scrub(value: Any, _depth: int = 0) -> Any:
    """Make ``details`` safe to store: redact secrets, cap sizes and depth, force JSON-friendly types."""
    if _depth >= _MAX_DEPTH:
        return "[truncated]"
    if isinstance(value, dict):
        clean: Dict[str, Any] = {}
        for key, item in list(value.items())[:50]:
            key = str(key)[:80]
            if any(part in key.lower() for part in _SENSITIVE_PARTS):
                clean[key] = "[redacted]"
            else:
                clean[key] = scrub(item, _depth + 1)
        return clean
    if isinstance(value, (list, tuple, set)):
        return [scrub(item, _depth + 1) for item in list(value)[:50]]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return str(value)[:_MAX_TEXT]


def _actor_fields(actor: Any) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Accepts a StaffUser, a dict {id,email,role}, or None (system / anonymous)."""
    if actor is None:
        return None, None, None
    if isinstance(actor, dict):
        return actor.get("id"), actor.get("email"), actor.get("role")
    return actor.id, actor.email, actor.role


def _commit_rows(db: Session, *rows: Any) -> bool:
    try:
        for row in rows:
            db.add(row)
        db.commit()
        return True
    except Exception:  # never let the trail break the action it describes
        logger.exception("Could not write audit/login record")
        try:
            db.rollback()
        except Exception:
            pass
        return False


def _never_raise(func: Callable[..., Any]) -> Callable[..., Any]:
    """Public writers must never break the action they describe: log the problem and carry on."""
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return func(*args, **kwargs)
        except Exception:
            logger.exception("Audit helper %s failed", func.__name__)
            return False
    return wrapper

# --------------------------------------------------------------------------- core writers
@_never_raise
def record_audit(
    db: Session,
    *,
    category: str,
    action: str,
    summary: str,
    actor: Any = None,
    request: Optional[Request] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    success: bool = True,
) -> bool:
    actor_id, actor_email, actor_role = _actor_fields(actor)
    ip, agent = client_info(request)
    row = AuditLog(
        category=category, action=action, summary=summary[:1000],
        actor_id=actor_id, actor_email=actor_email, actor_role=actor_role,
        target_type=target_type, target_id=target_id,
        details=scrub(details) if details else None,
        success=success, ip_address=ip, user_agent=agent,
    )
    return _commit_rows(db, row)


def _login_event_row(request: Optional[Request], *, event: str, success: bool, portal: Optional[str],
                     email: Optional[str], user_id: Optional[str], reason: Optional[str]) -> LoginEvent:
    ip, agent = client_info(request)
    return LoginEvent(
        user_id=user_id, email=(email or "")[:254] or None, portal=portal, event=event,
        success=success, failure_reason=reason, ip_address=ip, user_agent=agent,
    )


@_never_raise
def record_login_event(
    db: Session,
    request: Optional[Request],
    *,
    event: str,
    success: bool = True,
    portal: Optional[str] = None,
    email: Optional[str] = None,
    user_id: Optional[str] = None,
    reason: Optional[str] = None,
) -> bool:
    return _commit_rows(db, _login_event_row(request, event=event, success=success, portal=portal,
                                             email=email, user_id=user_id, reason=reason))


# --------------------------------------------------------------------------- sign-in wrappers
@_never_raise
def password_verified(db: Session, request: Optional[Request], portal: str, user: StaffUser) -> None:
    """Step 1 of sign-in succeeded (password OK, OTP sent). Login history only."""
    record_login_event(db, request, event="password_ok", portal=portal, email=user.email, user_id=user.id)


@_never_raise
def login_failed(db: Session, request: Optional[Request], portal: str, email: str,
                 user: Optional[StaffUser], reason: str, event: str = "login_failed") -> None:
    """Sign-in refused. Unknown emails are recorded in login history only (see module docstring)."""
    ip, agent = client_info(request)
    rows = [_login_event_row(request, event=event, success=False, portal=portal, email=email,
                             user_id=user.id if user else None, reason=reason)]
    if user is not None:
        rows.append(AuditLog(
            category=CAT_AUTH, action=f"auth.{event}", actor_id=user.id, actor_email=user.email,
            actor_role=user.role, success=False, ip_address=ip, user_agent=agent,
            summary=f"Sign-in to the {portal} portal refused for {user.email} ({reason.replace('_', ' ')})",
            details={"portal": portal, "reason": reason}))
    _commit_rows(db, *rows)


@_never_raise
def account_locked(db: Session, request: Optional[Request], portal: str, user: StaffUser, minutes: int) -> None:
    ip, agent = client_info(request)
    _commit_rows(
        db,
        _login_event_row(request, event="account_locked", success=False, portal=portal,
                         email=user.email, user_id=user.id, reason="too_many_failures"),
        AuditLog(category=CAT_SECURITY, action="security.account_locked", actor_id=user.id,
                 actor_email=user.email, actor_role=user.role, target_type="staff_user", target_id=user.id,
                 success=False, ip_address=ip, user_agent=agent,
                 summary=f"{user.email} was locked for {minutes} minute(s) after repeated failed sign-ins",
                 details={"portal": portal, "lockoutMinutes": minutes}),
    )


@_never_raise
def otp_failed(db: Session, request: Optional[Request], portal: str,
               user: Optional[StaffUser], reason: str) -> None:
    ip, agent = client_info(request)
    rows = [_login_event_row(request, event="otp_failed", success=False, portal=portal,
                             email=user.email if user else None, user_id=user.id if user else None,
                             reason=reason)]
    if user is not None:
        rows.append(AuditLog(
            category=CAT_AUTH, action="auth.otp_failed", actor_id=user.id, actor_email=user.email,
            actor_role=user.role, success=False, ip_address=ip, user_agent=agent,
            summary=f"Wrong or expired passcode for {user.email} on the {portal} portal ({reason.replace('_', ' ')})",
            details={"portal": portal, "reason": reason}))
    _commit_rows(db, *rows)


@_never_raise
def login_success(db: Session, request: Optional[Request], portal: str, user: StaffUser) -> None:
    ip, agent = client_info(request)
    _commit_rows(
        db,
        _login_event_row(request, event="login_success", success=True, portal=portal,
                         email=user.email, user_id=user.id, reason=None),
        AuditLog(category=CAT_AUTH, action="auth.login", actor_id=user.id, actor_email=user.email,
                 actor_role=user.role, ip_address=ip, user_agent=agent,
                 summary=f"{user.email} signed in to the {portal} portal", details={"portal": portal}),
    )


@_never_raise
def logout(db: Session, request: Optional[Request], portal: str, user: StaffUser) -> None:
    ip, agent = client_info(request)
    _commit_rows(
        db,
        _login_event_row(request, event="logout", success=True, portal=portal,
                         email=user.email, user_id=user.id, reason=None),
        AuditLog(category=CAT_AUTH, action="auth.logout", actor_id=user.id, actor_email=user.email,
                 actor_role=user.role, ip_address=ip, user_agent=agent,
                 summary=f"{user.email} signed out of the {portal} portal", details={"portal": portal}),
    )
