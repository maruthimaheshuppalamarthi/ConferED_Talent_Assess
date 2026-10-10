import os
import sys
import tempfile

import pytest

# Isolated DB + deterministic settings must be set before the app is imported.
_tmp = tempfile.mkdtemp()
os.environ["AUTH_DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp, 'test.db').replace(os.sep, '/')}"
os.environ["DEV_EXPOSE_OTP"] = "true"
os.environ["OTP_RESEND_COOLDOWN_SECONDS"] = "0"
os.environ["LOGIN_MAX_FAILURES"] = "3"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services import email as email_service  # noqa: E402

API = "/api/v1"
ADMIN = {"email": "admin@7666", "password": "970598"}


@pytest.fixture(autouse=True)
def no_real_email(monkeypatch):
    sent = []
    monkeypatch.setattr(email_service, "send_email", lambda *a, **k: sent.append((a, k)) or True)
    return sent


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def staff_login(client, email=ADMIN["email"], password=ADMIN["password"]):
    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    ch = r.json()
    r = client.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200, r.text
    return r.json()["accessToken"]


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


# ------------------------------------------------------------------ staff login
def test_wrong_password_rejected(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "nope"})
    assert r.status_code == 401


def test_login_requires_real_otp(client):
    r = client.post(f"{API}/auth/login", json=ADMIN)
    ch = r.json()
    wrong = "000000" if ch["devOtp"] != "000000" else "111111"
    r = client.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": wrong})
    assert r.status_code == 401
    # arbitrary 6 digit code must not work, correct one still does
    r = client.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "Admin"
    assert "HttpOnly" in r.headers["set-cookie"]


def test_otp_single_use(client):
    ch = client.post(f"{API}/auth/login", json=ADMIN).json()
    body = {"challengeId": ch["challengeId"], "otp": ch["devOtp"]}
    assert client.post(f"{API}/auth/verify-otp", json=body).status_code == 200
    assert client.post(f"{API}/auth/verify-otp", json=body).status_code == 401


def test_otp_attempt_limit(client):
    ch = client.post(f"{API}/auth/login", json=ADMIN).json()
    wrong = "000000" if ch["devOtp"] != "000000" else "111111"
    for _ in range(5):
        client.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": wrong})
    r = client.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code in (401, 429)  # burned even though the code is now correct


def test_new_login_invalidates_old_otp(client):
    first = client.post(f"{API}/auth/login", json=ADMIN).json()
    client.post(f"{API}/auth/login", json=ADMIN)
    r = client.post(f"{API}/auth/verify-otp", json={"challengeId": first["challengeId"], "otp": first["devOtp"]})
    assert r.status_code == 401


# ----------------------------------------------------------------------- RBAC
def test_endpoints_require_token(client):
    assert client.get(f"{API}/auth/me").status_code == 401
    assert client.get(f"{API}/auth/staff").status_code == 401
    assert client.post(f"{API}/send-email", json={}).status_code in (401, 404)
    assert client.post(f"{API}/code/execute", json={"language": "python", "code": "", "testCases": []}).status_code == 401


def test_garbage_and_wrong_type_tokens_rejected(client):
    assert client.get(f"{API}/auth/me", headers=bearer("abc.def.ghi")).status_code == 401


def test_register_creates_recruiter_only_and_rbac_enforced(client):
    r = client.post(f"{API}/auth/register",
                    json={"name": "Rita", "email": "rita@corp.com", "password": "longenough1", "role": "Admin"})
    assert r.status_code == 201
    assert r.json()["role"] == "Recruiter"  # cannot self-assign Admin

    token = staff_login(client, "rita@corp.com", "longenough1")
    assert client.get(f"{API}/auth/me", headers=bearer(token)).json()["workspaces"] == ["Recruiter"]
    assert client.get(f"{API}/auth/staff", headers=bearer(token)).status_code == 403
    assert client.post(f"{API}/auth/staff", headers=bearer(token),
                       json={"name": "x", "email": "x@corp.com", "password": "longenough1", "role": "Admin"}).status_code == 403


def test_admin_manages_staff(client):
    admin = staff_login(client)
    assert client.get(f"{API}/auth/me", headers=bearer(admin)).json()["workspaces"] == ["Recruiter", "Admin", "Super Admin"]

    r = client.post(f"{API}/auth/staff", headers=bearer(admin),
                    json={"name": "Bob", "email": "bob@corp.com", "password": "longenough1", "role": "Admin"})
    assert r.status_code == 201
    # Admin cannot mint a Super Admin
    r = client.post(f"{API}/auth/staff", headers=bearer(admin),
                    json={"name": "Eve", "email": "eve@corp.com", "password": "longenough1", "role": "Super Admin"})
    assert r.status_code == 403
    assert len(client.get(f"{API}/auth/staff", headers=bearer(admin)).json()) >= 2


def test_weak_password_rejected(client):
    r = client.post(f"{API}/auth/register", json={"name": "W", "email": "weak@corp.com", "password": "123"})
    assert r.status_code == 422


def test_account_lockout(client):
    client.post(f"{API}/auth/register", json={"name": "L", "email": "lock@corp.com", "password": "longenough1"})
    for _ in range(3):
        assert client.post(f"{API}/auth/login", json={"email": "lock@corp.com", "password": "bad"}).status_code == 401
    r = client.post(f"{API}/auth/login", json={"email": "lock@corp.com", "password": "longenough1"})
    assert r.status_code == 429


# ----------------------------------------------------------- refresh / logout
def test_refresh_rotation_and_reuse_detection(client):
    with TestClient(app) as c:
        ch = c.post(f"{API}/auth/login", json=ADMIN).json()
        c.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
        old_cookie = c.cookies.get("nexus_refresh")
        assert old_cookie

        r = c.post(f"{API}/auth/refresh")
        assert r.status_code == 200
        new_cookie = c.cookies.get("nexus_refresh")
        assert new_cookie and new_cookie != old_cookie
        assert c.get(f"{API}/auth/me", headers=bearer(r.json()["accessToken"])).status_code == 200

        # replaying the rotated token is rejected and kills the whole session family
        c.cookies.set("nexus_refresh", old_cookie, path=f"{API}/auth")
        assert c.post(f"{API}/auth/refresh").status_code == 401
        c.cookies.set("nexus_refresh", new_cookie, path=f"{API}/auth")
        assert c.post(f"{API}/auth/refresh").status_code == 401


def test_logout_revokes_refresh(client):
    with TestClient(app) as c:
        ch = c.post(f"{API}/auth/login", json=ADMIN).json()
        c.post(f"{API}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
        cookie = c.cookies.get("nexus_refresh")
        assert c.post(f"{API}/auth/logout").status_code == 200
        c.cookies.set("nexus_refresh", cookie, path=f"{API}/auth")
        assert c.post(f"{API}/auth/refresh").status_code == 401


# ------------------------------------------------------------ password reset
def test_password_reset_flow(client):
    client.post(f"{API}/auth/register", json={"name": "P", "email": "pw@corp.com", "password": "oldpassword1"})
    ch = client.post(f"{API}/auth/password-reset/request", json={"email": "pw@corp.com"}).json()
    bad = client.post(f"{API}/auth/password-reset/confirm",
                      json={"challengeId": ch["challengeId"], "otp": "000000", "newPassword": "newpassword1"})
    assert bad.status_code == 401
    ok = client.post(f"{API}/auth/password-reset/confirm",
                     json={"challengeId": ch["challengeId"], "otp": ch["devOtp"], "newPassword": "newpassword1"})
    assert ok.status_code == 200
    assert client.post(f"{API}/auth/login", json={"email": "pw@corp.com", "password": "oldpassword1"}).status_code == 401
    staff_login(client, "pw@corp.com", "newpassword1")


def test_password_reset_does_not_reveal_unknown_email(client):
    r = client.post(f"{API}/auth/password-reset/request", json={"email": "ghost@corp.com"})
    assert r.status_code == 200
    assert r.json().get("devOtp") is None
    r2 = client.post(f"{API}/auth/password-reset/confirm",
                     json={"challengeId": r.json()["challengeId"], "otp": "123456", "newPassword": "newpassword1"})
    assert r2.status_code == 401


# ---------------------------------------------------------------- candidates
def create_invite(client, token):
    r = client.post(f"{API}/auth/candidate/invites", headers=bearer(token),
                    json={"name": "Marcus", "email": "marcus@example.com", "assessmentId": "assess-101"})
    assert r.status_code == 201, r.text
    return r.json()


def test_candidate_invite_requires_staff(client):
    r = client.post(f"{API}/auth/candidate/invites",
                    json={"name": "M", "email": "m@example.com", "assessmentId": "assess-101"})
    assert r.status_code == 401


def test_candidate_flow_and_scoping(client, no_real_email):
    admin = staff_login(client)
    inv = create_invite(client, admin)
    assert no_real_email  # an email was dispatched server-side
    invite_token = inv["link"].split("invite=")[1]

    # wrong OTP / wrong token
    assert client.post(f"{API}/auth/candidate/verify",
                       json={"inviteToken": invite_token, "otp": "000000"}).status_code == 401
    assert client.post(f"{API}/auth/candidate/verify",
                       json={"inviteToken": "bogus", "otp": inv["devOtp"]}).status_code == 401

    r = client.post(f"{API}/auth/candidate/verify", json={"inviteToken": invite_token, "otp": inv["devOtp"]})
    assert r.status_code == 200, r.text
    cand_token = r.json()["accessToken"]
    assert r.json()["candidate"]["assessmentId"] == "assess-101"

    # candidate token is NOT a staff token
    assert client.get(f"{API}/auth/me", headers=bearer(cand_token)).status_code == 401
    assert client.get(f"{API}/auth/staff", headers=bearer(cand_token)).status_code == 401
    assert client.post(f"{API}/auth/candidate/invites", headers=bearer(cand_token),
                       json={"name": "M", "email": "m@example.com", "assessmentId": "x"}).status_code == 401
    # but it may use candidate-allowed endpoints
    r = client.post(f"{API}/code/execute", headers=bearer(cand_token),
                    json={"language": "javascript", "code": "1", "testCases": []})
    assert r.status_code == 200
    # and a staff token is not a candidate token
    assert client.post(f"{API}/send-email", headers=bearer(cand_token),
                       json={"recipientEmail": "a@b.c", "subject": "s", "bodyHtml": "b"}).status_code == 401


def test_candidate_otp_resend(client):
    admin = staff_login(client)
    inv = create_invite(client, admin)
    token = inv["link"].split("invite=")[1]
    r = client.post(f"{API}/auth/candidate/resend-otp", json={"inviteToken": token})
    assert r.status_code == 200
    new = r.json()["devOtp"]
    # old OTP dead, new one works
    assert client.post(f"{API}/auth/candidate/verify", json={"inviteToken": token, "otp": inv["devOtp"]}).status_code in (401,) or inv["devOtp"] == new
    assert client.post(f"{API}/auth/candidate/verify", json={"inviteToken": token, "otp": new}).status_code == 200


# ----------------------------------------------------------------- websocket
def test_websocket_requires_valid_token_and_scopes_events(client):
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/proctoring"):
            pass
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/proctoring?token=garbage"):
            pass

    admin = staff_login(client)
    inv = create_invite(client, admin)
    itoken = inv["link"].split("invite=")[1]
    cand = client.post(f"{API}/auth/candidate/verify", json={"inviteToken": itoken, "otp": inv["devOtp"]}).json()["accessToken"]

    with client.websocket_connect(f"/ws/proctoring?token={admin}") as monitor:
        with client.websocket_connect(f"/ws/proctoring?token={cand}") as cws:
            cws.send_json({"candidateId": "someone-else", "event": "Tab Switch", "severity": "high"})
            msg = monitor.receive_json()
            assert msg["candidateId"] == inv["candidateId"]  # spoofed id ignored
            assert msg["event"] == "Tab Switch"
