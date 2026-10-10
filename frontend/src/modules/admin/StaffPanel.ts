import { StaffCredentials } from '../../services/authApi';
import {
  LoginEventEntry, Page, StaffDetail, StaffItem, StaffSessionInfo, StaffProfileChanges, adminApi,
} from '../../services/adminApi';
import { store } from '../../services/store';
import { StaffRole } from '../../types';
import {
  ConfirmOptions, Tone, badge, bindPager, confirmDialog, copyText, debounce, describeBrowser, errorText, esc,
  formatDate, formatDateTime, openModal, pagerHtml, timeAgo, toast,
} from '../../services/ui';

/**
 * "Staff Management" screen: a searchable, filterable, paginated directory, and a drawer with everything the
 * System Admin can do to one account (edit details, role, unlock, reset / resend credentials, force sign-out,
 * end single sessions, delete / restore). Every action asks for confirmation and is recorded in the audit log.
 *
 * The app re-creates this page on every store change, so ALL state lives at module level and anything that
 * finishes after a re-render paints through `current` (the page that is on screen now).
 */
const ROLE_OPTIONS: { role: StaffRole; label: string }[] = [
  { role: 'Recruiter', label: 'Recruiter / HR' },
  { role: 'Proctor', label: 'Live Proctor' },
  { role: 'System Admin', label: 'System Administrator' },
];
const ROLE_TONE: Record<string, Tone> = { 'System Admin': 'purple', Recruiter: 'blue', Proctor: 'red' };
const PORTAL_PATH: Record<string, string> = { 'System Admin': '/admin', Recruiter: '/recruiter', Proctor: '/proctor' };
const STATUS_OPTIONS: [string, string][] = [
  ['all', 'All accounts'], ['active', 'Active'], ['disabled', 'Disabled'], ['locked', 'Locked out'],
  ['pendingPassword', 'Awaiting new password'], ['neverSignedIn', 'Never signed in'], ['deleted', 'Deleted'],
];
const EVENT_LABELS: Record<string, string> = {
  password_ok: 'Password accepted', login_success: 'Signed in', login_failed: 'Wrong password / refused',
  login_blocked: 'Tried while locked', otp_failed: 'Wrong passcode', account_locked: 'Account locked',
  logout: 'Signed out', rate_limited: 'Rate limited',
};

// ------------------------------------------------------------------ module state
const filters = { q: '', role: '', status: 'all', department: '', sort: 'createdAt', order: 'desc' as 'asc' | 'desc', page: 1, pageSize: 25 };
const list = { data: null as Page<StaffItem> | null, error: '', loading: false };
const drawer = {
  id: null as string | null,
  detail: null as StaffDetail | null,
  sessions: null as StaffSessionInfo[] | null,
  history: null as Page<LoginEventEntry> | null,
  error: '',
  loading: false,
  busy: false,
  draft: {} as Record<string, string>,
  role: '' as string,
};
let current: StaffPanel | null = null;
let escapeBound = false;

/** Used by the dashboard's shortcuts ("3 locked" -> the staff list filtered to locked accounts). */
export function presetStaffFilters(preset: Partial<typeof filters>): void {
  Object.assign(filters, { q: '', role: '', status: 'all', department: '', page: 1 }, preset);
  drawer.id = null;
}

const isSelf = (id: string | null) => !!id && store.getState().currentUser?.id === id;
const isLocked = (u: { lockedUntil?: string | null }) => !!u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();

function statusBadges(u: StaffItem): string {
  if (u.deletedAt) return badge('Deleted', 'slate');
  const out = [u.isActive === false ? badge('Disabled', 'slate') : badge('Active', 'green')];
  if (isLocked(u)) out.push(badge('Locked out', 'red'));
  if (u.isActive !== false && u.mustChangePassword) out.push(badge('Awaiting new password', 'amber'));
  return `<div class="flex flex-col items-start gap-1">${out.join('')}</div>`;
}

export class StaffPanel {
  constructor(private root: HTMLElement) {}

  public mount(): void {
    current = this;
    this.root.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Staff Management</h2>
            <p class="text-xs text-slate-400 mt-0.5">Create accounts, change roles, reset passwords and end sessions. New people get a temporary password and must choose their own at first sign-in.</p>
          </div>
          <button id="st-add" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md transition-all whitespace-nowrap">＋ Add Staff Member</button>
        </div>
        ${this.toolbarHtml()}
        <div id="st-table"></div>
        <div id="st-pager"></div>
      </div>
      <div id="st-drawer"></div>`;
    this.bindToolbar();
    this.root.querySelector('#st-add')?.addEventListener('click', () => openCreateDialog());
    this.paintTable();
    this.paintDrawer();
    void loadList();
    if (drawer.id) void loadDrawer(drawer.id, false);

    if (!escapeBound) {
      escapeBound = true;
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && drawer.id && !document.querySelector('[role="dialog"][aria-modal="true"]')) closeDrawer();
      });
    }
  }

  // ------------------------------------------------------------------ toolbar
  private toolbarHtml(): string {
    const input = 'glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs';
    return `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <input id="st-q" type="search" value="${esc(filters.q)}" placeholder="Search name, email or department" class="${input} md:col-span-4" aria-label="Search staff" />
        <select id="st-role" class="${input} md:col-span-2" aria-label="Filter by role">
          <option value="">All roles</option>${ROLE_OPTIONS.map(o => `<option value="${o.role}" ${filters.role === o.role ? 'selected' : ''}>${o.role}</option>`).join('')}
        </select>
        <select id="st-status" class="${input} md:col-span-3" aria-label="Filter by status">
          ${STATUS_OPTIONS.map(([v, label]) => `<option value="${v}" ${filters.status === v ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <input id="st-dept" type="search" value="${esc(filters.department)}" placeholder="Department" class="${input} md:col-span-2" aria-label="Filter by department" />
        <button id="st-clear" class="md:col-span-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button>
      </div>`;
  }

  private bindToolbar(): void {
    const q = <T extends HTMLElement>(s: string) => this.root.querySelector<T>(s)!;
    const reload = () => { filters.page = 1; void loadList(); };
    const typing = debounce(reload, 300);
    q<HTMLInputElement>('#st-q').addEventListener('input', e => { filters.q = (e.target as HTMLInputElement).value; typing(); });
    q<HTMLInputElement>('#st-dept').addEventListener('input', e => { filters.department = (e.target as HTMLInputElement).value; typing(); });
    q<HTMLSelectElement>('#st-role').addEventListener('change', e => { filters.role = (e.target as HTMLSelectElement).value; reload(); });
    q<HTMLSelectElement>('#st-status').addEventListener('change', e => { filters.status = (e.target as HTMLSelectElement).value; reload(); });
    q('#st-clear').addEventListener('click', () => {
      Object.assign(filters, { q: '', role: '', status: 'all', department: '', page: 1 });
      q<HTMLInputElement>('#st-q').value = '';
      q<HTMLInputElement>('#st-dept').value = '';
      q<HTMLSelectElement>('#st-role').value = '';
      q<HTMLSelectElement>('#st-status').value = 'all';
      void loadList();
    });
  }

  // ------------------------------------------------------------------ table
  public paintTable(): void {
    const host = this.root.querySelector<HTMLElement>('#st-table');
    const pager = this.root.querySelector<HTMLElement>('#st-pager');
    if (!host || !pager) return;
    const { data, error, loading } = list;

    if (!data) {
      host.innerHTML = error
        ? `<p class="text-xs text-red-400">${esc(error)}</p><button id="st-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`
        : `<p class="py-8 text-center text-xs text-slate-500 font-mono">Loading staff accounts…</p>`;
      pager.innerHTML = '';
      host.querySelector('#st-retry')?.addEventListener('click', () => void loadList());
      return;
    }

    const me = store.getState().currentUser?.id;
    const sortHead = (key: string, label: string) => {
      const active = filters.sort === key;
      return `<th class="py-2.5 px-3"><button data-sort="${key}" class="uppercase font-semibold hover:text-white inline-flex items-center gap-1 ${active ? 'text-blue-400' : ''}">${label}<span aria-hidden="true">${active ? (filters.order === 'asc' ? '▲' : '▼') : ''}</span></button></th>`;
    };
    const rows = data.items.map(u => `
      <tr class="hover:bg-slate-800/40 cursor-pointer ${u.deletedAt || u.isActive === false ? 'opacity-70' : ''}" data-open="${esc(u.id)}">
        <td class="py-2.5 px-3"><div class="font-bold text-white">${esc(u.name)}${u.id === me ? ' <span class="text-[10px] text-slate-500 font-normal">(you)</span>' : ''}</div>
          <div class="font-mono text-blue-400 text-[11px] break-all">${esc(u.email)}</div>
          ${u.department ? `<div class="text-[10px] text-slate-500">${esc(u.department)}</div>` : ''}</td>
        <td class="py-2.5 px-3">${badge(u.role, ROLE_TONE[u.role] || 'slate')}</td>
        <td class="py-2.5 px-3">${statusBadges(u)}</td>
        <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap" title="${esc(formatDateTime(u.lastLoginAt))}">${esc(timeAgo(u.lastLoginAt))}</td>
        <td class="py-2.5 px-3 text-slate-300 text-center">${u.activeSessions}</td>
        <td class="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">${esc(formatDate(u.createdAt))}</td>
        <td class="py-2.5 px-3 text-right"><button data-open-btn="${esc(u.id)}" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 font-bold text-[11px]">Manage</button></td>
      </tr>`).join('');

    host.innerHTML = `
      ${error ? `<p class="text-xs text-red-400 mb-2">${esc(error)}</p>` : ''}
      <div class="overflow-x-auto ${loading ? 'opacity-60' : ''}">
        <table class="w-full text-left text-xs">
          <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]">
            ${sortHead('name', 'Person')}${sortHead('role', 'Role')}<th class="py-2.5 px-3 uppercase font-semibold">Status</th>
            ${sortHead('lastLoginAt', 'Last sign-in')}<th class="py-2.5 px-3 uppercase font-semibold text-center">Sessions</th>
            ${sortHead('createdAt', 'Created')}<th class="py-2.5 px-3"></th>
          </tr></thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            ${rows || `<tr><td colspan="7" class="py-10 px-3 text-center text-slate-500">No staff accounts match these filters.</td></tr>`}
          </tbody>
        </table>
      </div>`;
    pager.innerHTML = pagerHtml(data);

    host.querySelectorAll<HTMLElement>('[data-sort]').forEach(b => b.addEventListener('click', () => {
      const key = b.getAttribute('data-sort') as string;
      filters.order = filters.sort === key && filters.order === 'asc' ? 'desc' : filters.sort === key ? 'asc' : (key === 'createdAt' || key === 'lastLoginAt' ? 'desc' : 'asc');
      filters.sort = key;
      filters.page = 1;
      void loadList();
    }));
    host.querySelectorAll<HTMLElement>('[data-open]').forEach(row =>
      row.addEventListener('click', () => void openDrawer(row.getAttribute('data-open') as string)));
    bindPager(pager,
      page => { filters.page = page; void loadList(); },
      size => { filters.pageSize = size; filters.page = 1; void loadList(); });
  }

  // ------------------------------------------------------------------ drawer
  public paintDrawer(): void {
    const host = this.root.querySelector<HTMLElement>('#st-drawer');
    if (!host) return;
    if (!drawer.id) { host.innerHTML = ''; return; }

    const scroll = host.querySelector('aside')?.scrollTop ?? 0;
    const d = drawer.detail;
    const body = d ? this.drawerBody(d) : `<p class="py-10 text-center text-xs ${drawer.error ? 'text-red-400' : 'text-slate-500 font-mono'}">${esc(drawer.error || 'Loading account…')}</p>`;
    host.innerHTML = `
      <div class="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm" data-backdrop>
        <aside role="dialog" aria-label="Manage staff member" class="absolute right-0 top-0 h-full w-full max-w-xl menu-panel border-l border-slate-800 overflow-y-auto p-6 space-y-5 shadow-2xl">
          ${body}
        </aside>
      </div>`;
    const aside = host.querySelector('aside') as HTMLElement;
    aside.scrollTop = scroll;
    host.querySelector('[data-backdrop]')?.addEventListener('mousedown', e => { if (e.target === e.currentTarget) closeDrawer(); });
    if (d) this.bindDrawer(host, d);
  }

  private drawerBody(d: StaffDetail): string {
    const self = isSelf(d.id);
    const deleted = !!d.deletedAt;
    const busy = drawer.busy ? 'disabled' : '';
    const val = (field: string, fallback: string | null | undefined) => esc(field in drawer.draft ? drawer.draft[field] : (fallback ?? ''));
    const input = (id: string, label: string, field: string, saved: string | null | undefined, opts: { disabled?: boolean; type?: string; hint?: string; placeholder?: string } = {}) => `
      <div>
        <label class="block font-semibold text-slate-300 mb-1" for="${id}">${label}</label>
        <input id="${id}" data-field="${field}" type="${opts.type || 'text'}" value="${val(field, saved)}" ${opts.disabled || deleted ? 'disabled' : ''} placeholder="${esc(opts.placeholder || '')}"
          class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white disabled:opacity-60" />
        ${opts.hint ? `<p class="text-[10px] text-slate-500 mt-1">${opts.hint}</p>` : ''}
      </div>`;
    const btn = (id: string, label: string, tone: 'neutral' | 'danger' | 'good' = 'neutral', extra = '') =>
      `<button id="${id}" ${busy} class="px-3 py-1.5 rounded-lg border font-bold text-[11px] disabled:opacity-50 ${
        tone === 'danger' ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300'
          : tone === 'good' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'} ${extra}">${label}</button>`;
    const section = (title: string, inner: string, id = '') => `
      <section ${id ? `id="${id}"` : ''} class="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">${title}</h4>${inner}</section>`;
    const fact = (label: string, value: string) => `<div><p class="text-[10px] uppercase font-bold text-slate-500">${label}</p><p class="text-xs text-slate-200 break-words">${value}</p></div>`;

    const locked = isLocked(d);
    const sessions = drawer.sessions;
    const history = drawer.history?.items || [];

    return `
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black shrink-0">${esc((d.name || '?').trim().charAt(0).toUpperCase())}</div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-extrabold text-white break-words">${esc(d.name)}${self ? ' <span class="text-xs text-slate-500 font-normal">(you)</span>' : ''}</h3>
          <p class="font-mono text-[11px] text-blue-400 break-all">${esc(d.email)}</p>
          <div class="flex flex-wrap gap-1.5 mt-1.5">${badge(d.role, ROLE_TONE[d.role] || 'slate')}${statusBadges(d).replace('flex flex-col items-start gap-1', 'flex flex-wrap gap-1.5')}</div>
        </div>
        <button id="dw-close" class="text-slate-400 hover:text-white font-bold text-lg leading-none" aria-label="Close">✕</button>
      </div>
      ${drawer.error ? `<p class="text-xs font-semibold text-red-400 break-words">${esc(drawer.error)}</p>` : ''}

      ${section('Details', `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          ${input('dw-name', 'Full name', 'name', d.name)}
          ${input('dw-phone', 'Phone', 'phone', d.phone, { placeholder: '+91 98765 43210' })}
          ${input('dw-email', 'Login email', 'email', d.email, { disabled: self, type: 'text' })}
          ${input('dw-otp', '2FA email (passcodes go here)', 'otpEmail', d.otpEmail, { disabled: self, type: 'text' })}
          <div class="sm:col-span-2">${input('dw-dept', 'Department', 'department', d.department)}</div>
        </div>
        ${self ? '<p class="text-[10px] text-slate-500">You cannot change your own login or 2FA email (a typo could lock you out). Ask another System Admin.</p>' : ''}
        ${!self && !deleted ? '<p class="text-[10px] text-slate-500">Changing the login or 2FA email signs the person out everywhere and notifies their previous address.</p>' : ''}
        <div class="flex justify-end">${btn('dw-save', 'Save changes', 'good', deleted ? 'hidden' : '')}</div>`)}

      ${deleted ? section('This account is deleted', `
        <p class="text-xs text-slate-300">Deleted ${esc(formatDateTime(d.deletedAt))}. It cannot sign in. Restoring brings it back <b>disabled</b>, and the person must set a new password.</p>
        <div>${btn('dw-restore', '↩ Restore account', 'good')}</div>`) : `

      ${section('Access', `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-end">
          <div>
            <label class="block font-semibold text-slate-300 mb-1" for="dw-role">Role / portal</label>
            <select id="dw-role" ${self || drawer.busy ? 'disabled' : ''} class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold disabled:opacity-60">
              ${ROLE_OPTIONS.map(o => `<option value="${o.role}" ${(drawer.role || d.role) === o.role ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>
          <div class="flex gap-2">${btn('dw-role-apply', 'Change role', 'neutral', self || (drawer.role || d.role) === d.role ? 'hidden' : '')}
            ${self ? '' : btn('dw-toggle', d.isActive === false ? 'Activate' : 'Deactivate', d.isActive === false ? 'good' : 'danger')}</div>
        </div>
        ${self ? '<p class="text-[10px] text-slate-500">You cannot change your own role or status.</p>' : ''}`)}

      ${section('Security', `
        <div class="grid grid-cols-2 gap-3">
          ${fact('Last sign-in', d.lastLoginAt ? `${esc(formatDateTime(d.lastLoginAt))} <span class="text-slate-500">(${esc(timeAgo(d.lastLoginAt))})</span>` : 'Never')}
          ${fact('Password changed', esc(formatDateTime(d.passwordChangedAt)))}
          ${fact('Failed attempts', String(d.failedLogins))}
          ${fact('Lockout', locked ? `<span class="text-red-400 font-semibold">until ${esc(formatDateTime(d.lockedUntil))}</span>` : 'None')}
          ${fact('Created', `${esc(formatDateTime(d.createdAt))}${d.createdByEmail ? ` by ${esc(d.createdByEmail)}` : ''}`)}
          ${fact('Password status', d.mustChangePassword ? '<span class="text-amber-400 font-semibold">Must choose a new password</span>' : 'Chosen by the user')}
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          ${locked || d.failedLogins > 0 ? btn('dw-unlock', '🔓 Unlock', 'good') : ''}
          ${self ? '' : btn('dw-reset', '🔑 Reset password')}
          ${!self && d.mustChangePassword && d.isActive !== false ? btn('dw-resend', '✉ Resend credentials') : ''}
          ${self ? '' : btn('dw-logout', '⏻ Force sign-out everywhere', 'danger')}
        </div>`)}

      ${section(`Active sessions${sessions ? ` (${sessions.length})` : ''}`, sessions === null
        ? '<p class="text-xs text-slate-500 font-mono">Loading…</p>'
        : sessions.length === 0 ? '<p class="text-xs text-slate-500">Not signed in anywhere.</p>'
          : `<ul class="space-y-2">${sessions.map(s => `
            <li class="flex items-center gap-3 rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <div class="min-w-0 flex-1 text-xs">
                <p class="font-semibold text-slate-200">${esc(describeBrowser(s.userAgent))} <span class="font-mono text-slate-500 font-normal">${esc(s.ipAddress || '')}</span></p>
                <p class="text-[10px] text-slate-500">Signed in ${esc(formatDateTime(s.startedAt))} • last active ${esc(timeAgo(s.lastActiveAt))} • expires ${esc(formatDateTime(s.expiresAt))}</p>
              </div>
              <button data-end-session="${esc(s.id)}" ${busy} class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-300 font-bold text-[11px] disabled:opacity-50">End</button>
            </li>`).join('')}</ul>`)}

      ${section('Recent sign-in activity', history.length === 0
        ? `<p class="text-xs text-slate-500">${drawer.history ? 'No sign-in activity recorded yet.' : 'Loading…'}</p>`
        : `<ul class="divide-y divide-slate-800/60">${history.map(h => `
          <li class="py-1.5 flex items-center gap-2 text-[11px]">
            <span class="w-1.5 h-1.5 rounded-full ${h.success ? 'bg-emerald-500' : 'bg-red-500'}"></span>
            <span class="text-slate-200 font-semibold">${esc(EVENT_LABELS[h.event] || h.event)}</span>
            ${h.failureReason ? `<span class="text-slate-500">(${esc(h.failureReason.replace(/_/g, ' '))})</span>` : ''}
            <span class="ml-auto text-slate-500 font-mono">${esc(h.ipAddress || '')}</span>
            <span class="text-slate-500 whitespace-nowrap" title="${esc(formatDateTime(h.createdAt))}">${esc(timeAgo(h.createdAt))}</span>
          </li>`).join('')}</ul>`)}

      ${self ? '' : section('Danger zone', `
        <p class="text-xs text-slate-400">Deleting removes the account from lists and blocks sign-in at once. The history stays in the audit log and the account can be restored.</p>
        <div>${btn('dw-delete', '🗑 Delete account', 'danger')}</div>`)}`}`;
  }

  private bindDrawer(host: HTMLElement, d: StaffDetail): void {
    const on = (id: string, fn: () => void) => host.querySelector(`#${id}`)?.addEventListener('click', fn);
    on('dw-close', closeDrawer);
    host.querySelectorAll<HTMLInputElement>('input[data-field]').forEach(i =>
      i.addEventListener('input', () => { drawer.draft[i.getAttribute('data-field') as string] = i.value; }));
    host.querySelector<HTMLSelectElement>('#dw-role')?.addEventListener('change', e => {
      drawer.role = (e.target as HTMLSelectElement).value;
      this.paintDrawer();
    });

    on('dw-save', () => void saveProfile(d));
    on('dw-role-apply', () => {
      const role = (drawer.role || d.role) as StaffRole;
      void act({
        title: 'Change role?', confirmLabel: 'Change role', danger: true,
        message: `${d.name} will move from ${d.role} to ${role}. They are signed out everywhere and must use the ${role} portal.`,
      }, async () => { await adminApi.staff.setRole(d.id, role); drawer.role = ''; return `${d.name} is now ${role}.`; });
    });
    on('dw-toggle', () => {
      const activate = d.isActive === false;
      void act(activate ? null : {
        title: 'Deactivate account?', confirmLabel: 'Deactivate', danger: true,
        message: `${d.name} is signed out immediately and cannot sign in until you activate the account again.`,
      }, async () => { await adminApi.staff.setActive(d.id, activate); return activate ? `${d.name} can sign in again.` : `${d.name} was deactivated.`; });
    });
    on('dw-unlock', () => void act(null, async () => { await adminApi.staff.unlock(d.id); return `${d.name} was unlocked.`; }));
    on('dw-reset', () => void act({
      title: 'Reset password?', confirmLabel: 'Reset password', danger: true,
      message: `A new temporary password is created and emailed. ${d.name} is signed out everywhere and must choose their own password.`,
    }, async () => { showCredentials(await adminApi.staff.resetPassword(d.id), 'reset'); return 'Password reset.'; }));
    on('dw-resend', () => void act({
      title: 'Resend credentials?', confirmLabel: 'Send new password',
      message: `A new temporary password is created and emailed to ${d.name}. The previous temporary password stops working.`,
    }, async () => { showCredentials(await adminApi.staff.resendCredentials(d.id), 'resend'); return 'New credentials created.'; }));
    on('dw-logout', () => void act({
      title: 'Sign out everywhere?', confirmLabel: 'Force sign-out', danger: true,
      message: `${d.name} is signed out of every device immediately. They can sign in again with their password.`,
    }, async () => { const r = await adminApi.staff.forceLogout(d.id); return `${r.message} (${r.revokedSessions} session${r.revokedSessions === 1 ? '' : 's'} ended)`; }));
    on('dw-delete', () => void act({
      title: 'Delete account?', confirmLabel: 'Delete account', danger: true,
      message: `${d.name} (${d.email}) is signed out now and can no longer sign in. You can restore the account later.`,
    }, async () => { await adminApi.staff.remove(d.id); return `${d.name}'s account was deleted.`; }));
    on('dw-restore', () => void act(null, async () => { await adminApi.staff.restore(d.id); return `${d.name}'s account was restored (still disabled).`; }));
    host.querySelectorAll<HTMLElement>('[data-end-session]').forEach(b => b.addEventListener('click', () => {
      const sid = b.getAttribute('data-end-session') as string;
      void act({
        title: 'End this session?', confirmLabel: 'End session', danger: true,
        message: 'That device can no longer refresh its sign-in. A screen already open stays usable until its access token expires (a few minutes); use "Force sign-out" to cut everything at once.',
      }, async () => { await adminApi.staff.endSession(d.id, sid); return 'Session ended.'; });
    }));
  }
}

// ------------------------------------------------------------------ data
async function loadList(): Promise<void> {
  list.loading = true;
  current?.paintTable();
  try {
    const query = { q: filters.q.trim(), role: filters.role, status: filters.status, department: filters.department.trim(),
      sort: filters.sort, order: filters.order, page: filters.page, pageSize: filters.pageSize };
    let data = await adminApi.staff.search(query);
    if (data.items.length === 0 && data.total > 0 && filters.page > data.pages) {   // e.g. the last row of a page was deleted
      filters.page = data.pages;
      data = await adminApi.staff.search({ ...query, page: filters.page });
    }
    list.data = data;
    list.error = '';
  } catch (e) {
    list.error = errorText(e);
  } finally {
    list.loading = false;
    current?.paintTable();
  }
}

async function openDrawer(id: string): Promise<void> {
  drawer.id = id;
  drawer.detail = null;
  drawer.sessions = null;
  drawer.history = null;
  drawer.error = '';
  drawer.draft = {};
  drawer.role = '';
  await loadDrawer(id, true);
}

/** Load (or reload) everything the drawer shows; the three requests are independent. */
async function loadDrawer(id: string, resetDraft: boolean): Promise<void> {
  drawer.loading = true;
  current?.paintDrawer();
  const [detail, sessions, history] = await Promise.allSettled([
    adminApi.staff.detail(id), adminApi.staff.sessions(id), adminApi.audit.loginEvents({ userId: id, pageSize: 8 }),
  ]);
  if (drawer.id !== id) return;                      // closed or switched to someone else meanwhile
  if (detail.status === 'fulfilled') { drawer.detail = detail.value; drawer.error = ''; if (resetDraft) drawer.draft = {}; }
  else drawer.error = errorText(detail.reason);
  drawer.sessions = sessions.status === 'fulfilled' ? sessions.value.items : [];
  drawer.history = history.status === 'fulfilled' ? history.value : null;
  drawer.loading = false;
  current?.paintDrawer();
}

function closeDrawer(): void {
  drawer.id = null;
  drawer.detail = null;
  current?.paintDrawer();
}

/** Run one account action: confirm -> call -> toast -> reload the drawer and the list. */
async function act(confirm: ConfirmOptions | null, work: () => Promise<string>): Promise<void> {
  if (drawer.busy || !drawer.id) return;
  if (confirm && !(await confirmDialog(confirm))) return;
  const id = drawer.id;
  drawer.busy = true;
  drawer.error = '';
  current?.paintDrawer();
  try {
    toast(await work(), 'success');
    drawer.draft = {};
  } catch (e) {
    drawer.error = errorText(e);
    toast(errorText(e), 'error');
  } finally {
    drawer.busy = false;
  }
  await Promise.all([loadDrawer(id, true), loadList()]);
}

async function saveProfile(d: StaffDetail): Promise<void> {
  const original: Record<string, string> = {
    name: d.name, email: d.email, otpEmail: d.otpEmail, phone: d.phone || '', department: d.department || '',
  };
  const changes: Record<string, string> = {};
  Object.entries(drawer.draft).forEach(([field, value]) => {
    if (value.trim() !== original[field]) changes[field] = value.trim();
  });
  if (!Object.keys(changes).length) { toast('Nothing to save: no details were changed.', 'info', 2500); return; }
  if (changes.name === '') { drawer.error = 'The name must not be empty.'; current?.paintDrawer(); return; }
  const signsOut = 'email' in changes || 'otpEmail' in changes;
  await act(signsOut ? {
    title: 'Change sign-in email?', confirmLabel: 'Save and sign out', danger: true,
    message: `${d.name} is signed out everywhere, and their previous address is told about the change.`,
  } : null, async () => {
    await adminApi.staff.updateProfile(d.id, changes as StaffProfileChanges);
    return 'Details saved.';
  });
}

// ------------------------------------------------------------------ dialogs
function showCredentials(result: StaffCredentials, kind: 'created' | 'reset' | 'resend'): void {
  const title = kind === 'created' ? 'Account created' : kind === 'reset' ? 'Password reset' : 'New credentials';
  const modal = openModal({
    title,
    body: `
      <div class="space-y-3 text-xs">
        <p class="text-slate-300"><b class="text-white">${esc(result.user.name)}</b> (${esc(result.user.role)}) — <span class="font-mono text-blue-400">${esc(result.user.email)}</span></p>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="cr-pass">Temporary password</label>
          <div class="flex gap-2">
            <input id="cr-pass" readonly value="${esc(result.temporaryPassword)}" class="glass-input flex-1 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono text-sm tracking-wider" />
            <button id="cr-copy" class="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold">Copy</button>
          </div>
        </div>
        <p class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
          This is the only time the password is shown. ${result.emailed ? 'It has also been emailed.' : 'No email was sent: give it to them yourself.'}
          They must choose a new password when they sign in at <b>${esc(PORTAL_PATH[result.user.role] || '/')}</b>.
        </p>
        <button id="cr-done" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider">DONE</button>
      </div>`,
  });
  modal.root.querySelector('#cr-done')?.addEventListener('click', modal.close);
  modal.root.querySelector('#cr-copy')?.addEventListener('click', async e => {
    const button = e.currentTarget as HTMLButtonElement;
    if (await copyText(result.temporaryPassword)) button.textContent = 'Copied ✓';
    else { (modal.root.querySelector('#cr-pass') as HTMLInputElement).select(); button.textContent = 'Press Ctrl+C'; }
  });
}

function openCreateDialog(prefill: Record<string, string> = {}, error = ''): void {
  const v = (k: string, d = '') => esc(prefill[k] ?? d);
  const field = 'glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white';
  const modal = openModal({
    title: 'Add staff member',
    body: `
      <p id="cs-error" class="text-xs font-semibold text-red-400 break-words ${error ? '' : 'hidden'}">${esc(error)}</p>
      <div class="space-y-3 text-xs">
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-name">Full name</label><input id="cs-name" class="${field}" value="${v('name')}" placeholder="Jane Doe" /></div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-email">Work email (login id)</label><input id="cs-email" class="${field} font-mono" value="${v('email')}" placeholder="jane@company.com" /></div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-role">Role</label>
          <select id="cs-role" class="${field} font-semibold">${ROLE_OPTIONS.map(o => `<option value="${o.role}" ${(prefill.role || 'Recruiter') === o.role ? 'selected' : ''}>${o.label}</option>`).join('')}</select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block font-semibold text-slate-300 mb-1" for="cs-dept">Department <span class="text-slate-500 font-normal">(optional)</span></label><input id="cs-dept" class="${field}" value="${v('department')}" /></div>
          <div><label class="block font-semibold text-slate-300 mb-1" for="cs-phone">Phone <span class="text-slate-500 font-normal">(optional)</span></label><input id="cs-phone" class="${field}" value="${v('phone')}" placeholder="+91 98765 43210" /></div>
        </div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-otp">2FA email <span class="text-slate-500 font-normal">(optional — defaults to the work email)</span></label><input id="cs-otp" class="${field} font-mono" value="${v('otpEmail')}" /></div>
        <p class="text-[11px] text-slate-500">A temporary password is generated and emailed. They must replace it when they first sign in.</p>
        <button id="cs-submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 disabled:opacity-60">CREATE ACCOUNT ➔</button>
      </div>`,
  });
  const q = (s: string) => modal.root.querySelector<HTMLInputElement>(s)!;
  const submit = q('#cs-submit') as unknown as HTMLButtonElement;
  const showError = (msg: string) => { const el = q('#cs-error'); el.textContent = msg; el.classList.toggle('hidden', !msg); };
  const run = async () => {
    const data = {
      name: q('#cs-name').value.trim(), email: q('#cs-email').value.trim(), role: q('#cs-role').value as StaffRole,
      department: q('#cs-dept').value.trim(), phone: q('#cs-phone').value.trim(), otpEmail: q('#cs-otp').value.trim(),
    };
    if (!data.name || !data.email) return showError('Enter a name and an email.');
    showError('');
    submit.disabled = true;
    try {
      const result = await adminApi.staff.create({
        name: data.name, email: data.email, role: data.role,
        ...(data.department ? { department: data.department } : {}), ...(data.phone ? { phone: data.phone } : {}),
        ...(data.otpEmail ? { otpEmail: data.otpEmail } : {}),
      });
      modal.close();
      toast(`${result.user.name} was added.`, 'success');
      showCredentials(result, 'created');
      Object.assign(filters, { q: '', role: '', status: 'all', department: '', sort: 'createdAt', order: 'desc', page: 1 });
      current?.mount();
    } catch (e) {
      submit.disabled = false;
      showError(errorText(e));
    }
  };
  submit.addEventListener('click', () => void run());
  modal.root.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') void run(); }));
  q('#cs-name').focus();
}
