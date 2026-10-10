import { ApiError } from './authApi';

/**
 * Small UI toolkit shared by the System Admin screens: safe HTML escaping, toasts, confirm dialogs, pagination,
 * badges, a tiny bar chart and date formatting. Everything that opens an overlay attaches it to <body>, so it
 * survives the app re-rendering the page underneath.
 */

// ------------------------------------------------------------------ text
export const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const errorText = (e: unknown): string =>
  e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: number | undefined;
  return (...args: A) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}

// ------------------------------------------------------------------ dates
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "10 Oct 2026, 13:51" in the viewer's local time. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "5 min ago", "3 h ago", "2 d ago" (or the date for anything older than 30 days). */
export function timeAgo(iso?: string | null, now: number = Date.now()): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '—';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  if (seconds < 30 * 86400) return `${Math.round(seconds / 86400)} d ago`;
  return formatDate(iso);
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

/** Short, readable device name from a User-Agent string ("Chrome on Windows"). */
export function describeBrowser(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown device';
  const ua = userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /python|httpx|curl/i.test(ua) ? 'Script' : '';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || ua.slice(0, 40);
}

// ------------------------------------------------------------------ badges
export type Tone = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'slate';
const TONES: Record<Tone, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function badge(text: string, tone: Tone = 'slate'): string {
  return `<span class="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold border ${TONES[tone]}">${esc(text)}</span>`;
}

// ------------------------------------------------------------------ toasts
let toastHost: HTMLElement | null = null;

export function toast(message: string, kind: 'success' | 'error' | 'info' = 'info', ms = 4500): void {
  if (!toastHost || !toastHost.isConnected) {
    toastHost = document.createElement('div');
    toastHost.className = 'fixed bottom-4 right-4 z-[120] flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))]';
    toastHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastHost);
  }
  const tone = kind === 'success' ? TONES.green : kind === 'error' ? TONES.red : TONES.blue;
  const el = document.createElement('div');
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  el.className = `menu-panel rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xl flex items-start gap-2 ${tone}`;
  el.innerHTML = `<span class="flex-1 break-words">${esc(message)}</span><button class="font-bold opacity-70 hover:opacity-100" aria-label="Dismiss">✕</button>`;
  const remove = () => el.remove();
  el.querySelector('button')?.addEventListener('click', remove);
  toastHost.appendChild(el);
  window.setTimeout(remove, kind === 'error' ? Math.max(ms, 7000) : ms);
}

// ------------------------------------------------------------------ dialogs
export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

/** Modal yes / no. Resolves true on confirm; false on cancel, Escape or a click outside. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md overflow-y-auto';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="min-h-full flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-7 space-y-4 shadow-2xl">
          <h3 class="text-lg font-extrabold text-white">${esc(opts.title)}</h3>
          <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${esc(opts.message)}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button data-act="cancel" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs">Cancel</button>
            <button data-act="ok" class="px-4 py-2 rounded-xl ${opts.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold text-xs">${esc(opts.confirmLabel || 'Confirm')}</button>
          </div>
        </div>
      </div>`;
    const finish = (answer: boolean) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve(answer);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        finish(false);
      }
    };
    overlay.addEventListener('click', e => {
      const act = (e.target as HTMLElement).closest('[data-act]')?.getAttribute('data-act');
      if (act === 'ok') finish(true);
      else if (act === 'cancel' || e.target === overlay || (e.target as HTMLElement).parentElement === overlay) finish(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);
    (overlay.querySelector('[data-act="ok"]') as HTMLElement).focus();
  });
}

/** Generic modal shell; the caller fills `body` and wires its own buttons. Returns a close function. */
export function openModal(opts: { title: string; width?: string; body: string; onClose?: () => void }): {
  root: HTMLElement;
  close: () => void;
} {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md overflow-y-auto';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="min-h-full flex items-center justify-center p-4" data-backdrop>
      <div class="glass-panel w-full ${opts.width || 'max-w-md'} rounded-3xl border border-slate-800 p-7 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-lg font-extrabold text-white">${esc(opts.title)}</h3>
          <button data-close class="text-slate-400 hover:text-white font-bold" aria-label="Close">✕</button>
        </div>
        <div data-modal-body>${opts.body}</div>
      </div>
    </div>`;
  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    opts.onClose?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !document.querySelector('[role="dialog"].z-\\[110\\]')) close();
  };
  overlay.querySelector('[data-close]')?.addEventListener('click', close);
  overlay.addEventListener('mousedown', e => {
    if ((e.target as HTMLElement).hasAttribute('data-backdrop')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  return { root: overlay.querySelector('[data-modal-body]') as HTMLElement, close };
}

// ------------------------------------------------------------------ pagination
export interface PagerInfo {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}

export function pagerHtml(p: PagerInfo, sizes: number[] = [10, 25, 50, 100]): string {
  const from = p.total === 0 ? 0 : (p.page - 1) * p.pageSize + 1;
  const to = Math.min(p.total, p.page * p.pageSize);
  const btn = (label: string, page: number, disabled: boolean) =>
    `<button data-page="${page}" ${disabled ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] disabled:opacity-40 disabled:cursor-not-allowed">${label}</button>`;
  return `
    <div class="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-400">
      <span>${p.total === 0 ? 'No results' : `Showing <b class="text-slate-200">${from}–${to}</b> of <b class="text-slate-200">${p.total}</b>`}</span>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1.5">Rows
          <select data-page-size class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
            ${sizes.map(s => `<option value="${s}" ${s === p.pageSize ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </label>
        ${btn('« First', 1, p.page <= 1)}${btn('‹ Prev', p.page - 1, p.page <= 1)}
        <span class="px-1">Page <b class="text-slate-200">${p.page}</b> / ${p.pages}</span>
        ${btn('Next ›', p.page + 1, p.page >= p.pages)}${btn('Last »', p.pages, p.page >= p.pages)}
      </div>
    </div>`;
}

export function bindPager(root: HTMLElement, onPage: (page: number) => void, onSize: (size: number) => void): void {
  root.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(b =>
    b.addEventListener('click', () => {
      if (!b.disabled) onPage(Number(b.getAttribute('data-page')));
    }));
  root.querySelector<HTMLSelectElement>('[data-page-size]')?.addEventListener('change', e =>
    onSize(Number((e.currentTarget as HTMLSelectElement).value)));
}

// ------------------------------------------------------------------ chart
export interface ChartPoint {
  label: string;
  ok: number;
  bad: number;
}

/** Stacked bars (successful in green, failed in red) as an inline SVG that scales to its container. */
export function barChart(points: ChartPoint[], height = 120): string {
  const width = 600;
  if (!points.length) return '';
  const max = Math.max(1, ...points.map(p => p.ok + p.bad));
  const slot = width / points.length;
  const bar = Math.max(2, slot * 0.7);
  const scale = (height - 18) / max;
  const bars = points.map((p, i) => {
    const x = i * slot + (slot - bar) / 2;
    const okH = p.ok * scale;
    const badH = p.bad * scale;
    const base = height - 16;
    return `<g><title>${esc(p.label)}: ${p.ok} successful, ${p.bad} failed</title>
      ${p.ok ? `<rect x="${x.toFixed(1)}" y="${(base - okH).toFixed(1)}" width="${bar.toFixed(1)}" height="${okH.toFixed(1)}" rx="1.5" fill="#10b981"/>` : ''}
      ${p.bad ? `<rect x="${x.toFixed(1)}" y="${(base - okH - badH).toFixed(1)}" width="${bar.toFixed(1)}" height="${badH.toFixed(1)}" rx="1.5" fill="#ef4444"/>` : ''}
      ${!p.ok && !p.bad ? `<rect x="${x.toFixed(1)}" y="${base - 1}" width="${bar.toFixed(1)}" height="1" fill="currentColor" opacity="0.2"/>` : ''}
    </g>`;
  }).join('');
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const labels = points.map((p, i) => (i % labelEvery === 0
    ? `<text x="${(i * slot + slot / 2).toFixed(1)}" y="${height - 3}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.55">${esc(p.label)}</text>` : '')).join('');
  return `<svg viewBox="0 0 ${width} ${height}" class="w-full text-slate-400" role="img" aria-label="Sign-ins over time" preserveAspectRatio="none">
    <line x1="0" y1="${height - 16}" x2="${width}" y2="${height - 16}" stroke="currentColor" opacity="0.2"/>${bars}${labels}</svg>`;
}

// ------------------------------------------------------------------ files / clipboard
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
