# Authentication & Authorisation (JWT + RBAC + server-side OTP)

## Flows

**Staff (Recruiter / Admin / Super Admin)**
1. `POST /api/v1/auth/login` - email + password. Server verifies the bcrypt hash and emails a 6-digit OTP.
2. `POST /api/v1/auth/verify-otp` - challengeId + OTP. Server checks expiry (10 min), attempts (max 5) and single use,
   then returns a **15-30 min access JWT** (kept in memory by the SPA) and sets a **rotating refresh JWT in an HttpOnly cookie**.
3. `POST /api/v1/auth/refresh` - rotates the refresh token (reuse of an old one revokes the whole session family).
   The SPA calls it on page load to restore the session.
4. `POST /api/v1/auth/logout` - revokes the refresh token.

Also: `/auth/resend-otp`, `/auth/register` (public, **Recruiter only**), `/auth/password-reset/{request,confirm}`,
`GET|POST|PATCH /auth/staff` (Admin+ account management).

**Candidates**
1. Recruiter+ calls `POST /auth/candidate/invites` -> server creates a personal link (`?assessment=..&invite=<secret>`)
   and emails it with a one-time OTP.
2. Candidate opens the link, enters the OTP -> `POST /auth/candidate/verify` returns a **candidate-scoped JWT**
   (`typ=candidate`, bound to one invite/assessment). It is not accepted on any staff endpoint.

## RBAC

| Role | Rank | Can open |
|---|---|---|
| Recruiter | 1 | Recruiter workspace, create invites |
| Admin | 2 | + Admin portal, staff management, Live Monitor, WebSocket monitor stream |
| Super Admin | 3 | + can create/modify other Admins and Super Admins |
| Candidate | - | only their own exam session (code execution, proctoring events) |

Enforced server-side with FastAPI dependencies (`require_role(...)` in `backend/app/api/deps.py`); the UI only
hides what the server would reject anyway. The DB role (not the token claim) is authoritative.

`/ws/proctoring?token=<JWT>`: unauthenticated connections are rejected; candidates can only publish events as
themselves; only Admin+ receive the broadcast.

## Running / testing

```
cd backend
.venv\Scripts\python -m pytest tests -q          # 19 tests
.venv\Scripts\python -m uvicorn app.main:app --port 8000
cd ../frontend && npm run dev                      # http://localhost:3000
```

Dev account (seeded on first start): `admin@7666` / `970598` (OTP is emailed; with `DEV_EXPOSE_OTP=true` it is also
shown in the UI and printed in the server log).

## Before going to production (dev-only shortcuts currently in place)

- [ ] **Rotate the Gmail App Password** - it is hardcoded in `backend/app/core/config.py`, `frontend/src/modules/AdminPortal.ts`
      and committed `.env` files. Load from environment / secret manager; untrack `.env` files.
- [ ] Set a strong `SECRET_KEY` (no default fallback) and remove the seeded `admin@7666 / 970598` account (`SEED_ADMIN_*`).
- [ ] `DEV_EXPOSE_OTP=false` (OTP currently returned in API responses and logged).
- [ ] `COOKIE_SECURE=true` + HTTPS; set `CORS_ORIGINS` / `FRONTEND_URL` to real origins.
- [ ] `ALLOW_PUBLIC_STAFF_REGISTRATION=false` (or require admin approval).
- [ ] Remove pre-filled credentials from the sign-in form (`Navbar.ts`).
- [ ] Switch `AUTH_DATABASE_URL` from SQLite to Postgres and add Alembic migrations.
- [ ] Add per-IP rate limiting (login, OTP, resend) and move OTP/refresh state to Redis if running several instances.
- [ ] Decide on one-use candidate invites (`verified_at` is recorded but not yet enforced) and server-side exam/score logic.
- [ ] `/send-email` still accepts SMTP creds from the client body - remove once the UI no longer sends them.
