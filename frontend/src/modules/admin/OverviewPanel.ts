import { portalSectionPath, router } from '../../router';
import {
  ActivityFeed, EmailProbe, GroupValues, HealthReport, InviteStats, SecurityStats, StaffStats, adminApi,
} from '../../services/adminApi';
import {
  Tone, badge, barChart, errorText, esc, formatChartTick, formatUptime, timeAgo, toast,
} from '../../services/ui';
import { presetStaffFilters } from './StaffPanel';

/**
 * "Dashboard & Health" screen. Every card is its own request (see /admin/dashboard/*) with its own loading and
 * error state, so one slow or failing card never blanks the page. Data is cached at module level because the app
 * re-creates the page on every store change; the screen refreshes itself once a minute while it is open.
 */
interface Slot<T> { data: T | null; error: string }
const slot = <T,>(): Slot<T> => ({ data: null, error: '' });

const DATA = {
  staff: slot<StaffStats>(),
  security: slot<SecurityStats>(),
  activity: slot<ActivityFeed>(),
  invites: slot<InviteStats>(),
  health: slot<HealthReport>(),
  policy: slot<GroupValues>(),
};
type SlotName = keyof typeof DATA;

const LOADERS: Record<SlotName, () => Promise<unknown>> = {
  staff: () => adminApi.dashboard.staff(),
  security: () => adminApi.dashboard.security(view.hours),
  activity: () => adminApi.dashboard.activity(8),
  invites: () => adminApi.dashboard.invites(),
  health: () => adminApi.dashboard.health(),
  policy: () => adminApi.settings.group('proctoring'),
};

const view = { hours: 24, probing: false, probe: null as EmailProbe | null, refreshedAt: 0 };
let timer: number | undefined;

const COMPONENT_NAMES: Record<string, string> = {
  database: 'Database', migrations: 'Database schema', settings: 'Platform settings', emailGateway: 'Email gateway',
  encryption: 'Secret encryption', securityPosture: 'Security posture',
};
const HEALTH_LOOK: Record<string, { label: string; text: string; tone: Tone }> = {
  healthy: { label: 'Healthy', text: 'text-emerald-400', tone: 'green' },
  degraded: { label: 'Needs attention', text: 'text-amber-400', tone: 'amber' },
  unhealthy: { label: 'Unhealthy', text: 'text-red-400', tone: 'red' },
};
const DOT: Record<string, string> = { ok: 'bg-emerald-500', warning: 'bg-amber-500', error: 'bg-red-500' };

const card = (inner: string, extra = '') =>
  `<div class="glass-panel p-5 rounded-2xl border border-slate-800 ${extra}">${inner}</div>`;
const heading = (title: string, right = '') =>
  `<div class="flex items-center justify-between gap-3 mb-3"><h3 class="text-sm font-bold text-white">${title}</h3>${right}</div>`;
const retry = (name: SlotName, message: string) =>
  `<p class="text-xs text-red-400">${esc(message)}</p>
   <button data-retry="${name}" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`;
const loading = (text = 'Loading…') => `<p class="text-xs text-slate-500 font-mono">${text}</p>`;

function tile(title: string, value: string, sub: string, valueClass = 'text-white'): string {
  return card(`
    <span class="text-xs font-semibold text-slate-400 uppercase">${title}</span>
    <div class="text-2xl font-extrabold ${valueClass} mt-1">${value}</div>
    <div class="text-[11px] text-slate-500 mt-1 space-y-1">${sub}</div>`);
}

/** ▲ +3 / ▼ −2 against the previous period. `upIsBad` flips the colours (failed sign-ins). */
function delta(current: number, previous: number, upIsBad: boolean): string {
  if (current === 0 && previous === 0) return '';
  const diff = current - previous;
  if (diff === 0) return `<span class="text-slate-500">same as before</span>`;
  const good = upIsBad ? diff < 0 : diff > 0;
  return `<span class="${good ? 'text-emerald-400' : 'text-red-400'}">${diff > 0 ? '▲ +' : '▼ −'}${Math.abs(diff)} vs previous</span>`;
}

export class OverviewPanel {
  constructor(private root: HTMLElement) {}

  public mount(): void {
    this.root.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between gap-3">
          <p id="ov-refreshed" class="text-[11px] text-slate-500"></p>
          <button id="ov-refresh" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">⟳ Refresh</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div id="ov-tile-health"></div><div id="ov-tile-staff"></div><div id="ov-tile-policy"></div><div id="ov-tile-email"></div>
        </div>
        <div id="ov-security"></div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div id="ov-activity"></div>
          <div id="ov-health-details"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="ov-byrole"></div>
          <div id="ov-invites"></div>
        </div>
      </div>`;
    this.root.querySelector('#ov-refresh')?.addEventListener('click', () => { void this.loadAll(true); });
    (Object.keys(DATA) as SlotName[]).forEach(name => this.paint(name));
    this.paintRefreshed();
    void this.loadAll();

    window.clearInterval(timer);
    timer = window.setInterval(() => {
      if (!this.root.isConnected) return void window.clearInterval(timer);
      void this.loadAll();
    }, 60_000);
  }

  // ------------------------------------------------------------------ loading
  private async loadAll(announce = false): Promise<void> {
    try {
      await Promise.all((Object.keys(DATA) as SlotName[]).map(name => this.load(name)));
      view.refreshedAt = Date.now();
      this.paintRefreshed();
      if (announce) toast('Dashboard refreshed.', 'success', 2000);
    } catch {
      /* each card already shows its own error */
    }
  }

  private async load(name: SlotName): Promise<void> {
    try {
      (DATA[name] as Slot<unknown>).data = await LOADERS[name]();
      DATA[name].error = '';
    } catch (e) {
      DATA[name].error = errorText(e);
    }
    try {
      this.paint(name);
    } catch {
      /* keep the last painted card if a render throws */
    }
  }

  private paintRefreshed(): void {
    const el = this.root.querySelector('#ov-refreshed');
    if (el) el.textContent = view.refreshedAt ? `Updated ${timeAgo(new Date(view.refreshedAt).toISOString())} • refreshes every minute` : '';
  }

  private put(selector: string, html: string): HTMLElement | null {
    const el = this.root.querySelector<HTMLElement>(selector);
    if (!el || !el.isConnected) return null;
    el.innerHTML = html;
    return el;
  }

  // ------------------------------------------------------------------ painting
  private paint(name: SlotName): void {
    switch (name) {
      case 'health': this.paintHealth(); break;
      case 'staff': this.paintStaff(); break;
      case 'policy': this.paintPolicy(); break;
      case 'security': this.paintSecurity(); break;
      case 'activity': this.paintActivity(); break;
      case 'invites': this.paintInvites(); break;
    }
    this.root.querySelectorAll<HTMLElement>('[data-retry]').forEach(b => {
      b.onclick = () => void this.load(b.getAttribute('data-retry') as SlotName);
    });
    this.root.querySelectorAll<HTMLElement>('[data-goto]').forEach(b => {
      b.onclick = () => this.navigate(b.getAttribute('data-goto') as string);
    });
  }

  private navigate(target: string): void {
    const [tab, extra] = target.split(':');
    if (tab === 'staff' && extra) presetStaffFilters({ status: extra });
    const hash = tab === 'settings' && extra ? extra : '';
    router.navigate(portalSectionPath('admin', tab, hash));
  }

  private paintHealth(): void {
    const { data, error } = DATA.health;
    if (!data) {
      const body = error ? retry('health', error) : loading();
      this.put('#ov-tile-health', tile('System status', error ? 'Unknown' : '…', body, 'text-slate-400'));
      this.put('#ov-tile-email', tile('Email gateway', error ? 'Unknown' : '…', error ? '' : loading(), 'text-slate-400'));
      this.put('#ov-health-details', card(heading('Health checks') + (error ? retry('health', error) : loading())));
      return;
    }
    const look = HEALTH_LOOK[data.status];
    this.put('#ov-tile-health', tile(
      'System status',
      `<span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full ${DOT[data.status === 'healthy' ? 'ok' : data.status === 'degraded' ? 'warning' : 'error']} ${data.status === 'healthy' ? 'animate-pulse' : ''}"></span>${look.label}</span>`,
      `<p>${esc(data.environment)} • up ${formatUptime(data.uptimeSeconds)} • v${esc(data.version)}</p>`,
      look.text));

    const email = data.components.find(c => c.name === 'emailGateway');
    const ed = email?.details || {};
    const ok = email?.status === 'ok';
    const probe = view.probe;
    this.put('#ov-tile-email', tile(
      'Email gateway',
      ok ? 'Configured' : 'Not configured',
      `<p>${esc(ed.host || '—')}:${esc(ed.port || '')} • password: ${esc(ed.passwordSource || 'none')}</p>
       <p>${esc(ed.sender || 'no sender address')}</p>
       <button id="ov-probe" ${view.probing ? 'disabled' : ''} class="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-[11px] disabled:opacity-60">${view.probing ? 'Checking…' : '🔌 Check connection'}</button>
       ${probe ? `<p class="${probe.ok ? 'text-emerald-400' : 'text-red-400'} font-semibold break-words">${probe.ok ? '✓' : '✗'} ${esc(probe.message)}</p>` : ''}
       <button type="button" data-goto="settings:email" class="text-blue-400 hover:text-blue-300 font-semibold">Email settings →</button>`,
      ok ? 'text-purple-400' : 'text-amber-400'));
    this.root.querySelector('#ov-probe')?.addEventListener('click', () => void this.probeEmail());

    const rows = data.components.map(c => `
      <li class="py-2.5 border-b border-slate-800/60 last:border-0">
        <div class="flex items-start gap-2.5">
          <span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${DOT[c.status]}"></span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-white">${esc(COMPONENT_NAMES[c.name] || c.name)}</p>
            <p class="text-[11px] text-slate-400 break-words">${esc(c.message)}</p>
            ${(c.details.findings || []).length ? `<ul class="mt-1.5 space-y-1">${(c.details.findings as { id: string; message: string }[]).map(f =>
              `<li class="text-[11px] text-amber-300/90 pl-3 relative before:content-['•'] before:absolute before:left-0">${esc(f.message)}</li>`).join('')}</ul>` : ''}
          </div>
          ${badge(c.status === 'ok' ? 'OK' : c.status === 'warning' ? 'Check' : 'Problem', c.status === 'ok' ? 'green' : c.status === 'warning' ? 'amber' : 'red')}
        </div>
      </li>`).join('');
    this.put('#ov-health-details', card(heading('Health checks', badge(look.label, look.tone)) + `<ul>${rows}</ul>`));
  }

  private async probeEmail(): Promise<void> {
    if (view.probing) return;
    view.probing = true;
    this.paintHealth();
    try {
      view.probe = await adminApi.dashboard.probeEmail();
      toast(view.probe.ok ? 'Email gateway connected.' : view.probe.message, view.probe.ok ? 'success' : 'error');
    } catch (e) {
      view.probe = null;
      toast(errorText(e), 'error');
    } finally {
      view.probing = false;
      this.paintHealth();
    }
  }

  private paintStaff(): void {
    const { data, error } = DATA.staff;
    if (!data) {
      this.put('#ov-tile-staff', tile('Staff accounts', error ? 'Unavailable' : '…', error ? retry('staff', error) : loading(), 'text-slate-400'));
      this.put('#ov-byrole', card(heading('Staff by role') + (error ? retry('staff', error) : loading())));
      return;
    }
    const link = (n: number, label: string, filter: string) => n > 0
      ? `<button data-goto="staff:${filter}" class="text-blue-400 hover:text-blue-300 font-semibold">${n} ${label}</button>` : `<span>${n} ${label}</span>`;
    this.put('#ov-tile-staff', tile(
      'Staff accounts', `${data.active} active`,
      `<p>${link(data.lockedNow, 'locked', 'locked')} • ${link(data.pendingPasswordChange, 'awaiting first password', 'pendingPassword')}</p>
       <p>${link(data.neverSignedIn, 'never signed in', 'neverSignedIn')} • ${data.signedInLast24h} signed in today</p>`));

    const max = Math.max(1, ...data.byRole.map(r => r.active + r.disabled));
    this.put('#ov-byrole', card(heading('Staff by role', `<button data-goto="staff" class="text-[11px] font-semibold text-blue-400 hover:text-blue-300">Manage →</button>`) +
      `<div class="space-y-3">${data.byRole.map(r => `
        <div>
          <div class="flex justify-between text-[11px] mb-1"><span class="font-bold text-slate-200">${esc(r.role)}</span>
            <span class="text-slate-400">${r.active} active${r.disabled ? ` • ${r.disabled} disabled` : ''}</span></div>
          <div class="h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div class="bg-blue-500" style="width:${(r.active / max) * 100}%"></div>
            <div class="bg-slate-600" style="width:${(r.disabled / max) * 100}%"></div>
          </div>
        </div>`).join('')}</div>
        <p class="text-[11px] text-slate-500 mt-3">${data.createdLast7d} created in the last 7 days • ${data.signedInLast7d} signed in this week</p>`));
  }

  private paintPolicy(): void {
    const { data, error } = DATA.policy;
    if (!data) {
      this.put('#ov-tile-policy', tile('Proctoring policy', error ? 'Unavailable' : '…', error ? retry('policy', error) : loading(), 'text-slate-400'));
      return;
    }
    this.put('#ov-tile-policy', tile(
      'Proctoring policy', `${esc(data.maxViolationsBeforeTerminate)} violations max`,
      `<p>${esc(data.maxTabSwitches)} tab-switch warnings before action</p>
       <p>AI sensitivity: ${esc(data.proctoringSensitivity)}</p>
       <button type="button" data-goto="settings:proctoring" class="text-blue-400 hover:text-blue-300 font-semibold">Edit policy →</button>`, 'text-blue-400'));
  }

  private paintSecurity(): void {
    const { data, error } = DATA.security;
    const picker = `<select id="ov-hours" class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
      ${[[24, 'Last 24 hours'], [72, 'Last 3 days'], [168, 'Last 7 days']].map(([h, label]) =>
        `<option value="${h}" ${h === view.hours ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
    if (!data) {
      this.put('#ov-security', card(heading('Sign-in security', picker) + (error ? retry('security', error) : loading())));
      this.bindHours();
      return;
    }
    const t = data.totals;
    const stat = (label: string, value: number, note = '', tone = 'text-white') => `
      <div class="rounded-xl bg-slate-900 border border-slate-800 p-3">
        <p class="text-[10px] font-bold uppercase text-slate-500">${label}</p>
        <p class="text-xl font-extrabold ${tone}">${value}</p><p class="text-[10px] mt-0.5">${note || '&nbsp;'}</p>
      </div>`;
    const list = (title: string, items: { value: string; count: number }[]) => `
      <div><p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">${title}</p>
        ${items.length ? `<ul class="space-y-1">${items.map(i => `<li class="flex justify-between gap-3 text-[11px]"><span class="font-mono text-slate-300 truncate">${esc(i.value)}</span><span class="text-red-400 font-bold">${i.count}</span></li>`).join('')}</ul>`
          : '<p class="text-[11px] text-slate-500">None</p>'}</div>`;
    const points = data.series.map(p => ({
      label: formatChartTick(p.start, data.bucket),
      ok: p.successful,
      bad: p.failed,
    }));
    this.put('#ov-security', card(`
      ${heading('Sign-in security', picker)}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${stat('Successful sign-ins', t.successfulSignIns, delta(t.successfulSignIns, data.previousPeriod.successfulSignIns, false), 'text-emerald-400')}
        ${stat('Failed sign-ins', t.failedSignIns, delta(t.failedSignIns, data.previousPeriod.failedSignIns, true), t.failedSignIns ? 'text-red-400' : 'text-white')}
        ${stat('Lockouts', t.lockouts, `${data.lockedAccountsNow} locked right now`, t.lockouts ? 'text-amber-400' : 'text-white')}
        ${stat('Rate-limited', t.rateLimited, 'blocked for too many requests', t.rateLimited ? 'text-amber-400' : 'text-white')}
        ${stat('Wrong passcodes', t.otpFailures)}
        ${stat('Blocked while locked', t.blockedAttempts)}
        ${stat('People signed in', t.uniqueUsers)}
        ${stat('Token-theft alerts', t.tokenReuseAlerts, t.tokenReuseAlerts ? 'investigate in Audit Logs' : '', t.tokenReuseAlerts ? 'text-red-400' : 'text-white')}
      </div>
      <div class="mt-4">${barChart(points)}
        <div class="flex gap-4 text-[10px] text-slate-400 mt-1"><span><span class="inline-block w-2 h-2 rounded-sm bg-emerald-500"></span> successful</span><span><span class="inline-block w-2 h-2 rounded-sm bg-red-500"></span> failed / blocked</span>
          <span>per ${data.bucket} (UTC)</span></div></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 pt-4 border-t border-slate-800">
        ${list('Top failing emails', data.topFailingEmails)}
        ${list('Top failing IP addresses', data.topFailingIps)}
        <div><p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Why sign-ins failed</p>
          ${data.failuresByReason.length ? `<div class="flex flex-wrap gap-1.5">${data.failuresByReason.map(r =>
            `<span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">${esc(r.reason.replace(/_/g, ' '))} <b class="text-red-400">${r.count}</b></span>`).join('')}</div>`
            : '<p class="text-[11px] text-slate-500">None</p>'}</div>
      </div>
      ${data.truncated ? '<p class="text-[10px] text-amber-400 mt-3">Very high volume: only the latest events were counted.</p>' : ''}`));
    this.bindHours();
  }

  private bindHours(): void {
    this.root.querySelector<HTMLSelectElement>('#ov-hours')?.addEventListener('change', e => {
      view.hours = Number((e.currentTarget as HTMLSelectElement).value);
      DATA.security.data = null;
      this.paintSecurity();
      void this.load('security');
    });
  }

  private paintActivity(): void {
    const { data, error } = DATA.activity;
    const all = `<button data-goto="audit" class="text-[11px] font-semibold text-blue-400 hover:text-blue-300">View all →</button>`;
    if (!data) {
      this.put('#ov-activity', card(heading('Recent activity', all) + (error ? retry('activity', error) : loading())));
      return;
    }
    const tones: Record<string, Tone> = { auth: 'blue', staff: 'purple', security: 'red', settings: 'amber', system: 'slate', candidate: 'green' };
    this.put('#ov-activity', card(heading('Recent activity', all) + (data.items.length
      ? `<ul>${data.items.map(i => `
        <li class="py-2.5 border-b border-slate-800/60 last:border-0 flex items-start gap-2.5">
          <span class="mt-0.5">${i.success ? '' : '⚠️'}</span>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-slate-200 break-words">${esc(i.summary)}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">${timeAgo(i.createdAt)}${i.actorEmail ? ` • ${esc(i.actorEmail)}` : ''}</p>
          </div>${badge(i.category, tones[i.category] || 'slate')}
        </li>`).join('')}</ul>`
      : '<p class="text-xs text-slate-500">Nothing has happened yet.</p>')));
  }

  private paintInvites(): void {
    const { data, error } = DATA.invites;
    if (!data) {
      this.put('#ov-invites', card(heading('Candidate invitations') + (error ? retry('invites', error) : loading())));
      return;
    }
    const cell = (label: string, value: number, tone = 'text-white') =>
      `<div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><p class="text-[10px] font-bold uppercase text-slate-500">${label}</p><p class="text-xl font-extrabold ${tone}">${value}</p></div>`;
    this.put('#ov-invites', card(heading('Candidate invitations') + `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${cell('Total sent', data.total)}${cell('Active', data.active, 'text-blue-400')}${cell('Waiting for candidate', data.awaitingCandidate, 'text-amber-400')}
        ${cell('Verified', data.verified, 'text-emerald-400')}${cell('Expired', data.expired)}${cell('Expiring in 24 h', data.expiringWithin24h, data.expiringWithin24h ? 'text-amber-400' : 'text-white')}
      </div>
      <p class="text-[11px] text-slate-500 mt-3">${data.createdLast7d} sent in the last 7 days • ${data.revoked} revoked</p>`));
  }
}
