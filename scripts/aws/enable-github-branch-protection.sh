#!/usr/bin/env bash
# Require CI status checks on main. Needs GitHub CLI (gh) authenticated.
#   bash scripts/aws/enable-github-branch-protection.sh
set -euo pipefail

REPO="${GITHUB_REPO:-maruthimaheshuppalamarthi/ConferED_Talent_Assess}"
BRANCH="${BRANCH:-main}"

gh api -X PUT "repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["backend-tests", "frontend-build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo "main now requires backend-tests and frontend-build to pass before merge."
