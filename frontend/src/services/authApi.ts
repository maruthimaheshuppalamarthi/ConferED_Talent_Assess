import { Portal, UserRole } from '../types';

/**
 * Client for the backend auth API (JWT + server-side OTP + RBAC).
 *
 * Every staff portal has its own login API:  /admin/auth/*, /recruiter/auth/*, /proctor/auth/*.
 *
 * Token handling:
 *  - Staff access token is kept in memory only (never localStorage) and sent as a Bearer header.
 *  - The refresh token lives in an HttpOnly cookie managed by the server; the browser sends it
 *    automatically (credentials: 'include') and `restoreSession()` uses it on page load.
 *  - Candidate tokens are also memory-only and scoped to a single invite/assessment.
 */

const API_BASE: string =
  ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8000';
const API = `${API_BASE}/api/v1`;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  portals: Portal[];
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  phone?: string | null;
  department?: string | null;
}

export interface OtpChallenge {
  challengeId: string;
  otpDestination: string;
  expiresInSeconds: number;
  devOtp?: string | null; // only present when the backend runs with DEV_EXPOSE_OTP=true
}

export interface StaffSession {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface StaffCredentials {
  user: AuthUser;
  temporaryPassword: string;
  emailed: boolean;
}

export interface CandidateSession {
  accessToken: string;
  expiresIn: number;
  candidate: { id: string; name: string; email: string; assessmentId: string };
}

export interface InviteResult {
  inviteId: string;
  candidateId: string;
  link: string;
  expiresAt: string;
  otpDestination: string;
  assessmentTitle?: string | null;
  durationMinutes?: number | null;
  devOtp?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type AuthMode = 'staff' | 'candidate' | 'none';

let staffToken: string | null = null;
let candidateToken: string | null = null;
/** Portal the staff session was opened for; silent token refreshes go through that portal's API. */
let activePortal: Portal = 'recruiter';
let refreshInFlight: Promise<StaffSession | null> | null = null;
let onSessionExpired: (() => void) | null = null;

function errorMessage(body: any, status: number): string {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
  return `Request failed (${status})`;
}

async function rawRequest(path: string, method: string, body: unknown, mode: AuthMode, timeoutMs = 0): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = mode === 'staff' ? staffToken : mode === 'candidate' ? candidateToken : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const ctrl = timeoutMs > 0 ? new AbortController() : null;
  const timer = ctrl ? window.setTimeout(() => ctrl.abort(), timeoutMs) : 0;

  try {
    return await fetch(`${API}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl?.signal,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Make sure the backend is running.');
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

/** Send a request; if the staff access token has expired, refresh it silently once and replay. */
async function requestWithRefresh(path: string, method: string, body: unknown, mode: AuthMode): Promise<Response> {
  let res = await rawRequest(path, method, body, mode);
  if (res.status === 401 && mode === 'staff' && staffToken) {
    const session = await refreshSession(activePortal);
    if (session) {
      res = await rawRequest(path, method, body, mode);
    } else {
      handleSessionExpired();
    }
  }
  return res;
}

async function request<T>(path: string, method = 'GET', body?: unknown, mode: AuthMode = 'none'): Promise<T> {
  const res = await requestWithRefresh(path, method, body, mode);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, res.status));
  return data as T;
}

function handleSessionExpired() {
  staffToken = null;
  onSessionExpired?.();
}

async function refreshSession(portal: Portal): Promise<StaffSession | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await rawRequest(`/${portal}/auth/refresh`, 'POST', undefined, 'none', 8000);
        if (!res.ok) return null;
        const session = (await res.json()) as StaffSession;
        staffToken = session.accessToken;
        return session;
      } catch {
        return null;
      } finally {
        setTimeout(() => (refreshInFlight = null), 0);
      }
    })();
  }
  return refreshInFlight;
}

export const authApi = {
  apiBase: API_BASE,

  /** Called when a refresh fails mid-session (e.g. token revoked) so the UI can drop to signed-out. */
  setSessionExpiredHandler(fn: () => void) {
    onSessionExpired = fn;
  },

  getStaffToken: () => staffToken,
  getCandidateToken: () => candidateToken,

  // ---------------------------------------------------------------- staff
  /** Step 1: password check on the portal's own login API; the server emails a one-time passcode. */
  login: (portal: Portal, email: string, password: string) =>
    request<OtpChallenge>(`/${portal}/auth/login`, 'POST', { email, password }),

  /** Step 2: exchange the OTP for a session. */
  async verifyOtp(portal: Portal, challengeId: string, otp: string): Promise<StaffSession> {
    const session = await request<StaffSession>(`/${portal}/auth/verify-otp`, 'POST', { challengeId, otp });
    staffToken = session.accessToken;
    activePortal = portal;
    return session;
  },

  resendOtp: (portal: Portal, challengeId: string) =>
    request<OtpChallenge>(`/${portal}/auth/resend-otp`, 'POST', { challengeId }),

  /** Page-load: try to turn the HttpOnly refresh cookie into a fresh in-memory session for this portal. */
  async restoreSession(portal: Portal): Promise<StaffSession | null> {
    activePortal = portal;
    return refreshSession(portal);
  },

  /** Signed-in user moving to another portal they are allowed into (System Admin only). */
  setActivePortal(portal: Portal) {
    activePortal = portal;
  },

  /** Choose your own password (mandatory after an admin created the account or reset the password). */
  async changePassword(portal: Portal, currentPassword: string, newPassword: string): Promise<StaffSession> {
    const session = await request<StaffSession>(
      `/${portal}/auth/change-password`, 'POST', { currentPassword, newPassword }, 'staff');
    staffToken = session.accessToken;
    return session;
  },

  /** Best effort: always drops the local token, never rejects (server may be unreachable). */
  async logout(): Promise<void> {
    try {
      await rawRequest(`/${activePortal}/auth/logout`, 'POST', undefined, 'none');
    } catch {
      // Server unreachable: the refresh cookie simply expires; local sign-out still proceeds.
    } finally {
      staffToken = null;
    }
  },

  // ------------------------------------------------------------ candidates
  createInvite: (p: {
    name: string;
    email: string;
    phone?: string;
    assessmentId: string;
    expiresInHours: number;
    candidateId?: string;
  }) => request<InviteResult>('/recruiter/candidates/invites', 'POST', p, 'staff'),

  async candidateVerify(inviteToken: string, otp: string): Promise<CandidateSession> {
    const session = await request<CandidateSession>('/candidate/verify', 'POST', { inviteToken, otp });
    candidateToken = session.accessToken;
    return session;
  },

  candidateResendOtp: (inviteToken: string) =>
    request<OtpChallenge>('/candidate/resend-otp', 'POST', { inviteToken }),

  clearCandidateSession() {
    candidateToken = null;
  },

  /** Authenticated file download (e.g. the audit CSV): returns the file and the name the server suggested. */
  async downloadFile(path: string): Promise<{ blob: Blob; filename: string; truncated: boolean }> {
    const res = await requestWithRefresh(path, 'GET', undefined, 'staff');
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(res.status, errorMessage(data, res.status));
    }
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    return {
      blob: await res.blob(),
      filename: match ? match[1] : 'download.csv',
      truncated: res.headers.get('X-Export-Truncated') === 'true',
    };
  },

  /** Authenticated fetch helper for other API calls (adds the right bearer token). */
  fetchJson: <T>(path: string, method = 'GET', body?: unknown, mode: AuthMode = 'staff') =>
    request<T>(path, method, body, mode),

  /** Multipart upload (do not set Content-Type; the browser adds the boundary). */
  async uploadForm<T>(path: string, form: FormData, mode: AuthMode = 'staff'): Promise<T> {
    const headers: Record<string, string> = {};
    const token = mode === 'staff' ? staffToken : mode === 'candidate' ? candidateToken : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let res = await fetch(`${API}${path}`, { method: 'POST', headers, credentials: 'include', body: form });
    if (res.status === 401 && mode === 'staff' && staffToken) {
      const session = await refreshSession(activePortal);
      if (session) {
        const h2: Record<string, string> = {};
        if (staffToken) h2['Authorization'] = `Bearer ${staffToken}`;
        res = await fetch(`${API}${path}`, { method: 'POST', headers: h2, credentials: 'include', body: form });
      } else {
        handleSessionExpired();
      }
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(res.status, errorMessage(data, res.status));
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  },
};
