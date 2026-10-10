import logging
from pathlib import Path
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.default_settings import DEFAULT_SETTINGS
from app.core.roles import LEGACY_ROLE_MAP, ROLE_SYSTEM_ADMIN
from app.core.password_policy import is_weak_for_admin
from app.core.security import generate_temp_password, hash_password, verify_password
from app.db.session import SessionLocal, engine
from app.models.auth import AuthBase, StaffUser, SystemSetting, utcnow
from app.services import audit
from app.services import auth_core as core
from app.services.question_bank import ensure_question_categories
from app.services.recruiter_seed import seed_recruiter_demo

logger = logging.getLogger("nexus.bootstrap")

_BACKEND_DIR = Path(__file__).resolve().parents[2]


def schema_revisions() -> tuple:
    """(current, expected) Alembic revision of the database. Both are 'sqlite' for the local test database."""
    if settings.AUTH_DATABASE_URL.startswith("sqlite"):
        return "sqlite", "sqlite"

    from alembic.config import Config
    from alembic.runtime.migration import MigrationContext
    from alembic.script import ScriptDirectory

    cfg = Config(str(_BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(_BACKEND_DIR / "alembic"))
    head = ScriptDirectory.from_config(cfg).get_current_head()
    with engine.connect() as conn:
        current = MigrationContext.configure(conn).get_current_revision()
    return current, head


def _ensure_schema() -> None:
    """SQLite (local tests) builds its tables directly; Postgres must be migrated with Alembic."""
    if settings.AUTH_DATABASE_URL.startswith("sqlite"):
        AuthBase.metadata.create_all(bind=engine)
        return

    current, head = schema_revisions()
    if current != head:
        raise RuntimeError(
            f"Database schema is at revision {current!r} but the code expects {head!r}. "
            "Run:  alembic upgrade head   (from the backend folder)"
        )

def _migrate_legacy_roles(db: Session) -> None:
    for old, new in LEGACY_ROLE_MAP.items():
        moved = db.query(StaffUser).filter(StaffUser.role == old).update({"role": new})
        if moved:
            logger.warning("Migrated %d staff account(s) from role '%s' to '%s'", moved, old, new)
    db.commit()


def seed_default_settings(db: Session) -> int:
    """Insert every setting that is missing from the table. Existing values are never overwritten."""
    existing = {key for (key,) in db.query(SystemSetting.key).all()}
    added = 0
    for spec in DEFAULT_SETTINGS:
        if spec["key"] in existing:
            continue
        db.add(SystemSetting(
            key=spec["key"],
            group=spec["group"],
            value=spec["default"],
            value_type=spec["type"],
            is_secret=spec["secret"],
            description=spec["description"],
        ))
        added += 1
    if added:
        db.commit()
        logger.info("Seeded %d default system setting(s)", added)
    return added


# Admin passwords that were published in this project's source / documentation. Any account still using one of
# them is forced to choose a new password at its next sign-in.
LEGACY_DEFAULT_ADMIN_PASSWORDS = ("970598",)


def ensure_seed_admin(db: Session) -> Optional[str]:
    """
    Create the first System Admin when no account with SEED_ADMIN_EMAIL exists.
    Returns the generated temporary password when SEED_ADMIN_PASSWORD was not configured (None otherwise).
    A generated password is shown once in the server log and must be replaced at first sign-in; a password the
    operator chose explicitly in SEED_ADMIN_PASSWORD is trusted as is.
    """
    email = settings.SEED_ADMIN_EMAIL.strip().lower()
    if not email or db.query(StaffUser).filter(StaffUser.email == email).first():
        return None
    configured = settings.SEED_ADMIN_PASSWORD
    password = configured or generate_temp_password()
    db.add(StaffUser(
        email=email,
        # OTPs for the seeded account go to the project mailbox (its login id isn't a real email).
        otp_email=settings.GMAIL_SENDER_EMAIL if "." not in email.split("@")[-1] else email,
        full_name=settings.SEED_ADMIN_NAME,
        role=ROLE_SYSTEM_ADMIN,
        password_hash=hash_password(password),
        must_change_password=not configured,
        password_changed_at=utcnow(),
    ))
    db.commit()
    audit.record_audit(db, category=audit.CAT_SYSTEM, action="system.admin_seeded",
                       summary=f"Initial System Admin account {email} was created at startup",
                       target_type="staff_user", details={"email": email, "temporaryPassword": not configured})
    if not configured:
        logger.warning("=" * 72)
        logger.warning("Initial System Admin created:  %s", email)
        logger.warning("Temporary password (shown only now):  %s", password)
        logger.warning("You must choose your own password at first sign-in.")
        logger.warning("=" * 72)
        return password
    logger.warning("Seeded System Admin account '%s' from SEED_ADMIN_PASSWORD", email)
    return None


def enforce_admin_password_policy(db: Session) -> List[str]:
    """
    Force a password change for the seeded admin when it still uses a known-weak password (a published legacy
    default, or a weak SEED_ADMIN_PASSWORD). Returns the emails that were flagged.
    """
    email = settings.SEED_ADMIN_EMAIL.strip().lower()
    user = db.query(StaffUser).filter(StaffUser.email == email, StaffUser.deleted_at.is_(None)).first() if email else None
    if user is None or user.must_change_password:
        return []
    candidates = [p for p in (settings.SEED_ADMIN_PASSWORD, *LEGACY_DEFAULT_ADMIN_PASSWORDS) if p]
    if not any(is_weak_for_admin(p) and verify_password(p, user.password_hash) for p in candidates):
        return []
    user.must_change_password = True
    db.commit()
    core.end_all_sessions(db, user, core.REVOKE_SECURITY)
    audit.record_audit(db, category=audit.CAT_SECURITY, action="security.password_change_forced", actor=user,
                       target_type="staff_user", target_id=user.id,
                       summary=f"{user.email} still used a known-weak password; a new one is required at next sign-in",
                       details={"email": user.email})
    logger.warning("Admin '%s' still has a known-weak password: a new one is now required at next sign-in", user.email)
    return [user.email]


def init_auth_db() -> None:
    """Check the schema, seed default settings, make sure a System Admin exists, and retire weak admin passwords."""
    _ensure_schema()

    db: Session = SessionLocal()
    try:
        _migrate_legacy_roles(db)
        seed_default_settings(db)
        ensure_question_categories(db)
        ensure_seed_admin(db)
        seed_recruiter_demo(db)
        if settings.APP_ENV != "test":  # tests deliberately use a known admin password
            enforce_admin_password_policy(db)
    finally:
        db.close()
