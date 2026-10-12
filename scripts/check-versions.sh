#!/usr/bin/env bash
# Fail unless overall, frontend, and backend versions are identical.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
overall="$(tr -d '[:space:]' < "$root/VERSION")"
frontend="$(node -p "require('$root/frontend/package.json').version")"
backend="$(tr -d '[:space:]' < "$root/backend/VERSION")"
echo "overall=$overall"
echo "frontend=$frontend"
echo "backend=$backend"
if [ "$overall" != "$frontend" ] || [ "$overall" != "$backend" ]; then
  echo "Deploy requires overall, frontend, and backend versions to be the same."
  exit 1
fi
echo "Versions match."
