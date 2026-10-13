#!/usr/bin/env bash
# Fail unless:
# 1. overall, frontend, and backend versions are identical.
# 2. current version is strictly greater than the previous version on main.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

overall="$(tr -d '[:space:]' < "VERSION")"
frontend="$(node -p "require('./frontend/package.json').version")"
backend="$(tr -d '[:space:]' < "backend/VERSION")"

echo "=== Version Consistency Check ==="
echo "overall:  $overall"
echo "frontend: $frontend"
echo "backend:  $backend"

if [ "$overall" != "$frontend" ] || [ "$overall" != "$backend" ]; then
  echo ""
  echo "ERROR: Version mismatch across project files!"
  echo "Deploy requires overall ($overall), frontend ($frontend), and backend ($backend) to be identical."
  exit 1
fi
echo "✓ Versions match across all files."
echo ""

echo "=== Version Bump Check ==="
previous=""

# 1. Check BEFORE_SHA from GitHub Actions push event if available and non-zero
if [ -n "${BEFORE_SHA:-}" ] && [ "$BEFORE_SHA" != "0000000000000000000000000000000000000000" ]; then
  previous="$(git show "$BEFORE_SHA:VERSION" 2>/dev/null | tr -d '[:space:]' || true)"
fi

# 2. Check HEAD^1 (parent on main before merge commit)
if [ -z "$previous" ] && git rev-parse --verify "HEAD^1" >/dev/null 2>&1; then
  previous="$(git show "HEAD^1:VERSION" 2>/dev/null | tr -d '[:space:]' || true)"
fi

# 3. Check origin/main (when on a feature branch)
if [ -z "$previous" ] && git rev-parse --verify "origin/main" >/dev/null 2>&1; then
  previous="$(git show "origin/main:VERSION" 2>/dev/null | tr -d '[:space:]' || true)"
fi

# 4. Fallback: check HEAD~1
if [ -z "$previous" ] && git rev-parse --verify "HEAD~1" >/dev/null 2>&1; then
  previous="$(git show "HEAD~1:VERSION" 2>/dev/null | tr -d '[:space:]' || true)"
fi

if [ -n "$previous" ]; then
  echo "Previous version: $previous"
  echo "Current version:  $overall"

  is_bumped="$(node -e "
    const curr = '$overall'.split('.').map(Number);
    const prev = '$previous'.split('.').map(Number);
    let cmp = 0;
    for (let i = 0; i < Math.max(curr.length, prev.length); i++) {
      const c = curr[i] || 0;
      const p = prev[i] || 0;
      if (c > p) { cmp = 1; break; }
      if (c < p) { cmp = -1; break; }
    }
    console.log(cmp > 0 ? 'true' : 'false');
  ")"

  if [ "$is_bumped" != "true" ]; then
    echo ""
    echo "ERROR: Version bump check failed!"
    echo "Current version ($overall) is not greater than previous version ($previous)."
    echo "Every release merged to main must increment the version number."
    echo ""
    echo "Please update the version in:"
    echo "  - VERSION"
    echo "  - frontend/package.json"
    echo "  - backend/VERSION"
    exit 1
  fi
  echo "✓ Version bump verified: $previous -> $overall"
else
  echo "Notice: No previous version found in git history (initial commit). Skipping version bump check."
fi
