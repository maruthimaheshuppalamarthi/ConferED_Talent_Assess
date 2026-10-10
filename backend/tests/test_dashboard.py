"""Phase 4: admin dashboard panels, health report, SMTP probe and the public probes."""
import smtplib
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from helpers import (ADMIN, API, FakeSMTP, FakeSMTPSSL, audit_rows, auth, create_staff, new_email,
                     recruiter_token, sign_in, start_login)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api import admin_dashboard
from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.auth import (AuditLog, AuthBase, CandidateInvite, LoginEvent, StaffUser, SystemSetting)
from app.services import bootstrap, dashboard, health
from app.services import email as email_service
from app.services import runtime_settings as rt

D = f"{API}/admin/dashboard"
NOW = datetime(2030, 6, 15, 12, 30, tzinfo=timezone.utc)


def ago(**delta):
    return NOW - timedelta(**delta)


# ====================================================================================================
# 1. The calculations, against a private database with hand-made data (exact numbers)
# ====================================================================================================
@pytest.fixture()
def db(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'dash.db').as_posix()}", future=True)
    AuthBase.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    yield session
    session.close()
    engine.dispose()


def _staff(email, role, **kw):
    kw.setdefault("created_at", ago(days=40))
    return StaffUser(email=email, otp_email=email, full_name=email, role=role, password_hash="x", **kw)


def test_staff_stats_are_exact(db):
    db.add_all([
        _staff("a@x.co", "System Admin", last_login_at=ago(hours=1)),
        _staff("b@x.co", "Recruiter", must_change_password=True, created_at=ago(days=2)),
        _staff("c@x.co", "Recruiter", is_active=False, last_login_at=ago(days=3)),
        _staff("d@x.co", "Proctor", locked_until=NOW + timedelta(minutes=10), last_login_at=ago(days=10)),
        _staff("e@x.co", "Recruiter", deleted_at=ago(days=1), last_login_at=ago(hours=1)),   # soft-deleted: ignored
        _staff("f@x.co", "Proctor", last_login_at=ago(hours=23, minutes=59), created_at=ago(days=8)),
        _staff("g@x.co", "Proctor", locked_until=ago(minutes=1), last_login_at=ago(days=20)),  # lock already over
    ])
    db.commit()
    s = dashboard.staff_stats(db, NOW)
    assert (s["total"], s["active"], s["disabled"]) == (6, 5, 1)
    assert s["byRole"] == [{"role": "System Admin", "active": 1, "disabled": 0},
                           {"role": "Recruiter", "active": 1, "disabled": 1},
                           {"role": "Proctor", "active": 3, "disabled": 0}]
    assert s["lockedNow"] == 1
    assert s["pendingPasswordChange"] == 1 and s["neverSignedIn"] == 1
    assert s["signedInLast24h"] == 2 and s["signedInLast7d"] == 3
    assert s["createdLast7d"] == 1


def test_staff_stats_on_an_empty_database_lists_every_role(db):
    s = dashboard.staff_stats(db, NOW)
    assert s["total"] == 0 and [r["role"] for r in s["byRole"]] == ["System Admin", "Recruiter", "Proctor"]


def _event(when, event, success=True, user=None, email=None, ip=None, reason=None):
    return LoginEvent(created_at=when, event=event, success=success, user_id=user, email=email, ip_address=ip,
                      failure_reason=reason, portal="admin")


@pytest.fixture()
def signin_data(db):
    db.add_all([
        _event(NOW.replace(hour=11, minute=45), "login_success", user="A", email="a@x.co", ip="1.1.1.1"),
        _event(NOW.replace(hour=11, minute=50), "login_success", user="A", email="a@x.co", ip="1.1.1.1"),
        _event(NOW.replace(hour=9, minute=10), "login_success", user="B", email="b@x.co", ip="2.2.2.2"),
        _event(NOW.replace(hour=10, minute=20), "login_failed", False, None, "x@e.com", "9.9.9.9", "wrong_password"),
        _event(NOW.replace(hour=10, minute=25), "login_failed", False, None, "x@e.com", "9.9.9.9", "wrong_password"),
        _event(NOW.replace(hour=10, minute=26), "login_failed", False, None, "y@e.com", "8.8.8.8", "unknown_account"),
        _event(NOW.replace(hour=10, minute=27), "account_locked", False, None, "x@e.com", "9.9.9.9", "too_many_failures"),
        _event(NOW.replace(hour=10, minute=30), "login_blocked", False, None, "x@e.com", "9.9.9.9", "account_locked"),
        _event(NOW.replace(hour=7, minute=0), "otp_failed", False, "B", "b@x.co", "7.7.7.7", "wrong_or_expired_code"),
        _event(NOW.replace(hour=11, minute=0), "logout", user="A", email="a@x.co"),
        _event(NOW.replace(hour=8, minute=30), "rate_limited", False, None, None, "9.9.9.9", "login"),
        _event(NOW.replace(hour=8, minute=31), "rate_limited", False, None, None, "9.9.9.9", "login"),
        _event(NOW.replace(hour=5, minute=0), "login_success", user="A", email="a@x.co"),    # previous period
        _event(NOW.replace(hour=4, minute=0), "login_failed", False, None, "z@e.com", "6.6.6.6", "wrong_password"),
        _event(NOW + timedelta(hours=1), "login_success", user="A"),                          # in the future: ignored
        AuditLog(created_at=NOW.replace(hour=8), category="security", action="security.token_reuse", summary="r"),
        AuditLog(created_at=NOW.replace(hour=5), category="security", action="security.token_reuse", summary="r"),
        _staff("locked@x.co", "Recruiter", locked_until=NOW + timedelta(minutes=5)),
    ])
    db.commit()


def test_security_stats_are_exact(db, signin_data):
    s = dashboard.security_stats(db, NOW, hours=6)  # window 06:30 -> 12:30
    assert s["bucket"] == "hour" and s["hours"] == 6 and s["truncated"] is False
    assert s["totals"] == {"successfulSignIns": 3, "failedSignIns": 3, "blockedAttempts": 1, "otpFailures": 1,
                           "lockouts": 1, "signOuts": 1, "uniqueUsers": 2, "tokenReuseAlerts": 1,
                           "rateLimited": 2}
    assert s["previousPeriod"] == {"successfulSignIns": 1, "failedSignIns": 1}   # 00:30 -> 06:30
    assert {r["reason"]: r["count"] for r in s["failuresByReason"]} == {
        "wrong_password": 2, "unknown_account": 1, "account_locked": 1, "wrong_or_expired_code": 1}
    assert s["failuresByReason"][0] == {"reason": "wrong_password", "count": 2}   # most common first
    assert s["topFailingEmails"][0] == {"value": "x@e.com", "count": 3}
    assert s["topFailingIps"][0] == {"value": "9.9.9.9", "count": 3}
    assert {"value": "6.6.6.6", "count": 1} not in s["topFailingIps"]            # outside the window
    assert s["lockedAccountsNow"] == 1

    series = {p["start"][11:13]: (p["successful"], p["failed"]) for p in s["series"]}
    assert list(series) == ["06", "07", "08", "09", "10", "11", "12"]            # zero-filled, no gaps
    assert series == {"06": (0, 0), "07": (0, 1), "08": (0, 0), "09": (1, 0), "10": (0, 4), "11": (2, 0),
                      "12": (0, 0)}
    assert sum(p["successful"] for p in s["series"]) == 3 and sum(p["failed"] for p in s["series"]) == 5


def test_long_windows_are_charted_per_day(db, signin_data):
    s = dashboard.security_stats(db, NOW, hours=72)
    assert s["bucket"] == "day"
    assert [p["start"][:10] for p in s["series"]] == ["2030-06-12", "2030-06-13", "2030-06-14", "2030-06-15"]
    assert s["series"][-1]["successful"] == 4  # 3 + the 05:00 sign-in, all on the 15th


def test_security_stats_with_no_activity(db):
    s = dashboard.security_stats(db, NOW, hours=24)
    assert all(v == 0 for v in s["totals"].values()) and s["failuresByReason"] == [] and s["topFailingIps"] == []
    assert len(s["series"]) == 25 and all(p["successful"] == p["failed"] == 0 for p in s["series"])


def test_activity_feed(db):
    db.add_all([
        AuditLog(created_at=ago(minutes=5), category="auth", action="auth.login", summary="newest", actor_email="a@x"),
        AuditLog(created_at=ago(minutes=10), category="staff", action="staff.create", summary="middle"),
        AuditLog(created_at=ago(hours=1), category="auth", action="auth.logout", summary="oldest in week"),
        AuditLog(created_at=ago(days=9), category="auth", action="auth.login", summary="too old for the counts"),
        AuditLog(created_at=ago(minutes=1), category="system", action="db.selftest", summary="hidden"),
    ])
    db.commit()

    feed = dashboard.activity_feed(db, NOW, limit=10, category=None)
    assert [i["summary"] for i in feed["items"]] == ["newest", "middle", "oldest in week", "too old for the counts"]
    assert feed["last7DaysByCategory"] == [{"category": "auth", "count": 2}, {"category": "staff", "count": 1}]
    assert [i["summary"] for i in dashboard.activity_feed(db, NOW, 2, None)["items"]] == ["newest", "middle"]
    only = dashboard.activity_feed(db, NOW, 10, "auth")["items"]
    assert [i["summary"] for i in only] == ["newest", "oldest in week", "too old for the counts"]


def test_invite_stats(db):
    def invite(n, expires, created=None, **kw):
        return CandidateInvite(candidate_id=f"c{n}", name="N", email=f"n{n}@x.co", assessment_id="a",
                               token_hash=f"t{n}", expires_at=expires, created_by="u",
                               created_at=created or ago(days=1), **kw)
    db.add_all([
        invite(1, NOW + timedelta(hours=2)),                                  # active, waiting, expires soon
        invite(2, NOW + timedelta(days=3), verified_at=ago(hours=1)),         # active, verified
        invite(3, ago(hours=1)),                                              # expired
        invite(4, NOW + timedelta(days=1), revoked=True),                     # revoked
        invite(5, NOW + timedelta(hours=30), created=ago(days=10)),           # active, waiting, old
    ])
    db.commit()
    assert dashboard.invite_stats(db, NOW) == {
        "total": 5, "active": 3, "verified": 1, "awaitingCandidate": 2, "expired": 1, "revoked": 1,
        "expiringWithin24h": 1, "createdLast7d": 4}


# ====================================================================================================
# 2. The API
# ====================================================================================================
@pytest.fixture(scope="module", autouse=True)
def _no_real_email():
    mp = pytest.MonkeyPatch()
    mp.setattr(email_service, "send_email", lambda *a, **k: True)
    yield
    mp.undo()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin(client):
    return auth(sign_in(client, "admin", **ADMIN)["accessToken"])


@pytest.fixture(autouse=True)
def _fresh_throttle():
    admin_dashboard._last_probe.clear()
    rt.invalidate()
    yield
    rt.invalidate()


def panel(client, admin, name, **params):
    r = client.get(f"{D}/{name}", params=params, headers=admin)
    assert r.status_code == 200, r.text
    return r.json()


PANELS = ["staff", "security", "activity", "invites", "health"]


@pytest.mark.parametrize("name", PANELS)
def test_panels_are_admin_only(client, admin, name):
    assert client.get(f"{D}/{name}").status_code == 401
    _, token = recruiter_token(client, admin, "dash")
    assert client.get(f"{D}/{name}", headers=auth(token)).status_code == 403
    assert client.get(f"{D}/{name}", headers=admin).status_code == 200


def test_probe_endpoint_is_admin_only(client, admin):
    assert client.post(f"{D}/health/email-probe").status_code == 401
    _, token = recruiter_token(client, admin, "probe")
    assert client.post(f"{D}/health/email-probe", headers=auth(token)).status_code == 403


def test_staff_panel_follows_real_account_changes(client, admin):
    before = panel(client, admin, "staff")
    role_count = lambda s, role: next(r for r in s["byRole"] if r["role"] == role)  # noqa: E731

    active_user, _ = create_staff(client, admin, "Recruiter", "dashactive")
    disabled_user, _ = create_staff(client, admin, "Proctor", "dashdisabled")
    client.patch(f"{API}/admin/staff/{disabled_user['id']}", json={"isActive": False}, headers=admin)
    for _ in range(3):  # the default lockout threshold in tests
        start_login(client, "recruiter", active_user["email"], "wrong-password")

    after = panel(client, admin, "staff")
    assert after["total"] == before["total"] + 2
    assert after["active"] == before["active"] + 1 and after["disabled"] == before["disabled"] + 1
    assert role_count(after, "Recruiter")["active"] == role_count(before, "Recruiter")["active"] + 1
    assert role_count(after, "Proctor")["disabled"] == role_count(before, "Proctor")["disabled"] + 1
    assert after["lockedNow"] == before["lockedNow"] + 1
    assert after["pendingPasswordChange"] == before["pendingPasswordChange"] + 1  # only the active new account
    assert after["neverSignedIn"] == before["neverSignedIn"] + 1
    assert after["createdLast7d"] == before["createdLast7d"] + 2
    assert after["signedInLast24h"] >= 1  # the admin signed in for this test module


def test_security_panel_counts_new_sign_ins_and_failures(client, admin):
    before = panel(client, admin, "security", hours=24)
    user, temp = create_staff(client, admin, "Recruiter", "dashsec")
    sign_in(client, "recruiter", user["email"], temp)
    start_login(client, "recruiter", user["email"], "wrong-password")
    start_login(client, "admin", new_email("ghost"), "whatever")

    after = panel(client, admin, "security", hours=24)
    assert after["totals"]["successfulSignIns"] == before["totals"]["successfulSignIns"] + 1
    assert after["totals"]["failedSignIns"] == before["totals"]["failedSignIns"] + 2
    reasons = {r["reason"]: r["count"] for r in after["failuresByReason"]}
    prior = {r["reason"]: r["count"] for r in before["failuresByReason"]}
    assert reasons["unknown_account"] == prior.get("unknown_account", 0) + 1
    assert reasons["wrong_password"] == prior.get("wrong_password", 0) + 1

    assert after["bucket"] == "hour" and 24 <= len(after["series"]) <= 25
    bad = after["totals"]["failedSignIns"] + after["totals"]["blockedAttempts"] + after["totals"]["otpFailures"]
    assert sum(p["successful"] for p in after["series"]) == after["totals"]["successfulSignIns"]
    assert sum(p["failed"] for p in after["series"]) == bad
    assert panel(client, admin, "security")["hours"] == 24  # default window


@pytest.mark.parametrize("params", [{"hours": 0}, {"hours": 169}, {"hours": "abc"}])
def test_security_panel_validates_the_window(client, admin, params):
    assert client.get(f"{D}/security", params=params, headers=admin).status_code == 422


def test_activity_panel(client, admin):
    with SessionLocal() as db:
        db.add(AuditLog(category="system", action="db.selftest", summary="self-test row must stay hidden"))
        db.commit()
    feed = panel(client, admin, "activity", limit=5)
    assert 1 <= len(feed["items"]) <= 5
    times = [i["createdAt"] for i in feed["items"]]
    assert times == sorted(times, reverse=True)
    assert all(i["action"] != "db.selftest" for i in feed["items"])
    assert feed["last7DaysByCategory"] and feed["last7DaysByCategory"][0]["count"] >= 1

    only_auth = panel(client, admin, "activity", limit=50, category="auth")["items"]
    assert only_auth and {i["category"] for i in only_auth} == {"auth"}
    assert panel(client, admin, "activity", category="no-such-category")["items"] == []
    for bad in (0, 51):
        assert client.get(f"{D}/activity", params={"limit": bad}, headers=admin).status_code == 422


def test_invites_panel_follows_recruiter_activity(client, admin):
    before = panel(client, admin, "invites")
    _, token = recruiter_token(client, admin, "dashinv")
    r = client.post(f"{API}/recruiter/candidates/invites", headers=auth(token),
                    json={"name": "Dash Cand", "email": new_email("cand"), "assessmentId": "a1", "expiresInHours": 1})
    assert r.status_code == 201
    after = panel(client, admin, "invites")
    assert after["total"] == before["total"] + 1 and after["active"] == before["active"] + 1
    assert after["awaitingCandidate"] == before["awaitingCandidate"] + 1
    assert after["expiringWithin24h"] == before["expiringWithin24h"] + 1
    assert after["createdLast7d"] == before["createdLast7d"] + 1


# ---------------------------------------------------------------- health report
def component(report, name):
    return next(c for c in report["components"] if c["name"] == name)


def test_health_report_shape_and_secrecy(client, admin):
    r = client.get(f"{D}/health", headers=admin)
    report = r.json()
    assert {c["name"] for c in report["components"]} == {
        "database", "migrations", "settings", "emailGateway", "encryption", "securityPosture"}
    assert component(report, "database")["status"] == "ok"
    assert component(report, "migrations")["status"] == "ok"
    assert component(report, "settings")["status"] == "ok"
    assert report["status"] in ("healthy", "degraded") and report["uptimeSeconds"] >= 0
    assert report["version"] and report["startedAt"] <= report["checkedAt"]

    for secret in (settings.SEED_ADMIN_PASSWORD, settings.GMAIL_APP_PASSWORD, settings.SECRET_KEY,
                   settings.GMAIL_APP_PASSWORD.replace(" ", "")):
        assert secret and secret not in r.text, "a secret value leaked into the health report"
    assert component(report, "emailGateway")["details"]["passwordSource"] in ("database", "environment", "none")


def test_security_posture_flags_unsafe_defaults(client, admin, monkeypatch):
    findings = lambda: {f["id"] for f in component(panel(client, admin, "health"), "securityPosture")  # noqa: E731
                        ["details"]["findings"]}
    monkeypatch.setattr(settings, "DEV_EXPOSE_OTP", True)
    monkeypatch.setattr(settings, "COOKIE_SECURE", False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.setattr(settings, "SETTINGS_ENCRYPTION_KEY", "")
    found = findings()
    assert {"default-secret-key", "dev-otp-exposed", "insecure-cookies", "derived-encryption-key",
            "default-admin-password"} <= found
    assert component(panel(client, admin, "health"), "securityPosture")["status"] == "warning"

    monkeypatch.setattr(settings, "DEV_EXPOSE_OTP", False)
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)
    monkeypatch.setenv("SECRET_KEY", "a-real-secret")
    monkeypatch.setattr(settings, "SETTINGS_ENCRYPTION_KEY", "")
    monkeypatch.setattr(health, "verify_password", lambda *a, **k: False)  # the admin changed the default password
    left = findings()
    assert not ({"default-secret-key", "dev-otp-exposed", "insecure-cookies", "default-admin-password"} & left)

    monkeypatch.setattr(health, "security_findings", lambda db: [])
    assert component(panel(client, admin, "health"), "securityPosture")["status"] == "ok"


def test_a_missing_setting_is_a_warning(client, admin):
    with SessionLocal() as db:
        db.query(SystemSetting).filter(SystemSetting.key == "supportEmail").delete()
        db.commit()
    try:
        report = panel(client, admin, "health")
        assert component(report, "settings")["status"] == "warning"
        assert component(report, "settings")["details"]["missing"] == ["supportEmail"]
        assert report["status"] in ("degraded",)
    finally:
        with SessionLocal() as db:
            bootstrap.seed_default_settings(db)
    assert component(panel(client, admin, "health"), "settings")["status"] == "ok"


def test_an_undecryptable_smtp_password_is_an_error(client, admin):
    with SessionLocal() as db:
        db.get(SystemSetting, "smtpPassword").value = "not-a-valid-ciphertext"
        db.commit()
    try:
        report = panel(client, admin, "health")
        assert component(report, "encryption")["status"] == "error" and report["status"] == "unhealthy"
    finally:
        with SessionLocal() as db:
            db.get(SystemSetting, "smtpPassword").value = None
            db.commit()
        rt.invalidate()
    assert component(panel(client, admin, "health"), "encryption")["status"] == "ok"


def test_migration_problems_are_reported(client, admin, monkeypatch):
    monkeypatch.setattr(bootstrap, "schema_revisions", lambda: ("0001", "0002"))
    c = component(panel(client, admin, "health"), "migrations")
    assert c["status"] == "error" and "alembic upgrade head" in c["message"]
    assert c["details"] == {"current": "0001", "expected": "0002"}

    def boom():
        raise RuntimeError("cannot read")
    monkeypatch.setattr(bootstrap, "schema_revisions", boom)
    assert component(panel(client, admin, "health"), "migrations")["status"] == "error"


def test_email_gateway_status_reflects_configuration(monkeypatch):
    def cfg(sender, source):
        return rt.EmailConfig("smtp.example.test", 587, sender, "N", "pw" if source != "none" else "", source)
    monkeypatch.setattr(rt, "email_config", lambda: cfg("a@example.test", "database"))
    assert health.check_email_gateway()["status"] == "ok"
    monkeypatch.setattr(rt, "email_config", lambda: cfg("a@example.test", "none"))
    assert health.check_email_gateway()["status"] == "warning"
    monkeypatch.setattr(rt, "email_config", lambda: cfg("", "environment"))
    assert health.check_email_gateway()["status"] == "warning"


def test_a_database_outage_makes_the_report_unhealthy_without_crashing(monkeypatch):
    class DeadEngine:
        class dialect:  # noqa: N801
            name = "postgresql"

        def connect(self):
            raise ConnectionError("connection refused, password=hunter2")

    monkeypatch.setattr(health, "engine", DeadEngine())
    with SessionLocal() as db:
        report = health.build_report(db)
    assert report["status"] == "unhealthy"
    assert [c["name"] for c in report["components"]] == ["database"]  # the rest all need the database
    assert "hunter2" not in str(report)                              # the driver's error text is not exposed


def test_overall_status_rules():
    ok, warn, err = {"status": "ok"}, {"status": "warning"}, {"status": "error"}
    assert health.overall_status([ok, ok]) == "healthy"
    assert health.overall_status([ok, warn]) == "degraded"
    assert health.overall_status([warn, err, ok]) == "unhealthy"


# ---------------------------------------------------------------- email probe
@pytest.fixture()
def fake_smtp(monkeypatch):
    FakeSMTP.instances, FakeSMTP.fail_login = [], None
    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", FakeSMTPSSL)
    return FakeSMTP


def configure_email(client, admin):
    r = client.patch(f"{API}/admin/settings/email", headers=admin, json={
        "smtpHost": "smtp.example.test", "smtpPort": 2525, "senderEmail": "noreply@example.test",
        "smtpPassword": "abcd efgh ijkl mnop"})
    assert r.status_code == 200, r.text


@pytest.fixture()
def restore_email(client, admin):
    snapshot = {}
    with SessionLocal() as db:
        snapshot = {k: db.get(SystemSetting, k).value for k in ("smtpHost", "smtpPort", "senderEmail", "smtpPassword")}
    yield
    with SessionLocal() as db:
        for key, value in snapshot.items():
            db.get(SystemSetting, key).value = value
        db.commit()
    rt.invalidate()


def test_probe_connects_and_signs_in_but_sends_nothing(client, admin, fake_smtp, restore_email):
    configure_email(client, admin)
    r = client.post(f"{D}/health/email-probe", headers=admin)
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["ok"] is True and "smtp.example.test:2525" in out["message"]
    assert out["passwordSource"] == "database" and out["sender"] == "noreply@example.test"
    calls = fake_smtp.instances[-1].calls
    assert ("login", "noreply@example.test", "abcdefghijklmnop") in calls and "quit" in calls
    assert not any(isinstance(c, tuple) and c[0] == "sendmail" for c in calls)
    entry = audit_rows(action="system.email_probe")[-1]
    assert entry.success is True and "abcd" not in entry.summary + str(entry.details)


def test_probe_failure_is_explained_and_audited(client, admin, fake_smtp, restore_email):
    configure_email(client, admin)
    fake_smtp.fail_login = smtplib.SMTPAuthenticationError(535, b"bad credentials")
    out = client.post(f"{D}/health/email-probe", headers=admin).json()
    assert out["ok"] is False and "App Password" in out["message"] and "bad credentials" not in str(out)
    assert audit_rows(action="system.email_probe")[-1].success is False


def test_probe_is_throttled(client, admin, fake_smtp, restore_email):
    configure_email(client, admin)
    assert client.post(f"{D}/health/email-probe", headers=admin).status_code == 200
    again = client.post(f"{D}/health/email-probe", headers=admin)
    assert again.status_code == 429 and "wait" in again.json()["detail"]


def test_probe_without_credentials(client, admin, monkeypatch, restore_email):
    monkeypatch.setattr(rt.env, "GMAIL_APP_PASSWORD", "")
    client.patch(f"{API}/admin/settings/email", json={"senderEmail": "noreply@example.test"}, headers=admin)
    client.delete(f"{API}/admin/settings/email/password", headers=admin)
    out = client.post(f"{D}/health/email-probe", headers=admin).json()
    assert out["ok"] is False and "No sender address or SMTP password" in out["message"]


# ---------------------------------------------------------------- public probes
def test_public_probes_need_no_login_and_reveal_nothing(client):
    live = client.get("/health")
    assert live.status_code == 200 and live.json() == {"status": "ok"}
    ready = client.get("/health/ready")
    assert ready.status_code == 200 and ready.json() == {"status": "ready"}


def test_readiness_reports_503_when_the_database_is_down(client, monkeypatch):
    monkeypatch.setattr(health, "ping_database",
                        lambda: {"name": "database", "status": "error", "message": "x", "details": {"error": "boom"}})
    r = client.get("/health/ready")
    assert r.status_code == 503 and r.json() == {"status": "unavailable"}
    assert client.get("/health").status_code == 200  # the process itself is still alive
