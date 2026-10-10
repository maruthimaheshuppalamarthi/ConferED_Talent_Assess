"""
Role-based access control (RBAC) definitions.

Three staff roles, one portal each, strictly separated:

    System Admin  -> /admin      (staff accounts, global settings, audit logs)
    Recruiter     -> /recruiter  (assessment builder, question bank, candidates, invites, results)
    Proctor       -> /proctor    (live proctoring monitor, identity & ID verification)

No role is ranked above another: the System Admin manages people and platform policy but does
NOT inherit the Recruiter or Proctor portals. Someone who needs both jobs gets two accounts.
"Candidate" is a separate, non-staff principal authenticated by an invite link + OTP.
"""
from typing import List

ROLE_CANDIDATE = "Candidate"
ROLE_SYSTEM_ADMIN = "System Admin"
ROLE_RECRUITER = "Recruiter"
ROLE_PROCTOR = "Proctor"

STAFF_ROLES = [ROLE_SYSTEM_ADMIN, ROLE_RECRUITER, ROLE_PROCTOR]

# Legacy role names that may still exist in an older database -> new role.
LEGACY_ROLE_MAP = {
    "Admin": ROLE_SYSTEM_ADMIN,
    "Super Admin": ROLE_SYSTEM_ADMIN,
}

PORTAL_ADMIN = "admin"
PORTAL_RECRUITER = "recruiter"
PORTAL_PROCTOR = "proctor"
PORTALS = [PORTAL_ADMIN, PORTAL_RECRUITER, PORTAL_PROCTOR]

# The ONE role that may sign in through each portal's login endpoint.
PORTAL_LOGIN_ROLE = {
    PORTAL_ADMIN: ROLE_SYSTEM_ADMIN,
    PORTAL_RECRUITER: ROLE_RECRUITER,
    PORTAL_PROCTOR: ROLE_PROCTOR,
}

# Roles allowed to *use* each portal's API once signed in: exactly the role that logs into it.
PORTAL_ACCESS = {portal: {role} for portal, role in PORTAL_LOGIN_ROLE.items()}


def can_access_portal(role: str, portal: str) -> bool:
    return role in PORTAL_ACCESS.get(portal, set())


def portals_for(role: str) -> List[str]:
    """Which portals a staff role may open, in display order."""
    return [p for p in PORTALS if can_access_portal(role, p)]
