import { AuthUser, StaffCredentials, authApi } from './authApi';
import { StaffRole } from '../types';

/**
 * Typed client for the System Admin API. One small method per backend endpoint, grouped like the backend:
 *   dashboard  /admin/dashboard/*      staff  /admin/staff/*      settings  /admin/settings/*
 *   audit      /admin/audit-logs, /admin/login-events
 * All calls carry the staff access token and silently refresh it once if it has expired.
 */

type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(params: Query): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

const get = <T>(path: string) => authApi.fetchJson<T>(path, 'GET');
const post = <T>(path: string, body?: unknown) => authApi.fetchJson<T>(path, 'POST', body);
const patch = <T>(path: string, body: unknown) => authApi.fetchJson<T>(path, 'PATCH', body);
const del = <T>(path: string) => authApi.fetchJson<T>(path, 'DELETE');

// ------------------------------------------------------------------ shared shapes
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

// ------------------------------------------------------------------ dashboard
export interface RoleCount { role: StaffRole; active: number; disabled: number }
export interface StaffStats {
  total: number; active: number; disabled: number; byRole: RoleCount[]; lockedNow: number;
  pendingPasswordChange: number; neverSignedIn: number; signedInLast24h: number; signedInLast7d: number;
  createdLast7d: number;
}
export interface ValueCount { value: string; count: number }
export interface SecurityStats {
  hours: number; since: string; until: string; bucket: 'hour' | 'day';
  totals: {
    successfulSignIns: number; failedSignIns: number; blockedAttempts: number; otpFailures: number;
    lockouts: number; signOuts: number; uniqueUsers: number; tokenReuseAlerts: number; rateLimited: number;
  };
  previousPeriod: { successfulSignIns: number; failedSignIns: number };
  failuresByReason: { reason: string; count: number }[];
  topFailingEmails: ValueCount[];
  topFailingIps: ValueCount[];
  series: { start: string; successful: number; failed: number }[];
  lockedAccountsNow: number;
  truncated: boolean;
}
export interface ActivityItem {
  id: string; createdAt: string; category: string; action: string; actorEmail?: string | null;
  summary: string; success: boolean;
}
export interface ActivityFeed {
  items: ActivityItem[];
  last7DaysByCategory: { category: string; count: number }[];
}
export interface InviteStats {
  total: number; active: number; verified: number; awaitingCandidate: number; expired: number; revoked: number;
  expiringWithin24h: number; createdLast7d: number;
}
export type HealthStatus = 'ok' | 'warning' | 'error';
export interface HealthComponent {
  name: string; status: HealthStatus; message: string; details: Record<string, any>;
}
export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy'; checkedAt: string; startedAt: string; uptimeSeconds: number;
  version: string; environment: string; python: string; components: HealthComponent[];
}
export interface EmailProbe {
  ok: boolean; message: string; host: string; port: number; sender: string;
  passwordSource: 'database' | 'environment' | 'none';
}

// ------------------------------------------------------------------ staff
export interface StaffItem extends AuthUser {
  lockedUntil?: string | null;
  deletedAt?: string | null;
  activeSessions: number;
}
export interface StaffDetail extends StaffItem {
  otpEmail: string; failedLogins: number; updatedAt?: string | null; passwordChangedAt?: string | null;
  createdById?: string | null; createdByEmail?: string | null;
}
export interface StaffQuery {
  q?: string; role?: string; status?: string; department?: string; sort?: string; order?: 'asc' | 'desc';
  page?: number; pageSize?: number;
}
export interface StaffProfileChanges {
  name?: string; email?: string; otpEmail?: string; phone?: string; department?: string;
}
export interface StaffSessionInfo {
  id: string; startedAt?: string | null; lastActiveAt: string; expiresAt: string;
  ipAddress?: string | null; userAgent?: string | null;
}
export interface ActionResult { message: string; revokedSessions: number }

// ------------------------------------------------------------------ settings
export interface SettingField {
  key: string; label: string; description: string; type: 'int' | 'bool' | 'enum' | 'string';
  min?: number | null; max?: number | null; choices?: string[] | null; secret: boolean;
  fmt?: 'email' | 'hostname' | 'text' | null; minLength: number; maxLength: number; allowEmpty: boolean;
}
export interface SettingsGroupSchema {
  group: string; title: string; description: string; fields: SettingField[];
}
export type SettingValue = number | boolean | string;
export type GroupValues = Record<string, SettingValue>;
export interface EmailGroupValues extends GroupValues {
  smtpPasswordSet: boolean;
  smtpPasswordSource: 'database' | 'environment' | 'none';
}
export interface EmailTestResult {
  ok: boolean; message: string; sentTo: string; host: string; port: number; sender: string;
  passwordSource: 'database' | 'environment' | 'none';
}

// ------------------------------------------------------------------ audit
export interface AuditEntry {
  id: string; createdAt: string; category: string; action: string; actorId?: string | null;
  actorEmail?: string | null; actorRole?: string | null; targetType?: string | null; targetId?: string | null;
  summary: string; details?: Record<string, any> | null; success: boolean; ipAddress?: string | null;
  userAgent?: string | null;
}
export interface AuditQuery {
  from?: string; to?: string; category?: string; action?: string; actor?: string; success?: string;
  search?: string; targetId?: string; order?: 'asc' | 'desc'; page?: number; pageSize?: number;
}
export interface LoginEventEntry {
  id: string; createdAt: string; userId?: string | null; email?: string | null; portal?: string | null;
  event: string; success: boolean; failureReason?: string | null; ipAddress?: string | null;
  userAgent?: string | null;
}
export interface LoginEventQuery {
  from?: string; to?: string; email?: string; userId?: string; portal?: string; event?: string;
  success?: string; order?: 'asc' | 'desc'; page?: number; pageSize?: number;
}

export const adminApi = {
  dashboard: {
    staff: () => get<StaffStats>('/admin/dashboard/staff'),
    security: (hours: number) => get<SecurityStats>(`/admin/dashboard/security${qs({ hours })}`),
    activity: (limit = 10, category?: string) =>
      get<ActivityFeed>(`/admin/dashboard/activity${qs({ limit, category })}`),
    invites: () => get<InviteStats>('/admin/dashboard/invites'),
    health: () => get<HealthReport>('/admin/dashboard/health'),
    probeEmail: () => post<EmailProbe>('/admin/dashboard/health/email-probe'),
  },

  staff: {
    search: (query: StaffQuery) => get<Page<StaffItem>>(`/admin/staff/search${qs(query as Query)}`),
    detail: (id: string) => get<StaffDetail>(`/admin/staff/${id}`),
    create: (body: {
      name: string; email: string; role: StaffRole; phone?: string; department?: string; otpEmail?: string;
    }) => post<StaffCredentials>('/admin/staff', body),
    setRole: (id: string, role: StaffRole) => patch<AuthUser>(`/admin/staff/${id}`, { role }),
    setActive: (id: string, isActive: boolean) => patch<AuthUser>(`/admin/staff/${id}`, { isActive }),
    updateProfile: (id: string, changes: StaffProfileChanges) =>
      patch<StaffDetail>(`/admin/staff/${id}/profile`, changes),
    unlock: (id: string) => post<StaffDetail>(`/admin/staff/${id}/unlock`),
    forceLogout: (id: string) => post<ActionResult>(`/admin/staff/${id}/force-logout`),
    resendCredentials: (id: string) => post<StaffCredentials>(`/admin/staff/${id}/resend-credentials`),
    resetPassword: (id: string) => post<StaffCredentials>(`/admin/staff/${id}/reset-password`),
    remove: (id: string) => del<ActionResult>(`/admin/staff/${id}`),
    restore: (id: string) => post<StaffDetail>(`/admin/staff/${id}/restore`),
    sessions: (id: string) =>
      get<{ items: StaffSessionInfo[]; count: number; note: string }>(`/admin/staff/${id}/sessions`),
    endSession: (id: string, sessionId: string) =>
      del<ActionResult>(`/admin/staff/${id}/sessions/${encodeURIComponent(sessionId)}`),
  },

  settings: {
    schema: () => get<{ groups: SettingsGroupSchema[] }>('/admin/settings/schema'),
    all: () => get<Record<string, GroupValues>>('/admin/settings'),
    group: <T = GroupValues>(group: string) => get<T>(`/admin/settings/${group}`),
    update: <T = GroupValues>(group: string, changes: Record<string, SettingValue>) =>
      patch<T>(`/admin/settings/${group}`, changes),
    clearEmailPassword: () => del<EmailGroupValues>('/admin/settings/email/password'),
    testEmail: (to?: string) => post<EmailTestResult>('/admin/settings/email/test', to ? { to } : {}),
  },

  audit: {
    list: (query: AuditQuery) => get<Page<AuditEntry>>(`/admin/audit-logs${qs(query as Query)}`),
    meta: () => get<{ categories: string[]; actions: string[] }>('/admin/audit-logs/meta'),
    exportCsv: (query: AuditQuery) => {
      const { page: _page, pageSize: _size, ...filters } = query;   // the export ignores paging
      return authApi.downloadFile(`/admin/audit-logs/export${qs(filters as Query)}`);
    },
    loginEvents: (query: LoginEventQuery) => get<Page<LoginEventEntry>>(`/admin/login-events${qs(query as Query)}`),
  },
};
