"""
Password rules for staff accounts (beyond a minimum length, which is a System Admin setting).

NIST-style: no composition gymnastics, but refuse the passwords attackers try first.
    * the usual suspects ("password", "welcome", "qwerty", ... also as "Password123!"),
    * one repeated character, plain sequences (12345678, abcdefgh, qwertyui),
    * anything containing the person's own email name or name.
"""
import re
from typing import Optional

_COMMON = {
    "password", "passw0rd", "letmein", "welcome", "admin", "administrator", "qwerty", "qwertyuiop", "asdfgh",
    "asdfghjkl", "zxcvbn", "iloveyou", "monkey", "dragon", "master", "login", "abc", "football", "baseball",
    "sunshine", "princess", "trustno", "shadow", "superman", "batman", "michael", "freedom", "whatever", "secret",
    "changeme", "default", "guest", "root", "test", "testing", "temp", "temporary", "company", "nexusassess",
    "nexus", "assess", "hello", "hunter", "summer", "winter", "spring", "autumn", "india", "ganesh", "krishna",
    "computer", "internet", "service", "flower", "cheese", "pokemon", "starwars", "ninja", "mustang", "access",
}
_SEQUENCES = ("0123456789", "9876543210", "abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba",
              "qwertyuiopasdfghjklzxcvbnm", "1qaz2wsx3edc")
_LEET = str.maketrans({"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i"})
MIN_LENGTH_FOR_ADMIN_SEED = 12


def _base_word(password: str) -> str:
    """'Passw0rd123!' -> 'password': undo common letter swaps, then drop trailing digits / symbols."""
    stem = re.sub(r"[^a-z]+$", "", password.lower())  # drop trailing digits / symbols first ("Password1!" -> "password")
    return stem.translate(_LEET)                       # then undo letter swaps ("p@ssw0rd" -> "password")


def _is_sequence(password: str) -> bool:
    lowered = password.lower()
    return len(lowered) >= 6 and any(lowered in seq for seq in _SEQUENCES)


def violation(password: str, email: Optional[str] = None, name: Optional[str] = None) -> Optional[str]:
    """A short reason the password is not acceptable, or None when it is fine."""
    pw = password or ""
    if len(set(pw)) <= 2:
        return "it is made of one or two repeated characters"
    if _is_sequence(pw):
        return "it is a simple sequence of keys or digits"
    if _base_word(pw) in _COMMON:
        return "it is one of the most commonly used passwords"
    lowered = pw.lower()
    local = re.sub(r"[^a-z0-9]", "", (email or "").split("@")[0].lower())
    if len(local) >= 4 and local in re.sub(r"[^a-z0-9]", "", lowered):
        return "it contains your email name"
    for part in re.split(r"[^a-z]+", (name or "").lower()):
        if len(part) >= 4 and part in lowered:
            return "it contains your name"
    return None


def is_weak_for_admin(password: str) -> bool:
    """Stricter bar used for the seeded admin / leaked defaults: short or on the common list counts as weak."""
    return len(password or "") < MIN_LENGTH_FOR_ADMIN_SEED or violation(password) is not None
