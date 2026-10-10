import { AuditEntry, LoginEventEntry, Page, adminApi } from '../../services/adminApi';
import {
  Tone, badge, bindPager, debounce, describeBrowser, downloadBlob, errorText, esc, formatDateTime, pagerHtml, toast,
} from '../../services/ui';

/**
 * "Audit Logs" screen: the append-only audit trail (who did what, from where) and the sign-in history, each with
 * server-side filters, pagination and — for the trail — a CSV export of exactly the current filters.
 * State lives at module level because the app re-creates the page on every store change.
 */
const CATEGORY_TONE: Record<string, Tone> = {
  auth: 'blue', staff: 'purple', security: 'red', settings: 'amber', system: 'slate', candidate: 'green',
};
const EVENT_LABELS: Record<string, string> = {
  password_ok: 'Password accepted', login_success: 'Signed in', login_failed: 'Sign-in refused', login_blocked: 'Tried while locked',
  otp_failed: 'Wrong passcode', account_locked: 'Account locked', logout: 'Signed out', rate_limited: 'Rate limited',
};

const trailFilters = { from: '', to: '', category: '', action: '', actor: '', success: '', search: '', order: 'desc' as 'asc' | 'desc', page: 1, pageSize: 25 };
const signinFilters = { from: '', to: '', email: '', portal: '', event: '', success: '', order: 'desc' as 'asc' | 'desc', page: 1, pageSize: 25 };
const view = { tab: 'trail' as 'trail' | 'signins', exporting: false };
const trail = { data: null as Page<AuditEntry> | null, error: '', loading: false, open: new Set<string>() };
const signins = { data: null as Page<LoginEventEntry> | null, error: '', loading: false };
let meta: { categories: string[]; actions: string[] } | null = null;
let current: AuditPanel | null = null;

/** Used by "Settings history": open the audit trail already filtered. */
export function presetAuditFilters(preset: Partial<typeof trailFilters>): void {
  Object.assign(trailFilters, { from: '', to: '', category: '', action: '', actor: '', success: '', search: '', page: 1 }, preset);
  view.tab = 'trail';
  trail.data = null;
}

const field = 'glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs';
const label = (text: string, control: string) => `<label class="block"><span class="block text-[10px] font-bold uppercase text-slate-500 mb-1">${text}</span>${control}</label>`;
const resultOptions = (value: string) => ['', 'true', 'false'].map(v =>
  `<option value="${v}" ${value === v ? 'selected' : ''}>${v === '' ? 'Any result' : v === 'true' ? 'Succeeded' : 'Failed / refused'}</option>`).join('');

export class AuditPanel {
  constructor(private root: HTMLElement) {}

  public mount(): void {
    current = this;
    this.root.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Audit Logs</h2>
            <p class="text-xs text-slate-400 mt-0.5">An append-only record of who did what and from where. Entries cannot be edited or deleted.</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-xl border border-slate-700 overflow-hidden" role="tablist">
              ${(['trail', 'signins'] as const).map(t => `<button role="tab" aria-selected="${view.tab === t}" data-tab="${t}" class="px-3 py-2 text-xs font-bold ${view.tab === t ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}">${t === 'trail' ? 'Audit trail' : 'Sign-in history'}</button>`).join('')}
            </div>
            ${view.tab === 'trail' ? `<button id="au-export" ${view.exporting ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs disabled:opacity-60 whitespace-nowrap">${view.exporting ? 'Exporting…' : '📥 Export CSV'}</button>` : ''}
          </div>
        </div>
        <div id="au-filters"></div>
        <div id="au-table"></div>
        <div id="au-pager"></div>
      </div>`;
    this.root.querySelectorAll<HTMLElement>('[data-tab]').forEach(b => b.addEventListener('click', () => {
      view.tab = b.getAttribute('data-tab') as 'trail' | 'signins';
      this.mount();
    }));
    this.root.querySelector('#au-export')?.addEventListener('click', () => void exportCsv());
    this.paintFilters();
    this.paintTable();
    if (view.tab === 'trail') {
      void loadTrail();
      if (!meta) void adminApi.audit.meta().then(m => { meta = m; if (current === this) this.paintFilters(); }).catch(() => {});
    } else {
      void loadSignins();
    }
  }

  // ------------------------------------------------------------------ filters
  private paintFilters(): void {
    const host = this.root.querySelector<HTMLElement>('#au-filters');
    if (!host) return;
    const f = trailFilters;
    const s = signinFilters;
    host.innerHTML = view.tab === 'trail' ? `
      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        ${label('From (UTC)', `<input data-f="from" type="date" value="${esc(f.from)}" class="${field}" />`)}
        ${label('To (UTC)', `<input data-f="to" type="date" value="${esc(f.to)}" class="${field}" />`)}
        ${label('Category', `<select data-f="category" class="${field}"><option value="">All</option>${(meta?.categories || []).map(c => `<option value="${esc(c)}" ${f.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>`)}
        ${label('Action', `<select data-f="action" class="${field}"><option value="">All</option>${(meta?.actions || []).map(a => `<option value="${esc(a)}" ${f.action === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>`)}
        ${label('Done by', `<input data-f="actor" type="search" value="${esc(f.actor)}" placeholder="email" class="${field}" />`)}
        ${label('Result', `<select data-f="success" class="${field}">${resultOptions(f.success)}</select>`)}
        ${label('Search text', `<input data-f="search" type="search" value="${esc(f.search)}" placeholder="words in the summary" class="${field}" />`)}
        <div class="flex items-end gap-2"><button data-clear class="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button></div>
      </div>` : `
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        ${label('From (UTC)', `<input data-f="from" type="date" value="${esc(s.from)}" class="${field}" />`)}
        ${label('To (UTC)', `<input data-f="to" type="date" value="${esc(s.to)}" class="${field}" />`)}
        ${label('Email', `<input data-f="email" type="search" value="${esc(s.email)}" placeholder="contains…" class="${field}" />`)}
        ${label('Portal', `<select data-f="portal" class="${field}">${['', 'admin', 'recruiter', 'proctor'].map(p => `<option value="${p}" ${s.portal === p ? 'selected' : ''}>${p || 'All portals'}</option>`).join('')}</select>`)}
        ${label('Event', `<select data-f="event" class="${field}"><option value="">All events</option>${Object.entries(EVENT_LABELS).map(([k, v]) => `<option value="${k}" ${s.event === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}
        ${label('Result', `<select data-f="success" class="${field}">${resultOptions(s.success)}</select>`)}
        <div class="flex items-end gap-2"><button data-clear class="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button></div>
      </div>`;

    const target = (view.tab === 'trail' ? trailFilters : signinFilters) as Record<string, string | number>;
    const reload = () => { target.page = 1; void (view.tab === 'trail' ? loadTrail() : loadSignins()); };
    const typing = debounce(reload, 350);
    host.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-f]').forEach(el => {
      const key = el.getAttribute('data-f') as string;
      const isText = el instanceof HTMLInputElement && el.type === 'search';
      el.addEventListener(isText ? 'input' : 'change', () => { target[key] = el.value; (isText ? typing : reload)(); });
    });
    host.querySelector('[data-clear]')?.addEventListener('click', () => {
      if (view.tab === 'trail') Object.assign(trailFilters, { from: '', to: '', category: '', action: '', actor: '', success: '', search: '', page: 1 });
      else Object.assign(signinFilters, { from: '', to: '', email: '', portal: '', event: '', success: '', page: 1 });
      this.paintFilters();
      reload();
    });
  }

  // ------------------------------------------------------------------ table
  public paintTable(): void {
    const host = this.root.querySelector<HTMLElement>('#au-table');
    const pager = this.root.querySelector<HTMLElement>('#au-pager');
    if (!host || !pager) return;
    const src = view.tab === 'trail' ? trail : signins;

    if (!src.data) {
      host.innerHTML = src.error
        ? `<p class="text-xs text-red-400">${esc(src.error)}</p><button id="au-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`
        : '<p class="py-8 text-center text-xs text-slate-500 font-mono">Loading…</p>';
      pager.innerHTML = '';
      host.querySelector('#au-retry')?.addEventListener('click', () => void (view.tab === 'trail' ? loadTrail() : loadSignins()));
      return;
    }

    const dim = src.loading ? 'opacity-60' : '';
    const error = src.error ? `<p class="text-xs text-red-400 mb-2">${esc(src.error)}</p>` : '';
    const sortButton = (order: 'asc' | 'desc') => `<button data-order class="uppercase font-semibold hover:text-white">When ${order === 'desc' ? '▼' : '▲'}</button>`;

    if (view.tab === 'trail') {
      const rows = (trail.data?.items || []).map(e => {
        const open = trail.open.has(e.id);
        return `
          <tr class="hover:bg-slate-800/40 cursor-pointer align-top" data-row="${esc(e.id)}" aria-expanded="${open}">
            <td class="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono" title="${esc(e.createdAt)}">${esc(formatDateTime(e.createdAt))}</td>
            <td class="py-2.5 px-3">${badge(e.category, CATEGORY_TONE[e.category] || 'slate')}</td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-slate-300 break-all">${esc(e.action)}</td>
            <td class="py-2.5 px-3 text-slate-300 break-all">${esc(e.actorEmail || 'system')}${e.actorRole ? `<div class="text-[10px] text-slate-500">${esc(e.actorRole)}</div>` : ''}</td>
            <td class="py-2.5 px-3 text-slate-200 break-words min-w-[14rem]">${esc(e.summary)}</td>
            <td class="py-2.5 px-3 text-center" title="${e.success ? 'Succeeded' : 'Failed / refused'}">${e.success ? '<span class="text-emerald-400">✓</span>' : '<span class="text-red-400">✗</span>'}</td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${esc(e.ipAddress || '')}</td>
          </tr>
          ${open ? `<tr class="bg-slate-900/60"><td colspan="7" class="px-5 py-3 text-[11px] text-slate-400 space-y-1.5">
            ${e.targetType ? `<p><b class="text-slate-300">Target:</b> ${esc(e.targetType)} <span class="font-mono">${esc(e.targetId || '')}</span></p>` : ''}
            <p><b class="text-slate-300">Browser:</b> ${esc(describeBrowser(e.userAgent))}</p>
            ${e.details ? `<div><b class="text-slate-300">Details:</b><pre class="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">${esc(JSON.stringify(e.details, null, 2))}</pre></div>` : ''}
          </td></tr>` : ''}`;
      }).join('');
      host.innerHTML = `${error}<div class="overflow-x-auto ${dim}"><table class="w-full text-left text-xs">
        <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]"><th class="py-2.5 px-3">${sortButton(trailFilters.order)}</th>${['Category', 'Action', 'Done by', 'What happened', 'OK', 'IP address'].map(c => `<th class="py-2.5 px-3 uppercase font-semibold">${c}</th>`).join('')}</tr></thead>
        <tbody class="divide-y divide-slate-800/60">${rows || '<tr><td colspan="7" class="py-10 text-center text-slate-500">No audit entries match these filters.</td></tr>'}</tbody></table></div>`;
      host.querySelectorAll<HTMLElement>('[data-row]').forEach(r => r.addEventListener('click', () => {
        const id = r.getAttribute('data-row') as string;
        if (trail.open.has(id)) trail.open.delete(id); else trail.open.add(id);
        this.paintTable();
      }));
    } else {
      const rows = (signins.data?.items || []).map(e => `
        <tr class="hover:bg-slate-800/40">
          <td class="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono" title="${esc(e.createdAt)}">${esc(formatDateTime(e.createdAt))}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">${esc(EVENT_LABELS[e.event] || e.event)}</td>
          <td class="py-2.5 px-3">${e.success ? badge('OK', 'green') : badge('Refused', 'red')}</td>
          <td class="py-2.5 px-3 text-slate-300 break-all">${esc(e.email || '—')}</td>
          <td class="py-2.5 px-3 text-slate-400">${esc(e.portal || '—')}</td>
          <td class="py-2.5 px-3 text-slate-400">${esc((e.failureReason || '').replace(/_/g, ' '))}</td>
          <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${esc(e.ipAddress || '')}</td>
          <td class="py-2.5 px-3 text-slate-500">${esc(describeBrowser(e.userAgent))}</td>
        </tr>`).join('');
      host.innerHTML = `${error}<div class="overflow-x-auto ${dim}"><table class="w-full text-left text-xs">
        <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]"><th class="py-2.5 px-3">${sortButton(signinFilters.order)}</th>${['Event', 'Result', 'Email', 'Portal', 'Reason', 'IP address', 'Browser'].map(c => `<th class="py-2.5 px-3 uppercase font-semibold">${c}</th>`).join('')}</tr></thead>
        <tbody class="divide-y divide-slate-800/60">${rows || '<tr><td colspan="8" class="py-10 text-center text-slate-500">No sign-in events match these filters.</td></tr>'}</tbody></table></div>`;
    }

    host.querySelector('[data-order]')?.addEventListener('click', () => {
      const f = view.tab === 'trail' ? trailFilters : signinFilters;
      f.order = f.order === 'desc' ? 'asc' : 'desc';
      f.page = 1;
      void (view.tab === 'trail' ? loadTrail() : loadSignins());
    });
    pager.innerHTML = pagerHtml(src.data);
    const f = view.tab === 'trail' ? trailFilters : signinFilters;
    bindPager(pager,
      page => { f.page = page; void (view.tab === 'trail' ? loadTrail() : loadSignins()); },
      size => { f.pageSize = size; f.page = 1; void (view.tab === 'trail' ? loadTrail() : loadSignins()); });
  }
}

// ------------------------------------------------------------------ data
const clean = <T extends Record<string, unknown>>(f: T): T =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as T;

async function loadTrail(): Promise<void> {
  trail.loading = true;
  current?.paintTable();
  try {
    trail.data = await adminApi.audit.list(clean(trailFilters));
    trail.error = '';
  } catch (e) {
    trail.error = errorText(e);
  } finally {
    trail.loading = false;
    if (view.tab === 'trail') current?.paintTable();
  }
}

async function loadSignins(): Promise<void> {
  signins.loading = true;
  current?.paintTable();
  try {
    signins.data = await adminApi.audit.loginEvents(clean(signinFilters));
    signins.error = '';
  } catch (e) {
    signins.error = errorText(e);
  } finally {
    signins.loading = false;
    if (view.tab === 'signins') current?.paintTable();
  }
}

async function exportCsv(): Promise<void> {
  if (view.exporting) return;
  view.exporting = true;
  current?.mount();
  try {
    const file = await adminApi.audit.exportCsv(clean(trailFilters));
    downloadBlob(file.blob, file.filename);
    toast(file.truncated ? `Exported the first 50,000 entries as ${file.filename}. Narrow the filters to get the rest.` : `Exported ${file.filename}.`,
      file.truncated ? 'info' : 'success');
  } catch (e) {
    toast(errorText(e), 'error');
  } finally {
    view.exporting = false;
    current?.mount();
  }
}
