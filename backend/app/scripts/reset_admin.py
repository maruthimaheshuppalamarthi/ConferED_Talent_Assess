"""
Last-resort recovery for a System Admin (nobody above them can reset their password in the UI).

    python -m app.scripts.reset_admin admin@example.com            # prints a new temporary password
    python -m app.scripts.reset_admin admin@example.com "NewPass123"

The account is unlocked, re-activated, made to change the password at next sign-in, and signed out everywhere.
"""
import sys

from app.core.password_policy import violation
from app.core.roles import ROLE_SYSTEM_ADMIN
from app.core.security import generate_temp_password, hash_password
from app.db.session import SessionLocal
from app.models.auth import StaffUser
from app.services import auth_core as core
from app.services.bootstrap import init_auth_db


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    email = sys.argv[1].strip().lower()
    password = sys.argv[2] if len(sys.argv) > 2 else generate_temp_password()
    if len(password) < 8 or violation(password, email=email):
        print("Password must be at least 8 characters and not an easily guessed one.")
        return 2

    init_auth_db()
    db = SessionLocal()
    try:
        user = db.query(StaffUser).filter(StaffUser.email == email).first()
        if user is None or user.role != ROLE_SYSTEM_ADMIN:
            print(f"No System Admin account found for '{email}'.")
            return 1
        user.password_hash = hash_password(password)
        user.must_change_password = True
        user.is_active = True
        user.failed_logins = 0
        user.locked_until = None
        db.commit()
        core.end_all_sessions(db, user, core.REVOKE_SECURITY)  # signed out everywhere, at once
        print(f"Password reset for {email}. Temporary password: {password}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
