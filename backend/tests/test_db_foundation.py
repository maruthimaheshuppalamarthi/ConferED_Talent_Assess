"""Admin database foundation: timezone-aware timestamps, new tables, settings catalogue and seeding."""
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.default_settings import DEFAULT_SETTINGS, SETTINGS_BY_KEY  # noqa: E402
from app.models.auth import (AuditLog, AuthBase, LoginEvent, RefreshToken, StaffUser,  # noqa: E402
                             SystemSetting, utcnow)
from app.services.bootstrap import seed_default_settings  # noqa: E402


@pytest.fixture()
def db(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'foundation.db').as_posix()}", future=True)
    AuthBase.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    yield session
    session.close()
    engine.dispose()


def _staff(**kw):
    base = dict(email="a@example.com", otp_email="a@example.com", full_name="A", role="Recruiter", password_hash="x")
    base.update(kw)
    return StaffUser(**base)


def test_utcnow_is_timezone_aware():
    assert utcnow().tzinfo is not None
    assert utcnow().utcoffset() == timedelta(0)


def test_timestamps_round_trip_as_aware_utc(db):
    # A naive value is treated as UTC; a non-UTC aware value is converted to UTC.
    ist = timezone(timedelta(hours=5, minutes=30))
    user = _staff(locked_until=datetime(2030, 1, 1, 12, 0, 0, tzinfo=ist))
    db.add(user)
    db.commit()
    db.expire_all()
    loaded = db.get(StaffUser, user.id)
    assert loaded.locked_until == datetime(2030, 1, 1, 6, 30, 0, tzinfo=timezone.utc)
    assert loaded.locked_until.tzinfo is not None
    assert loaded.created_at.tzinfo is not None
    assert loaded.created_at - utcnow() < timedelta(seconds=5)  # comparable with utcnow() without errors


def test_new_staff_profile_columns_default_to_empty(db):
    user = _staff()
    db.add(user)
    db.commit()
    db.expire_all()
    u = db.get(StaffUser, user.id)
    for col in ("phone", "department", "last_login_at", "created_by", "password_changed_at", "deleted_at"):
        assert getattr(u, col) is None
    assert u.updated_at is not None


def test_audit_log_stores_json_details_and_defaults(db):
    db.add(AuditLog(category="staff", action="staff.create", summary="Created jane",
                    details={"role": "Recruiter", "nested": {"ok": True}}, actor_email="admin@x.com"))
    db.commit()
    row = db.query(AuditLog).one()
    assert row.success is True
    assert row.details["nested"]["ok"] is True
    assert row.created_at.tzinfo is not None


def test_login_event_allows_unknown_user(db):
    db.add(LoginEvent(email="nobody@x.com", portal="admin", event="login_failed", success=False,
                      failure_reason="unknown_account", ip_address="10.0.0.1"))
    db.commit()
    ev = db.query(LoginEvent).one()
    assert ev.user_id is None and ev.success is False


def test_refresh_token_expiry_is_comparable_with_utcnow(db):
    user = _staff()
    db.add(user)
    db.flush()
    db.add(RefreshToken(jti="j1", user_id=user.id, expires_at=utcnow() + timedelta(days=1)))
    db.commit()
    db.expire_all()
    assert db.get(RefreshToken, "j1").expires_at > utcnow()


def test_settings_catalogue_is_consistent():
    keys = [s["key"] for s in DEFAULT_SETTINGS]
    assert len(keys) == len(set(keys)), "duplicate setting keys"
    for s in DEFAULT_SETTINGS:
        assert s["type"] in ("int", "bool", "string", "enum")
        if s["type"] == "enum":
            assert s["default"] in s["choices"]
        if s["type"] == "int":
            assert s["min"] <= s["default"] <= s["max"], s["key"]
        if s["type"] == "bool":
            assert isinstance(s["default"], bool)
    assert SETTINGS_BY_KEY["smtpPassword"]["secret"] is True
    # every frontend SystemSettings field has a server-side home
    for k in ("maxTabSwitches", "maxViolationsBeforeTerminate", "proctoringSensitivity", "requireCamera",
              "requireMicrophone", "requireScreenShare", "detectPhone", "detectMultipleFaces",
              "detectFaceMissing", "enableFullscreenLock", "otpMethod", "linkExpirationHours",
              "allowSectionRevisit"):
        assert k in SETTINGS_BY_KEY, k


def test_seed_inserts_defaults_and_is_idempotent(db):
    added = seed_default_settings(db)
    assert added == len(DEFAULT_SETTINGS)
    assert db.query(SystemSetting).count() == len(DEFAULT_SETTINGS)
    assert seed_default_settings(db) == 0  # second run adds nothing


def test_seed_never_overwrites_an_admin_edit(db):
    seed_default_settings(db)
    row = db.get(SystemSetting, "maxTabSwitches")
    row.value = 9
    db.commit()
    seed_default_settings(db)
    db.expire_all()
    assert db.get(SystemSetting, "maxTabSwitches").value == 9


def test_seed_fills_in_a_newly_added_key_only(db):
    seed_default_settings(db)
    db.query(SystemSetting).filter(SystemSetting.key == "supportEmail").delete()
    db.commit()
    assert seed_default_settings(db) == 1
