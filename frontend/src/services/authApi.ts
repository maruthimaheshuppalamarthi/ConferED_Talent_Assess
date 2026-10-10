import { UserRole } from '../types';

/**
 * Client for the backend auth API (JWT + server-side OTP + RBAC).
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
  workspaces: UserRole[];
  isActive?: boolean;
  createdAt?: string | null;
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
let refreshInFlight: Promise<StaffSession | null> | null = null;
let onSessionExpired: (() => void) | null = null;

function errorMessage(body: any, status: number): string {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
  return `Request failed (${status})`;
}

async function rawRequest(path: string, method: string, body: unknown, mode: AuthMode): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = mode === 'staff' ? staffToken : mode === 'candidate' ? candidateToken : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    return await fetch(`${API}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Make sure the backend is running.');
  }
}

async function request<T>(path: string, method = 'GET', body?: unknown, mode: AuthMode = 'none'): Promise<T> {
  let res = await rawRequest(path, method, body, mode);

  // Access token expired -> try one silent refresh, then replay the request.
  if (res.status === 401 && mode === 'staff' && staffToken) {
    const session = await refreshSession();
    if (session) {
      res = await rawRequest(path, method, body, mode);
    } else {
      handleSessionExpired();
    }
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, res.status));
  return data as T;
}

function handleSessionExpired() {
  staffToken = null;
  onSessionExpired?.();
}

async function refreshSession(): Promise<StaffSession | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await rawRequest('/auth/refresh', 'POST', undefined, 'none');
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
  login: (email: string, password: string) =>
    request<OtpChallenge>('/auth/login', 'POST', { email, password }),

  async verifyOtp(challengeId: string, otp: string): Promise<StaffSession> {
    const session = await request<StaffSession>('/auth/verify-otp', 'POST', { challengeId, otp });
    staffToken = session.accessToken;
    return session;
  },

  resendOtp: (challengeId: string) => request<OtpChallenge>('/auth/resend-otp', 'POST', { challengeId }),

  register: (name: string, email: string, password: string) =>
    request<AuthUser>('/auth/register', 'POST', { name, email, password }),

  requestPasswordReset: (email: string) =>
    request<OtpChallenge>('/auth/password-reset/request', 'POST', { email }),

  confirmPasswordReset: (challengeId: string, otp: string, newPassword: string) =>
    request<{ status: string; message: string }>('/auth/password-reset/confirm', 'POST', {
      challengeId,
      otp,
      newPassword,
    }),

  /** Page-load: try to turn the HttpOnly refresh cookie into a fresh in-memory session. */
  async restoreSession(): Promise<StaffSession | null> {
    return refreshSession();
  },

  /** Best effort: always drops the local token, never rejects (server may be unreachable). */
  async logout(): Promise<void> {
    try {
      await rawRequest('/auth/logout', 'POST', undefined, 'none');
    } catch {
      // Server unreachable: the refresh cookie simply expires; local sign-out still proceeds.
    } finally {
      staffToken = null;
    }
  },

  me: () => request<AuthUser>('/auth/me', 'GET', undefined, 'staff'),
  listStaff: () => request<AuthUser[]>('/auth/staff', 'GET', undefined, 'staff'),
  createStaff: (name: string, email: string, password: string, role: UserRole) =>
    request<AuthUser>('/auth/staff', 'POST', { name, email, password, role }, 'staff'),

  // ------------------------------------------------------------ candidates
  createInvite: (p: {
    name: string;
    email: string;
    phone?: string;
    assessmentId: string;
    expiresInHours: number;
    candidateId?: string;
  }) => request<InviteResult>('/auth/candidate/invites', 'POST', p, 'staff'),

  async candidateVerify(inviteToken: string, otp: string): Promise<CandidateSession> {
    const session = await request<CandidateSession>('/auth/candidate/verify', 'POST', { inviteToken, otp });
    candidateToken = session.accessToken;
    return session;
  },

  candidateResendOtp: (inviteToken: string) =>
    request<OtpChallenge>('/auth/candidate/resend-otp', 'POST', { inviteToken }),

  clearCandidateSession() {
    candidateToken = null;
  },

  /** Authenticated fetch helper for other API calls (adds the right bearer token). */
  fetchJson: <T>(path: string, method = 'GET', body?: unknown, mode: AuthMode = 'staff') =>
    request<T>(path, method, body, mode),
};
