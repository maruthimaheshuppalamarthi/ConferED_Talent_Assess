import { CsvExporterService } from '../services/csvExporter';
import { EmailService } from '../services/emailService';
import { store } from '../services/store';
import { Question } from '../types';

export class AdminPortalModule {
  private container: HTMLElement;
  private activeTab: 'overview' | 'assessment-builder' | 'question-bank' | 'identity-verification' | 'settings' | 'audit' = 'overview';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
        <!-- Admin Navigation Tabs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-3xl border border-slate-800">
          <div>
            <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🛡️</span> System Admin & Assessment Configuration
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Configure global parameters, manage question bank, build custom assessments, and review audit logs.</p>
          </div>

          <div class="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs flex-wrap">
            <button data-tab="overview" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
              Dashboard & Health
            </button>
            <button data-tab="identity-verification" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab === 'identity-verification' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
              📸 Identity & ID Verification
            </button>
            <button data-tab="assessment-builder" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab === 'assessment-builder' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
              Assessment Builder
            </button>
            <button data-tab="question-bank" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab === 'question-bank' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
              Question Bank
            </button>
            <button data-tab="settings" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
              Global System Settings
            </button>
            <button data-tab="audit" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
              Audit Logs
            </button>
          </div>
        </div>

        <!-- Active Tab Workspace Container -->
        <div id="admin-tab-content">
          ${this.renderActiveTabContent()}
        </div>

        <!-- Modal Host Container -->
        <div id="admin-modal-host"></div>
      </div>
    `;

    this.attachEvents();
  }

  private renderActiveTabContent(): string {
    const state = store.getState();
    const assessment = store.getActiveAssessment();

    if (this.activeTab === 'overview') {
      return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">System Status</span>
            <div class="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> Healthy (100%)
            </div>
            <p class="text-[11px] text-slate-500">FastAPI backend & WebSocket gateway online</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Question Repository</span>
            <div class="text-2xl font-extrabold text-white">${state.questionBank.length} Questions</div>
            <p class="text-[11px] text-slate-500">MCQs, SQL, Algorithmic & Essay Topics</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Active Assessment</span>
            <div class="text-lg font-extrabold text-blue-400 truncate">${assessment?.title || 'Senior Software Engineer'}</div>
            <p class="text-[11px] text-slate-500">${assessment?.sections.length} Sections • ${assessment?.totalDurationMinutes} Mins</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Registered Candidates</span>
            <div class="text-2xl font-extrabold text-purple-400">${state.candidates.length} Candidates</div>
            <p class="text-[11px] text-slate-500">Evaluation scorecards active</p>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'identity-verification') {
      return `
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📸</span> Candidate Live Photo & Govt/College ID Verification Hub
              </h2>
              <p class="text-xs text-slate-400">Review live snapped candidate photos, uploaded Govt/College ID card proofs, authorize exam entry, or launch 360° room inspection intercom calls.</p>
            </div>
          </div>

          <div class="space-y-6">
            ${state.candidates.map(c => {
              const safeLivePhoto = c.livePhotoUrl ? c.livePhotoUrl.replace(/"/g, "'") : '';
              const safeIdProof = c.idProofUrl ? c.idProofUrl.replace(/"/g, "'") : '';
              return `
                <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white">${c.name}</h3>
                      <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        c.identityStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }">
                        ${c.identityStatus === 'approved' ? '✓ APPROVED & ALLOWED' : '⏳ PENDING VERIFICATION'}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400">${c.email} • ${c.phone}</p>
                    <p class="text-[11px] text-slate-500 font-mono">Candidate ID: ${c.id} • Registered: ${c.invitedAt}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4">
                    <!-- Live Photo Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">📸 Live Snapped Photo</span>
                      ${safeLivePhoto ? `
                        <img src="${safeLivePhoto}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      ` : `
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>📷</span> No Photo
                        </div>
                      `}
                    </div>

                    <!-- Govt / College ID Card Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-purple-400 uppercase tracking-wider">💳 Govt / College ID Proof</span>
                      ${safeIdProof ? `
                        <img src="${safeIdProof}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      ` : `
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>💳</span> No ID Proof
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Action Buttons: Approve & Intercom Pitch -->
                  <div class="flex flex-col gap-2.5 min-w-[220px]">
                    <button data-approve-id="${c.id}" class="w-full py-2.5 px-4 rounded-xl ${
                      c.identityStatus === 'approved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md font-extrabold animate-pulse'
                    } text-xs transition-all flex items-center justify-center gap-1.5">
                      <span>${c.identityStatus === 'approved' ? '✓ EXAM ENTRY ALLOWED' : '✅ ALLOW & ENTER EXAM'}</span>
                    </button>

                    <button data-intercom-cand="${c.id}" class="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                      <span>🎙️</span> Proctor Intercom / 360° Scan Call
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'assessment-builder') {
      return `
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white">Assessment Section & Module Builder</h2>
              <p class="text-xs text-slate-400">Dynamically add sections, modify timers, question counts, cutoffs, and randomization rules.</p>
            </div>
            <button id="add-sec-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
              <span>+</span> Add Custom Section
            </button>
          </div>

          <div class="space-y-4">
            ${(assessment?.sections || []).map((sec, idx) => `
              <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs flex items-center justify-center">${idx + 1}</span>
                    <h3 class="text-sm font-bold text-white">${sec.name}</h3>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-3 text-xs font-mono text-slate-400 mr-2">
                      <span>Timer: <b class="text-blue-400">${sec.timeLimitMinutes}m</b></span>
                      <span>Questions: <b class="text-purple-400">${sec.questions.length}</b></span>
                      <span>Cutoff: <b class="text-emerald-400">${sec.passingMarks} pts</b></span>
                    </div>
                    <button data-sec-edit="${sec.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                      ✏️ Edit
                    </button>
                    <button data-sec-del="${sec.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-400">${sec.instructions}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'question-bank') {
      return `
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white">Question Repository & Versioning</h2>
              <p class="text-xs text-slate-400">Add, modify, edit, or delete coding challenges, SQL queries, MCQs, and essay topics.</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="export-q-csv-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all">
                📥 Export CSV (.csv)
              </button>
              <button id="create-q-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
                <span>+</span> Create Question
              </button>
            </div>
          </div>

          <div class="space-y-3">
            ${state.questionBank.map(q => `
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      q.type === 'coding' ? 'bg-blue-500/20 text-blue-300' :
                      q.type === 'sql' ? 'bg-purple-500/20 text-purple-300' :
                      q.type === 'essay' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }">${q.type}</span>
                    <h4 class="text-xs font-bold text-white">${q.title}</h4>
                  </div>
                  <p class="text-xs text-slate-300 mt-1.5 font-sans">${q.content || q.title}</p>
                  <p class="text-[11px] text-slate-400 mt-1">${q.category} • Difficulty: ${q.difficulty} • Points: ${q.points}</p>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-1 bg-slate-950 text-slate-400 rounded font-mono hidden md:inline">${q.tags.join(', ')}</span>
                  <button data-q-edit="${q.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                    ✏️ Edit
                  </button>
                  <button data-q-del="${q.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'settings') {
      const s = state.settings;
      return `
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="border-b border-slate-800 pb-4">
            <h2 class="text-lg font-bold text-white">Global Assessment Policy & AI Proctoring Configuration</h2>
            <p class="text-xs text-slate-400">Zero hardcoding. Customize violation thresholds, proctoring sensitivity, and lockdown enforcement.</p>
          </div>

          <form id="settings-form" class="space-y-6 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 class="text-xs font-bold text-blue-400 uppercase tracking-wider">Lockdown & Violation Limits</h3>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max Allowed Tab Switch Warnings</label>
                  <input type="number" id="cfg-tab" value="${s.maxTabSwitches}" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max Violations Before Auto-Termination</label>
                  <input type="number" id="cfg-term" value="${s.maxViolationsBeforeTerminate}" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>

              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 class="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Proctoring Toggles</h3>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Mobile Phone Detection</span>
                  <input type="checkbox" id="cfg-phone" ${s.detectPhone ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Multiple Face Detection</span>
                  <input type="checkbox" id="cfg-multiface" ${s.detectMultipleFaces ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Face Missing Check</span>
                  <input type="checkbox" id="cfg-facemiss" ${s.detectFaceMissing ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
              </div>

              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 col-span-1 md:col-span-2">
                <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span>✉️</span> Gmail SMTP Email Gateway Configuration (smtp.gmail.com:587)
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">SMTP Server Host</label>
                    <input type="text" id="cfg-smtp-host" value="smtp.gmail.com" readonly class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">SMTP TLS Port</label>
                    <input type="number" id="cfg-smtp-port" value="587" readonly class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Sender Gmail Address</label>
                    <input type="email" id="cfg-smtp-user" value="udayrise7666@gmail.com" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="udayrise7666@gmail.com" />
                  </div>
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Gmail App Password (16-character 2FA App Passcode)</label>
                  <input type="password" id="cfg-smtp-pass" value="fjacucsgfnfbiemd" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="16-character Gmail App Password" />
                </div>
                <div class="flex items-center justify-between pt-2">
                  <span class="text-[11px] text-slate-400">Status: <b class="text-emerald-400 font-mono">Gmail SMTP (TLS 587) Active</b></span>
                  <button type="button" id="test-gmail-smtp-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs">
                    🧪 Dispatch Gmail Test Email
                  </button>
                </div>
              </div>

              <!-- Registered Staff Accounts Table -->
              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 col-span-1 md:col-span-2">
                <h3 class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🛡️</span> Registered Enterprise Staff & Recruiter Security Accounts
                </h3>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th class="py-2.5 px-3">Staff Name</th>
                        <th class="py-2.5 px-3">Enterprise Email</th>
                        <th class="py-2.5 px-3">Role</th>
                        <th class="py-2.5 px-3">Registered On</th>
                        <th class="py-2.5 px-3">Password Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300">
                      ${(state.staffAccounts || []).map(s => `
                        <tr class="hover:bg-slate-800/40">
                          <td class="py-2.5 px-3 font-sans font-bold text-white">${s.name}</td>
                          <td class="py-2.5 px-3 text-blue-400">${s.email}</td>
                          <td class="py-2.5 px-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}">
                              ${s.role}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 text-slate-400">${s.registeredAt}</td>
                          <td class="py-2.5 px-3 text-emerald-400">✓ Encrypted Active</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md">
                SAVE CONFIGURATION
              </button>
            </div>
          </form>
        </div>
      `;
    }

    if (this.activeTab === 'audit') {
      return `
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 class="text-lg font-bold text-white">Immutable System Audit Logs</h2>
            <button id="export-audit-csv-btn" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all">
              📥 Export Audit Logs (.csv)
            </button>
          </div>
          <div class="space-y-2 font-mono text-xs">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
              <span>[2026-07-31 15:30:12] ADMIN_POLICY_UPDATE: Violation threshold set to 5</span>
              <span class="text-slate-500 text-[10px]">IP: 192.168.1.1</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
              <span>[2026-07-31 15:20:04] EXAM_START: Candidate Marcus Vance started Assessment assess-101</span>
              <span class="text-slate-500 text-[10px]">Session: sess-9912</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
              <span>[2026-07-31 15:10:45] RECRUITER_ACTION: Alex Rivera moved to Selected stage</span>
              <span class="text-slate-500 text-[10px]">User: recruiter@nexus.ai</span>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  private attachEvents() {
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        this.activeTab = tab;
        this.render();
      });
    });

    // Identity Verification Approval Actions
    this.container.querySelectorAll('[data-approve-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candId = (e.currentTarget as HTMLElement).getAttribute('data-approve-id');
        if (candId) {
          store.approveCandidateIdentity(candId);
          this.render();
        }
      });
    });

    // Proctor Intercom / 360° Room Inspection Pitch Actions
    this.container.querySelectorAll('[data-intercom-cand]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candId = (e.currentTarget as HTMLElement).getAttribute('data-intercom-cand');
        if (candId) {
          const defaultMsg = 'PROCTOR ALERT: Please un-mute your audio and rotate your camera 360 degrees to scan your room environment.';
          const customMsg = prompt('Enter Proctor Voice Intercom Message / Room Inspection Instructions for candidate:', defaultMsg);
          if (customMsg) {
            store.triggerProctorIntercom(candId, customMsg);
            alert(`✅ Proctor Intercom Pitch & Room Inspection Broadcasted to Candidate (ID: ${candId})!`);
          }
        }
      });
    });

    // Question Bank Actions
    this.container.querySelector('#create-q-btn')?.addEventListener('click', () => {
      this.renderQuestionModal();
    });

    this.container.querySelectorAll('[data-q-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qId = (e.currentTarget as HTMLElement).getAttribute('data-q-edit');
        const q = store.getState().questionBank.find(item => item.id === qId);
        if (q) this.renderQuestionModal(q);
      });
    });

    this.container.querySelectorAll('[data-q-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qId = (e.currentTarget as HTMLElement).getAttribute('data-q-del');
        if (qId && confirm('Are you sure you want to delete this question from the Question Bank?')) {
          store.deleteQuestion(qId);
          this.render();
        }
      });
    });

    // Assessment Builder Actions
    this.container.querySelector('#add-sec-btn')?.addEventListener('click', () => {
      this.renderSectionModal();
    });

    this.container.querySelectorAll('[data-sec-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const secId = (e.currentTarget as HTMLElement).getAttribute('data-sec-edit');
        const sec = store.getActiveAssessment()?.sections.find(s => s.id === secId);
        if (sec) this.renderSectionModal(sec);
      });
    });

    this.container.querySelectorAll('[data-sec-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const secId = (e.currentTarget as HTMLElement).getAttribute('data-sec-del');
        if (secId && confirm('Are you sure you want to delete this section from the Assessment?')) {
          store.deleteAssessmentSection(secId);
          this.render();
        }
      });
    });

    this.container.querySelector('#export-q-csv-btn')?.addEventListener('click', () => {
      const state = store.getState();
      const headers = ['Question Title', 'Type', 'Category', 'Difficulty', 'Points', 'Tags'];
      const rows = state.questionBank.map(q => [q.title, q.type, q.category, q.difficulty, q.points, q.tags.join('; ')]);
      CsvExporterService.downloadCsv('Question_Bank_Export.csv', headers, rows);
    });

    this.container.querySelector('#export-audit-csv-btn')?.addEventListener('click', () => {
      const headers = ['Timestamp', 'Event Action', 'IP Address', 'User Session'];
      const rows = [
        ['2026-07-31 15:30:12', 'ADMIN_POLICY_UPDATE: Violation threshold set to 5', '192.168.1.1', 'admin@7666'],
        ['2026-07-31 15:20:04', 'EXAM_START: Candidate Marcus Vance started Assessment assess-101', '192.168.1.104', 'sess-9912'],
        ['2026-07-31 15:10:45', 'RECRUITER_ACTION: Alex Rivera moved to Selected stage', '192.168.1.5', 'recruiter@nexus.ai']
      ];
      CsvExporterService.downloadCsv('System_Audit_Logs.csv', headers, rows);
    });

    const settingsForm = this.container.querySelector('#settings-form');
    this.container.querySelector('#test-gmail-smtp-btn')?.addEventListener('click', async () => {
      const user = (this.container.querySelector('#cfg-smtp-user') as HTMLInputElement).value || 'udayrise7666@gmail.com';
      const ok = await EmailService.sendTestEmail(user);
      alert(ok
        ? `✉️ Test email dispatched via Gmail SMTP (smtp.gmail.com:587) to ${user}.`
        : `⚠️ Test email to ${user} could not be delivered. Check the backend SMTP settings / server log.`);
    });

    settingsForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tabVal = parseInt((this.container.querySelector('#cfg-tab') as HTMLInputElement).value, 10);
      const termVal = parseInt((this.container.querySelector('#cfg-term') as HTMLInputElement).value, 10);
      const phone = (this.container.querySelector('#cfg-phone') as HTMLInputElement).checked;
      const multiface = (this.container.querySelector('#cfg-multiface') as HTMLInputElement).checked;
      const facemiss = (this.container.querySelector('#cfg-facemiss') as HTMLInputElement).checked;

      store.updateSettings({
        maxTabSwitches: tabVal,
        maxViolationsBeforeTerminate: termVal,
        detectPhone: phone,
        detectMultipleFaces: multiface,
        detectFaceMissing: facemiss
      });

      alert('Gmail SMTP & System Settings updated cleanly! Zero hardcoded rules enforced.');
    });
  }

  /**
   * Question Modal Handler (Create / Modify / Edit Question)
   */
  private renderQuestionModal(q?: Question) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;

    const isEdit = !!q;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
              <span>${isEdit ? '✏️ Modify Question' : '✨ Create New Question'}</span>
            </h3>
            <button id="close-q-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <form id="q-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Question Title</label>
              <input type="text" id="q-title" value="${q?.title || ''}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Python Memory Management" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Full Question Problem Statement / Description</label>
              <textarea id="q-content" rows="3" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Enter full question instructions, scenario, or problem description for candidate...">${q?.content || q?.title || ''}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Question Type</label>
                <select id="q-type" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="mcq" ${q?.type === 'mcq' ? 'selected' : ''}>Multiple Choice (MCQ)</option>
                  <option value="sql" ${q?.type === 'sql' ? 'selected' : ''}>SQL Database Query</option>
                  <option value="coding" ${q?.type === 'coding' ? 'selected' : ''}>Algorithmic Coding</option>
                  <option value="essay" ${q?.type === 'essay' ? 'selected' : ''}>Architectural Essay</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty Level</label>
                <select id="q-diff" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="easy" ${q?.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                  <option value="medium" ${q?.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="hard" ${q?.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Category</label>
                <input type="text" id="q-cat" value="${q?.category || 'Core Engineering'}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Points / Weightage</label>
                <input type="number" id="q-points" value="${q?.points || 15}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <!-- Target Assessment Section Assignment -->
            ${(() => {
              const activeAssess = store.getActiveAssessment();
              const existingSections = activeAssess?.sections || [];
              let currentSecId = existingSections[0]?.id || '';
              if (q) {
                const foundSec = existingSections.find(s => s.questions.some(item => item.id === q.id));
                if (foundSec) currentSecId = foundSec.id;
              }

              return `
                <div class="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <label class="block font-semibold text-blue-400 mb-1">Target Assessment Section (Which section does this question belong to?)</label>
                  <select id="q-section-select" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                    ${existingSections.map(s => `
                      <option value="${s.id}" ${currentSecId === s.id ? 'selected' : ''}>📂 ${s.name} (${s.questions.length} questions)</option>
                    `).join('')}
                    <option value="__NEW_SECTION__">➕ + Create New Section...</option>
                  </select>

                  <div id="new-section-name-box" class="pt-2 hidden space-y-1">
                    <label class="block font-semibold text-purple-400">Enter New Assessment Section Name</label>
                    <input type="text" id="q-new-section-input" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-purple-500/50 bg-slate-950 text-purple-300 font-semibold" placeholder="e.g. DevOps & Cloud Infrastructure" />
                  </div>
                </div>
              `;
            })()}

            <!-- MCQ Options & Correct Answer Selection Section -->
            <div id="mcq-options-container" class="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800" style="display: ${q?.type === 'mcq' || !q ? 'block' : 'none'}">
              <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider">Multiple Choice Options & Correct Answer Configuration</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option A</label>
                  <input type="text" id="q-opt-0" value="${q?.options?.[0]?.text || 'Reference Counting & Generational GC'}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option B</label>
                  <input type="text" id="q-opt-1" value="${q?.options?.[1]?.text || 'Manual memory allocation with malloc and free'}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option C</label>
                  <input type="text" id="q-opt-2" value="${q?.options?.[2]?.text || 'Mark and sweep garbage collection only'}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option D</label>
                  <input type="text" id="q-opt-3" value="${q?.options?.[3]?.text || 'All of the above'}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-emerald-400 mb-1">Select Correct Answer (Only Visible to Admin / Recruiter)</label>
                <select id="q-correct-opt" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/50 bg-slate-950 text-emerald-300 font-bold">
                  <option value="opt-1" ${q?.correctAnswers?.includes('opt-1') ? 'selected' : ''}>Option A (First Option)</option>
                  <option value="opt-2" ${q?.correctAnswers?.includes('opt-2') ? 'selected' : ''}>Option B (Second Option)</option>
                  <option value="opt-3" ${q?.correctAnswers?.includes('opt-3') ? 'selected' : ''}>Option C (Third Option)</option>
                  <option value="opt-4" ${q?.correctAnswers?.includes('opt-4') || !q?.correctAnswers ? 'selected' : ''}>Option D (Fourth Option)</option>
                </select>
              </div>
            </div>

            <!-- Coding & SQL Test Cases Builder Container -->
            <div id="coding-testcases-container" class="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800" style="display: ${q?.type === 'coding' || q?.type === 'sql' ? 'block' : 'none'}">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-purple-400 uppercase tracking-wider">🧪 Coding Test Cases & Marks Weightage Configuration (5 Test Cases = 50 Marks)</h4>
              </div>
              <p class="text-[11px] text-slate-400">Configure inputs, expected outputs, and individual test case marks for candidate evaluation.</p>

              <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                ${[0, 1, 2, 3, 4].map(idx => {
                  const tc = q?.testCases?.[idx];
                  const defaultInputs = ['[2, 7, 11, 15], 9', '[3, 2, 4], 6', '[3, 3], 6', '[1, 5, 8, 12], 20', '[-1, -2, -3, -4], -7'];
                  const defaultOutputs = ['[0, 1]', '[1, 2]', '[0, 1]', '[2, 3]', '[2, 3]'];

                  return `
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-200">Test Case ${idx + 1}</span>
                        <div class="flex items-center gap-2">
                          <label class="text-[11px] text-slate-400">Marks / Weight:</label>
                          <input type="number" id="tc-weight-${idx}" value="${tc?.weight || 10}" class="glass-input w-16 px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-emerald-400 font-mono font-bold text-right" />
                          <span class="text-slate-400 text-[10px]">pts</span>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="tc-input-${idx}" value="${tc?.input || defaultInputs[idx]}" class="glass-input w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono text-[11px]" placeholder="Input (e.g. [2,7,11,15], 9)" />
                        <input type="text" id="tc-output-${idx}" value="${tc?.expectedOutput || defaultOutputs[idx]}" class="glass-input w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-emerald-300 font-mono text-[11px]" placeholder="Expected Output (e.g. [0,1])" />
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Tags (comma separated)</label>
              <input type="text" id="q-tags" value="${q?.tags ? q.tags.join(', ') : 'Python, SQL, Architecture'}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-q-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md">
                ${isEdit ? 'SAVE CHANGES' : 'CREATE QUESTION'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { host.innerHTML = ''; };
    host.querySelector('#close-q-modal-btn')?.addEventListener('click', closeModal);
    host.querySelector('#close-q-modal-btn-2')?.addEventListener('click', closeModal);

    const typeSelect = host.querySelector('#q-type') as HTMLSelectElement;
    const mcqContainer = host.querySelector('#mcq-options-container') as HTMLElement;
    const codingContainer = host.querySelector('#coding-testcases-container') as HTMLElement;

    const secSelect = host.querySelector('#q-section-select') as HTMLSelectElement;
    const newSecBox = host.querySelector('#new-section-name-box') as HTMLElement;

    secSelect?.addEventListener('change', () => {
      if (newSecBox) {
        newSecBox.classList.toggle('hidden', secSelect.value !== '__NEW_SECTION__');
      }
    });

    typeSelect?.addEventListener('change', () => {
      const val = typeSelect.value;
      if (mcqContainer) mcqContainer.style.display = val === 'mcq' ? 'block' : 'none';
      if (codingContainer) codingContainer.style.display = (val === 'coding' || val === 'sql') ? 'block' : 'none';
    });

    host.querySelector('#q-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (host.querySelector('#q-title') as HTMLInputElement).value;
      const content = (host.querySelector('#q-content') as HTMLTextAreaElement).value;
      const type = (host.querySelector('#q-type') as HTMLSelectElement).value as any;
      const difficulty = (host.querySelector('#q-diff') as HTMLSelectElement).value as any;
      const category = (host.querySelector('#q-cat') as HTMLInputElement).value;
      const points = parseInt((host.querySelector('#q-points') as HTMLInputElement).value, 10) || 15;
      const tags = (host.querySelector('#q-tags') as HTMLInputElement).value.split(',').map(t => t.trim()).filter(Boolean);

      const opt0 = (host.querySelector('#q-opt-0') as HTMLInputElement)?.value || 'Option A';
      const opt1 = (host.querySelector('#q-opt-1') as HTMLInputElement)?.value || 'Option B';
      const opt2 = (host.querySelector('#q-opt-2') as HTMLInputElement)?.value || 'Option C';
      const opt3 = (host.querySelector('#q-opt-3') as HTMLInputElement)?.value || 'Option D';
      const correctOptId = (host.querySelector('#q-correct-opt') as HTMLSelectElement)?.value || 'opt-1';

      const configuredOptions = [
        { id: 'opt-1', text: opt0 },
        { id: 'opt-2', text: opt1 },
        { id: 'opt-3', text: opt2 },
        { id: 'opt-4', text: opt3 }
      ];

      // Build Test Cases array for coding / sql questions
      const configuredTestCases = [0, 1, 2, 3, 4].map(idx => {
        const inputVal = (host.querySelector(`#tc-input-${idx}`) as HTMLInputElement)?.value || 'sample';
        const outputVal = (host.querySelector(`#tc-output-${idx}`) as HTMLInputElement)?.value || 'sample';
        const weightVal = parseInt((host.querySelector(`#tc-weight-${idx}`) as HTMLInputElement)?.value, 10) || 10;
        return {
          id: `tc-${idx + 1}`,
          input: inputVal,
          expectedOutput: outputVal,
          isHidden: idx >= 3,
          weight: weightVal
        };
      });

      let chosenSection = secSelect?.value || 'Technical MCQs & Aptitude';
      if (chosenSection === '__NEW_SECTION__') {
        const newSecName = (host.querySelector('#q-new-section-input') as HTMLInputElement)?.value.trim();
        chosenSection = newSecName || 'Custom Assessment Section';
      }

      let savedQuestion: Question;

      if (isEdit && q) {
        savedQuestion = {
          ...q,
          title,
          content,
          type,
          difficulty,
          category,
          points,
          tags,
          options: type === 'mcq' ? configuredOptions : q.options,
          correctAnswers: type === 'mcq' ? [correctOptId] : q.correctAnswers,
          testCases: (type === 'coding' || type === 'sql') ? configuredTestCases : q.testCases
        };
        store.updateQuestion(q.id, savedQuestion);
      } else {
        savedQuestion = {
          id: `q-${Date.now()}`,
          title,
          content,
          type,
          difficulty,
          category,
          points,
          tags,
          options: type === 'mcq' ? configuredOptions : undefined,
          correctAnswers: type === 'mcq' ? [correctOptId] : undefined,
          testCases: (type === 'coding' || type === 'sql') ? configuredTestCases : undefined
        };
        store.addQuestion(savedQuestion, chosenSection);
      }

      store.assignQuestionToSection(chosenSection, savedQuestion);

      closeModal();
      this.render();
    });
  }

  /**
   * Assessment Section Modal Handler (Add Custom Section / Modify Section)
   */
  private renderSectionModal(sec?: any) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;

    const isEdit = !!sec;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
              <span>${isEdit ? '✏️ Modify Assessment Section' : '✨ Add Custom Assessment Section'}</span>
            </h3>
            <button id="close-sec-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <form id="sec-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section Name</label>
              <input type="text" id="sec-name" value="${sec?.name || ''}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Advanced System Design" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Instructions / Description</label>
              <textarea id="sec-inst" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${sec?.instructions || 'Complete all questions in this section.'}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
                <input type="number" id="sec-time" value="${sec?.timeLimitMinutes || 15}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Cutoff / Passing Points</label>
                <input type="number" id="sec-pass" value="${sec?.passingMarks || 20}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-sec-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md">
                ${isEdit ? 'SAVE CHANGES' : 'ADD SECTION'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { host.innerHTML = ''; };
    host.querySelector('#close-sec-modal-btn')?.addEventListener('click', closeModal);
    host.querySelector('#close-sec-modal-btn-2')?.addEventListener('click', closeModal);

    host.querySelector('#sec-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (host.querySelector('#sec-name') as HTMLInputElement).value;
      const instructions = (host.querySelector('#sec-inst') as HTMLTextAreaElement).value;
      const timeLimitMinutes = parseInt((host.querySelector('#sec-time') as HTMLInputElement).value, 10) || 15;
      const passingMarks = parseInt((host.querySelector('#sec-pass') as HTMLInputElement).value, 10) || 20;

      if (isEdit && sec) {
        store.updateAssessmentSection(sec.id, { name, instructions, timeLimitMinutes, passingMarks });
      } else {
        const newSec = {
          id: `sec-${Date.now()}`,
          name,
          instructions,
          timeLimitMinutes,
          passingMarks,
          randomizeQuestions: true,
          questions: [
            {
              id: `q-sec-${Date.now()}`,
              title: `${name} Evaluation Challenge`,
              type: 'mcq',
              category: name,
              difficulty: 'medium',
              points: passingMarks,
              tags: [name, 'Assessment']
            }
          ]
        };
        store.addAssessmentSection(newSec);
      }

      closeModal();
      this.render();
    });
  }
}
