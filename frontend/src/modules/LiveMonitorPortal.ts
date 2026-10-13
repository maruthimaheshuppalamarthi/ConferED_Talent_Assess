import { getPortalTab, setPortalTab } from '../services/portalNav';
import { authApi } from '../services/authApi';
import { router, portalSectionPath } from '../router';
import {
  ensureProctorSocket,
  focusChat,
  frames,
  isSpeakingTo,
  onProctorUpdate,
  sendProctor,
  setListening,
  startSpeaking,
  stopSpeaking,
  threads,
  unread,
  violationCounts,
} from '../services/proctorSocket';
import { IdentityVerificationPanel } from './IdentityVerificationPanel';

interface LiveItem {
  id: string;
  name: string;
  email: string;
  examTitle: string;
  jobId?: string;
  jobTitle?: string;
  timeLeftSeconds: number;
  examStarted: boolean;
  /** Local deadline so the badge counts down between server refreshes. */
  deadlineMs: number | null;
  violations: number;
  lastEvent: string;
}

interface JobSummary {
  id: string;
  title: string;
  count: number;
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
  if (!item.examStarted) return 'Admitted (Ready to start)';
  const left = item.deadlineMs == null
    ? item.timeLeftSeconds
    : Math.max(0, Math.round((item.deadlineMs - Date.now()) / 1000));
  return `Time left ${clock(left)}`;
}

export class LiveMonitorPortalModule {
  private static current: LiveMonitorPortalModule | null = null;
  private container: HTMLElement;
  private items: LiveItem[] = [];
  private jobs: JobSummary[] = [];
  private filterJobId: string = '';
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
    const data = await authApi.fetchJson<{ items: LiveItem[]; jobs?: JobSummary[] }>('/proctor/live', 'GET', undefined, 'staff');
    const now = Date.now();
    this.items = (data.items || []).map(item => ({
      ...item,
      jobId: item.jobId || '',
      jobTitle: item.jobTitle || item.examTitle || 'General Assessment',
      examStarted: Boolean(item.examStarted),
      deadlineMs: item.examStarted ? now + Math.max(0, item.timeLeftSeconds) * 1000 : null,
      violations: Math.max(item.violations, violationCounts[item.id] || 0),
    }));
    this.jobs = data.jobs || [];
    this.paint();
  }

  private paint(error = '') {
    if (getPortalTab('proctor') === 'identity-verification') return;

    const displayedItems = this.filterJobId
      ? this.items.filter(item => item.jobId === this.filterJobId)
      : this.items;

    const selectedJobTitle = this.filterJobId
      ? (this.jobs.find(j => j.id === this.filterJobId)?.title || this.items.find(i => i.jobId === this.filterJobId)?.jobTitle || 'Selected Role')
      : '';

    // Group items by Job Title when "All Jobs" is selected
    const groupedJobs: { title: string; items: LiveItem[] }[] = [];
    if (!this.filterJobId) {
      const groupMap: Record<string, LiveItem[]> = {};
      for (const item of displayedItems) {
        const title = item.jobTitle || 'General Assessment';
        if (!groupMap[title]) groupMap[title] = [];
        groupMap[title].push(item);
      }
      for (const [title, list] of Object.entries(groupMap)) {
        groupedJobs.push({ title, items: list });
      }
    }

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Top Banner Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Proctor Surveillance Engine
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Live Candidate Monitor</h1>
            <p class="text-xs text-slate-400">
              Real-time candidate camera feeds and AI integrity tracking for active admitted exam sessions.
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${displayedItems.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}"></span>
              Live Feeds: <b class="${displayedItems.length > 0 ? 'text-emerald-400' : 'text-slate-400'} font-bold">${displayedItems.length}</b>
            </span>
          </div>
        </div>

        <!-- Filter by Job Section -->
        ${this.jobs.length > 0 ? `
          <div class="flex flex-wrap gap-2 items-center bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800/80">
            <span class="text-xs text-slate-400 font-semibold mr-1 pl-1">Filter by Job:</span>
            <button data-job-filter="" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${!this.filterJobId ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}">
              All Jobs (${this.items.length})
            </button>
            ${this.jobs.map(j => {
              const count = this.items.filter(it => it.jobId === j.id).length;
              return `
                <button data-job-filter="${escapeHtml(j.id)}" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${this.filterJobId === j.id ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}">
                  ${escapeHtml(j.title)} (${count})
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${error ? `<p class="text-xs text-red-400 font-semibold">${escapeHtml(error)}</p>` : ''}

        <!-- Feeds Grid or Empty State -->
        ${displayedItems.length === 0 ? `
          <div class="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
              📹
            </div>
            <h3 class="text-base font-bold text-slate-200">No Active Live Feeds</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              ${this.filterJobId
                ? `There are no admitted candidates currently taking the exam for <strong>${escapeHtml(selectedJobTitle)}</strong>.`
                : 'Candidates will appear here in real-time once admitted from <strong>Identity & ID Verification</strong> and their exam begins. Completed exams automatically exit this monitor.'}
            </p>
            <div class="pt-2">
              <button id="go-identity-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all">
                Go to Identity & ID Verification ➔
              </button>
            </div>
          </div>
        ` : this.filterJobId ? `
          <!-- Single Selected Job Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-base">💼</span>
                <h2 class="text-base font-bold text-white">${escapeHtml(selectedJobTitle)}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ${displayedItems.length} Live ${displayedItems.length === 1 ? 'Feed' : 'Feeds'}
                </span>
              </div>
              <span class="text-xs text-slate-400 font-mono">Job-Specific Live Monitoring</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${displayedItems.map(item => this.card(item)).join('')}
            </div>
          </div>
        ` : `
          <!-- Grouped by Job Sections -->
          <div class="space-y-8">
            ${groupedJobs.map(group => `
              <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-base">💼</span>
                    <h2 class="text-base font-bold text-white">${escapeHtml(group.title)}</h2>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      ${group.items.length} Live ${group.items.length === 1 ? 'Feed' : 'Feeds'}
                    </span>
                  </div>
                  <span class="text-xs text-slate-400 font-mono">${group.items.filter(i => i.examStarted).length} actively in test</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${group.items.map(item => this.card(item)).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `}

        ${this.listening ? this.popup(this.listening) : ''}
      </div>
    `;

    // Bind Job Filter Buttons
    this.container.querySelectorAll<HTMLElement>('[data-job-filter]').forEach(btn => {
      btn.addEventListener('click', e => {
        this.filterJobId = (e.currentTarget as HTMLElement).getAttribute('data-job-filter') || '';
        this.paint();
      });
    });

    // Go to Identity Verification CTA
    this.container.querySelector('#go-identity-btn')?.addEventListener('click', () => {
      setPortalTab('proctor', 'identity-verification');
      router.navigate(portalSectionPath('proctor', 'identity-verification'));
      this.render();
    });

    // Open candidate live modal
    this.container.querySelectorAll<HTMLElement>('[data-open-live]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-open-live') || '';
        this.listening = this.items.find(item => item.id === id) || null;
        setListening(id);
        this.paint();
      });
    });

    // Close candidate live modal
    this.container.querySelector('#close-live-popup')?.addEventListener('click', () => {
      if (this.listening && isSpeakingTo(this.listening.id)) stopSpeaking();
      this.listening = null;
      this.chatOpen = false;
      setListening('');
      focusChat('');
      this.paint();
    });

    // Push-to-talk button
    this.container.querySelector('[data-live-talk]')?.addEventListener('click', () => {
      const id = this.listening?.id || '';
      if (!id) return;
      if (isSpeakingTo(id)) stopSpeaking();
      else void startSpeaking(id);
    });

    // Toggle Chat
    this.container.querySelector('[data-live-chat]')?.addEventListener('click', () => {
      this.chatOpen = !this.chatOpen;
      focusChat(this.chatOpen && this.listening ? this.listening.id : '');
      this.paint();
    });

    // Send Live Chat Form
    this.container.querySelector('#live-chat-form')?.addEventListener('submit', ev => {
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
      <button type="button" data-open-live="${item.id}" class="text-left glass-panel p-4 rounded-3xl border ${violations ? 'border-amber-500/50 hover:border-amber-500' : 'border-slate-800 hover:border-blue-500/50'} space-y-3 transition-all group hover:shadow-xl hover:shadow-blue-500/5">
        <div class="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          ${frame
            ? `<img data-live-frame="${item.id}" src="${frame}" alt="" class="absolute inset-0 w-full h-full object-cover" />`
            : `<img data-live-frame="${item.id}" alt="" class="absolute inset-0 w-full h-full object-cover hidden" />
               <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                 <span class="text-xl">📹</span>
                 <span>Waiting for camera feed</span>
               </div>`
          }
          <!-- Top Tag Overlay -->
          <div class="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span class="text-[10px] font-bold bg-slate-950/85 text-blue-300 border border-slate-700/60 px-2 py-0.5 rounded truncate max-w-[55%]">
              💼 ${escapeHtml(item.jobTitle || item.examTitle || 'Assessment')}
            </span>
            ${item.examStarted ? `
              <span class="text-[10px] font-bold bg-emerald-950/85 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Exam
              </span>
            ` : `
              <span class="text-[10px] font-bold bg-blue-950/85 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded">
                Admitted
              </span>
            `}
          </div>

          <!-- Bottom Tag Overlay -->
          <div class="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[11px] font-mono pointer-events-none">
            <span data-clock="${item.id}" class="bg-slate-950/85 text-slate-200 border border-slate-800 px-2 py-0.5 rounded">
              ${timeLabel(item)}
            </span>
            ${violations > 0 ? `
              <span class="bg-red-950/90 text-red-200 border border-red-500/50 px-2 py-0.5 rounded font-bold">
                ⚠ Violations ${violations}
              </span>
            ` : `
              <span class="bg-slate-950/85 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                0 Violations
              </span>
            `}
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">${escapeHtml(item.name)}</h3>
          <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(item.jobTitle || item.examTitle || 'Assessment')}</p>
          <p class="text-[11px] text-slate-500 font-mono truncate mt-0.5">${escapeHtml(item.email)}</p>
        </div>

        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Monitor candidate</span>
          <span class="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">Open Feed ➔</span>
        </div>
      </button>
    `;
  }

  private popup(item: LiveItem): string {
    const frame = frames[item.id];
    const chat = threads[item.id] || [];
    const count = unread[item.id] || 0;
    const violations = Math.max(item.violations, violationCounts[item.id] || 0);

    return `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-white">${escapeHtml(item.name)}</h2>
                <span class="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  ${escapeHtml(item.jobTitle || item.examTitle || 'Assessment')}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                <span data-clock="${item.id}">${timeLabel(item)}</span> •
                <span class="${violations ? 'text-red-400 font-bold' : 'text-slate-400'}">Violations: ${violations}</span>
              </p>
            </div>
            <button id="close-live-popup" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200" type="button">
              ✕ Close
            </button>
          </div>

          <div class="relative w-full aspect-video rounded-2xl bg-slate-900 overflow-hidden border border-slate-800">
            ${frame
              ? `<img data-live-frame="${item.id}" src="${frame}" alt="" class="w-full h-full object-cover" />`
              : `<div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                   <span class="text-2xl">📹</span>
                   <span>Waiting for candidate camera stream</span>
                 </div>`}
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span class="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Microphone Audio Stream Active
            </span>
            <span class="text-slate-400 font-mono text-[11px]">${escapeHtml(item.email)}</span>
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            <button type="button" data-live-talk class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSpeakingTo(item.id) ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-purple-600/20 text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white'}">
              ${isSpeakingTo(item.id) ? '🔴 Stop Speaking' : '🎙️ Speak to Candidate'}
            </button>
            <button type="button" data-live-chat class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
              💬 Candidate Chat
              ${count ? `<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${count}</span>` : ''}
            </button>
          </div>

          ${this.chatOpen ? `
            <div class="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden">
              <div class="p-2.5 border-b border-slate-800 bg-slate-900 text-[11px] font-bold text-slate-300">
                Direct Proctor Chat with ${escapeHtml(item.name)}
              </div>
              <div class="h-36 overflow-y-auto p-3 space-y-2 text-xs">
                ${chat.map(m => `
                  <div class="${m.from === 'proctor' ? 'text-right' : ''}">
                    <span class="inline-block px-3 py-1.5 rounded-xl ${m.from === 'proctor' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-100'}">
                      ${escapeHtml(m.text)}
                    </span>
                  </div>
                `).join('') || '<p class="text-slate-500 text-center py-4">No messages yet. Send a prompt to the candidate.</p>'}
              </div>
              <form id="live-chat-form" class="flex gap-2 p-2 border-t border-slate-800 bg-slate-950">
                <input id="live-chat-input" class="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500" placeholder="Type a message to the candidate..." />
                <button class="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors" type="submit">Send</button>
              </form>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
