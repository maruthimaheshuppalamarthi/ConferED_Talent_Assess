"""
Role-based access control (RBAC) definitions.

Staff roles are ranked; a higher rank inherits everything a lower rank can do:

    Recruiter (1)   -> Recruiter workspace (candidates, invites, results)
    Admin (2)       -> + Admin & System Control (settings, staff accounts, question bank)
    Super Admin (3) -> + Live Proctor Monitor / everything

"Candidate" is a separate, non-staff principal authenticated by an invite + OTP.
"""
from typing import List

ROLE_CANDIDATE = "Candidate"
ROLE_RECRUITER = "Recruiter"
ROLE_ADMIN = "Admin"
ROLE_SUPER_ADMIN = "Super Admin"

STAFF_ROLE_RANK = {
    ROLE_RECRUITER: 1,
    ROLE_ADMIN: 2,
    ROLE_SUPER_ADMIN: 3,
}
STAFF_ROLES = list(STAFF_ROLE_RANK.keys())

# UI workspace -> minimum staff role required to open it
WORKSPACE_MIN_ROLE = {
    ROLE_RECRUITER: ROLE_RECRUITER,   # Recruiter Workspace
    ROLE_ADMIN: ROLE_ADMIN,           # Admin & System Control
    ROLE_SUPER_ADMIN: ROLE_ADMIN,     # Live Proctor Monitor (frontend calls this workspace "Super Admin")
}


def rank(role: str) -> int:
    return STAFF_ROLE_RANK.get(role, 0)


def has_min_role(role: str, minimum: str) -> bool:
    return rank(role) >= rank(minimum) > 0


def workspaces_for(role: str) -> List[str]:
    """Which frontend workspaces a staff role may open."""
    return [ws for ws, minimum in WORKSPACE_MIN_ROLE.items() if has_min_role(role, minimum)]
