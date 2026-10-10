"""
Security readiness report (read-only; prints no secret values).   Run from the backend folder:

    python -m app.scripts.security_report            # configuration + admin accounts + database
    python -m app.scripts.security_report --email    # also check the SMTP gateway (connects and signs in, sends nothing)

Shows what would stop a PRODUCTION start, the state of the System Admin accounts, and whether anything secret-looking is
still tracked by git.
"""
import shutil
import subprocess
import sys
from pathlib import Path

from sqlalchemy import text

from app.core.config import KNOWN_LEAKED_SECRET_KEYS, settings
from app.core.prod_checks import config_problems
from app.db.session import engine

REPO = Path(__file__).resolve().parents[3]


def section(title: str) -> None:
    print(f"\n== {title} " + "=" * max(3, 66 - len(title)))


def main() -> int:
    print(f"Environment: {settings.APP_ENV}   Database: {engine.dialect.name}")

    section("Signing key")
    print("  set in the environment :", bool(__import__('os').environ.get("SECRET_KEY")))
    print("  is a published key     :", settings.SECRET_KEY in KNOWN_LEAKED_SECRET_KEYS)
    print("  length                 :", len(settings.SECRET_KEY))
    print("  dedicated encryption key:", bool(settings.SETTINGS_ENCRYPTION_KEY))

    errors, warnings = config_problems()
    section(f"Would block a PRODUCTION start ({len(errors)})")
    for e in errors:
        print("  -", e)
    if not errors:
        print("  nothing: production configuration checks would pass")
    section(f"Warnings ({len(warnings)})")
    for w in warnings:
        print("  -", w)

    section("System Admin accounts")
    with engine.connect() as conn:
        rows = conn.execute(text(
            "select email, is_active, must_change_password, last_login_at, deleted_at "
            "from staff_users where role = 'System Admin' order by created_at")).fetchall()
        for email, active, must_change, last_login, deleted in rows:
            state = "DELETED" if deleted else ("active" if active else "disabled")
            print(f"  {email:<28} {state:<9} must change password: {str(bool(must_change)):<5} "
                  f"last sign-in: {str(last_login)[:19] if last_login else 'never'}")
        sessions = conn.execute(text(
            "select count(*) from refresh_tokens where revoked = false and expires_at > now()")).scalar() \
            if engine.dialect.name == "postgresql" else "n/a"
        print("  live staff sessions    :", sessions)

    section("Git")
    if shutil.which("git") and (REPO / ".git").exists():
        tracked = subprocess.run(["git", "ls-files"], cwd=REPO, capture_output=True, text=True).stdout.splitlines()
        env_files = [f for f in tracked if f.rsplit("/", 1)[-1].startswith(".env") and not f.endswith(".example")]
        print("  tracked env files      :", env_files or "none")
        print("  NOTE: anything committed earlier stays in the history of every clone and of the remote.")
    else:
        print("  (not a git checkout)")

    if "--email" in sys.argv:
        section("Email gateway")
        from app.services.email import probe_gateway
        ok, message = probe_gateway()
        print(f"  ok={ok} - {message}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
