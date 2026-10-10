"""Phase 3: System-Admin settings API, runtime effect of the settings, encrypted SMTP password, policy endpoints."""
import json
import smtplib
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient
from helpers import (ADMIN, API, audit_rows, auth, create_staff, new_email, recruiter_token, sign_in,
                     start_login)

from app.api import admin_settings
from app.api.settings_models import OUT_MODELS, UPDATE_MODELS
from app.core import crypto
from app.core.default_settings import GROUPS, SETTINGS_BY_GROUP
from app.db.session import SessionLocal
from app.main import app
from app.models.auth import SystemSetting
from app.services import email as email_service
from app.services import runtime_settings as rt

S = f"{API}/admin/settings"


# ---------------------------------------------------------------- fixtures
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
def restore_settings():
    """Every test starts from, and leaves behind, exactly the settings it found."""
    with SessionLocal() as db:
        snapshot = {r.key: r.value for r in db.query(SystemSetting).all()}
    admin_settings._last_email_test.clear()
    rt.invalidate()
    yield
    with SessionLocal() as db:
        for row in db.query(SystemSetting).all():
            row.value = snapshot.get(row.key)
        db.commit()
    rt.invalidate()


def patch(client, admin, group, body, expect=200):
    r = client.patch(f"{S}/{group}", json=body, headers=admin)
    assert r.status_code == expect, r.text
    return r.json()


def get(client, admin, group):
    r = client.get(f"{S}/{group}", headers=admin)
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------- access control
GROUP_PATHS = [f"/admin/settings/{g}" for g in GROUPS]


@pytest.mark.parametrize("path", GROUP_PATHS + ["/admin/settings"])
def test_reads_are_admin_only(client, admin, path):
    assert client.get(f"{API}{path}").status_code == 401
    _, token = recruiter_token(client, admin, "reader")
    assert client.get(f"{API}{path}", headers=auth(token)).status_code == 403
    assert client.get(f"{API}{path}", headers=admin).status_code == 200


@pytest.mark.parametrize("group", GROUPS)
def test_writes_are_admin_only(client, admin, group):
    assert client.patch(f"{S}/{group}", json={}).status_code == 401
    _, token = recruiter_token(client, admin, "writer")
    assert client.patch(f"{S}/{group}", json={}, headers=auth(token)).status_code == 403


def test_email_extras_are_admin_only(client, admin):
    _, token = recruiter_token(client, admin, "mailer")
    assert client.post(f"{S}/email/test", json={}).status_code == 401
    assert client.post(f"{S}/email/test", json={}, headers=auth(token)).status_code == 403
    assert client.delete(f"{S}/email/password").status_code == 401
    assert client.delete(f"{S}/email/password", headers=auth(token)).status_code == 403


# ---------------------------------------------------------------- reading
def test_overview_has_every_group_and_never_a_secret(client, admin):
    everything = client.get(S, headers=admin).json()
    assert set(everything) == set(GROUPS)
    assert everything["proctoring"]["maxTabSwitches"] == 3
    assert "smtpPassword" not in everything["email"]
    assert everything["email"]["smtpPasswordSet"] in (True, False)
    assert everything["email"]["smtpPasswordSource"] in ("database", "environment", "none")
    for group in GROUPS:  # each group endpoint serves exactly its slice of the overview
        assert get(client, admin, group) == everything[group]


def test_security_defaults_were_seeded_from_the_environment(client, admin):
    sec = get(client, admin, "security")  # the test environment sets LOGIN_MAX_FAILURES=3, resend cooldown=0
    assert sec["loginMaxFailures"] == 3 and sec["otpResendCooldownSeconds"] == 0
    assert sec["minPasswordLength"] == 8


# ---------------------------------------------------------------- writing + audit
def test_partial_update_changes_only_what_was_sent_and_is_audited(client, admin):
    before = get(client, admin, "proctoring")
    after = patch(client, admin, "proctoring", {"maxTabSwitches": 4, "detectPhone": False})
    assert after["maxTabSwitches"] == 4 and after["detectPhone"] is False
    assert {k: v for k, v in after.items() if k not in ("maxTabSwitches", "detectPhone")} == \
           {k: v for k, v in before.items() if k not in ("maxTabSwitches", "detectPhone")}
    assert get(client, admin, "proctoring") == after  # persisted

    entry = audit_rows(action="settings.update", target_id="proctoring")[-1]
    assert entry.category == "settings" and entry.actor_email == ADMIN["email"] and entry.ip_address
    assert entry.details["changes"] == {"maxTabSwitches": {"from": 3, "to": 4},
                                        "detectPhone": {"from": True, "to": False}}
    assert "maxTabSwitches: 3 -> 4" in entry.summary


def test_unchanged_and_empty_updates_write_no_audit_entry(client, admin):
    audited = len(audit_rows(action="settings.update", target_id="assessment"))
    patch(client, admin, "assessment", {"linkExpirationHours": 48})  # same as current
    patch(client, admin, "assessment", {})
    assert len(audit_rows(action="settings.update", target_id="assessment")) == audited


def test_every_group_can_be_updated_independently(client, admin):
    patch(client, admin, "assessment", {"otpMethod": "email", "allowSectionRevisit": True, "linkExpirationHours": 12})
    patch(client, admin, "general", {"platformName": "  Acme Assess  ", "supportEmail": "help@acme.test"})
    patch(client, admin, "security", {"loginLockoutMinutes": 30})
    assert get(client, admin, "assessment") == {"otpMethod": "email", "linkExpirationHours": 12,
                                                "allowSectionRevisit": True}
    general = get(client, admin, "general")
    assert general == {"platformName": "Acme Assess", "supportEmail": "help@acme.test"}  # trimmed
    assert get(client, admin, "security")["loginLockoutMinutes"] == 30
    assert get(client, admin, "proctoring")["maxTabSwitches"] == 3  # other groups untouched
    patch(client, admin, "general", {"supportEmail": ""})  # an empty support address is allowed
    assert get(client, admin, "general")["supportEmail"] == ""


# ---------------------------------------------------------------- validation
@pytest.mark.parametrize("group,body", [
    ("proctoring", {"maxTabSwitches": 0}),
    ("proctoring", {"maxTabSwitches": 21}),
    ("proctoring", {"maxViolationsBeforeTerminate": 51}),
    ("proctoring", {"maxTabSwitches": "5"}),            # strict types: no string -> int coercion
    ("proctoring", {"maxTabSwitches": True}),           # ... and a bool is not a number
    ("proctoring", {"maxTabSwitches": 2.5}),
    ("proctoring", {"detectPhone": "yes"}),
    ("proctoring", {"detectPhone": 1}),
    ("proctoring", {"proctoringSensitivity": "extreme"}),
    ("proctoring", {"maxTabSwitches": None}),
    ("proctoring", {"notASetting": 1}),
    ("assessment", {"otpMethod": "carrier-pigeon"}),
    ("assessment", {"linkExpirationHours": 0}),
    ("assessment", {"linkExpirationHours": 337}),
    ("security", {"otpExpireMinutes": 61}),
    ("security", {"otpMaxAttempts": 0}),
    ("security", {"loginMaxFailures": 21}),
    ("security", {"accessTokenExpireMinutes": 4}),
    ("security", {"refreshTokenExpireDays": 91}),
    ("security", {"minPasswordLength": 7}),
    ("security", {"minPasswordLength": 65}),
    ("email", {"smtpPort": 0}),
    ("email", {"smtpPort": 65536}),
    ("email", {"smtpHost": "not a host"}),
    ("email", {"smtpHost": "bad_host!.com"}),
    ("email", {"smtpHost": "-leading-dash.com"}),
    ("email", {"smtpHost": ""}),
    ("email", {"smtpHost": "x" * 254}),
    ("email", {"senderEmail": "not-an-email"}),
    ("email", {"senderEmail": "a@b"}),
    ("email", {"senderEmail": "two@@example.com"}),
    ("email", {"senderName": ""}),
    ("email", {"senderName": "Evil\r\nBcc: attacker@example.com"}),
    ("email", {"senderName": "Name <x@y.z>"}),
    ("email", {"smtpPassword": ""}),
    ("email", {"smtpPassword": "line\nbreak"}),
    ("general", {"platformName": ""}),
    ("general", {"platformName": "   "}),
    ("general", {"platformName": "x" * 81}),
    ("general", {"supportEmail": "nope"}),
])
def test_invalid_values_are_rejected_and_nothing_is_saved(client, admin, group, body):
    before = get(client, admin, group)
    audited = len(audit_rows(action="settings.update", target_id=group))
    r = client.patch(f"{S}/{group}", json=body, headers=admin)
    assert r.status_code == 422, r.text
    assert get(client, admin, group) == before
    assert len(audit_rows(action="settings.update", target_id=group)) == audited  # (the trail only ever grows)


def test_all_or_nothing_when_one_value_in_the_request_is_invalid(client, admin):
    before = get(client, admin, "proctoring")
    r = client.patch(f"{S}/proctoring", json={"detectPhone": False, "maxTabSwitches": 99}, headers=admin)
    assert r.status_code == 422
    assert get(client, admin, "proctoring") == before  # the valid detectPhone change was not applied either


def test_rules_that_span_several_values(client, admin):
    r = client.patch(f"{S}/proctoring", json={"maxViolationsBeforeTerminate": 2}, headers=admin)  # tab limit is 3
    assert r.status_code == 422 and "maxTabSwitches" in r.json()["detail"]
    r = client.patch(f"{S}/proctoring", json={"maxTabSwitches": 10}, headers=admin)  # terminate limit is 5
    assert r.status_code == 422
    patch(client, admin, "proctoring", {"maxTabSwitches": 10, "maxViolationsBeforeTerminate": 12})  # together: fine

    r = client.patch(f"{S}/security", json={"otpResendCooldownSeconds": 600}, headers=admin)  # 10 min lifetime
    assert r.status_code == 422 and "otpResendCooldownSeconds" in r.json()["detail"]
    patch(client, admin, "security", {"otpExpireMinutes": 1, "otpResendCooldownSeconds": 59})
    r = client.patch(f"{S}/security", json={"otpResendCooldownSeconds": 60}, headers=admin)
    assert r.status_code == 422


def test_generated_models_match_the_catalogue():
    for group in GROUPS:
        keys = {s["key"] for s in SETTINGS_BY_GROUP[group]}
        assert set(UPDATE_MODELS[group].model_fields) == keys
        secret = {s["key"] for s in SETTINGS_BY_GROUP[group] if s["secret"]}
        extra = {"smtpPasswordSet", "smtpPasswordSource"} if group == "email" else set()
        assert set(OUT_MODELS[group].model_fields) == (keys - secret) | extra
    assert "smtpPassword" not in OUT_MODELS["email"].model_fields


# ---------------------------------------------------------------- the settings really take effect
def test_otp_and_session_lifetimes_apply_at_once(client, admin):
    patch(client, admin, "security", {"otpExpireMinutes": 7, "accessTokenExpireMinutes": 10})
    ch = start_login(client, "admin", **ADMIN).json()
    assert ch["expiresInSeconds"] == 7 * 60
    r = client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200 and r.json()["expiresIn"] == 10 * 60


def test_lockout_threshold_is_a_setting(client, admin):
    patch(client, admin, "security", {"loginMaxFailures": 2})
    user, temp = create_staff(client, admin, "Recruiter", "lockset")
    for _ in range(2):
        assert start_login(client, "recruiter", user["email"], "wrong-password").status_code == 401
    assert start_login(client, "recruiter", user["email"], temp).status_code == 429  # locked after just 2


def test_minimum_password_length_is_a_setting(client, admin):
    patch(client, admin, "security", {"minPasswordLength": 12})
    body = {"name": "Short", "email": new_email("short"), "role": "Recruiter", "password": "elevenchars"}
    r = client.post(f"{API}/admin/staff", json=body, headers=admin)
    assert r.status_code == 422 and "at least 12" in r.json()["detail"]
    body.update(email=new_email("long"), password="twelve-chars")
    assert client.post(f"{API}/admin/staff", json=body, headers=admin).status_code == 201


def test_default_invite_lifetime_is_a_setting_but_an_explicit_one_wins(client, admin):
    patch(client, admin, "assessment", {"linkExpirationHours": 5})
    _, token = recruiter_token(client, admin, "inviter")
    expiry = lambda r: datetime.fromisoformat(r.json()["expiresAt"])  # noqa: E731
    now = datetime.now(timezone.utc)

    r = client.post(f"{API}/recruiter/candidates/invites", headers=auth(token),
                    json={"name": "C One", "email": "c.one@example.com", "assessmentId": "a1"})
    assert r.status_code == 201 and abs(expiry(r) - (now + timedelta(hours=5))) < timedelta(minutes=2)

    r = client.post(f"{API}/recruiter/candidates/invites", headers=auth(token),
                    json={"name": "C Two", "email": "c.two@example.com", "assessmentId": "a1", "expiresInHours": 2})
    assert abs(expiry(r) - (now + timedelta(hours=2))) < timedelta(minutes=2)


# ---------------------------------------------------------------- SMTP password: encrypted, write-only
def test_smtp_password_is_encrypted_never_returned_and_never_logged(client, admin):
    secret = "abcd efgh ijkl mnop"
    out = patch(client, admin, "email", {"smtpPassword": secret})
    assert out["smtpPasswordSet"] is True and out["smtpPasswordSource"] == "database"
    assert "smtpPassword" not in out

    for body in (client.get(S, headers=admin).text, client.get(f"{S}/email", headers=admin).text):
        assert secret not in body and secret.replace(" ", "") not in body

    with SessionLocal() as db:
        stored = db.get(SystemSetting, "smtpPassword").value
    assert stored and secret not in stored and "abcd" not in stored  # ciphertext at rest
    assert crypto.decrypt_secret(stored) == secret                  # ... that decrypts back (spaces kept)
    assert rt.get("smtpPassword") == secret and rt.email_config().password_source == "database"

    entry = audit_rows(action="settings.update", target_id="email")[-1]
    assert entry.details["changes"]["smtpPassword"] == "[redacted]"
    assert "smtpPassword changed" in entry.summary
    assert secret not in json.dumps(entry.details) + entry.summary

    # saving the same password again is not a change
    count = len(audit_rows(action="settings.update", target_id="email"))
    patch(client, admin, "email", {"smtpPassword": secret})
    assert len(audit_rows(action="settings.update", target_id="email")) == count


def test_clearing_the_smtp_password_falls_back_to_the_environment(client, admin):
    patch(client, admin, "email", {"smtpPassword": "first-password-1234"})
    out = client.delete(f"{S}/email/password", headers=admin).json()
    assert out["smtpPasswordSource"] in ("environment", "none")
    assert rt.get("smtpPassword") is None
    assert len(audit_rows(action="settings.email_password_cleared")) == 1
    client.delete(f"{S}/email/password", headers=admin)  # nothing left to clear: no second audit entry
    assert len(audit_rows(action="settings.email_password_cleared")) == 1


def test_a_password_that_cannot_be_decrypted_counts_as_unset():
    assert crypto.decrypt_secret("garbage") is None and crypto.decrypt_secret(None) is None
    token = crypto.encrypt_secret("p@ss")
    assert token != "p@ss" and crypto.decrypt_secret(token) == "p@ss"


# ---------------------------------------------------------------- the gateway uses the saved settings
class _FakeSMTP:
    instances = []
    fail_login = None

    def __init__(self, host, port, timeout=None, context=None):
        self.host, self.port, self.calls = host, port, []
        _FakeSMTP.instances.append(self)

    def ehlo(self):
        self.calls.append("ehlo")

    def starttls(self, context=None):
        self.calls.append("starttls")

    def login(self, user, password):
        if _FakeSMTP.fail_login:
            raise _FakeSMTP.fail_login
        self.calls.append(("login", user, password))

    def sendmail(self, sender, to, message):
        self.calls.append(("sendmail", sender, to, message))

    def quit(self):
        self.calls.append("quit")


class _FakeSMTPSSL(_FakeSMTP):
    pass


@pytest.fixture()
def fake_smtp(monkeypatch):
    _FakeSMTP.instances, _FakeSMTP.fail_login = [], None
    monkeypatch.setattr(email_service.smtplib, "SMTP", _FakeSMTP)
    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", _FakeSMTPSSL)
    return _FakeSMTP


def test_email_is_sent_through_the_saved_gateway(client, admin, fake_smtp):
    patch(client, admin, "email", {"smtpHost": "smtp.example.test", "smtpPort": 2525,
                                   "senderEmail": "noreply@example.test", "senderName": "Acme Hiring",
                                   "smtpPassword": "abcd efgh ijkl mnop"})
    ok, message = email_service.send_email_detailed("cand@example.com", "Hello", "<p>hi</p>")
    assert ok, message
    smtp = fake_smtp.instances[-1]
    assert (smtp.host, smtp.port) == ("smtp.example.test", 2525)
    assert "starttls" in smtp.calls
    assert ("login", "noreply@example.test", "abcdefghijklmnop") in smtp.calls  # spaces removed
    sent = next(c for c in smtp.calls if isinstance(c, tuple) and c[0] == "sendmail")
    assert "From: Acme Hiring <noreply@example.test>" in sent[3] and sent[2] == ["cand@example.com"]


def test_port_465_uses_implicit_tls(client, admin, fake_smtp):
    patch(client, admin, "email", {"smtpPort": 465, "senderEmail": "noreply@example.test", "smtpPassword": "pw-1234"})
    ok, _ = email_service.send_email_detailed("a@b.co", "s", "b")
    smtp = fake_smtp.instances[-1]
    assert ok and isinstance(smtp, _FakeSMTPSSL) and "starttls" not in smtp.calls


@pytest.mark.parametrize("error,hint", [
    (smtplib.SMTPAuthenticationError(535, b"bad credentials"), "App Password"),
    (TimeoutError("timed out"), "did not answer"),
    (ConnectionRefusedError("refused"), "Could not connect"),
])
def test_failures_are_explained_without_leaking_secrets(client, admin, fake_smtp, error, hint):
    patch(client, admin, "email", {"senderEmail": "noreply@example.test", "smtpPassword": "super-secret-pw"})
    fake_smtp.fail_login = error
    ok, message = email_service.send_email_detailed("a@b.co", "s", "b")
    assert ok is False and hint in message
    assert "super-secret-pw" not in message and "bad credentials" not in message


def test_missing_credentials_are_reported(client, admin, monkeypatch):
    monkeypatch.setattr(rt.env, "GMAIL_APP_PASSWORD", "")
    patch(client, admin, "email", {"senderEmail": "noreply@example.test"})
    client.delete(f"{S}/email/password", headers=admin)
    ok, message = email_service.send_email_detailed("a@b.co", "s", "b")
    assert ok is False and "No sender address or SMTP password" in message


# ---------------------------------------------------------------- test-email endpoint
def test_test_email_endpoint(client, admin, monkeypatch):
    sent = []
    monkeypatch.setattr(email_service, "send_email_detailed",
                        lambda to, subject, body, **k: sent.append((to, subject, body)) or (True, "Email sent."))

    r = client.post(f"{S}/email/test", json={}, headers=admin)  # default recipient: the admin's own 2FA address
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["ok"] is True and out["host"] and out["port"]
    assert "@" in out["sentTo"] and "*" in out["sentTo"]  # the address is masked in the response
    assert out["passwordSource"] in ("database", "environment", "none")
    assert len(sent) == 1 and "test email" in sent[0][1]
    real_address = sent[0][0]
    assert out["sentTo"] != real_address
    entry = audit_rows(action="settings.email_test")[-1]
    assert entry.success is True and entry.actor_email == ADMIN["email"]
    assert real_address not in entry.summary  # ... and in the audit trail

    admin_settings._last_email_test.clear()
    r = client.post(f"{S}/email/test", json={"to": "Someone.Else@Example.com"}, headers=admin)
    assert r.status_code == 200 and sent[-1][0] == "someone.else@example.com"


def test_test_email_validates_throttles_and_reports_failure(client, admin, monkeypatch):
    monkeypatch.setattr(email_service, "send_email_detailed",
                        lambda *a, **k: (False, "The SMTP server rejected the sender address / password."))
    assert client.post(f"{S}/email/test", json={"to": "nope"}, headers=admin).status_code == 422
    assert client.post(f"{S}/email/test", json={"unknown": 1}, headers=admin).status_code == 422

    r = client.post(f"{S}/email/test", json={"to": "x@example.com"}, headers=admin)
    assert r.status_code == 200 and r.json()["ok"] is False and "rejected" in r.json()["message"]
    entry = audit_rows(action="settings.email_test")[-1]
    assert entry.success is False

    again = client.post(f"{S}/email/test", json={"to": "x@example.com"}, headers=admin)
    assert again.status_code == 429  # throttled: no mail bombing through the test button


def test_recruiter_cannot_pick_the_smtp_gateway(client, admin, monkeypatch):
    calls = []
    monkeypatch.setattr(email_service, "send_email", lambda *a, **k: calls.append((a, k)) or True)
    _, token = recruiter_token(client, admin, "relay")
    r = client.post(f"{API}/recruiter/send-email", headers=auth(token), json={
        "recipientEmail": "victim@example.com", "subject": "Hi", "bodyHtml": "<b>x</b>",
        "smtpHost": "evil.example", "smtpPort": 25, "smtpUser": "attacker@evil.example", "smtpPassword": "x"})
    assert r.status_code == 200
    args, kwargs = calls[-1]
    assert args == ("victim@example.com", "Hi", "<b>x</b>") and kwargs == {}  # client-supplied gateway ignored


# ---------------------------------------------------------------- read-only policy for the other portals
def test_general_policy_is_public(client, admin):
    patch(client, admin, "general", {"platformName": "Acme Assess", "supportEmail": "help@acme.test"})
    r = client.get(f"{API}/policy/general")
    assert r.status_code == 200
    assert r.json() == {"platformName": "Acme Assess", "supportEmail": "help@acme.test"}


def test_proctoring_and_assessment_policy_need_a_signed_in_principal(client, admin):
    for name in ("proctoring", "assessment"):
        assert client.get(f"{API}/policy/{name}").status_code == 401
    patch(client, admin, "proctoring", {"maxTabSwitches": 2, "requireScreenShare": True})

    assert client.get(f"{API}/policy/proctoring", headers=admin).json()["maxTabSwitches"] == 2

    _, rec_token = recruiter_token(client, admin, "policy")
    r = client.get(f"{API}/policy/proctoring", headers=auth(rec_token))
    assert r.status_code == 200 and r.json()["requireScreenShare"] is True
    assert set(r.json()) == {s["key"] for s in SETTINGS_BY_GROUP["proctoring"]}
    assert client.get(f"{API}/policy/assessment", headers=auth(rec_token)).json()["otpMethod"] == "both"


def test_candidates_can_read_the_policy_but_not_the_admin_settings(client, admin):
    patch(client, admin, "proctoring", {"requireCamera": False})
    _, rec_token = recruiter_token(client, admin, "cand")
    invite = client.post(f"{API}/recruiter/candidates/invites", headers=auth(rec_token),
                         json={"name": "Cand Idate", "email": "cand.idate@example.com", "assessmentId": "a1"}).json()
    invite_token = parse_qs(urlparse(invite["link"]).query)["invite"][0]
    verified = client.post(f"{API}/candidate/verify", json={"inviteToken": invite_token, "otp": invite["devOtp"]})
    assert verified.status_code == 200, verified.text
    cand = auth(verified.json()["accessToken"])

    r = client.get(f"{API}/policy/proctoring", headers=cand)
    assert r.status_code == 200 and r.json()["requireCamera"] is False
    assert client.get(S, headers=cand).status_code in (401, 403)
    assert client.get(f"{S}/security", headers=cand).status_code in (401, 403)


# ---------------------------------------------------------------- runtime cache behaviour
def test_cache_is_refreshed_on_save_and_survives_a_database_outage(client, admin, monkeypatch):
    assert rt.get_int("maxTabSwitches") == 3
    with SessionLocal() as db:  # a change made behind the API's back is not seen until the cache expires ...
        db.get(SystemSetting, "maxTabSwitches").value = 9
        db.commit()
    assert rt.get_int("maxTabSwitches") == 3
    rt.invalidate()
    assert rt.get_int("maxTabSwitches") == 9  # ... or is invalidated (the API does this on every save)

    def boom():
        raise RuntimeError("database is down")

    monkeypatch.setattr(rt, "_fetch", boom)
    rt._loaded_at = time.monotonic() - 10_000  # force a reload attempt
    assert rt.get_int("maxTabSwitches") == 9   # last known value; no exception reaches the caller
    rt.invalidate()
    assert rt.get_int("maxTabSwitches") == 3   # nothing known at all: the catalogue default


def test_runtime_getters_fall_back_to_defaults_for_bad_stored_values():
    with SessionLocal() as db:
        db.get(SystemSetting, "maxTabSwitches").value = "not a number"
        db.get(SystemSetting, "detectPhone").value = "maybe"
        db.commit()
    rt.invalidate()
    assert rt.get_int("maxTabSwitches") == 3 and rt.get_bool("detectPhone") is True


# ---------------------------------------------------------------- schema (drives the Admin UI forms)
def test_schema_is_admin_only(client, admin):
    assert client.get(f"{S}/schema").status_code == 401
    _, token = recruiter_token(client, admin, "schemer")
    assert client.get(f"{S}/schema", headers=auth(token)).status_code == 403


def test_schema_describes_every_setting_exactly(client, admin):
    r = client.get(f"{S}/schema", headers=admin)
    assert r.status_code == 200, r.text
    groups = r.json()["groups"]
    assert [g["group"] for g in groups] == GROUPS
    for group in groups:
        assert group["title"] and group["description"]
        assert [f["key"] for f in group["fields"]] == [s["key"] for s in SETTINGS_BY_GROUP[group["group"]]]
        for field in group["fields"]:
            assert field["label"] and field["description"] and field["type"] in ("int", "bool", "enum", "string")

    fields = {f["key"]: f for g in groups for f in g["fields"]}
    assert fields["maxTabSwitches"]["label"] == "Max tab switches"
    assert (fields["maxTabSwitches"]["min"], fields["maxTabSwitches"]["max"]) == (1, 20)
    assert fields["proctoringSensitivity"]["choices"] == ["low", "medium", "high"]
    assert fields["smtpPassword"]["secret"] is True and fields["smtpHost"]["fmt"] == "hostname"
    assert fields["supportEmail"]["allowEmpty"] is True and fields["platformName"]["allowEmpty"] is False
    assert fields["authRateLimitPerMinute"]["max"] == 10000
    assert "default" not in fields["maxTabSwitches"]  # the schema describes shape, it never carries values
