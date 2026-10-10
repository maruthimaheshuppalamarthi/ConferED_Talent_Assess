"""
Shared test setup. Runs before any test module is imported, so the app is ALWAYS built against a throwaway
SQLite file with fixed, fake credentials - never the real (Supabase) database or the secrets in backend/.env.
"""
import os
import sys
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["APP_ENV"] = "test"
os.environ["AUTH_DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp, 'test.db').replace(os.sep, '/')}"
os.environ["SECRET_KEY"] = "test-only-signing-key-0123456789-abcdefghijklmnopqrstuvwxyz"
os.environ.pop("SETTINGS_ENCRYPTION_KEY", None)
os.environ["DEV_EXPOSE_OTP"] = "true"
os.environ["OTP_RESEND_COOLDOWN_SECONDS"] = "0"
os.environ["LOGIN_MAX_FAILURES"] = "3"
os.environ["RATE_LIMIT_AUTH_PER_MINUTE"] = "10000"     # the rate-limit tests lower it on purpose
os.environ["TRUST_PROXY"] = "false"
os.environ["SEED_ADMIN_EMAIL"] = "admin@7666"
os.environ["SEED_ADMIN_PASSWORD"] = "970598"            # explicit, so the test admin needs no password change
os.environ["GMAIL_SENDER_EMAIL"] = "platform@example.test"
os.environ["GMAIL_APP_PASSWORD"] = "test-app-password"

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
