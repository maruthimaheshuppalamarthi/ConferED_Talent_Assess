"""
Encryption for secrets stored in the database (e.g. the SMTP / Gmail app password).

Fernet = AES-128-CBC + HMAC-SHA256, so a stolen database dump does not reveal the password.
The key comes from SETTINGS_ENCRYPTION_KEY (a Fernet key) when set, otherwise it is derived from SECRET_KEY.
Generate a dedicated key with:   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

NOTE: if the key changes, previously stored secrets can no longer be read; they are treated as "not set"
(the environment fallback is used) and the admin simply enters them again.
"""
import base64
import hashlib
import logging
from functools import lru_cache
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

logger = logging.getLogger("nexus.crypto")


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    configured = (settings.SETTINGS_ENCRYPTION_KEY or "").strip()
    if configured:
        try:
            return Fernet(configured.encode())
        except Exception as exc:
            raise RuntimeError("SETTINGS_ENCRYPTION_KEY is not a valid Fernet key") from exc
    derived = hashlib.sha256(("nexus-settings-encryption:" + settings.SECRET_KEY).encode()).digest()
    return Fernet(base64.urlsafe_b64encode(derived))


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode("utf-8")).decode("ascii")


def decrypt_secret(token: Optional[str]) -> Optional[str]:
    """Plain text, or None when there is nothing stored or it cannot be decrypted with the current key."""
    if not token:
        return None
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError, UnicodeError):
        logger.error("A stored secret could not be decrypted (encryption key changed?). Treating it as unset.")
        return None
