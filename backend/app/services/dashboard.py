"""
Numbers for the System Admin dashboard. Plain functions of (session, now) so they are easy to test exactly.

    staff_stats      accounts by role / state, locked, awaiting a first password, recent sign-ins
    security_stats   sign-in outcomes for the last N hours, failure reasons, noisy emails / IPs, a time series
    activity_feed    the latest audit entries (+ a count per category)
    invite_stats     candidate invitations by state
"""
from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.roles import STAFF_ROLES
from app.models.auth import AuditLog, CandidateInvite, LoginEvent, StaffUser
from app.services import audit

MAX_EVENT_ROWS = 100_000   # safety cap when loading sign-in events for one window
TOP_N = 5
HOURLY_BUCKET_MAX_HOURS = 48  # longer windows are charted per day


# ------------------------------------------------------------------ staff
def staff_stats(db: Session, now: datetime) -> Dict[str, Any]:
    users: List[StaffUser] = db.query(StaffUser).filter(StaffUser.deleted_at.is_(None)).all()
    day, week = now - timedelta(hours=24), now - timedelta(days=7)

    by_role = []
    for role in STAFF_ROLES:
        of_role = [u for u in users if u.role == role]
        by_role.append({"role": role,
                        "active": sum(1 for u in of_role if u.is_active),
                        "disabled": sum(1 for u in of_role if not u.is_active)})

    return {
        "total": len(users),
        "active": sum(1 for u in users if u.is_active),
        "disabled": sum(1 for u in users if not u.is_active),
        "byRole": by_role,
        "lockedNow": sum(1 for u in users if u.locked_until and u.locked_until > now),
        "pendingPasswordChange": sum(1 for u in users if u.is_active and u.must_change_password),
        "neverSignedIn": sum(1 for u in users if u.is_active and u.last_login_at is None),
        "signedInLast24h": sum(1 for u in users if u.last_login_at and u.last_login_at >= day),
        "signedInLast7d": sum(1 for u in users if u.last_login_at and u.last_login_at >= week),
        "createdLast7d": sum(1 for u in users if u.created_at and u.created_at >= week),
    }


# ------------------------------------------------------------------ security / sign-in
def _floor(moment: datetime, bucket: str) -> datetime:
    if bucket == "day":
        return moment.replace(hour=0, minute=0, second=0, microsecond=0)
    return moment.replace(minute=0, second=0, microsecond=0)


def _top(counter: Counter) -> List[Dict[str, Any]]:
    return [{"value": value, "count": count} for value, count in counter.most_common(TOP_N)]


def _count_events(db: Session, start: datetime, end: datetime, *events: str) -> int:
    return (db.query(func.count(LoginEvent.id))
            .filter(LoginEvent.created_at >= start, LoginEvent.created_at < end, LoginEvent.event.in_(events))
            .scalar() or 0)


def security_stats(db: Session, now: datetime, hours: int) -> Dict[str, Any]:
    since = now - timedelta(hours=hours)
    bucket = "hour" if hours <= HOURLY_BUCKET_MAX_HOURS else "day"
    step = timedelta(hours=1) if bucket == "hour" else timedelta(days=1)

    rows = (db.query(LoginEvent.created_at, LoginEvent.event, LoginEvent.user_id, LoginEvent.email,
                     LoginEvent.ip_address, LoginEvent.failure_reason)
            .filter(LoginEvent.created_at >= since, LoginEvent.created_at <= now)
            .order_by(LoginEvent.created_at.desc()).limit(MAX_EVENT_ROWS + 1).all())
    truncated = len(rows) > MAX_EVENT_ROWS
    rows = rows[:MAX_EVENT_ROWS]

    totals: Counter = Counter()
    reasons: Counter = Counter()
    bad_emails: Counter = Counter()
    bad_ips: Counter = Counter()
    users_in = set()
    ok_by_bucket: Counter = Counter()
    bad_by_bucket: Counter = Counter()

    for created, event, user_id, email, ip, reason in rows:
        slot = _floor(created, bucket)
        if event == "login_success":
            totals["successfulSignIns"] += 1
            ok_by_bucket[slot] += 1
            if user_id:
                users_in.add(user_id)
        elif event == "logout":
            totals["signOuts"] += 1
        elif event == "rate_limited":
            totals["rateLimited"] += 1
        elif event in ("login_failed", "login_blocked", "otp_failed", "account_locked"):
            key = {"login_failed": "failedSignIns", "login_blocked": "blockedAttempts",
                   "otp_failed": "otpFailures", "account_locked": "lockouts"}[event]
            totals[key] += 1
            if event != "account_locked":
                bad_by_bucket[slot] += 1
                reasons[reason or "unknown"] += 1
                if email:
                    bad_emails[email] += 1
                if ip:
                    bad_ips[ip] += 1

    series, slot, last = [], _floor(since, bucket), _floor(now, bucket)
    while slot <= last:
        series.append({"start": slot.isoformat(), "successful": ok_by_bucket[slot], "failed": bad_by_bucket[slot]})
        slot += step

    reuse = (db.query(func.count(AuditLog.id))
             .filter(AuditLog.action == "security.token_reuse", AuditLog.created_at >= since).scalar() or 0)
    locked_now = (db.query(func.count(StaffUser.id))
                  .filter(StaffUser.deleted_at.is_(None), StaffUser.locked_until > now).scalar() or 0)
    before = since - timedelta(hours=hours)

    return {
        "hours": hours, "since": since.isoformat(), "until": now.isoformat(), "bucket": bucket,
        "totals": {
            "successfulSignIns": totals["successfulSignIns"], "failedSignIns": totals["failedSignIns"],
            "blockedAttempts": totals["blockedAttempts"], "otpFailures": totals["otpFailures"],
            "lockouts": totals["lockouts"], "signOuts": totals["signOuts"],
            "uniqueUsers": len(users_in), "tokenReuseAlerts": reuse, "rateLimited": totals["rateLimited"],
        },
        "previousPeriod": {
            "successfulSignIns": _count_events(db, before, since, "login_success"),
            "failedSignIns": _count_events(db, before, since, "login_failed"),
        },
        "failuresByReason": [{"reason": r, "count": c} for r, c in reasons.most_common()],
        "topFailingEmails": _top(bad_emails),
        "topFailingIps": _top(bad_ips),
        "series": series,
        "lockedAccountsNow": locked_now,
        "truncated": truncated,
    }


# ------------------------------------------------------------------ activity
def activity_feed(db: Session, now: datetime, limit: int, category: Optional[str]) -> Dict[str, Any]:
    query = db.query(AuditLog).filter(AuditLog.action.notin_(audit.HIDDEN_ACTIONS))
    if category:
        query = query.filter(AuditLog.category == category)
    rows = query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(limit).all()

    week = now - timedelta(days=7)
    per_category = (db.query(AuditLog.category, func.count(AuditLog.id))
                    .filter(AuditLog.created_at >= week, AuditLog.action.notin_(audit.HIDDEN_ACTIONS))
                    .group_by(AuditLog.category).all())
    return {
        "items": [{"id": r.id, "createdAt": r.created_at.isoformat(), "category": r.category, "action": r.action,
                   "actorEmail": r.actor_email, "summary": r.summary, "success": r.success} for r in rows],
        "last7DaysByCategory": sorted(({"category": c, "count": n} for c, n in per_category),
                                      key=lambda item: (-item["count"], item["category"])),
    }


# ------------------------------------------------------------------ invites
def invite_stats(db: Session, now: datetime) -> Dict[str, Any]:
    invites: List[CandidateInvite] = db.query(CandidateInvite).all()
    week, soon = now - timedelta(days=7), now + timedelta(hours=24)
    live = [i for i in invites if not i.revoked and i.expires_at > now]
    return {
        "total": len(invites),
        "active": len(live),
        "verified": sum(1 for i in invites if i.verified_at is not None),
        "awaitingCandidate": sum(1 for i in live if i.verified_at is None),
        "expired": sum(1 for i in invites if not i.revoked and i.expires_at <= now),
        "revoked": sum(1 for i in invites if i.revoked),
        "expiringWithin24h": sum(1 for i in live if i.expires_at <= soon),
        "createdLast7d": sum(1 for i in invites if i.created_at >= week),
    }
