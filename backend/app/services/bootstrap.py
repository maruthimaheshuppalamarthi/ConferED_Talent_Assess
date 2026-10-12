import logging
from pathlib import Path
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.default_settings import DEFAULT_SETTINGS
from app.core.roles import LEGACY_ROLE_MAP, ROLE_PROCTOR, ROLE_RECRUITER, ROLE_SYSTEM_ADMIN
from app.core.password_policy import is_weak_for_admin
from app.core.security import generate_temp_password, hash_password, verify_password
from app.db.session import SessionLocal, engine
from app.models.auth import AuthBase, StaffUser, SystemSetting, utcnow
from app.services import audit
from app.services import auth_core as core
from app.services.question_bank import ensure_question_categories
from app.services.recruiter_pipeline import sync_all_job_exam_papers
from app.services.recruiter_seed import ensure_demo_exam_paper, seed_recruiter_demo

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


def _otp_destination(login_id: str) -> str:
    # OTPs for a username-style login id go to the project mailbox (it isn't a real email).
    if "." not in login_id.split("@")[-1]:
        return (settings.GMAIL_SENDER_EMAIL or "").strip() or login_id
    return login_id


def _ensure_seed_staff(db: Session, *, email: str, password: str, name: str, role: str,
                       generate_if_missing: bool) -> Optional[str]:
    """
    Insert one staff row for this portal when that login id + role is missing.
    Lookup is per role so the same username can exist on admin, recruiter and proctor.
    Returns a generated temporary password, or None when the account already existed / was configured.
    """
    email = (email or "").strip().lower()
    if not email:
        return None
    if db.query(StaffUser).filter(StaffUser.email == email, StaffUser.role == role).first():
        return None
    configured = (password or "").strip()
    if not configured and not generate_if_missing:
        return None
    chosen = configured or generate_temp_password()
    db.add(StaffUser(
        email=email,
        otp_email=_otp_destination(email),
        full_name=name,
        role=role,
        password_hash=hash_password(chosen),
        must_change_password=not configured,
        password_changed_at=utcnow(),
    ))
    db.commit()
    audit.record_audit(db, category=audit.CAT_SYSTEM, action="system.staff_seeded",
                       summary=f"Seeded {role} account {email} was created at startup",
                       target_type="staff_user", details={"email": email, "role": role,
                                                          "temporaryPassword": not configured})
    if not configured:
        logger.warning("=" * 72)
        logger.warning("Seeded %s created:  %s", role, email)
        logger.warning("Temporary password (shown only now):  %s", chosen)
        logger.warning("You must choose your own password at first sign-in.")
        logger.warning("=" * 72)
        return chosen
    logger.warning("Seeded %s account '%s' from configured seed password", role, email)
    return None


def ensure_seed_admin(db: Session) -> Optional[str]:
    """
    Create the first System Admin when no account with SEED_ADMIN_EMAIL exists for that role.
    Returns the generated temporary password when SEED_ADMIN_PASSWORD was not configured (None otherwise).
    A generated password is shown once in the server log and must be replaced at first sign-in; a password the
    operator chose explicitly in SEED_ADMIN_PASSWORD is trusted as is.
    """
    return _ensure_seed_staff(
        db, email=settings.SEED_ADMIN_EMAIL, password=settings.SEED_ADMIN_PASSWORD,
        name=settings.SEED_ADMIN_NAME, role=ROLE_SYSTEM_ADMIN, generate_if_missing=True,
    )


def ensure_seed_recruiter(db: Session) -> Optional[str]:
    """Create the Recruiter seed account when SEED_RECRUITER_EMAIL and SEED_RECRUITER_PASSWORD are set."""
    return _ensure_seed_staff(
        db, email=settings.SEED_RECRUITER_EMAIL, password=settings.SEED_RECRUITER_PASSWORD,
        name=settings.SEED_RECRUITER_NAME, role=ROLE_RECRUITER, generate_if_missing=False,
    )


def ensure_seed_proctor(db: Session) -> Optional[str]:
    """Create the Proctor seed account when SEED_PROCTOR_EMAIL and SEED_PROCTOR_PASSWORD are set."""
    return _ensure_seed_staff(
        db, email=settings.SEED_PROCTOR_EMAIL, password=settings.SEED_PROCTOR_PASSWORD,
        name=settings.SEED_PROCTOR_NAME, role=ROLE_PROCTOR, generate_if_missing=False,
    )


def enforce_admin_password_policy(db: Session) -> List[str]:
    """
    Force a password change for the seeded admin when it still uses a known-weak password (a published legacy
    default, or a weak SEED_ADMIN_PASSWORD). Returns the emails that were flagged.
    """
    email = settings.SEED_ADMIN_EMAIL.strip().lower()
    user = (db.query(StaffUser).filter(StaffUser.email == email, StaffUser.role == ROLE_SYSTEM_ADMIN,
                                       StaffUser.deleted_at.is_(None)).first() if email else None)
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
        ensure_seed_recruiter(db)
        ensure_seed_proctor(db)
        seed_recruiter_demo(db)
        ensure_demo_exam_paper(db)
        sync_all_job_exam_papers(db)
        if settings.IS_PRODUCTION:  # development seeds (and tests) keep the configured password usable
            enforce_admin_password_policy(db)
    finally:
        db.close()
