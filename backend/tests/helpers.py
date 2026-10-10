"""Small helpers shared by the API tests (import with ``from helpers import ...``)."""
import uuid

from app.db.session import SessionLocal
from app.models.auth import AuditLog, LoginEvent

API = "/api/v1"
ADMIN = {"email": "admin@7666", "password": "970598"}


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def start_login(client, portal, email, password):
    return client.post(f"{API}/{portal}/auth/login", json={"email": email, "password": password})


def sign_in(client, portal, email, password):
    """Full two-step sign-in; returns the TokenOut JSON."""
    r = start_login(client, portal, email, password)
    assert r.status_code == 200, r.text
    ch = r.json()
    r = client.post(f"{API}/{portal}/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
    assert r.status_code == 200, r.text
    return r.json()


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


def recruiter_token(client, admin, prefix="rec"):
    """A recruiter who has already chosen their own password; returns (user, access token)."""
    user, temp = create_staff(client, admin, "Recruiter", prefix)
    first = sign_in(client, "recruiter", user["email"], temp)["accessToken"]
    new_password = "NewPassw0rd!x"
    r = client.post(f"{API}/recruiter/auth/change-password", headers=auth(first),
                    json={"currentPassword": temp, "newPassword": new_password})
    assert r.status_code == 200, r.text
    return user, sign_in(client, "recruiter", user["email"], new_password)["accessToken"]


def audit_rows(**filters):
    with SessionLocal() as db:
        return db.query(AuditLog).filter_by(**filters).order_by(AuditLog.created_at).all()


def login_rows(**filters):
    with SessionLocal() as db:
        return db.query(LoginEvent).filter_by(**filters).order_by(LoginEvent.created_at).all()


class FakeSMTP:
    """Stand-in for smtplib.SMTP: records what the code does, never touches the network."""
    instances = []
    fail_login = None

    def __init__(self, host, port, timeout=None, context=None):
        self.host, self.port, self.calls = host, port, []
        FakeSMTP.instances.append(self)

    def ehlo(self):
        self.calls.append("ehlo")

    def starttls(self, context=None):
        self.calls.append("starttls")

    def login(self, user, password):
        if FakeSMTP.fail_login:
            raise FakeSMTP.fail_login
        self.calls.append(("login", user, password))

    def sendmail(self, sender, to, message):
        self.calls.append(("sendmail", sender, to, message))

    def quit(self):
        self.calls.append("quit")


class FakeSMTPSSL(FakeSMTP):
    pass
