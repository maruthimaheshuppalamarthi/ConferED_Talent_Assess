"""
Live smoke test: sign in as the seeded admin through the RUNNING server (uses the real database).

    python -m app.scripts.smoke_login [base_url] [--probe]

Credentials: SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD environment variables, otherwise you are asked for them
(nothing is stored). Needs DEV_EXPOSE_OTP=true (the development default) so the OTP is returned in the response.
"""
import getpass
import os
import sys

import httpx

from app.core.config import settings


def main() -> int:
    urls = [a for a in sys.argv[1:] if not a.startswith("--")]
    base = (urls[0] if urls else "http://127.0.0.1:8000") + settings.API_V1_STR
    email = os.getenv("SMOKE_ADMIN_EMAIL") or input("Admin email: ").strip()
    password = os.getenv("SMOKE_ADMIN_PASSWORD") or getpass.getpass("Admin password: ")
    with httpx.Client(timeout=30) as c:
        r = c.post(f"{base}/admin/auth/login", json={"email": email, "password": password})
        print("login        :", r.status_code)
        r.raise_for_status()
        ch = r.json()
        r = c.post(f"{base}/admin/auth/verify-otp", json={"challengeId": ch["challengeId"], "otp": ch["devOtp"]})
        print("verify-otp   :", r.status_code)
        r.raise_for_status()
        token = r.json()["accessToken"]
        r = c.get(f"{base}/admin/staff", headers={"Authorization": f"Bearer {token}"})
        print("list staff   :", r.status_code, [(u["email"], u["role"], u["createdAt"]) for u in r.json()])
        r.raise_for_status()

        headers = {"Authorization": f"Bearer {token}"}
        r = c.get(f"{base}/admin/audit-logs", params={"pageSize": 5}, headers=headers)
        print("audit logs   :", r.status_code, "total =", r.json()["total"])
        r.raise_for_status()
        for item in r.json()["items"]:
            print("   ", item["createdAt"][:19], f"{item['action']:<24}", item["actorEmail"], "|", item["ipAddress"])
        r = c.get(f"{base}/admin/login-events", params={"pageSize": 3}, headers=headers)
        print("login events :", r.status_code, "total =", r.json()["total"])
        r.raise_for_status()

        r = c.get(f"{base}/admin/settings", headers=headers)
        print("settings     :", r.status_code)
        r.raise_for_status()
        s = r.json()
        print("   proctoring:", s["proctoring"]["maxTabSwitches"], "tab switches /", s["proctoring"]["maxViolationsBeforeTerminate"], "violations")
        print("   security  : OTP", s["security"]["otpExpireMinutes"], "min, lockout after", s["security"]["loginMaxFailures"])
        print("   email     :", s["email"]["smtpHost"], s["email"]["smtpPort"], "| password:", s["email"]["smtpPasswordSource"])
        assert "smtpPassword" not in s["email"], "the SMTP password must never be returned"
        for name in ("general", "proctoring", "assessment"):
            r = c.get(f"{base}/policy/{name}", headers=headers)
            print(f"policy/{name:<10}:", r.status_code)
            r.raise_for_status()

        print("staff directory:")
        found = c.get(f"{base}/admin/staff/search", params={"pageSize": 5, "sort": "name", "order": "asc"},
                      headers=headers)
        found.raise_for_status()
        page = found.json()
        for row in page["items"]:
            print(f"   {row['name']:<22} {row['email']:<24} {row['role']:<13} active={row['isActive']} "
                  f"sessions={row['activeSessions']} last_login={(row['lastLoginAt'] or 'never')[:19]}")
        me_row = next(i for i in page["items"] if i["email"] == email.strip().lower())
        detail = c.get(f"{base}/admin/staff/{me_row['id']}", headers=headers).json()
        print(f"   detail    : otpEmail={detail['otpEmail']} created_by={detail['createdByEmail']}")
        sess = c.get(f"{base}/admin/staff/{me_row['id']}/sessions", headers=headers).json()
        print(f"   sessions  : {sess['count']} live")
        for s in sess["items"][:3]:
            print(f"      started {s['startedAt'][:19]}  from {s['ipAddress']}  ({(s['userAgent'] or '')[:40]})")

        print("dashboard:")
        staff = c.get(f"{base}/admin/dashboard/staff", headers=headers)
        staff.raise_for_status()
        st = staff.json()
        print(f"   staff     : {st['total']} total, {st['active']} active, {st['lockedNow']} locked, "
              f"{st['neverSignedIn']} never signed in")
        sec = c.get(f"{base}/admin/dashboard/security", params={"hours": 24}, headers=headers)
        sec.raise_for_status()
        t = sec.json()["totals"]
        print(f"   security  : 24h -> {t['successfulSignIns']} sign-ins, {t['failedSignIns']} failed, "
              f"{t['lockouts']} lockouts, {len(sec.json()['series'])} chart points")
        act = c.get(f"{base}/admin/dashboard/activity", params={"limit": 3}, headers=headers)
        act.raise_for_status()
        print(f"   activity  : latest = {[i['action'] for i in act.json()['items']]}")
        inv = c.get(f"{base}/admin/dashboard/invites", headers=headers)
        inv.raise_for_status()
        print(f"   invites   : {inv.json()['total']} total, {inv.json()['active']} active")
        rep = c.get(f"{base}/admin/dashboard/health", headers=headers)
        rep.raise_for_status()
        report = rep.json()
        print(f"   health    : {report['status'].upper()} (up {report['uptimeSeconds']}s, python {report['python']})")
        for comp in report["components"]:
            print(f"      [{comp['status']:<7}] {comp['name']:<15} {comp['message']}")
            for f in comp["details"].get("findings", []):
                print(f"                 - {f['id']}: {f['message']}")
        if "--probe" in sys.argv:
            probe = c.post(f"{base}/admin/dashboard/health/email-probe", headers=headers).json()
            print(f"   email probe: ok={probe['ok']} - {probe['message']}")
        ready = c.get(base.replace(settings.API_V1_STR, "") + "/health/ready")
        print("   /health/ready:", ready.status_code, ready.json())

        out = c.post(f"{base}/admin/auth/logout")  # leave no stray session behind
        print("logout       :", out.status_code)
    print("SMOKE TEST PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
