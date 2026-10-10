import { getPortalTab } from '../services/portalNav';
import { store } from '../services/store';
import { IdentityVerificationPanel } from './IdentityVerificationPanel';

export class LiveMonitorPortalModule {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    // Identity & ID Verification is a separate section of the proctor menu.
    if (getPortalTab('proctor') === 'identity-verification') {
      this.container.innerHTML = '<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="proctor-section"></div></div>';
      new IdentityVerificationPanel(this.container.querySelector('#proctor-section') as HTMLElement).render();
      return;
    }

    const state = store.getState();
    const liveCands = state.liveCandidates;

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Live Proctor Grid Header -->
        <div class="flex items-center justify-between glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold text-xl animate-pulse">
              📹
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h1 class="text-xl font-extrabold text-white tracking-tight">Live Candidate Proctoring Command Center</h1>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Real-time WebRTC camera streams, AI gaze tracking, and remote intervention tools.</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300">
              Active Sessions: <b class="text-blue-400">${liveCands.length}</b>
            </span>
          </div>
        </div>

        <!-- Live Candidate Video Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${liveCands.map(lc => `
            <div class="glass-panel p-4 rounded-3xl border ${lc.status === 'warning' ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800 bg-slate-950/80'} space-y-4 shadow-xl">
              <!-- Video Frame -->
              <div class="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <!-- Video Stream Feed -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col items-center justify-center text-slate-500">
                  <span class="text-4xl mb-1">👤</span>
                  <span class="text-xs font-mono text-slate-400">${lc.name}</span>
                </div>

                <!-- Face Bounding Box Overlay -->
                <div class="absolute inset-4 border-2 border-dashed ${lc.status === 'warning' ? 'border-amber-400' : 'border-emerald-400'} rounded-xl flex items-start justify-between p-2 pointer-events-none">
                  <span class="text-[9px] font-mono font-bold bg-slate-950/80 text-white px-2 py-0.5 rounded border border-slate-800">
                    ${lc.sectionName}
                  </span>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded ${lc.status === 'warning' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}">
                    ${lc.status.toUpperCase()}
                  </span>
                </div>

                <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono font-bold text-white">
                  <span class="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">Time Left: ${lc.timeRemaining}</span>
                  <span class="bg-red-950/90 text-red-300 px-2 py-0.5 rounded border border-red-800">Violations: ${lc.violations}</span>
                </div>
              </div>

              <!-- Candidate Summary Info -->
              <div class="space-y-1.5 px-1">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">${lc.name}</h3>
                  <span class="text-xs text-slate-400">${lc.role}</span>
                </div>
                ${lc.lastEvent ? `
                  <p class="text-xs font-mono text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    ⚠️ Alert: ${lc.lastEvent}
                  </p>
                ` : `
                  <p class="text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    ✓ Clean session behavior.
                  </p>
                `}
              </div>

              <!-- Remote Action Control Buttons -->
              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button data-cid="${lc.candidateId}" class="warn-btn px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wider transition-all">
                  ⚠️ Issue Warning
                </button>
                <button data-cid="${lc.candidateId}" class="term-btn px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider transition-all">
                  ⛔ Terminate Exam
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    this.container.querySelectorAll('.warn-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cid = (e.currentTarget as HTMLElement).getAttribute('data-cid');
        alert(`Direct proctor warning dispatched to candidate ${cid}.`);
      });
    });

    this.container.querySelectorAll('.term-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cid = (e.currentTarget as HTMLElement).getAttribute('data-cid');
        if (confirm(`Are you sure you want to forcibly terminate candidate ${cid}'s assessment?`)) {
          store.logProctoringViolation('Fullscreen Exit', 'Assessment remotely terminated by Proctor', 'high');
          alert(`Assessment terminated for candidate ${cid}.`);
        }
      });
    });
  }
}
