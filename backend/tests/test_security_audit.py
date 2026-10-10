"""Phase 2: audit trail, sign-in history and the admin audit API."""
import csv
import io
import json
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.api import admin_audit
from app.db.session import SessionLocal
from app.main import app
from app.models.auth import AuditLog, LoginEvent
from app.services import audit
from app.services import email as email_service

API = "/api/v1"
ADMIN = {"email": "admin@7666", "password": "970598"}


# ---------------------------------------------------------------- fixtures / helpers
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


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def start_login(client, portal, email, password):
    return client.post(f"{API}/{portal}/auth/login", json={"email": email, "password": password})


def sign_in(client, portal, email, password):
    r = start_login(client, portal, email, password)
    assert r.status_code == 200, r.text
    ch = r.json()
    r = client.post(f"{API}/{portal}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def admin(client):
    return auth(sign_in(client, "admin", **ADMIN)["accessToken"])


def new_email(prefix="user"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


def create_staff(client, admin, role="Recruiter", prefix="user", password=None):
    body = {"name": f"Test {prefix}", "email": new_email(prefix), "role": role}
    if password:
        body["password"] = password
    r = client.post(f"{API}/admin/staff", json=body, headers=admin)
    assert r.status_code == 201, r.text
    data = r.json()
    return data["user"], data["temporaryPassword"]


def audit_rows(**filters):
    with SessionLocal() as db:
        return db.query(AuditLog).filter_by(**filters).order_by(AuditLog.created_at).all()


def login_rows(**filters):
    with SessionLocal() as db:
        return db.query(LoginEvent).filter_by(**filters).order_by(LoginEvent.created_at).all()


def audit_api(client, admin, **params):
    r = client.get(f"{API}/admin/audit-logs", params=params, headers=admin)
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------- sign-in is recorded
def test_successful_sign_in_is_recorded_with_ip_and_agent(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "signin")
    sign_in(client, "recruiter", user["email"], temp)

    events = [e.event for e in login_rows(email=user["email"])]
    assert events == ["password_ok", "login_success"]

    entry = audit_rows(action="auth.login", actor_email=user["email"])[0]
    assert entry.category == "auth" and entry.success is True
    assert entry.actor_id == user["id"] and entry.actor_role == "Recruiter"
    assert entry.ip_address == "testclient"
    assert entry.user_agent  # the test client's user agent
    assert entry.details == {"portal": "recruiter"}


def test_last_login_is_stored_and_shown(client, admin):
    user, temp = create_staff(client, admin, "Proctor", "lastlogin")
    assert user["lastLoginAt"] is None
    sign_in(client, "proctor", user["email"], temp)
    listed = {u["id"]: u for u in client.get(f"{API}/admin/staff", headers=admin).json()}
    assert listed[user["id"]]["lastLoginAt"] is not None


def test_wrong_password_for_known_account_is_audited(client, admin):
    user, _ = create_staff(client, admin, "Recruiter", "wrongpw")
    r = start_login(client, "recruiter", user["email"], "definitely-wrong")
    assert r.status_code == 401

    entry = audit_rows(action="auth.login_failed", actor_email=user["email"])[0]
    assert entry.success is False and entry.details["reason"] == "wrong_password"
    event = login_rows(email=user["email"])[0]
    assert event.event == "login_failed" and event.success is False and event.failure_reason == "wrong_password"
    # the caller still sees the same generic message (no account probing)
    assert r.json()["detail"] == start_login(client, "recruiter", new_email("ghost"), "x").json()["detail"]


def test_unknown_email_is_in_login_history_but_not_in_the_immutable_audit_log(client):
    ghost = new_email("ghost")
    assert start_login(client, "admin", ghost, "whatever").status_code == 401
    event = login_rows(email=ghost)[0]
    assert event.user_id is None and event.failure_reason == "unknown_account" and event.success is False
    assert audit_rows(actor_email=ghost) == []  # an anonymous caller cannot grow the append-only table


def test_wrong_portal_is_recorded_with_the_real_reason(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "portal")
    assert start_login(client, "admin", user["email"], temp).status_code == 401
    entry = audit_rows(action="auth.login_failed", actor_email=user["email"])[0]
    assert entry.details["reason"] == "wrong_portal"


def test_lockout_is_audited_and_blocked_attempts_are_logged(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "lock")
    for _ in range(3):  # LOGIN_MAX_FAILURES = 3 in tests
        assert start_login(client, "recruiter", user["email"], "bad-password").status_code == 401

    locked = audit_rows(action="security.account_locked", actor_email=user["email"])
    assert len(locked) == 1 and locked[0].category == "security" and locked[0].target_id == user["id"]
    assert any(e.event == "account_locked" for e in login_rows(email=user["email"]))

    assert start_login(client, "recruiter", user["email"], temp).status_code == 429  # even the right password
    blocked = audit_rows(action="auth.login_blocked", actor_email=user["email"])
    assert len(blocked) == 1 and blocked[0].details["reason"] == "account_locked"


def test_wrong_otp_is_audited(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "otp")
    ch = start_login(client, "recruiter", user["email"], temp).json()
    bad = "000000" if ch["devOtp"] != "000000" else "111111"
    r = client.post(f"{API}/recruiter/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": bad})
    assert r.status_code == 401

    entry = audit_rows(action="auth.otp_failed", actor_email=user["email"])[0]
    assert entry.success is False and entry.details["reason"] == "wrong_or_expired_code"
    assert any(e.event == "otp_failed" for e in login_rows(email=user["email"]))
    assert bad not in json.dumps(entry.details) and ch["devOtp"] not in json.dumps(entry.details)


def test_logout_is_audited_once(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "logout")
    sign_in(client, "recruiter", user["email"], temp)
    assert client.post(f"{API}/recruiter/auth/logout").status_code == 200
    assert len(audit_rows(action="auth.logout", actor_email=user["email"])) == 1
    assert any(e.event == "logout" for e in login_rows(email=user["email"]))


def test_password_change_is_audited_and_failures_too(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "pwchange")
    token = sign_in(client, "recruiter", user["email"], temp)["accessToken"]

    bad = client.post(f"{API}/recruiter/auth/change-password", headers=auth(token),
                      json={"currentPassword": "not-it", "newPassword": "NewPassw0rd!x"})
    assert bad.status_code == 401
    assert len(audit_rows(action="auth.password_change_failed", actor_email=user["email"])) == 1

    ok = client.post(f"{API}/recruiter/auth/change-password", headers=auth(token),
                     json={"currentPassword": temp, "newPassword": "NewPassw0rd!x"})
    assert ok.status_code == 200, ok.text
    entry = audit_rows(action="auth.password_changed", actor_email=user["email"])[0]
    assert entry.details == {"wasForced": True}
    assert "NewPassw0rd" not in json.dumps(entry.details) and "NewPassw0rd" not in entry.summary


# ---------------------------------------------------------------- admin actions are recorded
def test_staff_lifecycle_actions_are_audited_without_secrets(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "lifecycle")
    uid = user["id"]

    assert client.patch(f"{API}/admin/staff/{uid}", json={"role": "Proctor"}, headers=admin).status_code == 200
    assert client.patch(f"{API}/admin/staff/{uid}", json={"isActive": False}, headers=admin).status_code == 200
    assert client.patch(f"{API}/admin/staff/{uid}", json={"isActive": True}, headers=admin).status_code == 200
    reset = client.post(f"{API}/admin/staff/{uid}/reset-password", headers=admin)
    assert reset.status_code == 200
    new_temp = reset.json()["temporaryPassword"]

    rows = {r.action: r for r in audit_rows(target_id=uid)}
    assert set(rows) == {"staff.create", "staff.role_change", "staff.deactivate", "staff.activate",
                         "staff.reset_password"}
    assert rows["staff.create"].actor_email == ADMIN["email"] and rows["staff.create"].category == "staff"
    assert rows["staff.role_change"].details == {"email": user["email"], "from": "Recruiter", "to": "Proctor"}
    for row in rows.values():
        blob = json.dumps(row.details) + row.summary
        assert temp not in blob and new_temp not in blob, "a password leaked into the audit log"
        assert row.ip_address == "testclient"


def test_noop_patch_writes_nothing(client, admin):
    user, _ = create_staff(client, admin, "Recruiter", "noop")
    before = len(audit_rows(target_id=user["id"]))
    r = client.patch(f"{API}/admin/staff/{user['id']}", json={"role": "Recruiter", "isActive": True}, headers=admin)
    assert r.status_code == 200
    assert len(audit_rows(target_id=user["id"])) == before


def test_invite_and_email_actions_are_audited(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "invites")
    token = sign_in(client, "recruiter", user["email"], temp)["accessToken"]
    client.post(f"{API}/recruiter/auth/change-password", headers=auth(token),
                json={"currentPassword": temp, "newPassword": "NewPassw0rd!x"})
    token = sign_in(client, "recruiter", user["email"], "NewPassw0rd!x")["accessToken"]

    r = client.post(f"{API}/recruiter/candidates/invites", headers=auth(token),
                    json={"name": "Cand One", "email": "cand.one@example.com", "assessmentId": "assess-1"})
    assert r.status_code == 201, r.text
    invite = audit_rows(action="candidate.invite_create", actor_email=user["email"])[0]
    assert invite.category == "candidate" and "cand.one@example.com" not in invite.summary  # masked
    assert invite.details["assessmentId"] == "assess-1"

    r = client.post(f"{API}/recruiter/send-email", headers=auth(token),
                    json={"recipientEmail": "someone@example.com", "subject": "Hi", "bodyHtml": "<b>x</b>"})
    assert r.status_code == 200
    mail = audit_rows(action="email.send", actor_email=user["email"])[0]
    assert mail.success is True and "someone@example.com" not in mail.summary


def test_audit_failure_never_breaks_sign_in(client, admin, monkeypatch):
    user, temp = create_staff(client, admin, "Recruiter", "resilient")

    def boom(*_a, **_k):
        raise RuntimeError("audit store is down")

    monkeypatch.setattr(audit, "AuditLog", boom)
    monkeypatch.setattr(audit, "LoginEvent", boom)
    sign_in(client, "recruiter", user["email"], temp)  # must still succeed
    assert start_login(client, "recruiter", user["email"], "wrong").status_code == 401


# ---------------------------------------------------------------- access control
@pytest.mark.parametrize("path", ["/admin/audit-logs", "/admin/audit-logs/meta", "/admin/audit-logs/export",
                                  "/admin/login-events"])
def test_audit_endpoints_are_admin_only(client, admin, path):
    assert client.get(f"{API}{path}").status_code == 401
    user, temp = create_staff(client, admin, "Recruiter", "nope")
    token = sign_in(client, "recruiter", user["email"], temp)["accessToken"]
    assert client.get(f"{API}{path}", headers=auth(token)).status_code == 403
    assert client.get(f"{API}{path}", headers=admin).status_code == 200


# ---------------------------------------------------------------- list, filters, pagination
def test_list_pagination_and_order(client, admin):
    total = audit_api(client, admin)["total"]
    assert total >= 6

    p1 = audit_api(client, admin, pageSize=2, page=1)
    p2 = audit_api(client, admin, pageSize=2, page=2)
    assert len(p1["items"]) == 2 and p1["total"] >= total and p1["pages"] == -(-p1["total"] // 2)
    assert {i["id"] for i in p1["items"]}.isdisjoint({i["id"] for i in p2["items"]})
    assert p1["items"][0]["createdAt"] >= p1["items"][1]["createdAt"]  # newest first

    oldest = audit_api(client, admin, order="asc", pageSize=1)["items"][0]
    newest = audit_api(client, admin, order="desc", pageSize=1)["items"][0]
    assert oldest["createdAt"] <= newest["createdAt"] and oldest["id"] != newest["id"]

    beyond = audit_api(client, admin, page=9999)
    assert beyond["items"] == [] and beyond["total"] >= total


def test_list_validates_paging_parameters(client, admin):
    assert client.get(f"{API}/admin/audit-logs?pageSize=101", headers=admin).status_code == 422
    assert client.get(f"{API}/admin/audit-logs?page=0", headers=admin).status_code == 422
    assert client.get(f"{API}/admin/audit-logs?order=sideways", headers=admin).status_code == 422


def test_filters(client, admin):
    user, _ = create_staff(client, admin, "Recruiter", "filters")
    client.patch(f"{API}/admin/staff/{user['id']}", json={"isActive": False}, headers=admin)
    start_login(client, "recruiter", user["email"], "wrong")

    staff_only = audit_api(client, admin, category="staff", pageSize=100)
    assert staff_only["items"] and {i["category"] for i in staff_only["items"]} == {"staff"}

    exact = audit_api(client, admin, action="staff.deactivate", targetId=user["id"])
    assert exact["total"] == 1 and exact["items"][0]["details"]["role"] == "Recruiter"

    by_actor = audit_api(client, admin, actor="ADMIN@7666", pageSize=100)  # case-insensitive "contains"
    assert by_actor["total"] >= 2 and all("admin@7666" == i["actorEmail"] for i in by_actor["items"])

    by_id = audit_api(client, admin, actorId=user["id"], pageSize=100)
    assert by_id["total"] >= 1 and all(i["actorId"] == user["id"] for i in by_id["items"])

    failures = audit_api(client, admin, success="false", pageSize=100)
    assert failures["total"] >= 1 and all(i["success"] is False for i in failures["items"])
    successes = audit_api(client, admin, success="true", pageSize=100)
    assert all(i["success"] is True for i in successes["items"])

    found = audit_api(client, admin, search=user["email"].upper())
    assert found["total"] >= 2 and all(user["email"] in (i["summary"] + (i["actorEmail"] or ""))
                                       for i in found["items"])

    everything = audit_api(client, admin)["total"]
    assert audit_api(client, admin, search="%")["total"] == 0, "LIKE wildcards must be escaped"
    # an unescaped "_" would match every row; escaped it only matches a literal underscore (e.g. auth.login_failed)
    assert 0 < audit_api(client, admin, search="_")["total"] < everything
    assert audit_api(client, admin, category="no-such-category")["total"] == 0


def test_date_filters_including_a_bare_end_date(client, admin):
    everything = audit_api(client, admin)["total"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    assert audit_api(client, admin, to="2000-01-01")["total"] == 0
    assert audit_api(client, admin, **{"from": "2000-01-01"})["total"] == everything
    assert audit_api(client, admin, **{"from": "2999-01-01"})["total"] == 0
    # a bare date for "to" means "through the end of that day", so today's rows are included
    assert audit_api(client, admin, to=today)["total"] == everything
    assert audit_api(client, admin, **{"from": today, "to": today})["total"] == everything
    # a precise instant in the past excludes everything newer
    assert audit_api(client, admin, to="2020-06-01T12:30:00")["total"] == 0


def test_meta_lists_filter_values_and_hides_selftest_rows(client, admin):
    with SessionLocal() as db:
        db.add(AuditLog(category="system", action="db.selftest", summary="append-only check"))
        db.commit()

    meta = client.get(f"{API}/admin/audit-logs/meta", headers=admin).json()
    assert {"auth", "staff", "security", "settings", "system", "candidate"} <= set(meta["categories"])
    assert {"auth.login", "staff.create"} <= set(meta["actions"])
    assert "db.selftest" not in meta["actions"]

    assert audit_api(client, admin, action="db.selftest")["total"] == 0
    assert audit_api(client, admin, action="db.selftest", includeSystemChecks="true")["total"] >= 1


# ---------------------------------------------------------------- CSV export
def test_csv_export_matches_filters_neutralises_formulas_and_is_audited(client, admin):
    with SessionLocal() as db:
        audit.record_audit(db, category="system", action="test.formula",
                           summary="=HYPERLINK(\"http://evil.example\",\"click\")", details={"password": "hunter2"})

    r = client.get(f"{API}/admin/audit-logs/export", params={"action": "test.formula"}, headers=admin)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert r.headers["content-disposition"].startswith('attachment; filename="audit-logs-')
    assert r.headers["x-export-truncated"] == "false"
    assert r.content.startswith(b"\xef\xbb\xbf")  # BOM for Excel

    rows = list(csv.reader(io.StringIO(r.content.decode("utf-8-sig"))))
    assert rows[0][:3] == ["Timestamp (UTC)", "Category", "Action"]
    assert len(rows) == 2
    summary = rows[1][rows[0].index("Summary")]
    assert summary.startswith("'=") and not summary.startswith("=")
    assert "hunter2" not in r.text and "[redacted]" in r.text

    full = client.get(f"{API}/admin/audit-logs/export", headers=admin)
    exported_rows = len(list(csv.reader(io.StringIO(full.content.decode("utf-8-sig"))))) - 1
    # the export is audited after its rows were read, so the log now holds exactly one more entry
    assert audit_api(client, admin, pageSize=1)["total"] == exported_rows + 1

    assert audit_api(client, admin, action="audit.export")["total"] >= 2  # the exports were audited too


# ---------------------------------------------------------------- sign-in history endpoint
def test_login_events_endpoint_filters_and_paginates(client, admin):
    user, temp = create_staff(client, admin, "Proctor", "history")
    start_login(client, "proctor", user["email"], "wrong")
    sign_in(client, "proctor", user["email"], temp)

    def events(**params):
        r = client.get(f"{API}/admin/login-events", params=params, headers=admin)
        assert r.status_code == 200, r.text
        return r.json()

    mine = events(email=user["email"], order="asc", pageSize=100)
    assert [e["event"] for e in mine["items"]] == ["login_failed", "password_ok", "login_success"]
    assert mine["items"][0]["failureReason"] == "wrong_password" and mine["items"][0]["ipAddress"] == "testclient"

    assert events(userId=user["id"])["total"] == 3  # failed attempt + password ok + login success
    assert {e["success"] for e in events(email=user["email"], success="false")["items"]} == {False}
    assert {e["portal"] for e in events(email=user["email"], portal="proctor")["items"]} == {"proctor"}
    assert events(email=user["email"], event="login_success")["total"] == 1
    assert events(email=user["email"], pageSize=1)["pages"] == 3
    assert events(to="2000-01-01")["total"] == 0
    assert client.get(f"{API}/admin/login-events?portal=hacker", headers=admin).status_code == 422


# ---------------------------------------------------------------- unit tests for the helpers
def test_scrub_redacts_secrets_and_bounds_the_data():
    clean = audit.scrub({
        "password": "p", "newPassword": "p2", "otp": "123456", "refreshToken": "t", "Authorization": "Bearer x",
        "apiKey": "k", "client_secret": "s", "role": "Admin",
        "nested": {"smtpPassword": "p3", "deep": {"deeper": {"deepest": {"x": 1}}}},
        "long": "x" * 5000, "when": datetime(2030, 1, 1), "items": list(range(500)),
    })
    for key in ("password", "newPassword", "otp", "refreshToken", "Authorization", "apiKey", "client_secret"):
        assert clean[key] == "[redacted]", key
    assert clean["role"] == "Admin"
    assert clean["nested"]["smtpPassword"] == "[redacted]"
    assert clean["nested"]["deep"]["deeper"]["deepest"] == "[truncated]"
    assert len(clean["long"]) == 500 and len(clean["items"]) == 50
    assert clean["when"] == "2030-01-01 00:00:00"
    json.dumps(clean)  # always serialisable


def _request(headers, client_ip="10.1.1.1"):
    return Request({"type": "http", "headers": [(k.encode(), v.encode()) for k, v in headers.items()],
                    "client": (client_ip, 5000), "method": "GET", "path": "/"})


def test_client_info_only_trusts_forwarded_for_behind_a_proxy(monkeypatch):
    req = _request({"x-forwarded-for": "203.0.113.9, 10.0.0.1", "user-agent": "UA/1.0"})
    monkeypatch.setattr(audit.settings, "TRUST_PROXY", False)
    assert audit.client_info(req) == ("10.1.1.1", "UA/1.0")
    monkeypatch.setattr(audit.settings, "TRUST_PROXY", True)
    assert audit.client_info(req) == ("203.0.113.9", "UA/1.0")
    assert audit.client_info(None) == (None, None)
    assert audit.client_info(_request({"user-agent": "x" * 1000}))[1] == "x" * 300


def test_csv_cell_neutralises_formula_prefixes():
    for risky in ("=1+1", "+1", "-1", "@SUM(A1)", "\tcmd", "\rcmd"):
        assert admin_audit._csv_cell(risky) == "'" + risky
    assert admin_audit._csv_cell("normal") == "normal" and admin_audit._csv_cell(None) == ""
