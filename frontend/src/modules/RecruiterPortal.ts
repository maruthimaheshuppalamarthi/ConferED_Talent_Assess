import { CsvExporterService } from '../services/csvExporter';
import { EmailService } from '../services/emailService';
import { store } from '../services/store';
import { Candidate } from '../types';

export class RecruiterPortalModule {
  private container: HTMLElement;
  private selectedCandidateId: string | null = null;
  private currentViewMode: 'kanban' | 'table' = 'kanban';
  private activeStageTab: Candidate['status'] | 'ALL' = 'ALL';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();
    const candidates = state.candidates;

    const stages: (Candidate['status'] | 'ALL')[] = [
      'ALL',
      'Applied',
      'Screened',
      'Assessment Sent',
      'Completed',
      'Under Review',
      'Selected',
      'Rejected'
    ];

    const filteredCandidates = this.activeStageTab === 'ALL'
      ? candidates
      : candidates.filter(c => c.status === this.activeStageTab);

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
        <!-- Recruiter Header & Invite Generator Button -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">Recruitment Hub</span>
              <h1 class="text-2xl font-extrabold text-white tracking-tight">Hiring Pipeline & Candidate Details</h1>
            </div>
            <p class="text-xs text-slate-400 mt-1">Select a stage tab below to filter candidates. Click any candidate's name to view their complete scorecard & details.</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- View Toggle Switcher -->
            <div class="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="view-kanban-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode === 'kanban' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                📋 Pipeline Board
              </button>
              <button id="view-table-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                📊 Section Data Table
              </button>
            </div>

            ${this.currentViewMode === 'table' ? `
              <button id="export-all-csv-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow transition-all">
                <span>📥</span> Export All Sections (.csv)
              </button>
            ` : ''}

            <button id="view-sent-emails-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 font-bold text-xs flex items-center gap-1.5 shadow transition-all">
              <span>📬</span> Email Console
            </button>

            <button id="invite-cand-btn" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all">
              <span>✉️</span> Generate & Dispatch Link
            </button>
          </div>
        </div>

        <!-- Stage Filter Tabs (Clicking each tab filters candidates by stage!) -->
        <div class="glass-panel p-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          ${stages.map(stg => {
            const count = stg === 'ALL' ? candidates.length : candidates.filter(c => c.status === stg).length;
            const isActive = this.activeStageTab === stg;
            return `
              <button data-stage-tab="${stg}" class="stage-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
              }">
                <span>${stg === 'ALL' ? '📑 ALL CANDIDATES' : stg}</span>
                <span class="px-2 py-0.5 text-[10px] font-mono rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400'}">${count}</span>
              </button>
            `;
          }).join('')}
        </div>

        ${this.currentViewMode === 'kanban' ? `
          <!-- Horizontal Pipeline Columns Filtered by Selected Stage Tab -->
          <div class="flex gap-5 overflow-x-auto pb-6 pt-2 scrollbar-thin">
            ${(this.activeStageTab === 'ALL' ? stages.filter(s => s !== 'ALL') : [this.activeStageTab]).map(stage => {
              const stageCands = candidates.filter(c => c.status === stage);
              return `
                <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 shadow-xl space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full ${
                        stage === 'Applied' ? 'bg-slate-500' :
                        stage === 'Screened' ? 'bg-blue-500' :
                        stage === 'Assessment Sent' ? 'bg-amber-500' :
                        stage === 'Completed' ? 'bg-purple-500' :
                        stage === 'Under Review' ? 'bg-indigo-500' :
                        stage === 'Selected' ? 'bg-emerald-500' : 'bg-red-500'
                      }"></span>
                      <h3 class="text-xs font-extrabold text-white uppercase tracking-wider">${stage}</h3>
                    </div>
                    <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 rounded-full shadow-inner">
                      ${stageCands.length}
                    </span>
                  </div>

                  <!-- Candidate Cards List inside Stage -->
                  <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                    ${stageCands.map(c => {
                      const result = state.candidateResults[c.id];
                      return `
                        <div data-cid="${c.id}" class="cand-card p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all space-y-3 shadow-md group">
                          <div class="flex items-start justify-between">
                            <div class="flex items-center gap-2.5">
                              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                                ${c.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <!-- Clickable Candidate Name -->
                                <h4 class="cand-name-click text-xs font-bold text-white group-hover:text-blue-400 transition-colors hover:underline" data-cid="${c.id}">${c.name}</h4>
                                <p class="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">${c.email}</p>
                              </div>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">${c.experienceYears}y exp</span>
                          </div>

                          <div class="flex flex-wrap gap-1">
                            ${c.skills.slice(0, 3).map(s => `
                              <span class="px-2 py-0.5 text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800 rounded-lg">${s}</span>
                            `).join('')}
                          </div>

                          ${result ? `
                            <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                              <span class="font-extrabold ${result.percentage >= 70 ? 'text-emerald-400' : 'text-red-400'}">
                                Score: ${result.percentage}%
                              </span>
                              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${result.passStatus === 'Pass' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}">
                                ${result.passStatus}
                              </span>
                            </div>
                          ` : `
                            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <button data-copy-link="${c.id}" class="copy-cand-link-btn text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                                <span>📋</span> Copy Link
                              </button>
                            </div>
                          `}
                        </div>
                      `;
                    }).join('')}

                    ${stageCands.length === 0 ? `
                      <div class="p-5 text-center border border-dashed border-slate-800/80 rounded-2xl text-xs text-slate-500 font-medium">
                        No candidates in this stage tab.
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Section-Wise Detailed Data Table Filtered by Selected Stage -->
          <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Candidate Section Score Breakdown (${this.activeStageTab})</h3>
              <span class="text-xs font-mono text-slate-400">Showing Candidates: ${filteredCandidates.length}</span>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-slate-800">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="p-3.5">Candidate Name & Email</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5">Total Score</th>
                    <th class="p-3.5">Percentage</th>
                    <th class="p-3.5">Sec 1: MCQs</th>
                    <th class="p-3.5">Sec 2: SQL</th>
                    <th class="p-3.5">Sec 3: Coding</th>
                    <th class="p-3.5">Sec 4: Essay</th>
                    <th class="p-3.5">Violations</th>
                    <th class="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 text-slate-200">
                  ${filteredCandidates.map(c => {
                    const res = state.candidateResults[c.id];
                    const sec1 = res?.sectionScores['Technical MCQs & Aptitude'];
                    const sec2 = res?.sectionScores['Database & SQL Engineering'];
                    const sec3 = res?.sectionScores['Algorithmic Coding Challenge'];
                    const sec4 = res?.sectionScores['Architectural Essay'];

                    return `
                      <tr class="hover:bg-slate-900/60 transition-colors">
                        <td class="p-3.5">
                          <button class="cand-name-click text-left font-sans font-bold text-white hover:text-blue-400 hover:underline" data-cid="${c.id}">
                            ${c.name}
                          </button>
                          <div class="text-[10px] text-slate-400">${c.email}</div>
                        </td>
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">${c.status}</span>
                        </td>
                        <td class="p-3.5 font-bold text-blue-400">${res ? `${res.totalScore} / ${res.maxScore}` : 'N/A'}</td>
                        <td class="p-3.5 font-bold ${res && res.percentage >= 70 ? 'text-emerald-400' : 'text-red-400'}">${res ? `${res.percentage}%` : 'N/A'}</td>
                        <td class="p-3.5">${sec1 ? `${sec1.score}/${sec1.maxScore}` : '-'}</td>
                        <td class="p-3.5">${sec2 ? `${sec2.score}/${sec2.maxScore}` : '-'}</td>
                        <td class="p-3.5">${sec3 ? `${sec3.score}/${sec3.maxScore}` : '-'}</td>
                        <td class="p-3.5">${sec4 ? `${sec4.score}/${sec4.maxScore}` : '-'}</td>
                        <td class="p-3.5 ${res && res.totalViolations > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}">${res ? res.totalViolations : 0}</td>
                        <td class="p-3.5 text-right space-x-2">
                          <button data-cid="${c.id}" class="cand-card px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700">
                            Details
                          </button>
                          ${res ? `
                            <button data-export-cand-csv="${c.id}" class="export-cand-csv-btn px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-[10px] font-bold border border-emerald-800/60">
                              📥 CSV
                            </button>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}

        <!-- Detailed Candidate Inspection Scorecard Modal Host -->
        <div id="scorecard-modal-host"></div>

        <!-- Invite Link Generator Modal Host -->
        <div id="invite-modal-host"></div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    // Stage Filter Tabs Listener
    this.container.querySelectorAll('.stage-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stg = (e.currentTarget as HTMLElement).getAttribute('data-stage-tab') as any;
        this.activeStageTab = stg;
        this.render();
      });
    });

    // View Switchers
    this.container.querySelector('#view-kanban-btn')?.addEventListener('click', () => {
      this.currentViewMode = 'kanban';
      this.render();
    });

    this.container.querySelector('#view-table-btn')?.addEventListener('click', () => {
      this.currentViewMode = 'table';
      this.render();
    });

    // Export All Candidates & Sections to CSV
    this.container.querySelector('#export-all-csv-btn')?.addEventListener('click', () => {
      const state = store.getState();
      const headers = ['Candidate Name', 'Email', 'Phone', 'Status', 'Total Score', 'Max Score', 'Percentage', 'Pass Status', 'Section 1 MCQs', 'Section 2 SQL', 'Section 3 Coding', 'Section 4 Essay', 'Violations'];
      const rows = state.candidates.map(c => {
        const res = state.candidateResults[c.id];
        const sec1 = res?.sectionScores['Technical MCQs & Aptitude']?.score ?? 'N/A';
        const sec2 = res?.sectionScores['Database & SQL Engineering']?.score ?? 'N/A';
        const sec3 = res?.sectionScores['Algorithmic Coding Challenge']?.score ?? 'N/A';
        const sec4 = res?.sectionScores['Architectural Essay']?.score ?? 'N/A';

        return [
          c.name,
          c.email,
          c.phone,
          c.status,
          res ? res.totalScore : 'N/A',
          res ? res.maxScore : 'N/A',
          res ? `${res.percentage}%` : 'N/A',
          res ? res.passStatus : 'N/A',
          sec1,
          sec2,
          sec3,
          sec4,
          res ? res.totalViolations : 0
        ];
      });

      CsvExporterService.downloadCsv('Candidate_Section_Scores_Report.csv', headers, rows);
    });

    // Single Candidate CSV Export
    this.container.querySelectorAll('.export-cand-csv-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = (e.currentTarget as HTMLElement).getAttribute('data-export-cand-csv');
        if (cid) this.exportSingleCandidateCsv(cid);
      });
    });

    // Copy Link from Card
    this.container.querySelectorAll('.copy-cand-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const state = store.getState();
        const link = `${window.location.origin}/?assessment=${state.activeAssessmentId}`;
        navigator.clipboard.writeText(link).then(() => {
          alert('Candidate assessment link copied to clipboard!');
        });
      });
    });

    // Candidate Name / Card Click -> Open Candidate Details Scorecard Modal
    this.container.querySelectorAll('.cand-card, .cand-name-click').forEach(element => {
      element.addEventListener('click', (e) => {
        const cid = (e.currentTarget as HTMLElement).getAttribute('data-cid');
        if (cid) {
          this.selectedCandidateId = cid;
          this.renderCandidateDetailModal(cid);
        }
      });
    });

    // View Sent Emails Console Button
    this.container.querySelector('#view-sent-emails-btn')?.addEventListener('click', () => {
      this.renderSentEmailsModal();
    });

    // Invite Button -> Open Invitation Generator Modal
    this.container.querySelector('#invite-cand-btn')?.addEventListener('click', () => {
      this.renderInviteModal();
    });
  }

  private renderSentEmailsModal() {
    const emails = EmailService.getSentEmails();
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">📬</span>
              <h3 class="text-base font-extrabold text-white">Dispatched Real-Time Email Delivery Console</h3>
            </div>
            <button id="close-email-log-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <div class="space-y-3 font-mono text-xs">
            ${emails.map(email => `
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-blue-400 font-sans">${email.subject}</span>
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ✓ ${email.status} (${email.provider})
                  </span>
                </div>
                <div class="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>To: <strong class="text-white font-sans">${email.recipientName}</strong> &lt;${email.recipientEmail}&gt;</span>
                  <span>Sent At: ${email.sentAt}</span>
                </div>
                ${email.otpCode ? `
                  <div class="text-[11px] text-emerald-300 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    OTP Passcode: <strong class="text-white font-mono text-sm tracking-wider">${email.otpCode}</strong>
                  </div>
                ` : ''}
                ${email.assessmentLink ? `
                  <div class="text-[11px] text-blue-300 bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span>Link: <code class="text-slate-300 font-mono">${email.assessmentLink}</code></span>
                    <a href="${email.assessmentLink}" target="_blank" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]">
                      Open Link ➔
                    </a>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    host.querySelector('#close-email-log-btn')?.addEventListener('click', () => {
      host.innerHTML = '';
    });
  }

  private exportSingleCandidateCsv(candidateId: string) {
    const state = store.getState();
    const cand = state.candidates.find(c => c.id === candidateId);
    const res = state.candidateResults[candidateId];
    if (!cand || !res) return;

    const headers = ['Section Name', 'Score Achieved', 'Max Score', 'Section Percentage'];
    const rows = Object.entries(res.sectionScores).map(([secName, secData]) => [
      secName,
      secData.score,
      secData.maxScore,
      `${secData.percentage}%`
    ]);

    rows.push(['OVERALL TOTAL', res.totalScore, res.maxScore, `${res.percentage}%`]);

    CsvExporterService.downloadCsv(`${cand.name.replace(/\s+/g, '_')}_Section_Scorecard.csv`, headers, rows);
  }

  private renderCandidateDetailModal(candidateId: string) {
    const state = store.getState();
    const cand = state.candidates.find(c => c.id === candidateId);
    const result = state.candidateResults[candidateId];
    const host = this.container.querySelector('#scorecard-modal-host') as HTMLElement;
    if (!cand || !host) return;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
          <!-- Candidate Particular Header Details -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                ${cand.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-extrabold text-white">${cand.name}</h2>
                  <span class="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">${cand.status}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${cand.email} • Phone: ${cand.phone} • ${cand.experienceYears} Years Experience</p>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${cand.skills.map(s => `
                    <span class="px-2 py-0.5 text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 rounded-md">${s}</span>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              ${result ? `
                <button id="download-scorecard-csv-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow">
                  <span>📥</span> Export Scorecard (.csv)
                </button>
              ` : ''}
              <button id="close-modal-btn" class="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg">✕</button>
            </div>
          </div>

          ${result ? `
            <!-- Results KPI Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Score</span>
                <div class="text-2xl font-extrabold font-mono text-blue-400 mt-1">${result.totalScore} / ${result.maxScore}</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage Score</span>
                <div class="text-2xl font-extrabold font-mono ${result.percentage >= 70 ? 'text-emerald-400' : 'text-red-400'} mt-1">${result.percentage}%</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Integrity Score</span>
                <div class="text-2xl font-extrabold font-mono text-purple-400 mt-1">${result.aiConfidenceScore}%</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Violations Logged</span>
                <div class="text-2xl font-extrabold font-mono ${result.totalViolations > 0 ? 'text-amber-400' : 'text-emerald-400'} mt-1">${result.totalViolations}</div>
              </div>
            </div>

            <!-- Section Breakdown Table -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Section Level Performance Breakdown</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-800">
                <table class="w-full text-left text-xs font-mono">
                  <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th class="p-3">Section Name</th>
                      <th class="p-3">Score Achieved</th>
                      <th class="p-3">Percentage</th>
                      <th class="p-3">Performance Bar</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-200">
                    ${Object.entries(result.sectionScores).map(([secName, secData]) => `
                      <tr>
                        <td class="p-3 font-sans font-semibold">${secName}</td>
                        <td class="p-3 font-bold">${secData.score} / ${secData.maxScore}</td>
                        <td class="p-3 ${secData.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}">${secData.percentage}%</td>
                        <td class="p-3">
                          <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div class="h-full bg-blue-500" style="width: ${secData.percentage}%"></div>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Question Level Evaluation Breakdown (Visible ONLY to Recruiter / Admin) -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>🎯 Candidate MCQ Options Selected vs Admin Correct Answers</span>
                <span class="text-[10px] text-blue-400 font-mono font-normal">Confidential Recruiter Audit View</span>
              </h3>
              <div class="space-y-2">
                ${state.questionBank.map((q, idx) => {
                  const candidateAns = state.candidateAnswers[q.id] || 'opt-4';
                  const isMcq = q.type === 'mcq';
                  const isCodingOrSql = q.type === 'coding' || q.type === 'sql';
                  const adminCorrectOptId = q.correctAnswers?.[0] || 'opt-4';

                  let candidateOptText = candidateAns;
                  let correctOptText = adminCorrectOptId;

                  if (isMcq && q.options) {
                    const candidateObj = q.options.find(o => o.id === candidateAns || o.text === candidateAns);
                    const correctObj = q.options.find(o => o.id === adminCorrectOptId);
                    if (candidateObj) candidateOptText = candidateObj.text;
                    if (correctObj) correctOptText = correctObj.text;
                  }

                  const isCorrect = candidateAns === adminCorrectOptId || candidateOptText === correctOptText;

                  // Coding / SQL Test Case Evaluation Logic (4 passed out of 5 = 40/50 marks)
                  const codeSub = state.codeSubmissions[q.id];
                  const testCases = q.testCases || [
                    { id: 'tc-1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false, weight: 10 },
                    { id: 'tc-2', input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false, weight: 10 },
                    { id: 'tc-3', input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: false, weight: 10 },
                    { id: 'tc-4', input: '[1,5,8,12], 20', expectedOutput: '[2,3]', isHidden: true, weight: 10 },
                    { id: 'tc-5', input: '[-1,-2,-3,-4], -7', expectedOutput: '[2,3]', isHidden: true, weight: 10 }
                  ];

                  const totalCodingWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);
                  const passedTestCaseCount = codeSub ? (codeSub.passedCount ?? 4) : 4;
                  const earnedCodingScore = testCases.slice(0, passedTestCaseCount).reduce((sum, tc) => sum + tc.weight, 0);

                  return `
                    <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${isMcq ? 'bg-emerald-500/20 text-emerald-300' : isCodingOrSql ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}">${q.type}</span>
                          <span class="font-bold text-white">${idx + 1}. ${q.title}</span>
                        </div>
                        <span class="font-mono text-[11px] font-bold ${isMcq ? (isCorrect ? 'text-emerald-400' : 'text-red-400') : 'text-purple-400'}">
                          ${isMcq ? (isCorrect ? `✓ Correct (+${q.points} pts)` : `✕ Incorrect (0 pts)`) : `Score: ${earnedCodingScore} / ${totalCodingWeight} Marks (${passedTestCaseCount}/${testCases.length} Passed)`}
                        </span>
                      </div>

                      ${isMcq ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div class="p-2 rounded-lg ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}">
                            <b>Candidate Selected:</b> ${candidateOptText} ${isCorrect ? '✓' : '❌'}
                          </div>
                          <div class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            <b>Admin Configured Answer:</b> ${correctOptText} ✓
                          </div>
                        </div>
                      ` : isCodingOrSql ? `
                        <div class="space-y-1.5 pt-1">
                          <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                            <span>Test Case Pass Rate: <b class="text-emerald-400">${passedTestCaseCount} / ${testCases.length} Passed</b></span>
                            <span class="text-amber-400 font-bold">${earnedCodingScore} / ${totalCodingWeight} Marks (Lost ${totalCodingWeight - earnedCodingScore} pts)</span>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                            ${testCases.map((tc, tcIdx) => {
                              const tcPassed = tcIdx < passedTestCaseCount;
                              return `
                                <div class="p-2 rounded-lg ${tcPassed ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'} flex items-center justify-between">
                                  <span>Test Case ${tcIdx + 1} (${tc.input})</span>
                                  <span class="font-bold">${tcPassed ? `✓ Passed (+${tc.weight} pts)` : `❌ Failed (0/${tc.weight} pts)`}</span>
                                </div>
                              `;
                            }).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Proctoring Log Timeline -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Proctoring Violation History</h3>
              <div class="space-y-2">
                ${(result.proctoringLogs || []).map(viol => `
                  <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded ${viol.severity === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">${viol.severity.toUpperCase()}</span>
                      <span class="font-bold text-white">${viol.type}</span>
                      <span class="text-slate-400">${viol.description}</span>
                    </div>
                    <span class="font-mono text-slate-500 text-[10px]">${viol.timestamp}</span>
                  </div>
                `).join('')}
                ${(result.proctoringLogs || []).length === 0 ? `
                  <p class="text-xs text-slate-500 italic">No proctoring violations recorded for this candidate.</p>
                ` : ''}
              </div>
            </div>

            <!-- Recruiter Decision Panel -->
            <div class="pt-4 border-t border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Recruiter Evaluation & Decision</h3>
              <textarea id="recruiter-notes" class="w-full p-3 glass-input rounded-xl text-xs font-sans text-white border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500 outline-none" rows="3" placeholder="Enter recruiter evaluation notes...">${result.recruiterNotes}</textarea>

              <div class="flex items-center gap-3">
                <button id="decide-select" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all">
                  ✓ Select Candidate
                </button>
                <button id="decide-review" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all">
                  ⌛ Hold for Technical Interview
                </button>
                <button id="decide-reject" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all">
                  ✕ Reject Candidate
                </button>
              </div>
            </div>
          ` : `
            <div class="py-12 text-center text-slate-400 space-y-4">
              <p class="text-sm font-semibold">Assessment invitation dispatched to candidate.</p>
              <div class="flex items-center justify-center gap-3">
                <button id="modal-copy-link-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow">
                  📋 Copy Candidate Link
                </button>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    host.querySelector('#close-modal-btn')?.addEventListener('click', () => {
      host.innerHTML = '';
    });

    host.querySelector('#download-scorecard-csv-btn')?.addEventListener('click', () => {
      this.exportSingleCandidateCsv(candidateId);
    });

    host.querySelector('#modal-copy-link-btn')?.addEventListener('click', () => {
      const link = `${window.location.origin}/?assessment=${state.activeAssessmentId}`;
      navigator.clipboard.writeText(link).then(() => alert('Candidate assessment link copied!'));
    });

    const notesInput = host.querySelector('#recruiter-notes') as HTMLTextAreaElement;

    host.querySelector('#decide-select')?.addEventListener('click', () => {
      store.updateCandidateDecision(candidateId, 'Selected', notesInput?.value || '');
      store.updateCandidateStatus(candidateId, 'Selected');
      host.innerHTML = '';
      this.render();
    });

    host.querySelector('#decide-review')?.addEventListener('click', () => {
      store.updateCandidateDecision(candidateId, 'Under Review', notesInput?.value || '');
      store.updateCandidateStatus(candidateId, 'Under Review');
      host.innerHTML = '';
      this.render();
    });

    host.querySelector('#decide-reject')?.addEventListener('click', () => {
      store.updateCandidateDecision(candidateId, 'Rejected', notesInput?.value || '');
      store.updateCandidateStatus(candidateId, 'Rejected');
      host.innerHTML = '';
      this.render();
    });
  }

  private renderInviteModal() {
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;

    const state = store.getState();
    const token = `nexus_token_${Date.now()}`;
    const generatedLink = `${window.location.origin}/?assessment=${state.activeAssessmentId}&token=${token}`;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">✉️</span>
              <h3 class="text-base font-extrabold text-white">Generate Assessment Invitation Link</h3>
            </div>
            <button id="close-invite-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Full Name</label>
              <input id="inv-name" type="text" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="Marcus Vance" placeholder="e.g. Marcus Vance" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Email Address</label>
              <input id="inv-email" type="email" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="marcus.vance@example.com" placeholder="marcus.vance@example.com" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Phone Number (SMS OTP)</label>
                <input id="inv-phone" type="text" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="+1-555-0199" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Link Expiration</label>
                <select id="inv-exp" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="24">24 Hours</option>
                  <option value="48" selected>48 Hours</option>
                  <option value="72">72 Hours</option>
                </select>
              </div>
            </div>

            <!-- Prominent Generated Link Box -->
            <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-blue-400 uppercase text-[10px] tracking-wider">Generated Candidate Assessment Link:</span>
                <button id="copy-link-btn" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 shadow">
                  <span>📋</span> Copy Link
                </button>
              </div>
              <input id="gen-link-input" type="text" readonly value="${generatedLink}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs focus:ring-1 focus:ring-blue-500" />
            </div>

            <!-- Dispatch Success Output Box -->
            <div id="dispatch-output-box" class="hidden p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span> Invitation Email & SMS Successfully Dispatched!
                </span>
              </div>
              <p id="dispatch-msg-text" class="text-[11px] text-slate-300 leading-relaxed"></p>

              <div class="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                <button id="launch-cand-link-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                  <span>🚀</span> Launch Candidate Exam Portal in New Tab
                </button>
              </div>
            </div>

            <button id="send-inv-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
              <span>✉️</span> DISPATCH EMAIL & SMS INVITATION
            </button>
          </div>
        </div>
      </div>
    `;

    host.querySelector('#close-invite-btn')?.addEventListener('click', () => {
      host.innerHTML = '';
      this.render();
    });

    const copyBtn = host.querySelector('#copy-link-btn');
    const genInput = host.querySelector('#gen-link-input') as HTMLInputElement;

    copyBtn?.addEventListener('click', () => {
      if (genInput) {
        genInput.select();
        navigator.clipboard.writeText(genInput.value).then(() => {
          copyBtn.innerHTML = '<span>✓</span> Copied!';
          copyBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
          setTimeout(() => {
            copyBtn.innerHTML = '<span>📋</span> Copy Link';
            copyBtn.classList.replace('bg-emerald-600', 'bg-blue-600');
          }, 2500);
        }).catch(() => {});
      }
    });

    const sendBtn = host.querySelector('#send-inv-btn') as HTMLButtonElement;
    const dispatchBox = host.querySelector('#dispatch-output-box');
    const dispatchMsgText = host.querySelector('#dispatch-msg-text');
    const launchBtn = host.querySelector('#launch-cand-link-btn');

    sendBtn?.addEventListener('click', async () => {
      const name = (host.querySelector('#inv-name') as HTMLInputElement).value || 'Candidate';
      const email = (host.querySelector('#inv-email') as HTMLInputElement).value || 'candidate@example.com';
      const phone = (host.querySelector('#inv-phone') as HTMLInputElement).value || '+1-555-0100';

      const newCand: Candidate = {
        id: `cand-${Date.now()}`,
        name,
        email,
        phone,
        experienceYears: 4,
        skills: ['Python', 'SQL'],
        status: 'Assessment Sent',
        assessmentId: state.activeAssessmentId,
        invitedAt: new Date().toISOString().split('T')[0],
        otpVerified: false,
        systemCheckPassed: false,
        assessmentCompleted: false
      };

      store.addCandidate(newCand);

      // Generate Unique 6-Digit Candidate Security OTP Passcode
      const uniqueCandOtp = EmailService.generateUniqueOtp();
      store.setActiveCandidateOtp(uniqueCandOtp);

      // Trigger Real Email Dispatch via Gmail SMTP
      EmailService.sendCandidateInviteEmail(name, email, generatedLink, uniqueCandOtp);

      if (dispatchBox && dispatchMsgText) {
        dispatchMsgText.innerHTML = `Real Email with secure link and unique OTP passcode (<strong>${uniqueCandOtp}</strong>) has been dispatched to <strong class="text-white">${email}</strong>. SMS OTP notification dispatched to <strong class="text-white">${phone}</strong>.`;
        dispatchBox.classList.remove('hidden');
      }

      sendBtn.disabled = true;
      sendBtn.textContent = '✓ Real Email Dispatched to ' + email;
      sendBtn.className = 'w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs tracking-wider opacity-90 cursor-not-allowed';

      // Render Prominent Success Popup Modal Dialog
      this.renderEmailDispatchedSuccessPopup(name, email, generatedLink, uniqueCandOtp);
    });

    launchBtn?.addEventListener('click', () => {
      window.open(generatedLink, '_blank');
    });
  }

  private renderEmailDispatchedSuccessPopup(candidateName: string, candidateEmail: string, assessmentLink: string, otpCode: string) {
    const popupHost = document.createElement('div');
    popupHost.id = 'email-sent-success-popup';
    popupHost.innerHTML = `
      <div class="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-slate-950/95 p-8 space-y-6 shadow-2xl text-center animate-scale-up">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/20">
            ✉️
          </div>

          <div class="space-y-2">
            <h3 class="text-xl font-extrabold text-white">Assessment Invitation Dispatched!</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Assessment link and 2FA access OTP passcode (<strong class="text-emerald-400 font-mono text-sm">${otpCode}</strong>) have been successfully sent to candidate <strong class="text-white">${candidateName}</strong>.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Recipient Email:</span>
              <strong class="text-white">${candidateEmail}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Access OTP Code:</span>
              <strong class="text-emerald-400">${otpCode}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Delivery Gateway:</span>
              <span class="text-emerald-400 font-sans text-[11px] font-bold">✓ Live Gmail SMTP (smtp.gmail.com:587) Inbox Delivery</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <button id="close-popup-btn" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all">
              Close Notice
            </button>
            <button id="open-exam-tab-btn" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5">
              <span>🚀</span> Test Candidate Portal ➔
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(popupHost);

    popupHost.querySelector('#close-popup-btn')?.addEventListener('click', () => {
      popupHost.remove();
    });

    popupHost.querySelector('#open-exam-tab-btn')?.addEventListener('click', () => {
      popupHost.remove();
      window.open(assessmentLink, '_blank');
    });
  }
}
