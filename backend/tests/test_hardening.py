"""Phase 6: security hardening - password policy, rate limiting, headers, CORS, production checks, admin bootstrap."""
import logging
import re
import shutil
import subprocess
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from helpers import (ADMIN, API, audit_rows, auth, create_staff, login_rows, new_email, recruiter_token, sign_in,
                     start_login)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core import config as config_module
from app.core import password_policy, prod_checks, rate_limit
from app.core.config import KNOWN_LEAKED_SECRET_KEYS, load_secret_key, settings
from app.core.security import generate_temp_password, hash_password, verify_password
from app.db.session import SessionLocal
from app.main import app
from app.models.auth import AuthBase, StaffUser, SystemSetting
from app.services import bootstrap, health
from app.services import runtime_settings as rt

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent


# ---------------------------------------------------------------- fixtures
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin(client):
    return auth(sign_in(client, "admin", **ADMIN)["accessToken"])


@pytest.fixture(autouse=True)
def clean_state(client):  # (the client fixture starts the app, which creates the tables)
    """Rate-limit counters and the settings table are put back exactly as found."""
    with SessionLocal() as db:
        snapshot = {r.key: r.value for r in db.query(SystemSetting).all()}
    rate_limit.reset()
    rt.invalidate()
    yield
    with SessionLocal() as db:
        for row in db.query(SystemSetting).all():
            row.value = snapshot.get(row.key)
        db.commit()
    rate_limit.reset()
    rt.invalidate()


@pytest.fixture()
def db(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'hardening.db').as_posix()}", future=True)
    AuthBase.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    yield session
    session.close()
    engine.dispose()


# ====================================================================================================
# Password policy
# ====================================================================================================
@pytest.mark.parametrize("weak", ["Password1", "Passw0rd123!", "Welcome@2024", "qwertyuiop", "12345678", "aaaaaaaa",
                                  "abcdefgh", "Admin#123", "P@ssword", "letmein99", "Summer2024", "Nexus@2026",
                                  "11111112", "ababababab"])
def test_common_passwords_are_refused(weak):
    assert password_policy.violation(weak), weak


@pytest.mark.parametrize("fine", ["NewPassw0rd!x", "OriginalPass1", "twelve-chars", "correct horse battery staple",
                                  "Tr0ub4dor&3", "Blue-Harbor-4821"])
def test_reasonable_passwords_are_accepted(fine):
    assert password_policy.violation(fine) is None, fine


def test_passwords_may_not_contain_the_owners_name_or_email():
    assert password_policy.violation("xjane.doe123", email="jane.doe@corp.com") == "it contains your email name"
    assert password_policy.violation("MariaSecret77", name="Maria Gonzalez") == "it contains your name"
    assert password_policy.violation("MariaSecret77", name="Al Li") is None       # parts under 4 letters are ignored
    assert password_policy.violation("Blue-Harbor-4821", email="rit@x.co", name="Rita") is None


def test_the_admin_bar_is_stricter():
    assert password_policy.is_weak_for_admin("970598") and password_policy.is_weak_for_admin("short1!A")
    assert password_policy.is_weak_for_admin("Welcome12345")
    assert not password_policy.is_weak_for_admin("Orchard-Velvet-Lantern-52")


def test_generated_temporary_passwords_always_pass_the_policy():
    for _ in range(300):
        assert password_policy.violation(generate_temp_password()) is None


def test_the_policy_applies_when_choosing_and_when_creating(client, admin):
    r = client.post(f"{API}/admin/staff", headers=admin,
                    json={"name": "Weak One", "email": new_email("weak"), "role": "Recruiter", "password": "Password123!"})
    assert r.status_code == 422 and "stronger password" in r.json()["detail"]
    r = client.post(f"{API}/admin/staff", headers=admin,
                    json={"name": "Named Person", "email": new_email("named"), "role": "Recruiter",
                          "password": "NamedPerson-2026-x"})
    assert r.status_code == 422 and "your name" in r.json()["detail"]

    user, temp = create_staff(client, admin, "Recruiter", "chooser")
    token = sign_in(client, "recruiter", user["email"], temp)["accessToken"]
    change = lambda new: client.post(f"{API}/recruiter/auth/change-password", headers=auth(token),  # noqa: E731
                                     json={"currentPassword": temp, "newPassword": new})
    for refused in ("Welcome2024!", "12345678", "aaaaaaaaaa"):
        assert change(refused).status_code == 422, refused
    assert change(user["email"].split("@")[0] + "!!").status_code == 422          # their own email name
    assert change("Blue-Harbor-4821").status_code == 200


# ====================================================================================================
# Rate limiter
# ====================================================================================================
def test_sliding_window_counts_and_recovers():
    key = "unit:1.2.3.4"
    for i in range(3):
        assert rate_limit.check(key, 3, now=100.0 + i) == (True, 0, False)
    allowed, retry_after, first = rate_limit.check(key, 3, now=103.0)
    assert (allowed, first) == (False, True) and 1 <= retry_after <= 60
    assert rate_limit.check(key, 3, now=104.0)[0:3:2] == (False, False)          # same burst: not "first" again
    assert rate_limit.check(key, 3, now=159.9)[0] is False                         # the 100.0 hit is 59.9 s old
    assert rate_limit.check(key, 3, now=160.1)[0] is True                          # ... and 60.1 s old: its slot is free
    assert rate_limit.check("unit:other", 3, now=103.0)[0] is True                 # other keys are independent
    # a new burst after a quiet minute is reported as "first" again
    for t in (200.0, 201.0, 202.0):
        rate_limit.check("unit:burst", 3, now=t)
    assert rate_limit.check("unit:burst", 3, now=203.0)[2] is True
    assert rate_limit.check("unit:burst", 3, now=270.0)[0] is True
    for t in (270.1, 270.2):
        rate_limit.check("unit:burst", 3, now=t)
    assert rate_limit.check("unit:burst", 3, now=270.3) == (False, rate_limit.check("unit:burst", 3, now=270.3)[1], True)


def test_the_retry_after_value_counts_down():
    for t in (0.0, 10.0):
        rate_limit.check("unit:retry", 2, now=t)
    assert rate_limit.check("unit:retry", 2, now=20.0)[1] == 41                    # oldest hit expires at t=60
    assert rate_limit.check("unit:retry", 2, now=59.0)[1] == 2


def test_memory_is_bounded(monkeypatch):
    monkeypatch.setattr(rate_limit, "MAX_TRACKED_KEYS", 50)
    for i in range(500):
        rate_limit.check(f"flood:{i}", 5, now=1000.0 + i * 0.01)
    assert len(rate_limit._hits) <= 60


def test_bucket_allowances_are_scaled_from_the_setting(monkeypatch):
    monkeypatch.setattr(rate_limit.rt, "get_int", lambda key: 100)
    assert {b: rate_limit.limit_for(b) for b in rate_limit.BUCKET_FACTORS} == {
        "login": 100, "verify": 100, "resend": 25, "password": 25, "refresh": 300, "candidate": 100}
    monkeypatch.setattr(rate_limit.rt, "get_int", lambda key: 1)
    assert rate_limit.limit_for("resend") == 1                                    # never rounds down to zero
    with pytest.raises(ValueError):
        rate_limit.rate_limit("no-such-bucket")


def set_limit(client, admin, value, expect=200):
    r = client.patch(f"{API}/admin/settings/security", json={"authRateLimitPerMinute": value}, headers=admin)
    assert r.status_code == expect, r.text
    return r


def test_the_limit_is_a_validated_setting(client, admin):
    assert client.get(f"{API}/admin/settings/security", headers=admin).json()["authRateLimitPerMinute"] == 10000
    set_limit(client, admin, 0, 422)
    set_limit(client, admin, 10001, 422)
    set_limit(client, admin, "5", 422)
    assert set_limit(client, admin, 5).json()["authRateLimitPerMinute"] == 5


def test_sign_in_attempts_are_limited_per_ip_and_the_block_is_recorded_once(client, admin):
    set_limit(client, admin, 5)
    rate_limit.reset()
    ghost = new_email("ghost")
    for _ in range(5):
        assert start_login(client, "recruiter", ghost, "whatever").status_code == 401
    blocked = start_login(client, "recruiter", ghost, "whatever")
    assert blocked.status_code == 429 and "Too many requests" in blocked.json()["detail"]
    assert 1 <= int(blocked.headers["retry-after"]) <= 60
    assert start_login(client, "recruiter", ghost, "whatever").status_code == 429

    # even the right password is refused while limited, and a spoofed X-Forwarded-For does not help
    assert start_login(client, "admin", **ADMIN).status_code == 429
    spoof = client.post(f"{API}/recruiter/auth/login", json={"email": ghost, "password": "x"},
                        headers={"X-Forwarded-For": "203.0.113.77"})
    assert spoof.status_code == 429

    events = login_rows(event="rate_limited")
    assert len(events) == 1 and events[0].failure_reason == "login" and events[0].ip_address == "testclient"
    assert events[0].success is False

    rate_limit.reset()
    assert start_login(client, "recruiter", ghost, "whatever").status_code == 401   # window cleared: allowed again


def test_each_endpoint_has_its_own_allowance(client, admin):
    set_limit(client, admin, 5)
    rate_limit.reset()
    for _ in range(5):
        start_login(client, "recruiter", new_email("g"), "x")
    assert start_login(client, "recruiter", new_email("g"), "x").status_code == 429       # login is used up ...
    verify = client.post(f"{API}/recruiter/auth/verify-otp", json={"challengeId": "nope", "otp": "000000"})
    assert verify.status_code == 401                                                       # ... verify-otp is not
    refresh = client.post(f"{API}/recruiter/auth/refresh")
    assert refresh.status_code != 429                                                      # ... nor refresh (3x as many)


def test_resend_and_password_change_get_a_quarter(client, admin):
    set_limit(client, admin, 5)                                                            # a quarter of 5 is 1
    rate_limit.reset()
    resend = lambda: client.post(f"{API}/recruiter/auth/resend-otp", json={"challengeId": "nope"})  # noqa: E731
    assert resend().status_code == 400
    assert resend().status_code == 429
    change = lambda: client.post(f"{API}/recruiter/auth/change-password",  # noqa: E731
                                 json={"currentPassword": "a", "newPassword": "b"})
    assert change().status_code == 401                                                     # the limiter lets it through
    assert change().status_code == 429


def test_candidate_endpoints_are_limited_too(client, admin):
    set_limit(client, admin, 5)
    rate_limit.reset()
    attempt = lambda: client.post(f"{API}/candidate/verify", json={"inviteToken": "not-a-token", "otp": "123456"})  # noqa: E731
    for _ in range(5):
        assert attempt().status_code == 401
    assert attempt().status_code == 429


def test_blocked_requests_show_on_the_dashboard(client, admin):
    def blocked():
        r = client.get(f"{API}/admin/dashboard/security", params={"hours": 24}, headers=admin)
        return r.json()["totals"]["rateLimited"]
    before = blocked()
    set_limit(client, admin, 2)
    rate_limit.reset()
    for _ in range(4):
        start_login(client, "recruiter", new_email("g"), "x")
    assert blocked() == before + 1                                                         # one burst = one event


# ====================================================================================================
# HTTP hardening: headers, request size, CORS
# ====================================================================================================
def test_every_response_carries_the_defensive_headers(client):
    for path in ("/health", "/", f"{API}/admin/staff", f"{API}/policy/general"):           # 200 and 401 alike
        h = client.get(path).headers
        assert h["x-content-type-options"] == "nosniff", path
        assert h["x-frame-options"] == "DENY" and h["referrer-policy"] == "no-referrer", path
        assert h["content-security-policy"] == "default-src 'none'; frame-ancestors 'none'", path
        assert h["cache-control"] == "no-store" and "camera=()" in h["permissions-policy"], path
        assert "strict-transport-security" not in h, path                                   # only over HTTPS


def test_hsts_is_sent_once_cookies_are_secure(client, monkeypatch):
    monkeypatch.setattr(settings, "COOKIE_SECURE", True)
    assert "max-age=31536000" in client.get("/health").headers["strict-transport-security"]


def test_the_interactive_docs_keep_working(client):
    docs = client.get("/docs")
    assert docs.status_code == 200
    assert "content-security-policy" not in docs.headers and docs.headers["x-content-type-options"] == "nosniff"


def test_oversized_bodies_are_rejected_before_they_are_read(client, monkeypatch):
    monkeypatch.setattr(settings, "MAX_REQUEST_BYTES", 60)
    big = client.post(f"{API}/admin/auth/login", json={"email": "a" * 200, "password": "b"})
    assert big.status_code == 413 and big.json() == {"detail": "The request body is too large."}
    assert big.headers["x-content-type-options"] == "nosniff"                               # headers still applied
    small = client.post(f"{API}/admin/auth/login", json={"email": "a@b.co", "password": "b"})
    assert small.status_code == 401


def test_cors_allows_only_configured_origins_with_credentials(client):
    ok = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert ok.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert ok.headers["access-control-allow-credentials"] == "true"
    exposed = ok.headers["access-control-expose-headers"]
    assert all(h in exposed for h in ("Retry-After", "Content-Disposition", "X-Export-Truncated"))

    evil = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in evil.headers

    pre = client.options(f"{API}/admin/staff", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "authorization,content-type"})
    assert pre.status_code == 200 and "PATCH" in pre.headers["access-control-allow-methods"]
    bad_pre = client.options(f"{API}/admin/staff", headers={
        "Origin": "https://evil.example", "Access-Control-Request-Method": "PATCH"})
    assert bad_pre.status_code == 400
    wrong_method = client.options(f"{API}/admin/staff", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "TRACE"})
    assert wrong_method.status_code == 400


# ====================================================================================================
# Secrets: nothing hardcoded, nothing committed
# ====================================================================================================
def test_signing_key_comes_from_the_environment_or_a_local_ignored_file(tmp_path):
    key_file = tmp_path / ".dev_secret_key"
    assert load_secret_key(key_file, environ={"SECRET_KEY": "  from-env  "}, production=False) == "from-env"
    assert not key_file.exists()

    first = load_secret_key(key_file, environ={}, production=False)       # development: generated once ...
    assert len(first) >= 48 and key_file.read_text() == first
    assert load_secret_key(key_file, environ={}, production=False) == first   # ... and then kept stable
    assert first not in KNOWN_LEAKED_SECRET_KEYS

    assert load_secret_key(tmp_path / "other", environ={}, production=True) == ""   # production: never invented
    assert not (tmp_path / "other").exists()


def test_the_real_signing_key_is_not_the_leaked_one():
    assert settings.SECRET_KEY not in KNOWN_LEAKED_SECRET_KEYS and len(settings.SECRET_KEY) >= 32


def test_secrets_have_no_hardcoded_defaults_in_the_source():
    source = (BACKEND / "app" / "core" / "config.py").read_text(encoding="utf-8")
    for name in ("SECRET_KEY", "SETTINGS_ENCRYPTION_KEY", "GMAIL_APP_PASSWORD", "GMAIL_SENDER_EMAIL",
                 "SEED_ADMIN_PASSWORD"):
        assert not re.search(rf'getenv\(\s*"{name}"\s*,\s*"[^"]+"', source), f"{name} has a hardcoded default"
    for path in (BACKEND / "app").rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        for leaked in KNOWN_LEAKED_SECRET_KEYS:
            assert leaked not in text or path.name == "config.py", f"{path.name} contains a published key"


def test_environment_files_are_not_tracked_by_git():
    ignore = (REPO / ".gitignore").read_text(encoding="utf-8").splitlines()
    for pattern in (".env", ".env.*", "!.env.example", "backend/.dev_secret_key"):
        assert pattern in ignore, f".gitignore must contain {pattern}"
    if shutil.which("git") and (REPO / ".git").exists():
        tracked = subprocess.run(["git", "ls-files"], cwd=REPO, capture_output=True, text=True).stdout.splitlines()
        offenders = [f for f in tracked if re.search(r"(^|/)\.env($|\.)", f) and not f.endswith(".example")]
        assert offenders == [], f"secret-bearing files are tracked: {offenders}"


# ====================================================================================================
# Production startup check
# ====================================================================================================
def prod_settings(**overrides):
    base = dict(
        SECRET_KEY="k" * 48, DEV_EXPOSE_OTP=False, COOKIE_SECURE=True, COOKIE_SAMESITE="lax",
        CORS_ORIGINS=["https://app.example.com"], FRONTEND_URL="https://app.example.com",
        AUTH_DATABASE_URL="postgresql+pg8000://u:p@db.example.com:5432/postgres", SEED_ADMIN_PASSWORD="",
        SETTINGS_ENCRYPTION_KEY="x", ALLOWED_HOSTS=["api.example.com"], TRUST_PROXY=True, ENABLE_DOCS=False,
        IS_PRODUCTION=True)
    base.update(overrides)
    return SimpleNamespace(**base)


def test_a_correct_production_configuration_passes_cleanly():
    assert prod_checks.config_problems(prod_settings()) == ([], [])
    prod_checks.enforce_startup_checks(prod_settings())                                      # no exception


@pytest.mark.parametrize("override,expected", [
    ({"SECRET_KEY": ""}, "SECRET_KEY is not set"),
    ({"SECRET_KEY": next(iter(KNOWN_LEAKED_SECRET_KEYS))}, "published in the source"),
    ({"SECRET_KEY": "short"}, "too short"),
    ({"DEV_EXPOSE_OTP": True}, "DEV_EXPOSE_OTP"),
    ({"COOKIE_SECURE": False}, "COOKIE_SECURE"),
    ({"CORS_ORIGINS": ["http://app.example.com"]}, "not https"),
    ({"CORS_ORIGINS": ["https://localhost:3000"]}, "localhost"),
    ({"CORS_ORIGINS": ["*"]}, "wildcard"),
    ({"CORS_ORIGINS": []}, "CORS_ORIGINS is empty"),
    ({"FRONTEND_URL": "http://app.example.com"}, "FRONTEND_URL"),
    ({"AUTH_DATABASE_URL": "sqlite:///./x.db"}, "SQLite"),
    ({"SEED_ADMIN_PASSWORD": "970598"}, "SEED_ADMIN_PASSWORD"),
    ({"SEED_ADMIN_PASSWORD": "Welcome12345"}, "SEED_ADMIN_PASSWORD"),
])
def test_each_unsafe_production_setting_blocks_the_start(override, expected):
    errors, _ = prod_checks.config_problems(prod_settings(**override))
    assert any(expected in e for e in errors), errors
    with pytest.raises(RuntimeError) as err:
        prod_checks.enforce_startup_checks(prod_settings(**override))
    assert "Refusing to start in production" in str(err.value) and expected in str(err.value)


def test_all_problems_are_listed_at_once_and_warnings_never_block():
    everything_wrong = prod_settings(SECRET_KEY="", DEV_EXPOSE_OTP=True, COOKIE_SECURE=False)
    with pytest.raises(RuntimeError) as err:
        prod_checks.enforce_startup_checks(everything_wrong)
    assert str(err.value).count("\n  - ") >= 3

    only_warnings = prod_settings(SETTINGS_ENCRYPTION_KEY="", ALLOWED_HOSTS=[], TRUST_PROXY=False, ENABLE_DOCS=True)
    errors, warnings = prod_checks.config_problems(only_warnings)
    assert errors == [] and len(warnings) == 4
    prod_checks.enforce_startup_checks(only_warnings)                                        # starts, with warnings


def test_development_only_warns(caplog):
    dev = prod_settings(IS_PRODUCTION=False, DEV_EXPOSE_OTP=True, COOKIE_SECURE=False, SECRET_KEY="short")
    with caplog.at_level(logging.WARNING, logger="nexus.config"):
        prod_checks.enforce_startup_checks(dev)                                              # never raises outside production
    assert any("would block a production start" in r.message for r in caplog.records)


# ====================================================================================================
# The first admin account
# ====================================================================================================
def test_a_generated_admin_password_is_shown_once_and_must_be_changed(db, monkeypatch, caplog):
    monkeypatch.setattr(settings, "SEED_ADMIN_EMAIL", "first@admin.test")
    monkeypatch.setattr(settings, "SEED_ADMIN_PASSWORD", "")
    with caplog.at_level(logging.WARNING, logger="nexus.bootstrap"):
        password = bootstrap.ensure_seed_admin(db)
    assert password and password_policy.violation(password) is None
    admin_row = db.query(StaffUser).one()
    assert verify_password(password, admin_row.password_hash)
    assert admin_row.must_change_password is True and admin_row.role == "System Admin"
    assert any(password in record.getMessage() for record in caplog.records)                 # the one place it appears
    assert bootstrap.ensure_seed_admin(db) is None and db.query(StaffUser).count() == 1      # never re-created


def test_an_explicit_admin_password_is_trusted_and_never_logged(db, monkeypatch, caplog):
    monkeypatch.setattr(settings, "SEED_ADMIN_EMAIL", "chosen@admin.test")
    monkeypatch.setattr(settings, "SEED_ADMIN_PASSWORD", "Orchard-Velvet-Lantern-52")
    with caplog.at_level(logging.DEBUG):
        assert bootstrap.ensure_seed_admin(db) is None
    admin_row = db.query(StaffUser).one()
    assert verify_password("Orchard-Velvet-Lantern-52", admin_row.password_hash)
    assert admin_row.must_change_password is False
    assert "Orchard-Velvet-Lantern-52" not in caplog.text


def _admin(db, password, **kw):
    user = StaffUser(email="admin@7666", otp_email="a@x.co", full_name="Admin", role="System Admin",
                     password_hash=hash_password(password), **kw)
    db.add(user)
    db.commit()
    return user


def test_known_weak_admin_passwords_are_retired_at_startup(db, monkeypatch):
    monkeypatch.setattr(settings, "SEED_ADMIN_EMAIL", "admin@7666")
    monkeypatch.setattr(settings, "SEED_ADMIN_PASSWORD", "")
    user = _admin(db, "970598")                                                              # the published default
    assert bootstrap.enforce_admin_password_policy(db) == ["admin@7666"]
    assert user.must_change_password is True and user.sessions_valid_after is not None       # signed out, must change
    entry = db.query(__import__("app.models.auth", fromlist=["AuditLog"]).AuditLog).filter_by(
        action="security.password_change_forced").one()
    assert entry.actor_email == "admin@7666" and "970598" not in str(entry.details) + entry.summary
    assert bootstrap.enforce_admin_password_policy(db) == []                                 # already pending: no repeat


def test_a_weak_configured_seed_password_is_retired_but_a_strong_one_is_left_alone(db, monkeypatch):
    monkeypatch.setattr(settings, "SEED_ADMIN_EMAIL", "admin@7666")
    monkeypatch.setattr(settings, "SEED_ADMIN_PASSWORD", "weakpass1")
    weak = _admin(db, "weakpass1")
    assert bootstrap.enforce_admin_password_policy(db) == ["admin@7666"] and weak.must_change_password

    db.delete(weak)
    db.commit()
    monkeypatch.setattr(settings, "SEED_ADMIN_PASSWORD", "Orchard-Velvet-Lantern-52")
    strong = _admin(db, "Orchard-Velvet-Lantern-52")
    assert bootstrap.enforce_admin_password_policy(db) == [] and strong.must_change_password is False

    strong.password_hash = hash_password("a-password-the-admin-chose-themselves")             # changed since seeding
    db.commit()
    assert bootstrap.enforce_admin_password_policy(db) == []


# ====================================================================================================
# Health report reflects the new rules
# ====================================================================================================
def test_health_flags_leaked_and_weak_signing_keys(monkeypatch):
    def findings():
        with SessionLocal() as session:
            return {f["id"] for f in health.security_findings(session)}
    assert not {"leaked-secret-key", "weak-secret-key"} & findings()
    monkeypatch.setattr(settings, "SECRET_KEY", next(iter(KNOWN_LEAKED_SECRET_KEYS)))
    assert "leaked-secret-key" in findings()
    monkeypatch.setattr(settings, "SECRET_KEY", "too-short")
    assert "weak-secret-key" in findings()


def test_health_report_names_the_environment(client, admin):
    report = client.get(f"{API}/admin/dashboard/health", headers=admin).json()
    assert report["environment"] == "test"
