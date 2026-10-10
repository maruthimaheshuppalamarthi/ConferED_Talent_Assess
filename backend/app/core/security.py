import base64
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt

from app.core.config import settings

# Token types (the "typ" claim). Each protected route only accepts the type it expects,
# so a refresh token or candidate token can never be replayed as a staff access token.
TOKEN_ACCESS = "access"
TOKEN_REFRESH = "refresh"
TOKEN_CANDIDATE = "candidate"


# ---------------------------------------------------------------- passwords
def _prehash(password: str) -> bytes:
    # bcrypt only looks at the first 72 bytes; pre-hashing keeps long passphrases safe.
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_prehash(password), password_hash.encode("utf-8"))
    except ValueError:
        return False


# Used to keep login timing similar when the account does not exist.
DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(16))


# --------------------------------------------------------------------- OTPs
def generate_otp() -> str:
    """Cryptographically secure numeric OTP."""
    upper = 10 ** settings.OTP_LENGTH
    return str(secrets.randbelow(upper)).zfill(settings.OTP_LENGTH)


def hash_otp(challenge_id: str, code: str) -> str:
    msg = f"{challenge_id}:{code}".encode("utf-8")
    return hmac.new(settings.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def verify_otp_hash(challenge_id: str, code: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_otp(challenge_id, code), expected_hash)


# ------------------------------------------------------------ opaque tokens
def generate_opaque_token() -> str:
    """URL-safe random token (used for candidate invite links)."""
    return secrets.token_urlsafe(32)


def hash_opaque_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------- JWTs
def _encode(claims: Dict[str, Any], expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        **claims,
        "typ": token_type,
        "iss": settings.JWT_ISSUER,
        "iat": now,
        "exp": now + expires_delta,
        "jti": claims.get("jti") or uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str, role: str) -> str:
    return _encode(
        {"sub": user_id, "role": role},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        TOKEN_ACCESS,
    )


def create_refresh_token(user_id: str, role: str, jti: str) -> str:
    return _encode(
        {"sub": user_id, "role": role, "jti": jti},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        TOKEN_REFRESH,
    )


def create_candidate_token(candidate_id: str, assessment_id: str, invite_id: str) -> str:
    return _encode(
        {
            "sub": candidate_id,
            "role": "Candidate",
            "assessment_id": assessment_id,
            "invite_id": invite_id,
        },
        timedelta(minutes=settings.CANDIDATE_TOKEN_EXPIRE_MINUTES),
        TOKEN_CANDIDATE,
    )


def decode_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """Decode + validate signature/expiry/issuer. Raises jwt.PyJWTError on any problem."""
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],  # never trust the header's alg
        issuer=settings.JWT_ISSUER,
        options={"require": ["exp", "iat", "sub", "typ", "jti"]},
    )
    if expected_type and payload.get("typ") != expected_type:
        raise jwt.InvalidTokenError("Unexpected token type")
    return payload
