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


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def login_step1(client, portal, email, password):
    return client.post(f"{API}/{portal}/auth/login", json={"email": email, "password": password})


def portal_login(client, portal, email, password):
    """Full two-step sign-in. Returns the TokenOut JSON."""
    r = login_step1(client, portal, email, password)
    assert r.status_code == 200, r.text
    ch = r.json()
    r = client.post(f"{API}/{portal}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200, r.text
    return r.json()


def admin_token(client):
    return portal_login(client, "admin", **ADMIN)["accessToken"]


def create_staff(client, admin, name, email, role, password=None):
    body = {"name": name, "email": email, "role": role}
    if password:
        body["password"] = password
    r = client.post(f"{API}/admin/staff", headers=bearer(admin), json=body)
    assert r.status_code == 201, r.text
    return r.json()


def ready_staff(client, admin, portal, email, role, name="Test User", final_password="MyOwnPass123"):
    """Admin creates the account, the user signs in with the temp password and chooses their own."""
    created = create_staff(client, admin, name, email, role)
    session = portal_login(client, portal, email, created["temporaryPassword"])
    assert session["user"]["mustChangePassword"] is True
    r = client.post(f"{API}/{portal}/auth/change-password", headers=bearer(session["accessToken"]),
                    json={"currentPassword": created["temporaryPassword"], "newPassword": final_password})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["mustChangePassword"] is False
    return r.json()["accessToken"]


# ------------------------------------------------------------ portal separation
def test_admin_signs_in_at_admin_portal(client):
    s = portal_login(client, "admin", **ADMIN)
    assert s["user"]["role"] == "System Admin"
    assert s["user"]["portals"] == ["admin"]  # no inherited Recruiter / Proctor access


def test_wrong_password_rejected(client):
    assert login_step1(client, "admin", ADMIN["email"], "nope").status_code == 401


def test_same_username_on_each_portal_is_looked_up_from_the_database(client):
    from app.core.security import hash_password
    from app.db.session import SessionLocal
    from app.models.auth import StaffUser

    with SessionLocal() as db:
        for role, name in (("System Admin", "Seed Admin"), ("Recruiter", "Seed Recruiter"),
                           ("Proctor", "Seed Proctor")):
            existing = db.query(StaffUser).filter(StaffUser.email == "shared_user", StaffUser.role == role).first()
            if not existing:
                db.add(StaffUser(
                    email="shared_user", otp_email="platform@example.test", full_name=name, role=role,
                    password_hash=hash_password("sharedpass123"), must_change_password=False,
                ))
        db.commit()

    for portal in ("admin", "recruiter", "proctor"):
        assert login_step1(client, portal, "shared_user", "sharedpass123").status_code == 200
    assert login_step1(client, "recruiter", ADMIN["email"], ADMIN["password"]).status_code == 401


def test_each_portal_login_accepts_only_its_own_role(client):
    admin = admin_token(client)
    create_staff(client, admin, "Rita", "rita@corp.com", "Recruiter", password="Blue-Harbor-4821")
    create_staff(client, admin, "Pat", "pat@corp.com", "Proctor", password="PatTemp12345")

    # admin account is not accepted at the recruiter / proctor logins (same generic answer)
    for portal in ("recruiter", "proctor"):
        r = login_step1(client, portal, ADMIN["email"], ADMIN["password"])
        assert r.status_code == 401
        assert "devOtp" not in r.text
    # recruiter / proctor accounts are not accepted at the admin portal, nor each other's
    assert login_step1(client, "admin", "rita@corp.com", "Blue-Harbor-4821").status_code == 401
    assert login_step1(client, "proctor", "rita@corp.com", "Blue-Harbor-4821").status_code == 401
    assert login_step1(client, "recruiter", "pat@corp.com", "PatTemp12345").status_code == 401
    # ...but their own portal works
    assert login_step1(client, "recruiter", "rita@corp.com", "Blue-Harbor-4821").status_code == 200
    assert login_step1(client, "proctor", "pat@corp.com", "PatTemp12345").status_code == 200


def test_wrong_portal_gives_same_error_as_unknown_account(client):
    wrong_portal = login_step1(client, "recruiter", ADMIN["email"], ADMIN["password"])
    unknown = login_step1(client, "recruiter", "nobody@corp.com", "whatever123")
    assert wrong_portal.status_code == unknown.status_code == 401
    assert wrong_portal.json() == unknown.json()


def test_otp_from_one_portal_cannot_be_used_at_another(client):
    admin = admin_token(client)
    create_staff(client, admin, "Rex", "rex@corp.com", "Recruiter", password="RexTemp12345")
    ch = login_step1(client, "recruiter", "rex@corp.com", "RexTemp12345").json()
    r = client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 401
    r = client.post(f"{API}/proctor/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 401


def test_public_register_and_password_reset_are_gone(client):
    assert client.post(f"{API}/auth/register", json={"name": "x", "email": "x@corp.com", "password": "longenough1"}).status_code == 404
    assert client.post(f"{API}/auth/password-reset/request", json={"email": "x@corp.com"}).status_code == 404
    assert client.post(f"{API}/auth/login", json=ADMIN).status_code == 404  # no shared login any more
    for portal in ("admin", "recruiter", "proctor"):
        assert client.post(f"{API}/{portal}/auth/register", json={}).status_code == 404
        assert client.post(f"{API}/{portal}/auth/password-reset/request", json={}).status_code == 404


# -------------------------------------------------------------------- OTP rules
def test_login_requires_real_otp(client):
    ch = login_step1(client, "admin", **ADMIN).json()
    wrong = "000000" if ch["devOtp"] != "000000" else "111111"
    r = client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": wrong})
    assert r.status_code == 401
    r = client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200
    assert "HttpOnly" in r.headers["set-cookie"]


def test_otp_single_use(client):
    ch = login_step1(client, "admin", **ADMIN).json()
    body = {"challengeId": ch["challengeId"], "otp": ch["devOtp"]}
    assert client.post(f"{API}/admin/auth/verify-otp", json=body).status_code == 200
    assert client.post(f"{API}/admin/auth/verify-otp", json=body).status_code == 401


def test_otp_attempt_limit(client):
    ch = login_step1(client, "admin", **ADMIN).json()
    wrong = "000000" if ch["devOtp"] != "000000" else "111111"
    for _ in range(5):
        client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": wrong})
    r = client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code in (401, 429)  # burned even though the code is now correct


def test_new_login_invalidates_old_otp(client):
    first = login_step1(client, "admin", **ADMIN).json()
    login_step1(client, "admin", **ADMIN)
    r = client.post(f"{API}/admin/auth/verify-otp", json={"challengeId": first["challengeId"], "otp": first["devOtp"]})
    assert r.status_code == 401


def test_resend_otp_is_portal_bound(client):
    ch = login_step1(client, "admin", **ADMIN).json()
    assert client.post(f"{API}/recruiter/auth/resend-otp", json={"challengeId": ch["challengeId"]}).status_code == 400
    r = client.post(f"{API}/admin/auth/resend-otp", json={"challengeId": ch["challengeId"]})
    assert r.status_code == 200
    r2 = client.post(f"{API}/admin/auth/verify-otp",
                     json={"challengeId": r.json()["challengeId"], "otp": r.json()["devOtp"]})
    assert r2.status_code == 200


# ----------------------------------------------------------------------- RBAC
def test_endpoints_require_token(client):
    for path in ("/admin/auth/me", "/recruiter/auth/me", "/proctor/auth/me", "/admin/staff"):
        assert client.get(f"{API}{path}").status_code == 401
    assert client.post(f"{API}/recruiter/send-email", json={}).status_code in (401, 422)
    assert client.post(f"{API}/code/execute", json={"language": "python", "code": "", "testCases": []}).status_code == 401


def test_garbage_token_rejected(client):
    assert client.get(f"{API}/admin/auth/me", headers=bearer("abc.def.ghi")).status_code == 401


def test_rbac_matrix(client):
    admin = admin_token(client)
    rec = ready_staff(client, admin, "recruiter", "rbac.rec@corp.com", "Recruiter")
    pro = ready_staff(client, admin, "proctor", "rbac.pro@corp.com", "Proctor")

    invite = {"name": "M", "email": "m@example.com", "assessmentId": "assess-101"}
    mail = {"recipientEmail": "a@b.c", "subject": "s", "bodyHtml": "b"}

    # recruiter: own portal only
    assert client.get(f"{API}/recruiter/auth/me", headers=bearer(rec)).status_code == 200
    assert client.post(f"{API}/recruiter/candidates/invites", headers=bearer(rec), json=invite).status_code == 201
    assert client.post(f"{API}/recruiter/send-email", headers=bearer(rec), json=mail).status_code == 200
    assert client.get(f"{API}/admin/staff", headers=bearer(rec)).status_code == 403
    assert client.get(f"{API}/admin/auth/me", headers=bearer(rec)).status_code == 403
    assert client.get(f"{API}/proctor/auth/me", headers=bearer(rec)).status_code == 403

    # proctor: own portal only
    assert client.get(f"{API}/proctor/auth/me", headers=bearer(pro)).status_code == 200
    assert client.post(f"{API}/recruiter/candidates/invites", headers=bearer(pro), json=invite).status_code == 403
    assert client.post(f"{API}/recruiter/send-email", headers=bearer(pro), json=mail).status_code == 403
    assert client.get(f"{API}/admin/staff", headers=bearer(pro)).status_code == 403
    assert client.get(f"{API}/recruiter/auth/me", headers=bearer(pro)).status_code == 403

    # system admin: own portal only (manages people and policy, not hiring or proctoring)
    assert client.get(f"{API}/admin/auth/me", headers=bearer(admin)).status_code == 200
    assert client.get(f"{API}/admin/staff", headers=bearer(admin)).status_code == 200
    assert client.get(f"{API}/recruiter/auth/me", headers=bearer(admin)).status_code == 403
    assert client.get(f"{API}/proctor/auth/me", headers=bearer(admin)).status_code == 403
    assert client.post(f"{API}/recruiter/candidates/invites", headers=bearer(admin), json=invite).status_code == 403
    assert client.post(f"{API}/recruiter/send-email", headers=bearer(admin), json=mail).status_code == 403


# ------------------------------------------------------- admin-managed accounts
def test_admin_creates_account_with_temp_password_and_forced_change(client, no_real_email):
    admin = admin_token(client)
    created = create_staff(client, admin, "Nina", "nina@corp.com", "Recruiter")
    assert created["user"]["role"] == "Recruiter"
    assert created["user"]["mustChangePassword"] is True
    assert len(created["temporaryPassword"]) >= 10
    assert created["emailed"] is True
    assert any("nina@corp.com" in str(a) for a, _ in no_real_email)  # credentials email dispatched

    session = portal_login(client, "recruiter", "nina@corp.com", created["temporaryPassword"])
    token = session["accessToken"]
    # until she picks her own password, the portal API is locked...
    invite = {"name": "M", "email": "m@example.com", "assessmentId": "assess-101"}
    r = client.post(f"{API}/recruiter/candidates/invites", headers=bearer(token), json=invite)
    assert r.status_code == 403 and r.json()["detail"] == "PASSWORD_CHANGE_REQUIRED"
    # ...but /me and change-password still work
    assert client.get(f"{API}/recruiter/auth/me", headers=bearer(token)).json()["mustChangePassword"] is True

    # wrong current password / weak / same password are refused
    chg = f"{API}/recruiter/auth/change-password"
    tmp = created["temporaryPassword"]
    assert client.post(chg, headers=bearer(token), json={"currentPassword": "bad", "newPassword": "BrandNew1234"}).status_code == 401
    assert client.post(chg, headers=bearer(token), json={"currentPassword": tmp, "newPassword": "123"}).status_code == 422
    assert client.post(chg, headers=bearer(token), json={"currentPassword": tmp, "newPassword": tmp}).status_code == 422

    r = client.post(chg, headers=bearer(token), json={"currentPassword": tmp, "newPassword": "BrandNew1234"})
    assert r.status_code == 200
    assert client.post(f"{API}/recruiter/candidates/invites", headers=bearer(r.json()["accessToken"]), json=invite).status_code == 201
    # old temp password is dead, new one works
    assert login_step1(client, "recruiter", "nina@corp.com", tmp).status_code == 401
    assert login_step1(client, "recruiter", "nina@corp.com", "BrandNew1234").status_code == 200


def test_duplicate_email_and_bad_role_rejected(client):
    admin = admin_token(client)
    create_staff(client, admin, "Dup", "dup@corp.com", "Recruiter")
    r = client.post(f"{API}/admin/staff", headers=bearer(admin),
                    json={"name": "Dup2", "email": "dup@corp.com", "role": "Recruiter"})
    assert r.status_code == 409
    r = client.post(f"{API}/admin/staff", headers=bearer(admin),
                    json={"name": "Bad", "email": "bad@corp.com", "role": "Super Admin"})
    assert r.status_code == 422


def test_admin_resets_password(client, no_real_email):
    admin = admin_token(client)
    old_token = ready_staff(client, admin, "recruiter", "reset.me@corp.com", "Recruiter", final_password="OriginalPass1")
    user_id = next(u["id"] for u in client.get(f"{API}/admin/staff", headers=bearer(admin)).json()
                   if u["email"] == "reset.me@corp.com")

    r = client.post(f"{API}/admin/staff/{user_id}/reset-password", headers=bearer(admin))
    assert r.status_code == 200
    temp = r.json()["temporaryPassword"]
    assert r.json()["user"]["mustChangePassword"] is True
    assert any("reset.me@corp.com" in str(a) for a, _ in no_real_email)

    assert login_step1(client, "recruiter", "reset.me@corp.com", "OriginalPass1").status_code == 401
    # the reset ends every existing session at once: the old access token is refused outright
    invite = {"name": "M", "email": "m@example.com", "assessmentId": "assess-101"}
    assert client.post(f"{API}/recruiter/candidates/invites", headers=bearer(old_token), json=invite).status_code == 401
    session = portal_login(client, "recruiter", "reset.me@corp.com", temp)
    assert session["user"]["mustChangePassword"] is True


def test_only_admin_can_manage_and_not_self(client):
    admin = admin_token(client)
    rec = ready_staff(client, admin, "recruiter", "norights@corp.com", "Recruiter")
    users = client.get(f"{API}/admin/staff", headers=bearer(admin)).json()
    me = next(u for u in users if u["email"] == ADMIN["email"])
    target = next(u for u in users if u["email"] == "norights@corp.com")

    assert client.post(f"{API}/admin/staff/{target['id']}/reset-password", headers=bearer(rec)).status_code == 403
    assert client.patch(f"{API}/admin/staff/{target['id']}", headers=bearer(rec), json={"isActive": False}).status_code == 403
    assert client.patch(f"{API}/admin/staff/{me['id']}", headers=bearer(admin), json={"isActive": False}).status_code == 400
    assert client.post(f"{API}/admin/staff/{me['id']}/reset-password", headers=bearer(admin)).status_code == 400


def test_admin_changes_role_and_deactivates(client):
    admin = admin_token(client)
    ready_staff(client, admin, "recruiter", "mover@corp.com", "Recruiter", final_password="Harbor-Lantern-77")
    user = next(u for u in client.get(f"{API}/admin/staff", headers=bearer(admin)).json() if u["email"] == "mover@corp.com")

    r = client.patch(f"{API}/admin/staff/{user['id']}", headers=bearer(admin), json={"role": "Proctor"})
    assert r.status_code == 200 and r.json()["role"] == "Proctor"
    assert login_step1(client, "recruiter", "mover@corp.com", "Harbor-Lantern-77").status_code == 401
    assert login_step1(client, "proctor", "mover@corp.com", "Harbor-Lantern-77").status_code == 200

    assert client.patch(f"{API}/admin/staff/{user['id']}", headers=bearer(admin), json={"isActive": False}).status_code == 200
    assert login_step1(client, "proctor", "mover@corp.com", "Harbor-Lantern-77").status_code == 401


def test_account_lockout(client):
    admin = admin_token(client)
    create_staff(client, admin, "Lock", "lock@corp.com", "Recruiter", password="Quiet-Orchard-9034")
    for _ in range(3):
        assert login_step1(client, "recruiter", "lock@corp.com", "bad").status_code == 401
    assert login_step1(client, "recruiter", "lock@corp.com", "Quiet-Orchard-9034").status_code == 429


# ----------------------------------------------------------- refresh / logout
def test_refresh_rotation_and_reuse_detection(client):
    with TestClient(app) as c:
        portal_login(c, "admin", **ADMIN)
        old_cookie = c.cookies.get("nexus_refresh")
        assert old_cookie

        r = c.post(f"{API}/admin/auth/refresh")
        assert r.status_code == 200
        new_cookie = c.cookies.get("nexus_refresh")
        assert new_cookie and new_cookie != old_cookie
        assert c.get(f"{API}/admin/auth/me", headers=bearer(r.json()["accessToken"])).status_code == 200

        # replaying the rotated token is rejected and kills the whole session family
        c.cookies.set("nexus_refresh", old_cookie, path=API)
        assert c.post(f"{API}/admin/auth/refresh").status_code == 401
        c.cookies.set("nexus_refresh", new_cookie, path=API)
        assert c.post(f"{API}/admin/auth/refresh").status_code == 401


def test_refresh_is_portal_aware(client):
    admin = admin_token(client)
    ready_staff(client, admin, "recruiter", "cookie.rec@corp.com", "Recruiter", final_password="CookiePass123")
    with TestClient(app) as c:
        portal_login(c, "recruiter", "cookie.rec@corp.com", "CookiePass123")
        # a recruiter session cannot be turned into an admin / proctor session...
        assert c.post(f"{API}/admin/auth/refresh").status_code == 403
        assert c.post(f"{API}/proctor/auth/refresh").status_code == 403
        # ...and that attempt did not burn the session
        assert c.post(f"{API}/recruiter/auth/refresh").status_code == 200

    with TestClient(app) as c:  # an admin session restores at the admin portal only
        portal_login(c, "admin", **ADMIN)
        for portal in ("recruiter", "proctor"):
            assert c.post(f"{API}/{portal}/auth/refresh").status_code == 403
        assert c.post(f"{API}/admin/auth/refresh").status_code == 200


def test_logout_revokes_refresh(client):
    with TestClient(app) as c:
        portal_login(c, "admin", **ADMIN)
        cookie = c.cookies.get("nexus_refresh")
        assert c.post(f"{API}/admin/auth/logout").status_code == 200
        c.cookies.set("nexus_refresh", cookie, path=API)
        assert c.post(f"{API}/admin/auth/refresh").status_code == 401


# ---------------------------------------------------------------- candidates
_invite_recruiters = 0


def create_invite(client, admin):
    """Invites need a Recruiter (admins cannot invite): the admin makes one, who then sends the invite."""
    global _invite_recruiters
    _invite_recruiters += 1
    token = ready_staff(client, admin, "recruiter", f"invite.rec{_invite_recruiters}@corp.com", "Recruiter")
    r = client.post(f"{API}/recruiter/candidates/invites", headers=bearer(token),
                    json={"name": "Marcus", "email": "marcus@example.com", "assessmentId": "assess-101"})
    assert r.status_code == 201, r.text
    return r.json()


def test_candidate_invite_requires_staff(client):
    r = client.post(f"{API}/recruiter/candidates/invites",
                    json={"name": "M", "email": "m@example.com", "assessmentId": "assess-101"})
    assert r.status_code == 401


def test_candidate_flow_and_scoping(client, no_real_email):
    admin = admin_token(client)
    inv = create_invite(client, admin)
    assert no_real_email  # an email was dispatched server-side
    invite_token = inv["link"].split("invite=")[1]

    assert client.post(f"{API}/candidate/verify",
                       json={"inviteToken": invite_token, "otp": "000000"}).status_code == 401
    assert client.post(f"{API}/candidate/verify",
                       json={"inviteToken": "bogus", "otp": inv["devOtp"]}).status_code == 401

    r = client.post(f"{API}/candidate/verify", json={"inviteToken": invite_token, "otp": inv["devOtp"]})
    assert r.status_code == 200, r.text
    cand_token = r.json()["accessToken"]
    assert r.json()["candidate"]["assessmentId"] == "assess-101"

    # candidate token is NOT a staff token
    for path in ("/admin/auth/me", "/recruiter/auth/me", "/proctor/auth/me", "/admin/staff"):
        assert client.get(f"{API}{path}", headers=bearer(cand_token)).status_code == 401
    assert client.post(f"{API}/recruiter/candidates/invites", headers=bearer(cand_token),
                       json={"name": "M", "email": "m@example.com", "assessmentId": "x"}).status_code == 401
    assert client.post(f"{API}/recruiter/send-email", headers=bearer(cand_token),
                       json={"recipientEmail": "a@b.c", "subject": "s", "bodyHtml": "b"}).status_code == 401
    # but it may use candidate-allowed endpoints
    r = client.post(f"{API}/code/execute", headers=bearer(cand_token),
                    json={"language": "javascript", "code": "1", "testCases": []})
    assert r.status_code == 200


_TINY_JPEG = bytes.fromhex(
    "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c"
    "1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b"
    "080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda000800"
    "01000100003f00fbffd9"
)


def test_candidate_identity_stores_jpeg_for_that_candidate(client):
    import base64

    admin = admin_token(client)
    token = ready_staff(client, admin, "recruiter", "jpeg.rec@corp.com", "Recruiter")
    invited = client.post(
        f"{API}/recruiter/candidates/invites", headers=bearer(token),
        json={"name": "Asha Rao", "email": "asha.rao@example.com", "phone": "9000000001",
              "assessmentId": "assess-101"},
    )
    assert invited.status_code == 201, invited.text
    inv = invited.json()
    invite_token = inv["link"].split("invite=")[1]
    verified = client.post(f"{API}/candidate/verify", json={"inviteToken": invite_token, "otp": inv["devOtp"]})
    assert verified.status_code == 200, verified.text
    access = verified.json()["accessToken"]
    jpeg = "data:image/jpeg;base64," + base64.b64encode(_TINY_JPEG).decode()
    checks = {
        "cameraPassed": True, "microphonePassed": True, "microphoneDb": -28,
        "networkPassed": True, "pingMs": 42, "browserPassed": True,
        "screenWidth": 1920, "screenHeight": 1080, "singleMonitor": True,
    }

    photo = client.post(f"{API}/candidate/identity", headers=bearer(access), json={
        "kind": "photo", "image": jpeg, "systemCheck": checks,
    })
    assert photo.status_code == 200, photo.text
    saved = photo.json()
    assert saved["candidateId"] == inv["candidateId"]
    assert saved["name"] == "Asha Rao"
    assert saved["email"] == "asha.rao@example.com"
    assert saved["format"] == "image/jpeg"
    assert saved["livePhotoStored"] is True
    assert saved["bytes"] == len(_TINY_JPEG)

    assert client.post(f"{API}/candidate/identity", headers=bearer(access), json={
        "kind": "id", "idDocumentType": "college", "image": jpeg,
    }).status_code == 400
    assert client.post(f"{API}/candidate/identity", headers=bearer(access), json={
        "kind": "photo", "image": "data:image/png;base64,aaaa",
    }).status_code == 400

    id_card = client.post(f"{API}/candidate/identity", headers=bearer(access), json={
        "kind": "id", "idDocumentType": "aadhaar", "image": jpeg, "systemCheck": checks,
    })
    assert id_card.status_code == 200, id_card.text
    assert id_card.json()["idProofStored"] is True
    assert id_card.json()["idDocumentType"] == "aadhaar"
    assert id_card.json()["systemCheckPassed"] is True

    detail = client.get(f"{API}/recruiter/candidates/{inv['candidateId']}", headers=bearer(token))
    assert detail.status_code == 200, detail.text
    row = detail.json()
    assert row["name"] == "Asha Rao"
    assert row["email"] == "asha.rao@example.com"
    assert row["livePhotoUrl"] == f"identity/{inv['candidateId']}/photo.jpg"
    assert row["idProofUrl"] == f"identity/{inv['candidateId']}/id.jpg"
    assert not row["livePhotoUrl"].startswith("data:")
    from app.services.identity_bucket import read_jpeg
    assert read_jpeg(row["livePhotoUrl"]) == _TINY_JPEG
    assert read_jpeg(row["idProofUrl"]) == _TINY_JPEG
    assert row["idDocumentType"] == "aadhaar"
    assert row["systemCheck"]["pingMs"] == 42
    assert row["systemCheck"]["microphoneDb"] == -28
    assert row["identityStatus"] == "pending_verification"


def test_candidate_otp_resend(client):
    admin = admin_token(client)
    inv = create_invite(client, admin)
    token = inv["link"].split("invite=")[1]
    r = client.post(f"{API}/candidate/resend-otp", json={"inviteToken": token})
    assert r.status_code == 200
    new = r.json()["devOtp"]
    assert client.post(f"{API}/candidate/verify", json={"inviteToken": token, "otp": inv["devOtp"]}).status_code in (401,) or inv["devOtp"] == new
    assert client.post(f"{API}/candidate/verify", json={"inviteToken": token, "otp": new}).status_code == 200


# ----------------------------------------------------------------- websocket
def test_websocket_requires_valid_token_and_scopes_events(client):
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/proctoring"):
            pass
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/proctoring?token=garbage"):
            pass

    admin = admin_token(client)
    proctor = ready_staff(client, admin, "proctor", "ws.proctor@corp.com", "Proctor", final_password="ProctorPass123")
    inv = create_invite(client, admin)
    itoken = inv["link"].split("invite=")[1]
    cand = client.post(f"{API}/candidate/verify", json={"inviteToken": itoken, "otp": inv["devOtp"]}).json()["accessToken"]

    # the Proctor receives the stream
    with client.websocket_connect(f"/ws/proctoring?token={proctor}") as p_ws:
        assert p_ws.receive_json()["type"] == "inbox"
        with client.websocket_connect(f"/ws/proctoring?token={cand}") as cws:
            assert cws.receive_json()["type"] == "history"
            cws.send_json({"candidateId": "someone-else", "event": "Tab Switch", "severity": "high"})
            msg = p_ws.receive_json()
            assert msg["candidateId"] == inv["candidateId"]  # spoofed id ignored
            assert msg["event"] == "Tab Switch"
            cws.send_json({"type": "chat", "text": "I cannot see the timer"})
            chat = p_ws.receive_json()
            assert chat["type"] == "chat" and chat["from"] == "candidate"
            assert chat["text"] == "I cannot see the timer"
            p_ws.send_json({"type": "chat", "candidateId": inv["candidateId"], "text": "Stay on this screen"})
            reply = cws.receive_json()
            assert reply["from"] == "proctor" and reply["text"] == "Stay on this screen"
            p_ws.send_json({"type": "audio", "candidateId": inv["candidateId"], "pcm": "AAAA"})
            audio = cws.receive_json()
            assert audio["type"] == "audio" and audio["pcm"] == "AAAA"


def test_only_proctor_receives_proctoring_stream():
    import asyncio

    from app.api.proctor import ConnectionManager

    class FakeSocket:
        def __init__(self):
            self.received = []

        async def send_json(self, message):
            self.received.append(message)

    manager = ConnectionManager()
    sockets = {role: FakeSocket() for role in ("Proctor", "System Admin", "Recruiter")}
    for role, ws in sockets.items():
        manager.active_connections.append((ws, {"kind": "staff", "id": role, "role": role}))
    candidate = FakeSocket()
    manager.active_connections.append((candidate, {"kind": "candidate", "id": "c1", "role": "Candidate"}))

    asyncio.run(manager.broadcast_to_monitors({"type": "PROCTORING_EVENT"}))

    assert len(sockets["Proctor"].received) == 1
    assert sockets["System Admin"].received == []  # admins manage people, they do not proctor
    assert sockets["Recruiter"].received == []
    assert candidate.received == []


def test_proctor_admits_candidate_after_uploads(client):
    import base64
    admin = admin_token(client)
    proctor = ready_staff(client, admin, "proctor", "admit.proctor@corp.com", "Proctor", final_password="ProctorPass123")
    inv = create_invite(client, admin)
    token = inv["link"].split("invite=")[1]
    access = client.post(f"{API}/candidate/verify", json={"inviteToken": token, "otp": inv["devOtp"]}).json()["accessToken"]
    jpeg = "data:image/jpeg;base64," + base64.b64encode(_TINY_JPEG).decode()
    assert client.post(f"{API}/candidate/identity", headers=bearer(access), json={"kind": "photo", "image": jpeg}).status_code == 200
    assert client.post(f"{API}/candidate/identity", headers=bearer(access), json={
        "kind": "id", "idDocumentType": "pan", "image": jpeg,
    }).status_code == 200
    listed = client.get(f"{API}/proctor/identity", headers=bearer(proctor))
    assert listed.status_code == 200, listed.text
    assert any(row["id"] == inv["candidateId"] and row["idDocumentType"] == "pan" for row in listed.json()["items"])
    photo = client.get(f"{API}/proctor/identity/{inv['candidateId']}/photo.jpg", headers=bearer(proctor))
    assert photo.status_code == 200 and photo.content.startswith(b"\xff\xd8\xff")
    assert client.get(f"{API}/candidate/gate", headers=bearer(access)).json()["admitted"] is False
    admitted = client.post(f"{API}/proctor/identity/{inv['candidateId']}/admit", headers=bearer(proctor))
    assert admitted.status_code == 200, admitted.text
    assert client.get(f"{API}/candidate/gate", headers=bearer(access)).json()["admitted"] is True


# ------------------------------------------------------------------- migration
def test_legacy_roles_are_migrated(client):
    from app.db.session import SessionLocal
    from app.models.auth import StaffUser
    from app.core.security import hash_password
    from app.services.bootstrap import init_auth_db

    db = SessionLocal()
    try:
        db.add(StaffUser(email="old.admin@corp.com", otp_email="old.admin@corp.com", full_name="Old",
                         role="Admin", password_hash=hash_password("whatever1234")))
        db.add(StaffUser(email="old.super@corp.com", otp_email="old.super@corp.com", full_name="Old2",
                         role="Super Admin", password_hash=hash_password("whatever1234")))
        db.commit()
    finally:
        db.close()

    init_auth_db()

    db = SessionLocal()
    try:
        roles = {u.email: u.role for u in db.query(StaffUser).filter(StaffUser.email.like("old.%")).all()}
    finally:
        db.close()
    assert roles == {"old.admin@corp.com": "System Admin", "old.super@corp.com": "System Admin"}
