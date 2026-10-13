import { getPortalTab } from '../services/portalNav';
import { authApi } from '../services/authApi';
import { ensureProctorSocket, focusChat, frames, isSpeakingTo, onProctorUpdate, sendProctor, setListening, startSpeaking, stopSpeaking, threads, unread, violationCounts } from '../services/proctorSocket';
import { IdentityVerificationPanel } from './IdentityVerificationPanel';

interface LiveItem {
  id: string;
  name: string;
  email: string;
  examTitle: string;
  timeLeftSeconds: number;
  examStarted: boolean;
  /** Local deadline so the badge counts down between server refreshes. */
  deadlineMs: number | null;
  violations: number;
  lastEvent: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function timeLabel(item: LiveItem): string {
  if (!item.examStarted) return 'Not started';
  const left = item.deadlineMs == null
    ? item.timeLeftSeconds
    : Math.max(0, Math.round((item.deadlineMs - Date.now()) / 1000));
  return `Time left ${clock(left)}`;
}

export class LiveMonitorPortalModule {
  private static current: LiveMonitorPortalModule | null = null;
  private container: HTMLElement;
  private items: LiveItem[] = [];
  private listening: LiveItem | null = null;
  private chatOpen = false;
  private timer: number | null = null;
  private tickTimer: number | null = null;
  private stopWatch: (() => void) | null = null;

  constructor(container: HTMLElement) {
    if (LiveMonitorPortalModule.current && LiveMonitorPortalModule.current !== this) {
      LiveMonitorPortalModule.current.stop();
    }
    LiveMonitorPortalModule.current = this;
    this.container = container;
  }

  public render() {
    if (getPortalTab('proctor') === 'identity-verification') {
      this.stop();
      this.container.innerHTML = '<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="proctor-section"></div></div>';
      new IdentityVerificationPanel(this.container.querySelector('#proctor-section') as HTMLElement).render();
      return;
    }

    ensureProctorSocket();
    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <p class="text-xs text-slate-400">Loading admitted candidates...</p>
      </div>
    `;
    this.load().catch(() => this.paint('Could not load live sessions.'));
    if (!this.timer) this.timer = window.setInterval(() => this.load().catch(() => undefined), 5000);
    if (!this.tickTimer) this.tickTimer = window.setInterval(() => this.tickClocks(), 1000);
    this.stopWatch?.();
    this.stopWatch = onProctorUpdate(() => { this.load().catch(() => undefined); });
  }

  private stop() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
    if (this.tickTimer) window.clearInterval(this.tickTimer);
    this.tickTimer = null;
    this.stopWatch?.();
    this.stopWatch = null;
    setListening('');
  }

  private tickClocks() {
    this.container.querySelectorAll<HTMLElement>('[data-clock]').forEach(node => {
      const id = node.getAttribute('data-clock') || '';
      const item = this.items.find(row => row.id === id);
      if (item) node.textContent = timeLabel(item);
    });
  }

  private async load() {
    const data = await authApi.fetchJson<{ items: LiveItem[] }>('/proctor/live', 'GET', undefined, 'staff');
    const now = Date.now();
    this.items = data.items.map(item => ({
      ...item,
      examStarted: Boolean(item.examStarted),
      deadlineMs: item.examStarted ? now + Math.max(0, item.timeLeftSeconds) * 1000 : null,
      violations: Math.max(item.violations, violationCounts[item.id] || 0),
    }));
    this.paint();
  }

  private paint(error = '') {
    if (getPortalTab('proctor') === 'identity-verification') return;
    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="flex items-center justify-between glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <h1 class="text-xl font-extrabold text-white">Live monitoring</h1>
            <p class="text-xs text-slate-400 mt-1">Admitted candidates. Select one to hear their microphone.</p>
          </div>
          <span class="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300">
            Active: <b class="text-blue-400">${this.items.length}</b>
          </span>
        </div>
        ${error ? `<p class="text-xs text-red-400">${escapeHtml(error)}</p>` : ''}
        ${this.items.length === 0 ? `<p class="text-sm text-slate-500">No admitted candidates yet. Admit someone from Identity & ID Verification.</p>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${this.items.map(item => this.card(item)).join('')}
        </div>
        ${this.listening ? this.popup(this.listening) : ''}
      </div>
    `;
    this.container.querySelectorAll<HTMLElement>('[data-open-live]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-open-live') || '';
        this.listening = this.items.find(item => item.id === id) || null;
        setListening(id);
        this.paint();
      });
    });
    this.container.querySelector('#close-live-popup')?.addEventListener('click', () => {
      if (this.listening && isSpeakingTo(this.listening.id)) stopSpeaking();
      this.listening = null;
      this.chatOpen = false;
      setListening('');
      focusChat('');
      this.paint();
    });
    this.container.querySelector('[data-live-talk]')?.addEventListener('click', () => {
      const id = this.listening?.id || '';
      if (!id) return;
      if (isSpeakingTo(id)) stopSpeaking();
      else void startSpeaking(id);
    });
    this.container.querySelector('[data-live-chat]')?.addEventListener('click', () => {
      this.chatOpen = !this.chatOpen;
      focusChat(this.chatOpen && this.listening ? this.listening.id : '');
      this.paint();
    });
    this.container.querySelector('#live-chat-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = this.container.querySelector('#live-chat-input') as HTMLInputElement | null;
      const text = input?.value.trim() || '';
      if (!text || !this.listening) return;
      sendProctor({ type: 'chat', candidateId: this.listening.id, text });
      if (input) input.value = '';
    });
  }

  private card(item: LiveItem): string {
    const frame = frames[item.id];
    const violations = Math.max(item.violations, violationCounts[item.id] || 0);
    return `
      <button type="button" data-open-live="${item.id}" class="text-left glass-panel p-4 rounded-3xl border ${violations ? 'border-amber-500/50' : 'border-slate-800'} space-y-3">
        <div class="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          ${frame
            ? `<img data-live-frame="${item.id}" src="${frame}" alt="" class="absolute inset-0 w-full h-full object-cover" />`
            : `<img data-live-frame="${item.id}" alt="" class="absolute inset-0 w-full h-full object-cover hidden" /><div class="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Waiting for camera</div>`}
          <div class="absolute top-2 left-2 text-[10px] font-bold bg-slate-950/80 text-white px-2 py-0.5 rounded">${escapeHtml(item.examTitle || 'Assessment')}</div>
          <div class="absolute bottom-2 left-2 right-2 flex justify-between text-[11px] font-mono text-white">
            <span data-clock="${item.id}" class="bg-slate-950/80 px-2 py-0.5 rounded">${timeLabel(item)}</span>
            <span class="bg-red-950/90 text-red-200 px-2 py-0.5 rounded">Violations ${violations}</span>
          </div>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">${escapeHtml(item.name)}</h3>
          <p class="text-xs text-slate-400">${escapeHtml(item.examTitle || 'Assessment')}</p>
        </div>
      </button>
    `;
  }

  private popup(item: LiveItem): string {
    const frame = frames[item.id];
    const chat = threads[item.id] || [];
    const count = unread[item.id] || 0;
    return `
      <div class="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-white">${escapeHtml(item.name)}</h2>
              <p class="text-xs text-slate-400">${escapeHtml(item.examTitle || 'Assessment')} • <span data-clock="${item.id}">${timeLabel(item)}</span> • Violations ${Math.max(item.violations, violationCounts[item.id] || 0)}</p>
            </div>
            <button id="close-live-popup" class="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200" type="button">Close</button>
          </div>
          <div class="relative w-full aspect-video rounded-2xl bg-slate-900 overflow-hidden">
            ${frame
              ? `<img data-live-frame="${item.id}" src="${frame}" alt="" class="w-full h-full object-cover" />`
              : `<img data-live-frame="${item.id}" alt="" class="w-full h-full object-cover hidden" />`}
          </div>
          <p class="text-xs font-semibold text-emerald-400">Listening to this candidate's microphone.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" data-live-talk class="px-4 py-2 rounded-xl text-xs font-bold ${isSpeakingTo(item.id) ? 'bg-red-600 text-white' : 'bg-purple-600/20 text-purple-200 border border-purple-500/40'}">
              ${isSpeakingTo(item.id) ? 'Stop speaking' : 'Speak to candidate'}
            </button>
            <button type="button" data-live-chat class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              Chat
              ${count ? `<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${count}</span>` : ''}
            </button>
          </div>
          ${this.chatOpen ? `
            <div class="rounded-xl border border-slate-800 bg-slate-950">
              <div class="h-36 overflow-y-auto p-3 space-y-2 text-xs">
                ${chat.map(m => `<div class="${m.from === 'proctor' ? 'text-right' : ''}"><span class="inline-block px-2 py-1 rounded-lg ${m.from === 'proctor' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-100'}">${escapeHtml(m.text)}</span></div>`).join('') || '<p class="text-slate-500">No messages yet.</p>'}
              </div>
              <form id="live-chat-form" class="flex gap-2 p-2 border-t border-slate-800">
                <input id="live-chat-input" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Message the candidate" />
                <button class="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold" type="submit">Send</button>
              </form>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
