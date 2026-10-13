"""When a candidate's exam clock starts, and how much time is left."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone


def exam_time_left(started_at: datetime | None, duration_minutes: int, now: datetime) -> tuple[int, bool]:
    """Return (seconds left, exam has started).

    The clock starts when the candidate enters the exam, not when the invite
    or the paper is created. Until then the full allotment is still available.
    """
    allotted = max(1, int(duration_minutes or 60)) * 60
    if started_at is None:
        return allotted, False
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    remaining = int((started_at + timedelta(seconds=allotted) - now).total_seconds())
    return max(0, remaining), True
