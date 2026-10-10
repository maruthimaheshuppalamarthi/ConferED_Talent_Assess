"""JPEG files for candidate identity.

The database stores only the object key and the government-ID type. The bytes go to the
Supabase Storage bucket named in SUPABASE_IDENTITY_BUCKET (default ``identity``):

    identity/<candidate id>/photo.jpg
    identity/<candidate id>/id.jpg

Tests, and a server with no Supabase credentials, keep the same files on local disk under
backend/storage/identity/.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path

from app.core.config import APP_ENV, settings

_ROOT = Path(__file__).resolve().parents[2] / "storage" / "identity"
_CANDIDATE_ID = re.compile(r"^[A-Za-z0-9_-]{1,80}$")
_NAMES = {"photo", "id"}
_KEY = re.compile(r"^identity/([A-Za-z0-9_-]{1,80})/(photo|id)\.jpg$")


class IdentityBucketError(ValueError):
    pass


def _use_supabase() -> bool:
    return APP_ENV != "test" and bool(settings.SUPABASE_URL) and bool(settings.SUPABASE_SERVICE_ROLE_KEY)


def _object_path(candidate_id: str, name: str) -> str:
    return f"{candidate_id}/{name}.jpg"


def _checked(candidate_id: str, name: str) -> None:
    if not _CANDIDATE_ID.match(candidate_id or "") or name not in _NAMES:
        raise IdentityBucketError("This image cannot be stored for that candidate.")


def _key_parts(key: str) -> tuple[str, str]:
    match = _KEY.match(key or "")
    if not match:
        raise IdentityBucketError("Unknown identity image.")
    return match.group(1), match.group(2)


def _request(method: str, object_path: str, body: bytes | None = None, content_type: str | None = None) -> bytes:
    bucket = settings.SUPABASE_IDENTITY_BUCKET or "identity"
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}")
    req.add_header("apikey", settings.SUPABASE_SERVICE_ROLE_KEY)
    if content_type:
        req.add_header("Content-Type", content_type)
    if method == "POST":
        req.add_header("x-upsert", "true")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:240]
        raise IdentityBucketError(
            f"Supabase Storage refused the image ({exc.code}). Confirm the '{bucket}' bucket exists and is private."
            + (f" {detail}" if detail else "")
        ) from exc
    except urllib.error.URLError as exc:
        raise IdentityBucketError("Could not reach Supabase Storage.") from exc


def put_jpeg(candidate_id: str, name: str, raw: bytes) -> str:
    """Store a JPEG and return the key saved on the candidate row."""
    _checked(candidate_id, name)
    if not raw.startswith(b"\xff\xd8\xff"):
        raise IdentityBucketError("The file is not a JPEG image.")
    key = f"identity/{candidate_id}/{name}.jpg"
    if _use_supabase():
        _request("POST", _object_path(candidate_id, name), raw, "image/jpeg")
        return key
    folder = _ROOT / candidate_id
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{name}.jpg").write_bytes(raw)
    return key


def read_jpeg(key: str) -> bytes:
    candidate_id, name = _key_parts(key)
    if _use_supabase():
        raw = _request("GET", _object_path(candidate_id, name))
        if not raw.startswith(b"\xff\xd8\xff"):
            raise IdentityBucketError("The stored file is not a JPEG image.")
        return raw
    path = _ROOT / candidate_id / f"{name}.jpg"
    if not path.is_file():
        raise IdentityBucketError("The identity image is not in the bucket.")
    return path.read_bytes()


def exists(key: str | None) -> bool:
    if not key:
        return False
    try:
        return len(read_jpeg(key)) >= 32
    except IdentityBucketError:
        return False


def delete_object(candidate_id: str, name: str) -> None:
    """Remove one object. Used to clean a connectivity check."""
    _checked(candidate_id, name)
    if not _use_supabase():
        path = _ROOT / candidate_id / f"{name}.jpg"
        if path.is_file():
            path.unlink()
        return
    bucket = settings.SUPABASE_IDENTITY_BUCKET or "identity"
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}"
    body = json.dumps({"prefixes": [_object_path(candidate_id, name)]}).encode()
    req = urllib.request.Request(url, data=body, method="DELETE")
    req.add_header("Authorization", f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}")
    req.add_header("apikey", settings.SUPABASE_SERVICE_ROLE_KEY)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30):
            return
    except urllib.error.HTTPError as exc:
        raise IdentityBucketError(f"Could not remove the image ({exc.code}).") from exc
