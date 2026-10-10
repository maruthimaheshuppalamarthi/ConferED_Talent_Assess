import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.roles import ROLE_ADMIN
from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.models.auth import AuthBase, StaffUser

logger = logging.getLogger("nexus.bootstrap")


def init_auth_db() -> None:
    """Create auth tables and make sure the dev admin account exists."""
    AuthBase.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        email = settings.SEED_ADMIN_EMAIL.strip().lower()
        if email and not db.query(StaffUser).filter(StaffUser.email == email).first():
            db.add(StaffUser(
                email=email,
                # OTPs for the seeded account go to the project mailbox (its login id isn't a real email).
                otp_email=settings.GMAIL_SENDER_EMAIL if "." not in email.split("@")[-1] else email,
                full_name=settings.SEED_ADMIN_NAME,
                role=ROLE_ADMIN,
                password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            ))
            db.commit()
            logger.warning("Seeded dev admin account '%s' (change SEED_ADMIN_* before production)", email)
    finally:
        db.close()
