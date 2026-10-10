"""
Per-IP request rate limiting for the sign-in endpoints (slows password guessing and OTP guessing, and protects the
server from bcrypt-heavy floods).

    login / verify-otp           N requests per minute per IP          (N = Settings > Security > authRateLimitPerMinute)
    resend-otp / change-password N/4
    refresh                      3N
    candidate verify / resend    N

The counters live in this process's memory. That is exact for one server process; with several processes the effective
limit is multiplied by their number (the per-account lockout still protects each account regardless). Use a shared
store such as Redis if you need an exact global limit.

The first rejected request of each burst is recorded in the sign-in history (event "rate_limited"); further rejected
requests are not, so an attack cannot flood the database.
"""
import threading
import time
from collections import deque
from typing import Deque, Dict, Optional, Tuple

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import audit
from app.services import runtime_settings as rt

WINDOW_SECONDS = 60.0
MAX_TRACKED_KEYS = 20_000

BUCKET_FACTORS = {"login": 1.0, "verify": 1.0, "resend": 0.25, "password": 0.25, "refresh": 3.0, "candidate": 1.0}

_lock = threading.Lock()
_hits: Dict[str, Deque[float]] = {}
_last_logged_block: Dict[str, float] = {}


def reset() -> None:
    """Forget every counter (tests)."""
    with _lock:
        _hits.clear()
        _last_logged_block.clear()


def limit_for(bucket: str) -> int:
    return max(1, int(rt.get_int("authRateLimitPerMinute") * BUCKET_FACTORS[bucket]))


def check(key: str, limit: int, now: Optional[float] = None) -> Tuple[bool, int, bool]:
    """
    Count one request for `key`. Returns (allowed, retry_after_seconds, first_block_of_this_burst).
    Sliding window: at most `limit` requests in any WINDOW_SECONDS.
    """
    now = time.monotonic() if now is None else now
    with _lock:
        hits = _hits.setdefault(key, deque())
        while hits and now - hits[0] >= WINDOW_SECONDS:
            hits.popleft()
        if len(hits) < limit:
            hits.append(now)
            if len(_hits) > MAX_TRACKED_KEYS:
                _prune(now)
            return True, 0, False
        retry_after = max(1, int(WINDOW_SECONDS - (now - hits[0])) + 1)
        first = now - _last_logged_block.get(key, -1e9) >= WINDOW_SECONDS
        if first:
            _last_logged_block[key] = now
        return False, retry_after, first


def _prune(now: float) -> None:
    for key in [k for k, h in _hits.items() if not h or now - h[-1] >= WINDOW_SECONDS]:
        _hits.pop(key, None)
        _last_logged_block.pop(key, None)
    if len(_hits) > MAX_TRACKED_KEYS:  # still too many: drop the oldest half rather than grow without bound
        for key in sorted(_hits, key=lambda k: _hits[k][-1])[: len(_hits) // 2]:
            _hits.pop(key, None)
            _last_logged_block.pop(key, None)


def rate_limit(bucket: str):
    """FastAPI dependency: 429 + Retry-After when this IP has used up the bucket's allowance."""
    if bucket not in BUCKET_FACTORS:
        raise ValueError(f"Unknown rate-limit bucket '{bucket}'")

    def dependency(request: Request, db: Session = Depends(get_db)) -> None:
        ip, _ = audit.client_info(request)
        allowed, retry_after, first = check(f"{bucket}:{ip or 'unknown'}", limit_for(bucket))
        if allowed:
            return
        if first:
            audit.record_login_event(db, request, event="rate_limited", success=False, reason=bucket)
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Please wait {retry_after} seconds and try again.",
            headers={"Retry-After": str(retry_after)},
        )

    return dependency
