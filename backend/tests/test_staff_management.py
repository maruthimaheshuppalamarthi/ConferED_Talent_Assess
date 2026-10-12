"""Phase 5: staff directory, account actions (profile / unlock / force-logout / resend / delete / restore), sessions."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from helpers import (ADMIN, API, audit_rows, auth, create_staff, new_email, recruiter_token, sign_in, start_login)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import SessionLocal
from app.main import app
from app.models.auth import AuthBase, RefreshToken, StaffUser
from app.services import email as email_service
from app.services import staff_admin

S = f"{API}/admin/staff"
NOW = datetime(2030, 6, 15, 12, 30, tzinfo=timezone.utc)


# ====================================================================================================
# 1. Rules and queries, against a private database (exact numbers)
# ====================================================================================================
@pytest.fixture()
def db(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'staff.db').as_posix()}", future=True)
    AuthBase.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    yield session
    session.close()
    engine.dispose()


def make(email, role="Recruiter", name=None, **kw):
    kw.setdefault("is_active", True)  # (column defaults only apply once a row is saved)
    return StaffUser(email=email, otp_email=email, full_name=name or email.split("@")[0], role=role,
                     password_hash="x", created_at=kw.pop("created_at", NOW - timedelta(days=30)), **kw)


def test_last_active_admin_guard(db):
    only = make("a@x.co", "System Admin")
    db.add(only)
    db.commit()
    with pytest.raises(HTTPException) as err:
        staff_admin.ensure_another_active_admin(db, only)
    assert err.value.status_code == 409 and "last active System Admin" in err.value.detail

    db.add_all([make("b@x.co", "System Admin", is_active=False),                 # disabled: does not count
                make("c@x.co", "System Admin", deleted_at=NOW),                  # deleted: does not count
                make("d@x.co", "Recruiter")])                                    # not an admin
    db.commit()
    with pytest.raises(HTTPException):
        staff_admin.ensure_another_active_admin(db, only)

    db.add(make("e@x.co", "System Admin"))
    db.commit()
    staff_admin.ensure_another_active_admin(db, only)  # a second active admin exists: no error


def test_is_active_admin():
    assert staff_admin.is_active_admin(make("a@x.co", "System Admin"))
    assert not staff_admin.is_active_admin(make("a@x.co", "Recruiter"))
    assert not staff_admin.is_active_admin(make("a@x.co", "System Admin", is_active=False))
    assert not staff_admin.is_active_admin(make("a@x.co", "System Admin", deleted_at=NOW))


def test_clean_profile_normalises_and_validates():
    assert staff_admin.clean_profile({"name": "  Jane   van  Doe ", "email": " Jane@Example.COM ",
                                      "otpEmail": "Alerts@Example.com", "phone": " +91 98765 43210 ",
                                      "department": "  Talent   Acquisition "}) == {
        "name": "Jane van Doe", "email": "jane@example.com", "otpEmail": "alerts@example.com",
        "phone": "+91 98765 43210", "department": "Talent Acquisition"}
    assert staff_admin.clean_profile({"phone": "", "department": "   "}) == {"phone": None, "department": None}
    for phone in ("+1 (415) 555-0100", "98765-43210", "020 7946 0958"):
        assert staff_admin.clean_profile({"phone": phone})["phone"] == phone
    for bad in ({"name": "   "}, {"name": "<script>"}, {"email": "nope"}, {"otpEmail": "a@b"},
                {"phone": "call me"}, {"phone": "12"}, {"phone": "1" * 40}, {"department": "Eng<ineering"}):
        with pytest.raises(HTTPException) as err:
            staff_admin.clean_profile(bad)
        assert err.value.status_code == 422, bad


@pytest.fixture()
def directory(db):
    db.add_all([
        make("ann@x.co", "System Admin", name="Ann Admin", department="Platform", last_login_at=NOW - timedelta(hours=1)),
        make("bob@x.co", "Recruiter", name="Bob Hire", department="Talent", must_change_password=True),
        make("cat@x.co", "Recruiter", name="Cat Hire", department="Talent", is_active=False,
             last_login_at=NOW - timedelta(days=5)),
        make("dan@x.co", "Proctor", name="Dan Watch", department="Exams", locked_until=NOW + timedelta(minutes=9),
             last_login_at=NOW - timedelta(days=2)),
        make("eve@x.co", "Proctor", name="Eve Watch", department="Exams", last_login_at=NOW - timedelta(days=9)),
        make("fay@x.co", "Recruiter", name="Fay Gone", department="Talent", deleted_at=NOW - timedelta(days=1)),
    ])
    db.commit()


def find(db, **kw):
    args = dict(q=None, role=None, status="all", department=None, sort="name", descending=False, page=1, page_size=25)
    args.update(kw)
    rows, total, pages = staff_admin.search_staff(db, NOW, **args)
    return [u.email.split("@")[0] for u in rows], total, pages


def test_search_status_filters(db, directory):
    assert find(db)[0] == ["ann", "bob", "cat", "dan", "eve"]                        # 'all' never includes deleted
    assert find(db, status="active")[0] == ["ann", "bob", "dan", "eve"]
    assert find(db, status="disabled")[0] == ["cat"]
    assert find(db, status="locked")[0] == ["dan"]
    assert find(db, status="pendingPassword")[0] == ["bob"]
    assert find(db, status="neverSignedIn")[0] == ["bob"]
    assert find(db, status="deleted")[0] == ["fay"]


def test_search_text_role_department_and_wildcards(db, directory):
    assert find(db, q="hire")[0] == ["bob", "cat"]                                   # name, case-insensitive
    assert find(db, q="EVE@X")[0] == ["eve"]                                         # email
    assert find(db, q="platf")[0] == ["ann"]                                         # department
    assert find(db, role="Proctor")[0] == ["dan", "eve"]
    assert find(db, department="talent", status="active")[0] == ["bob"]
    assert find(db, q="hire", role="Recruiter", status="active")[0] == ["bob"]
    assert find(db, q="%")[1] == 0 and find(db, q="_")[1] == 0                        # wildcards are literal
    assert find(db, q="   ")[1] == 5                                                 # blank search = no filter


def test_search_sorting_and_paging(db, directory):
    assert find(db, sort="name", descending=True)[0] == ["eve", "dan", "cat", "bob", "ann"]
    role_of = {"ann": "System Admin", "bob": "Recruiter", "cat": "Recruiter", "dan": "Proctor", "eve": "Proctor"}
    roles = [role_of[n] for n in find(db, sort="role")[0]]
    assert roles == sorted(roles) and roles[0] == "Proctor" and roles[-1] == "System Admin"
    # people who never signed in (bob) are last in both directions
    assert find(db, sort="lastLoginAt")[0] == ["eve", "cat", "dan", "ann", "bob"]
    assert find(db, sort="lastLoginAt", descending=True)[0] == ["ann", "dan", "cat", "eve", "bob"]

    names, total, pages = find(db, page_size=2)
    assert (names, total, pages) == (["ann", "bob"], 5, 3)
    assert find(db, page_size=2, page=3)[0] == ["eve"]
    assert find(db, page_size=2, page=4)[0] == []
    assert find(db, status="deleted", page_size=2) == (["fay"], 1, 1)
    assert find(db, q="nobody") == ([], 0, 1)


def test_session_queries(db):
    user = make("sess@x.co")
    db.add(user)
    db.commit()

    def token(jti, **kw):
        return RefreshToken(jti=jti, user_id=user.id, expires_at=kw.pop("expires_at", NOW + timedelta(days=1)),
                            created_at=kw.pop("created_at", NOW - timedelta(hours=1)), **kw)
    db.add_all([
        token("t1", session_id="s1", created_at=NOW - timedelta(hours=3)),
        token("t2", session_id="s2", created_at=NOW - timedelta(minutes=5)),
        token("t3", session_id="s3", revoked=True, revoked_reason="logout"),
        token("t4", session_id="s4", expires_at=NOW - timedelta(minutes=1)),         # expired
        token("t5"),                                                                  # a pre-tracking token: no session id
    ])
    db.commit()
    live = staff_admin.live_sessions(db, user.id, NOW)
    assert [staff_admin.session_key(t) for t in live] == ["s2", "t5", "s1"]           # newest activity first
    assert staff_admin.active_session_counts(db, [user.id, "nobody"], NOW) == {user.id: 3}
    assert staff_admin.active_session_counts(db, [], NOW) == {}


# ====================================================================================================
# 2. The API
# ====================================================================================================
SENT = []


@pytest.fixture(scope="module", autouse=True)
def _capture_email():
    mp = pytest.MonkeyPatch()

    def capture(to, subject, body, **k):
        SENT.append((to, subject, body))
        return True

    mp.setattr(email_service, "send_email", capture)
    # Login OTPs use dispatch_otp_email, which skips SMTP when DEV_EXPOSE_OTP is on.
    mp.setattr(email_service, "dispatch_otp_email", lambda to, subject, body: SENT.append((to, subject, body)))
    yield
    mp.undo()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin(client):
    return auth(sign_in(client, "admin", **ADMIN)["accessToken"])


def device(portal, email, password):
    """A separate browser: its own cookie jar. Returns (client, access token)."""
    c = TestClient(app)
    return c, sign_in(c, portal, email, password)["accessToken"]


def me(c, portal, token):
    return c.get(f"{API}/{portal}/auth/me", headers=auth(token))


def detail(client, admin, user_id):
    r = client.get(f"{S}/{user_id}", headers=admin)
    assert r.status_code == 200, r.text
    return r.json()


def audits(action, **kw):
    return audit_rows(action=action, **kw)


ACTIONS = [("PATCH", "/profile", {"name": "X"}), ("POST", "/unlock", None), ("POST", "/force-logout", None),
           ("POST", "/resend-credentials", None), ("DELETE", "", None), ("POST", "/restore", None),
           ("GET", "/sessions", None), ("DELETE", "/sessions/abc", None), ("GET", "", None)]


@pytest.mark.parametrize("method,suffix,body", ACTIONS)
def test_every_endpoint_is_admin_only(client, admin, method, suffix, body):
    victim, _ = create_staff(client, admin, "Recruiter", "guarded")
    url = f"{S}/{victim['id']}{suffix}"
    assert client.request(method, url, json=body).status_code == 401
    _, token = recruiter_token(client, admin, "snoop")
    assert client.request(method, url, json=body, headers=auth(token)).status_code == 403


def test_search_endpoint_is_admin_only(client, admin):
    assert client.get(f"{S}/search").status_code == 401
    _, token = recruiter_token(client, admin, "snoop2")
    assert client.get(f"{S}/search", headers=auth(token)).status_code == 403


# ---------------------------------------------------------------- creating with profile fields
def test_create_with_profile_fields_and_separate_2fa_address(client, admin):
    body = {"name": "Pia Profile", "email": new_email("pia"), "role": "Recruiter", "phone": "+91 98765 43210",
            "department": "Talent", "otpEmail": "pia.alerts@example.com"}
    r = client.post(S, json=body, headers=admin)
    assert r.status_code == 201, r.text
    user = r.json()["user"]
    assert user["phone"] == "+91 98765 43210" and user["department"] == "Talent"
    d = detail(client, admin, user["id"])
    assert d["otpEmail"] == "pia.alerts@example.com" and d["createdByEmail"] == ADMIN["email"]
    assert any(to == "pia.alerts@example.com" for to, *_ in SENT)  # credentials went to the 2FA address

    assert client.post(S, json={**body, "email": new_email("bad"), "phone": "call me"}, headers=admin).status_code == 422
    assert client.post(S, json={**body, "email": new_email("bad"), "otpEmail": "nope"}, headers=admin).status_code == 422


# ---------------------------------------------------------------- directory
def test_search_end_to_end(client, admin):
    tag = uuid.uuid4().hex[:6]

    def make_user(first, role, dept):
        body = {"name": f"{first}{tag}", "email": new_email(first.lower()), "role": role, "department": f"{dept}{tag}"}
        r = client.post(S, json=body, headers=admin)
        assert r.status_code == 201, r.text
        return r.json()["user"], r.json()["temporaryPassword"]

    alpha, _ = make_user("Alpha", "Recruiter", "D1")         # pending password, never signed in
    bravo, bravo_pw = make_user("Bravo", "Proctor", "D1")    # signs in and sets a password
    charlie, _ = make_user("Charlie", "Recruiter", "D2")     # deactivated
    delta, _ = make_user("Delta", "Recruiter", "D2")         # locked
    echo, _ = make_user("Echo", "Recruiter", "D2")           # deleted

    first = sign_in(client, "proctor", bravo["email"], bravo_pw)["accessToken"]
    assert client.post(f"{API}/proctor/auth/change-password", headers=auth(first),
                       json={"currentPassword": bravo_pw, "newPassword": "NewPassw0rd!x"}).status_code == 200
    client.patch(f"{S}/{charlie['id']}", json={"isActive": False}, headers=admin)
    for _ in range(3):
        start_login(client, "recruiter", delta["email"], "wrong-password")
    client.delete(f"{S}/{echo['id']}", headers=admin)

    def find(**params):
        r = client.get(f"{S}/search", params={"q": tag, "pageSize": 100, **params}, headers=admin)
        assert r.status_code == 200, r.text
        return [i["name"].replace(tag, "") for i in r.json()["items"]], r.json()

    assert find(sort="name", order="asc")[0] == ["Alpha", "Bravo", "Charlie", "Delta"]   # deleted Echo is hidden
    assert find(sort="name", order="desc")[0] == ["Delta", "Charlie", "Bravo", "Alpha"]
    assert find(status="active", sort="name", order="asc")[0] == ["Alpha", "Bravo", "Delta"]
    assert find(status="disabled")[0] == ["Charlie"]
    assert find(status="locked")[0] == ["Delta"]
    assert find(status="pendingPassword", sort="name", order="asc")[0] == ["Alpha", "Delta"]
    assert find(status="neverSignedIn", sort="name", order="asc")[0] == ["Alpha", "Delta"]
    assert find(status="deleted")[0] == ["Echo"]
    assert find(role="Proctor")[0] == ["Bravo"]
    assert find(department=f"d1{tag}", sort="name", order="asc")[0] == ["Alpha", "Bravo"]
    assert find(q=f"alpha{tag}")[0] == ["Alpha"] and find(q="%")[1]["total"] == 0
    assert find(sort="lastLoginAt", order="asc")[0][0] == "Bravo"                    # the only one who signed in
    assert find(sort="lastLoginAt", order="desc")[0][0] == "Bravo"                    # never-signed-in stay last

    page = find(pageSize=2, sort="name", order="asc")[1]
    assert (page["total"], page["pages"], len(page["items"])) == (4, 2, 2)
    assert find(pageSize=2, page=2, sort="name", order="asc")[0] == ["Charlie", "Delta"]
    assert find(pageSize=2, page=3)[0] == []

    bravo_row = next(i for i in find(role="Proctor")[1]["items"])
    assert bravo_row["activeSessions"] == 1 and bravo_row["lastLoginAt"] and bravo_row["mustChangePassword"] is False
    delta_row = next(i for i in find(status="locked")[1]["items"])
    assert delta_row["lockedUntil"]

    for bad in ({"role": "Hacker"}, {"status": "weird"}, {"sort": "password"}, {"order": "up"},
                {"pageSize": 101}, {"pageSize": 0}, {"page": 0}):
        assert client.get(f"{S}/search", params=bad, headers=admin).status_code == 422, bad


def test_the_plain_list_hides_deleted_accounts(client, admin):
    user, _ = create_staff(client, admin, "Recruiter", "listed")
    assert user["id"] in {u["id"] for u in client.get(S, headers=admin).json()}
    client.delete(f"{S}/{user['id']}", headers=admin)
    assert user["id"] not in {u["id"] for u in client.get(S, headers=admin).json()}


def test_detail(client, admin):
    user, _ = create_staff(client, admin, "Proctor", "detail")
    d = detail(client, admin, user["id"])
    assert d["email"] == user["email"] and d["otpEmail"] == user["email"] and d["role"] == "Proctor"
    assert d["createdByEmail"] == ADMIN["email"] and d["activeSessions"] == 0 and d["failedLogins"] == 0
    assert d["passwordChangedAt"] and d["deletedAt"] is None
    assert not any("hash" in key.lower() for key in d)  # the password hash is never exposed
    assert client.get(f"{S}/does-not-exist", headers=admin).status_code == 404
    client.delete(f"{S}/{user['id']}", headers=admin)
    assert detail(client, admin, user["id"])["deletedAt"]  # a deleted account can still be inspected


# ---------------------------------------------------------------- profile
def test_profile_edit_is_audited_with_before_and_after(client, admin):
    user, _ = create_staff(client, admin, "Recruiter", "profile")
    r = client.patch(f"{S}/{user['id']}/profile", headers=admin,
                     json={"name": "  Renamed   Person ", "phone": "+44 20 7946 0958", "department": "Legal"})
    assert r.status_code == 200, r.text
    assert (r.json()["name"], r.json()["phone"], r.json()["department"]) == ("Renamed Person", "+44 20 7946 0958", "Legal")
    entry = audits("staff.update_profile", target_id=user["id"])[-1]
    assert entry.details["changes"]["department"] == {"from": None, "to": "Legal"}
    assert entry.details["signedOut"] is False and "name" in entry.summary

    cleared = client.patch(f"{S}/{user['id']}/profile", json={"phone": "", "department": ""}, headers=admin).json()
    assert cleared["phone"] is None and cleared["department"] is None

    before = len(audits("staff.update_profile", target_id=user["id"]))
    assert client.patch(f"{S}/{user['id']}/profile", json={"name": "Renamed Person"}, headers=admin).status_code == 200
    assert client.patch(f"{S}/{user['id']}/profile", json={}, headers=admin).status_code == 200
    assert len(audits("staff.update_profile", target_id=user["id"])) == before    # no change, no entry


@pytest.mark.parametrize("body", [{"name": ""}, {"name": "<b>x</b>"}, {"name": None}, {"email": "nope"},
                                  {"otpEmail": "a@b"}, {"phone": "call me"}, {"role": "System Admin"},
                                  {"isActive": False}, {"department": "x" * 81}])
def test_profile_rejects_bad_input(client, admin, body):
    user, _ = create_staff(client, admin, "Recruiter", "badprofile")
    assert client.patch(f"{S}/{user['id']}/profile", json=body, headers=admin).status_code == 422


def test_changing_login_email_signs_the_user_out_and_notifies_the_old_address(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "moving")
    dev, token = device("recruiter", user["email"], temp)
    assert me(dev, "recruiter", token).status_code == 200
    SENT.clear()

    new_address = new_email("moved")
    r = client.patch(f"{S}/{user['id']}/profile", json={"email": new_address.upper()}, headers=admin)
    assert r.status_code == 200 and r.json()["email"] == new_address            # normalised

    assert me(dev, "recruiter", token).status_code == 401                        # the old access token died at once
    assert dev.post(f"{API}/recruiter/auth/refresh").status_code == 401         # ... and so did the refresh token
    assert start_login(client, "recruiter", user["email"], temp).status_code == 401   # old login id no longer exists
    assert start_login(client, "recruiter", new_address, temp).status_code == 200
    assert [s for s in SENT if s[0] == user["email"] and "security notice" in s[1]], "old address must be told"
    entry = audits("staff.update_profile", target_id=user["id"])[-1]
    assert entry.details["signedOut"] is True and entry.details["changes"]["email"]["to"] == new_address


def test_changing_the_2fa_address_redirects_codes_and_notifies_the_old_one(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "otpmove")
    SENT.clear()
    r = client.patch(f"{S}/{user['id']}/profile", json={"otpEmail": "new.2fa@example.com"}, headers=admin)
    assert r.status_code == 200 and r.json()["otpEmail"] == "new.2fa@example.com"
    assert any(to == user["email"] and "security notice" in subj for to, subj, _ in SENT)
    SENT.clear()
    assert start_login(client, "recruiter", user["email"], temp).status_code == 200
    assert any(to == "new.2fa@example.com" for to, *_ in SENT)                   # the passcode goes to the new address


def test_profile_email_must_be_unique_and_deleted_accounts_keep_theirs(client, admin):
    one, _ = create_staff(client, admin, "Recruiter", "uniq1")
    two, _ = create_staff(client, admin, "Recruiter", "uniq2")
    r = client.patch(f"{S}/{two['id']}/profile", json={"email": one["email"]}, headers=admin)
    assert r.status_code == 409 and "already exists" in r.json()["detail"]
    client.delete(f"{S}/{one['id']}", headers=admin)
    r = client.patch(f"{S}/{two['id']}/profile", json={"email": one["email"]}, headers=admin)
    assert r.status_code == 409 and "Restore" in r.json()["detail"]


def test_admins_cannot_edit_their_own_login_details_but_can_edit_the_rest(client, admin):
    mine = next(u for u in client.get(S, headers=admin).json() if u["email"] == ADMIN["email"])
    for body in ({"email": new_email("me")}, {"otpEmail": "typo@example.com"}):
        r = client.patch(f"{S}/{mine['id']}/profile", json=body, headers=admin)
        assert r.status_code == 400 and "lock you out" in r.json()["detail"]
    original = detail(client, admin, mine["id"])
    ok = client.patch(f"{S}/{mine['id']}/profile", json={"department": "Platform", "phone": "+91 99999 11111"},
                      headers=admin)
    assert ok.status_code == 200 and ok.json()["department"] == "Platform"
    client.patch(f"{S}/{mine['id']}/profile", headers=admin,
                 json={"department": original["department"] or "", "phone": original["phone"] or ""})


# ---------------------------------------------------------------- unlock
def test_unlock(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "locked")
    for _ in range(3):
        assert start_login(client, "recruiter", user["email"], "wrong-password").status_code == 401
    assert start_login(client, "recruiter", user["email"], temp).status_code == 429
    assert detail(client, admin, user["id"])["lockedUntil"]

    r = client.post(f"{S}/{user['id']}/unlock", headers=admin)
    assert r.status_code == 200 and r.json()["lockedUntil"] is None and r.json()["failedLogins"] == 0
    assert start_login(client, "recruiter", user["email"], temp).status_code == 200
    entry = audits("staff.unlock", target_id=user["id"])[-1]
    assert entry.details["wasLocked"] is True and entry.actor_email == ADMIN["email"]

    again = len(audits("staff.unlock", target_id=user["id"]))
    assert client.post(f"{S}/{user['id']}/unlock", headers=admin).status_code == 200   # nothing to unlock
    assert len(audits("staff.unlock", target_id=user["id"])) == again


def test_unlock_clears_a_partial_failure_count(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "partial")
    start_login(client, "recruiter", user["email"], "nope")
    assert detail(client, admin, user["id"])["failedLogins"] == 1
    client.post(f"{S}/{user['id']}/unlock", headers=admin)
    assert detail(client, admin, user["id"])["failedLogins"] == 0
    assert audits("staff.unlock", target_id=user["id"])[-1].details == {"wasLocked": False, "failedAttemptsCleared": 1}


# ---------------------------------------------------------------- force logout / instant session end
def test_force_logout_ends_every_session_immediately(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "forced")
    laptop, laptop_token = device("recruiter", user["email"], temp)
    phone, phone_token = device("recruiter", user["email"], temp)
    assert detail(client, admin, user["id"])["activeSessions"] == 2

    r = client.post(f"{S}/{user['id']}/force-logout", headers=admin)   # no sleeping: even a token minted this second dies
    assert r.status_code == 200 and r.json()["revokedSessions"] == 2

    for dev, token in ((laptop, laptop_token), (phone, phone_token)):
        assert me(dev, "recruiter", token).status_code == 401           # access tokens refused at once
        assert dev.post(f"{API}/recruiter/auth/refresh").status_code == 401
    assert detail(client, admin, user["id"])["activeSessions"] == 0
    assert audits("security.token_reuse", actor_email=user["email"]) == []   # an ended session is not a theft alarm
    entry = audits("staff.force_logout", target_id=user["id"])[-1]
    assert entry.details == {"sessionsEnded": 2}

    # they can sign in again right away, and the new token is accepted
    again, again_token = device("recruiter", user["email"], temp)
    assert me(again, "recruiter", again_token).status_code == 200


def test_force_logout_rules(client, admin):
    mine = next(u for u in client.get(S, headers=admin).json() if u["email"] == ADMIN["email"])
    assert client.post(f"{S}/{mine['id']}/force-logout", headers=admin).status_code == 400
    assert client.post(f"{S}/nobody/force-logout", headers=admin).status_code == 404
    deleted, _ = create_staff(client, admin, "Recruiter", "gone1")
    client.delete(f"{S}/{deleted['id']}", headers=admin)
    assert client.post(f"{S}/{deleted['id']}/force-logout", headers=admin).status_code == 409


def test_changing_your_password_ends_your_other_sessions_at_once(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "pwother")
    other, other_token = device("recruiter", user["email"], temp)
    here, here_token = device("recruiter", user["email"], temp)
    r = here.post(f"{API}/recruiter/auth/change-password", headers=auth(here_token),
                  json={"currentPassword": temp, "newPassword": "NewPassw0rd!x"})
    assert r.status_code == 200
    assert me(other, "recruiter", other_token).status_code == 401           # the other device is out immediately
    assert me(here, "recruiter", r.json()["accessToken"]).status_code == 200   # this one continues with its new token


def test_role_change_and_deactivation_take_effect_immediately(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "roleswap")
    dev, token = device("recruiter", user["email"], temp)
    client.patch(f"{S}/{user['id']}", json={"role": "Proctor"}, headers=admin)
    assert me(dev, "recruiter", token).status_code == 401 and dev.post(f"{API}/recruiter/auth/refresh").status_code == 401

    other, other_temp = create_staff(client, admin, "Recruiter", "deact")
    dev2, token2 = device("recruiter", other["email"], other_temp)
    client.patch(f"{S}/{other['id']}", json={"isActive": False}, headers=admin)
    assert me(dev2, "recruiter", token2).status_code == 401


def test_reset_password_ends_sessions_and_old_password_dies(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "resetme")
    dev, token = device("recruiter", user["email"], temp)
    new_temp = client.post(f"{S}/{user['id']}/reset-password", headers=admin).json()["temporaryPassword"]
    assert me(dev, "recruiter", token).status_code == 401
    assert start_login(client, "recruiter", user["email"], temp).status_code == 401
    assert start_login(client, "recruiter", user["email"], new_temp).status_code == 200


# ---------------------------------------------------------------- refresh-token theft detection stays precise
def test_replaying_a_rotated_token_is_still_a_theft_alarm_but_a_logged_out_one_is_not(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "theft")
    dev = TestClient(app)
    sign_in(dev, "recruiter", user["email"], temp)
    stolen = dev.cookies.get("nexus_refresh")
    assert dev.post(f"{API}/recruiter/auth/refresh").status_code == 200          # rotates: `stolen` is now spent
    dev.cookies.set("nexus_refresh", stolen, path=API)
    assert dev.post(f"{API}/recruiter/auth/refresh").status_code == 401           # replay of a rotated token
    assert len(audits("security.token_reuse", actor_email=user["email"])) == 1
    assert detail(client, admin, user["id"])["activeSessions"] == 0               # everything was cut off

    quiet, qtemp = create_staff(client, admin, "Recruiter", "quiet")
    dev2 = TestClient(app)
    sign_in(dev2, "recruiter", quiet["email"], qtemp)
    cookie = dev2.cookies.get("nexus_refresh")
    assert dev2.post(f"{API}/recruiter/auth/logout").status_code == 200
    dev2.cookies.set("nexus_refresh", cookie, path=API)
    assert dev2.post(f"{API}/recruiter/auth/refresh").status_code == 401
    assert audits("security.token_reuse", actor_email=quiet["email"]) == []        # a normal logout is not an attack


# ---------------------------------------------------------------- resend credentials
def test_resend_credentials_for_an_account_that_never_finished_signing_up(client, admin):
    user, first_temp = create_staff(client, admin, "Recruiter", "resend")
    SENT.clear()
    r = client.post(f"{S}/{user['id']}/resend-credentials", headers=admin)
    assert r.status_code == 200, r.text
    second = r.json()["temporaryPassword"]
    assert second != first_temp and r.json()["emailed"] is True
    assert any(to == user["email"] and second in body for to, _, body in SENT)

    assert start_login(client, "recruiter", user["email"], first_temp).status_code == 401   # the old one is dead
    assert start_login(client, "recruiter", user["email"], second).status_code == 200
    entry = audits("staff.resend_credentials", target_id=user["id"])[-1]
    assert second not in str(entry.details) + entry.summary

    token = sign_in(client, "recruiter", user["email"], second)["accessToken"]
    client.post(f"{API}/recruiter/auth/change-password", headers=auth(token),
                json={"currentPassword": second, "newPassword": "NewPassw0rd!x"})
    again = client.post(f"{S}/{user['id']}/resend-credentials", headers=admin)       # now they have their own password
    assert again.status_code == 409 and "Reset password" in again.json()["detail"]


def test_resend_credentials_rules(client, admin):
    mine = next(u for u in client.get(S, headers=admin).json() if u["email"] == ADMIN["email"])
    assert client.post(f"{S}/{mine['id']}/resend-credentials", headers=admin).status_code == 400
    off, _ = create_staff(client, admin, "Recruiter", "off")
    client.patch(f"{S}/{off['id']}", json={"isActive": False}, headers=admin)
    assert client.post(f"{S}/{off['id']}/resend-credentials", headers=admin).status_code == 409


# ---------------------------------------------------------------- delete / restore
def test_delete_and_restore(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "deleted")
    dev, token = device("recruiter", user["email"], temp)

    r = client.delete(f"{S}/{user['id']}", headers=admin)
    assert r.status_code == 200 and r.json()["revokedSessions"] == 1
    assert me(dev, "recruiter", token).status_code == 401                          # signed out instantly
    assert start_login(client, "recruiter", user["email"], temp).status_code == 401
    d = detail(client, admin, user["id"])
    assert d["deletedAt"] and d["isActive"] is False
    assert audits("staff.delete", target_id=user["id"])[-1].details["email"] == user["email"]

    assert client.delete(f"{S}/{user['id']}", headers=admin).status_code == 409    # already deleted
    for call in (lambda: client.patch(f"{S}/{user['id']}", json={"role": "Proctor"}, headers=admin),
                 lambda: client.post(f"{S}/{user['id']}/reset-password", headers=admin),
                 lambda: client.patch(f"{S}/{user['id']}/profile", json={"name": "Zed"}, headers=admin)):
        assert call().status_code == 409
    r = client.post(S, headers=admin, json={"name": "Again", "email": user["email"], "role": "Recruiter"})
    assert r.status_code == 409 and "Restore" in r.json()["detail"]

    restored = client.post(f"{S}/{user['id']}/restore", headers=admin)
    assert restored.status_code == 200
    assert restored.json()["deletedAt"] is None and restored.json()["isActive"] is False   # back, but disabled
    assert restored.json()["mustChangePassword"] is True
    assert start_login(client, "recruiter", user["email"], temp).status_code == 401        # still cannot sign in
    client.patch(f"{S}/{user['id']}", json={"isActive": True}, headers=admin)
    assert start_login(client, "recruiter", user["email"], temp).status_code == 200
    assert audits("staff.restore", target_id=user["id"])
    assert client.post(f"{S}/{user['id']}/restore", headers=admin).status_code == 409      # not deleted any more


def test_delete_rules(client, admin):
    mine = next(u for u in client.get(S, headers=admin).json() if u["email"] == ADMIN["email"])
    r = client.delete(f"{S}/{mine['id']}", headers=admin)
    assert r.status_code == 400 and "your own" in r.json()["detail"]
    assert client.delete(f"{S}/nobody", headers=admin).status_code == 404
    assert client.post(f"{S}/nobody/restore", headers=admin).status_code == 404


def test_a_second_admin_can_be_deleted_but_the_acting_admin_always_remains(client, admin):
    other, temp = create_staff(client, admin, "System Admin", "coadmin")
    assert client.delete(f"{S}/{other['id']}", headers=admin).status_code == 200      # fine: the caller is still active
    again, _ = create_staff(client, admin, "System Admin", "coadmin2")
    assert client.patch(f"{S}/{again['id']}", json={"role": "Recruiter"}, headers=admin).status_code == 200
    assert client.patch(f"{S}/{again['id']}", json={"role": "System Admin"}, headers=admin).status_code == 200
    assert client.patch(f"{S}/{again['id']}", json={"isActive": False}, headers=admin).status_code == 200


# ---------------------------------------------------------------- sessions
def test_sessions_list_and_end_one(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "sessions")
    laptop, _ = device("recruiter", user["email"], temp)
    phone, _ = device("recruiter", user["email"], temp)

    r = client.get(f"{S}/{user['id']}/sessions", headers=admin)
    assert r.status_code == 200 and r.json()["count"] == 2 and "Force logout" in r.json()["note"]
    sessions = r.json()["items"]
    assert all(s["ipAddress"] == "testclient" and s["userAgent"] and s["startedAt"] and s["expiresAt"]
               for s in sessions)

    # refreshing rotates the token but it is still the same session, with the same start time
    started = {s["id"]: s["startedAt"] for s in sessions}
    assert laptop.post(f"{API}/recruiter/auth/refresh").status_code == 200
    after = client.get(f"{S}/{user['id']}/sessions", headers=admin).json()
    assert after["count"] == 2 and {s["id"]: s["startedAt"] for s in after["items"]} == started

    target = after["items"][0]["id"]
    r = client.delete(f"{S}/{user['id']}/sessions/{target}", headers=admin)
    assert r.status_code == 200 and r.json()["revokedSessions"] == 1
    left = client.get(f"{S}/{user['id']}/sessions", headers=admin).json()
    assert left["count"] == 1 and left["items"][0]["id"] != target

    survivors = [d for d in (laptop, phone) if d.post(f"{API}/recruiter/auth/refresh").status_code == 200]
    assert len(survivors) == 1                                                         # exactly one device was cut off
    assert audits("security.token_reuse", actor_email=user["email"]) == []

    assert client.delete(f"{S}/{user['id']}/sessions/{target}", headers=admin).status_code == 404   # already ended
    assert client.delete(f"{S}/{user['id']}/sessions/not-a-session", headers=admin).status_code == 404
    entry = audits("staff.session_end", target_id=user["id"])[-1]
    assert entry.details["sessionId"] == target and entry.details["ipAddress"] == "testclient"


def test_sessions_of_unknown_or_logged_out_accounts(client, admin):
    assert client.get(f"{S}/nobody/sessions", headers=admin).status_code == 404
    user, temp = create_staff(client, admin, "Recruiter", "loggedout")
    dev, _ = device("recruiter", user["email"], temp)
    assert dev.post(f"{API}/recruiter/auth/logout").status_code == 200
    listing = client.get(f"{S}/{user['id']}/sessions", headers=admin).json()
    assert listing["items"] == [] and listing["count"] == 0


def test_sessions_can_be_expired_by_the_clock(client, admin):
    user, temp = create_staff(client, admin, "Recruiter", "expired")
    device("recruiter", user["email"], temp)
    with SessionLocal() as db:
        for token in db.query(RefreshToken).filter(RefreshToken.user_id == user["id"]):
            token.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()
    assert client.get(f"{S}/{user['id']}/sessions", headers=admin).json()["count"] == 0
    assert detail(client, admin, user["id"])["activeSessions"] == 0
