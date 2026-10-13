import { CsvExporterService } from '../services/csvExporter';
import { authApi } from '../services/authApi';
import { CandidateRow, recruiterApi } from '../services/recruiterApi';
import { portalHomePath, router } from '../router';
import { CandidateResult } from '../types';

const STATUS_LABEL: Record<string, string> = {
  Applied: 'Applied',
  Screened: 'Screened',
  'Assessment Sent': 'Invited',
  Completed: 'Submitted',
  'Under Review': 'In review',
  Selected: 'Selected',
  Rejected: 'Rejected',
};

const statusLabel = (s: string) => STATUS_LABEL[s] || s;

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const kpi = (label: string, value: string, tone: string, subtitle = '') => `
  <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-between">
    <span class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">${label}</span>
    <div class="text-2xl font-extrabold font-mono ${tone} my-1">${value}</div>
    ${subtitle ? `<span class="text-[10px] text-slate-500 font-mono">${subtitle}</span>` : ''}
  </div>`;

/** Full-page scorecard opened from the pipeline Excel list (`/recruiter/candidates/:id`). */
export class CandidateDetailPanel {
  private container: HTMLElement;
  private candidateId: string;
  private row: CandidateRow | null = null;
  private error = '';
  private loading = true;
  private savingDecision = false;

  constructor(container: HTMLElement, candidateId: string) {
    this.container = container;
    this.candidateId = candidateId;
  }

  public render() {
    void this.load();
    this.paint();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.paint();
    try {
      this.row = await recruiterApi.candidate(this.candidateId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Could not load candidate.';
      this.row = null;
    } finally {
      this.loading = false;
      this.paint();
    }
  }

  private paint() {
    if (this.loading) {
      this.container.innerHTML = `
        <div class="max-w-5xl mx-auto py-24 text-center space-y-3">
          <div class="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-slate-400 font-mono">Loading candidate profile & assessment paper…</p>
        </div>`;
      return;
    }
    if (this.error || !this.row) {
      this.container.innerHTML = `
        <div class="max-w-5xl mx-auto py-16 px-4 space-y-4 text-center">
          <p class="text-sm text-red-400 font-semibold">${this.error || 'Candidate not found.'}</p>
          <button id="cd-back" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs">← Back to pipeline</button>
        </div>`;
      this.container.querySelector('#cd-back')?.addEventListener('click', () => router.navigate('/recruiter/candidate-assessments'));
      return;
    }

    const cand = this.row;
    const result = cand.result as CandidateResult | null | undefined;
    const isCompleted = cand.status === 'Completed' || !!result;

    this.container.innerHTML = `
      <div class="max-w-5xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="flex items-center justify-between">
          <button id="cd-back" class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Back to pipeline
          </button>
          <span class="text-xs text-slate-500 font-mono">ID: ${esc(cand.id)}</span>
        </div>

        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 bg-slate-950/80">
          <!-- Candidate Header Profile -->
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div class="flex items-start gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                ${cand.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CA'}
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h1 class="text-2xl font-extrabold text-white tracking-tight">${esc(cand.name)}</h1>
                  <span class="px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                    cand.status === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    cand.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    cand.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }">
                    ${esc(statusLabel(cand.status))}
                  </span>
                  ${cand.roleTitle ? `
                    <span class="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      🎯 ${esc(cand.roleTitle)}
                    </span>` : ''}
                </div>
                <p class="text-xs text-slate-400 flex flex-wrap items-center gap-x-2">
                  <span>✉️ ${esc(cand.email)}</span>
                  <span>·</span>
                  <span>📞 ${esc(cand.phone || 'No phone')}</span>
                  <span>·</span>
                  <span>💼 ${cand.experienceYears}y experience</span>
                </p>
                ${(cand.organization || cand.source) ? `
                  <p class="text-[11px] text-slate-500">${[cand.organization, cand.source].filter(Boolean).map(v => esc(v)).join(' · ')}</p>
                ` : ''}
                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${(cand.skills || []).map(s => `
                    <span class="px-2 py-0.5 text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800 rounded-md">
                      ${esc(s)}
                    </span>`).join('')}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              ${result ? `
                <button id="cd-csv" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all">
                  📥 Export scorecard
                </button>
              ` : ''}
              ${!result ? `
                <button id="cd-reinvite" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30">
                  Resend invite
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Score Overview Section -->
          ${result ? this.scoreHtml(result) : `
            <div class="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <span class="text-2xl">⏳</span>
              <p class="text-sm font-semibold text-white">Assessment not submitted yet</p>
              <p class="text-xs text-slate-500">Candidate invite was sent on ${esc(cand.invitedAt || '—')}. Awaiting exam completion.</p>
            </div>
          `}

          <!-- Decision Action Section -->
          ${isCompleted ? this.decisionHtml(result) : ''}

          <!-- Detailed Candidate Question & Answer Review -->
          ${this.paperHtml(cand)}
        </div>
      </div>`;

    this.container.querySelector('#cd-back')?.addEventListener('click', () => router.navigate('/recruiter/candidate-assessments'));
    this.container.querySelector('#cd-csv')?.addEventListener('click', () => this.exportCsv());
    this.container.querySelector('#cd-reinvite')?.addEventListener('click', () => { void this.reinvite(); });

    const notes = this.container.querySelector('#recruiter-notes') as HTMLTextAreaElement | null;
    this.container.querySelector('#decide-select')?.addEventListener('click', () => {
      void this.decide('Selected', notes?.value || '');
    });
    this.container.querySelector('#decide-review')?.addEventListener('click', () => {
      void this.decide('Under Review', notes?.value || '');
    });
    this.container.querySelector('#decide-reject')?.addEventListener('click', () => {
      void this.decide('Rejected', notes?.value || '');
    });
  }

  private scoreHtml(result: CandidateResult): string {
    const isPassing = result.passStatus === 'Pass' || result.percentage >= 70;
    const cleanSectionScores = Object.entries(result.sectionScores || {}).filter(([key]) => !key.startsWith('_'));

    return `
      <!-- Metric Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${kpi('Total Score', `${result.totalScore} / ${result.maxScore}`, 'text-indigo-400', `${result.percentage}% marks scored`)}
        ${kpi('Performance', `${result.percentage}%`, isPassing ? 'text-emerald-400' : 'text-rose-400', isPassing ? '✓ Passed minimum cutoff' : '✗ Below passing threshold')}
        ${kpi('AI Integrity Score', `${result.aiConfidenceScore}%`, 'text-purple-300', 'Automated proctoring confidence')}
        ${kpi('Flagged Violations', String(result.totalViolations), result.totalViolations > 0 ? 'text-amber-400' : 'text-emerald-400', result.totalViolations > 0 ? 'Proctoring warnings noted' : 'Clean proctoring session')}
      </div>

      <!-- Section Scores Table -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-300 tracking-wide uppercase flex items-center gap-2">
            <span>📊 Section-Wise Marks & Percentage Breakdown</span>
          </h3>
          <span class="text-[11px] font-mono text-slate-500">${cleanSectionScores.length} sections graded</span>
        </div>
        <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900/90 text-slate-400 text-[10px] font-semibold tracking-wide uppercase">
              <tr>
                <th class="p-3 border-b border-slate-800">Section Name</th>
                <th class="p-3 border-b border-slate-800">Score / Max</th>
                <th class="p-3 border-b border-slate-800">Percentage</th>
                <th class="p-3 border-b border-slate-800 w-48">Progress</th>
                <th class="p-3 border-b border-slate-800">Status</th>
              </tr>
            </thead>
            <tbody class="font-mono divide-y divide-slate-800/60">
              ${cleanSectionScores.length === 0 ? `
                <tr><td colspan="5" class="p-4 text-center text-slate-500">No section score records available.</td></tr>
              ` : cleanSectionScores.map(([name, sec]: [string, any]) => {
                const secPct = Number(sec.percentage ?? (sec.maxScore ? ((sec.score / sec.maxScore) * 100).toFixed(1) : 0));
                const secPass = secPct >= 70;
                return `
                  <tr class="hover:bg-slate-900/40 transition-colors">
                    <td class="p-3 font-sans font-medium text-slate-200">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${secPass ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                        <span>${esc(name)}</span>
                      </div>
                    </td>
                    <td class="p-3 text-slate-300 font-bold">${sec.score} / ${sec.maxScore}</td>
                    <td class="p-3 font-bold ${secPass ? 'text-emerald-400' : 'text-amber-400'}">${secPct}%</td>
                    <td class="p-3">
                      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all ${secPass ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${Math.min(100, Math.max(0, secPct))}%"></div>
                      </div>
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${secPass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                        ${secPass ? 'PASS' : 'NEEDS REVIEW'}
                      </span>
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Proctoring Events Log -->
      ${(result.proctoringLogs || []).length > 0 ? `
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-slate-300 tracking-wide uppercase flex items-center gap-2">
            <span>🛡️ Proctoring Verification Logs</span>
          </h3>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${(result.proctoringLogs || []).map(v => `
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded ${v.severity === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">${esc(v.severity)}</span>
                  <span class="font-bold text-white">${esc(v.type)}</span>
                  <span class="text-slate-400 truncate">${esc(v.description)}</span>
                </div>
                <span class="font-mono text-slate-500 text-[10px] shrink-0">${esc(v.timestamp)}</span>
              </div>`).join('')}
          </div>
        </div>
      ` : ''}`;
  }

  private decisionHtml(result?: CandidateResult | null): string {
    const currentDecision = result?.recruiterDecision || this.row?.status || 'Under Review';
    const notesText = result?.recruiterNotes || '';

    return `
      <!-- Recruiter Decision Box -->
      <div class="pt-5 border-t border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span>⚖️ Recruiter Hiring Decision</span>
          </h3>
          <span class="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg border ${
            currentDecision === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            currentDecision === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
            'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }">
            Current: ${esc(currentDecision)}
          </span>
        </div>

        <textarea id="recruiter-notes" placeholder="Add recruiter feedback or notes for interviewers…" class="w-full p-3.5 glass-input rounded-2xl text-xs text-white border border-slate-700 bg-slate-950 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600" rows="3">${esc(notesText)}</textarea>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5">
            <button id="decide-select" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30">
              ✓ Select Candidate
            </button>
            <button id="decide-review" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all">
              ⏸ Hold / Interview
            </button>
            <button id="decide-reject" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30">
              ✗ Reject
            </button>
          </div>
          <span class="text-[11px] text-slate-500 font-mono">Updates candidate status immediately</span>
        </div>
      </div>`;
  }

  private paperHtml(cand: CandidateRow): string {
    const paper = cand.paper || [];
    if (!paper.length) {
      return `
        <div class="pt-6 border-t border-slate-800 text-center py-8 text-slate-500 text-xs">
          No question paper record available for this candidate.
        </div>`;
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return `
      <div class="space-y-6 pt-6 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              <span>📝 Detailed Question & Candidate Response Review</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Review every question shown to this candidate. Identified answer keys and candidate selections are labeled below.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ${paper.reduce((acc, s) => acc + (s.questions?.length || 0), 0)} Questions
          </span>
        </div>

        ${paper.map(section => `
          <div class="space-y-3.5 bg-slate-950/60 p-5 rounded-3xl border border-slate-800/80">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white">SECTION</span>
                <h4 class="text-sm font-bold text-white">${esc(section.name)}</h4>
              </div>
              <span class="text-[11px] font-mono text-slate-400">${section.questions.length} questions</span>
            </div>

            <div class="space-y-4">
              ${section.questions.map(q => {
                const ans = q.candidateAnswer;
                const isMcqLike = q.type === 'mcq' || q.type === 'msq';
                const hasCode = ans && typeof ans === 'object' && (ans.code || ans.sql);
                const codeText = hasCode ? (ans.code || ans.sql || '') : '';
                const codeLang = hasCode ? (ans.language || q.language || 'code') : '';

                // Calculate objective correctness
                let isPassed = false;
                let isAttempted = false;

                if (isMcqLike) {
                  const correctOpts = q.options.filter(o => o.correct);
                  const correctIds = new Set(correctOpts.map(o => String(o.id || '')));
                  
                  // Candidate selections
                  let chosenIds: string[] = [];
                  if (Array.isArray(ans)) {
                    chosenIds = ans.map(v => String(v));
                  } else if (ans != null && typeof ans === 'string') {
                    chosenIds = [ans];
                  } else if (ans != null && typeof ans === 'number') {
                    chosenIds = [String(ans)];
                  }

                  isAttempted = chosenIds.length > 0;
                  if (q.type === 'mcq') {
                    const chosen = chosenIds[0];
                    // Also match against opt text if stored by text
                    const optByText = q.options.find(o => o.text.trim() === String(ans || '').trim());
                    isPassed = correctIds.has(chosen) || (!!optByText && optByText.correct);
                  } else if (q.type === 'msq') {
                    const chosenSet = new Set(chosenIds);
                    isPassed = chosenSet.size === correctIds.size && [...chosenSet].every(id => correctIds.has(id));
                  }
                } else if (ans) {
                  isAttempted = true;
                }

                return `
                  <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 transition-all hover:border-slate-700">
                    <!-- Question Header & Badges -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          Q${q.number}
                        </span>
                        <h5 class="text-xs font-bold text-white">${esc(q.title)}</h5>
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          ${esc(q.type)}
                        </span>
                        ${q.difficulty ? `
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                            q.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                            q.difficulty === 'hard' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                          }">
                            ${esc(q.difficulty)}
                          </span>` : ''}
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-mono text-slate-400 font-bold">${q.points || 10} pts</span>
                        ${isMcqLike ? (
                          !isAttempted ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              ○ Not Attempted
                            </span>
                          ` : isPassed ? `
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              ✓ Correct (+${q.points || 10} pts)
                            </span>
                          ` : `
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              ✗ Incorrect (0 pts)
                            </span>
                          `
                        ) : ''}
                      </div>
                    </div>

                    <!-- Question Prompt / Content -->
                    ${q.content && q.content !== q.title ? `
                      <p class="text-xs text-slate-300 leading-relaxed font-sans">${esc(q.content)}</p>
                    ` : ''}

                    <!-- MCQ / MSQ Options with Crystal Clear Identifiers -->
                    ${q.options && q.options.length ? `
                      <div class="space-y-2 pt-1">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Options & Answer Comparison:</p>
                        <div class="grid grid-cols-1 gap-2">
                          ${q.options.map((opt, i) => {
                            const optId = String(opt.id || '');
                            const isCorrect = !!opt.correct;
                            
                            // Check if candidate selected this option
                            let isChosen = false;
                            if (Array.isArray(ans)) {
                              isChosen = ans.map(v => String(v)).includes(optId);
                            } else if (ans != null) {
                              isChosen = String(ans) === optId || String(ans).trim() === opt.text.trim();
                            }

                            return `
                              <div class="p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                                isCorrect && isChosen ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100 shadow-sm' :
                                isChosen && !isCorrect ? 'bg-rose-950/40 border-rose-500/70 text-rose-100 shadow-sm' :
                                isCorrect && !isChosen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' :
                                'bg-slate-950/40 border-slate-800 text-slate-400'
                              }">
                                <div class="flex items-start gap-2.5 min-w-0">
                                  <span class="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 font-mono ${
                                    isCorrect && isChosen ? 'bg-emerald-600 text-white' :
                                    isChosen && !isCorrect ? 'bg-rose-600 text-white' :
                                    isCorrect ? 'bg-emerald-800/80 text-emerald-200' :
                                    'bg-slate-800 text-slate-400'
                                  }">
                                    ${letters[i] || i + 1}
                                  </span>
                                  <span class="text-xs font-sans leading-relaxed pt-0.5">${esc(opt.text)}</span>
                                </div>

                                <div class="flex items-center gap-1.5 shrink-0">
                                  ${isChosen && isCorrect ? `
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                                      ✓ Candidate Picked
                                    </span>
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                                      ✓ Correct Key
                                    </span>
                                  ` : isChosen && !isCorrect ? `
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40">
                                      ✗ Candidate Picked (Wrong)
                                    </span>
                                  ` : isCorrect && !isChosen ? `
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      ✓ Correct Key
                                    </span>
                                  ` : ''}
                                </div>
                              </div>`;
                          }).join('')}
                        </div>
                      </div>
                    ` : ''}

                    <!-- Coding / SQL Solution Box -->
                    ${hasCode ? `
                      <div class="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span class="font-bold text-white flex items-center gap-1.5">
                            💻 Submitted Candidate Code
                          </span>
                          <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px]">
                            ${esc(codeLang)}
                          </span>
                        </div>
                        <pre class="font-mono text-xs text-emerald-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto leading-relaxed border border-slate-800 max-h-64">${esc(codeText)}</pre>
                      </div>
                    ` : ''}

                    <!-- Non-Code Candidate Answer (Text / Essay) -->
                    ${!isMcqLike && !hasCode && ans ? `
                      <div class="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Written Response:</span>
                        <p class="text-xs text-indigo-200 font-sans leading-relaxed whitespace-pre-wrap">${esc(typeof ans === 'string' ? ans : JSON.stringify(ans))}</p>
                      </div>
                    ` : ''}

                    <!-- Recruiter Explanation Key -->
                    ${q.explanation ? `
                      <div class="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                        <span class="text-indigo-400 font-bold shrink-0">💡 Note for Recruiter:</span>
                        <span class="font-sans leading-relaxed">${esc(q.explanation)}</span>
                      </div>
                    ` : ''}
                  </div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  private exportCsv() {
    if (!this.row) return;
    const r = this.row.result;
    const headers = [
      'Candidate ID', 'Name', 'Email', 'Phone', 'Job Role', 'Status',
      'Total Score', 'Max Score', 'Percentage', 'Pass Status', 'Violations', 'Recruiter Notes',
    ];
    const row = [
      this.row.id, this.row.name, this.row.email, this.row.phone || '',
      this.row.roleTitle || '', this.row.status,
      r?.totalScore ?? this.row.totalScore ?? 'N/A',
      r?.maxScore ?? this.row.maxScore ?? 'N/A',
      r?.percentage != null ? `${r.percentage}%` : (this.row.percentage != null ? `${this.row.percentage}%` : 'N/A'),
      r?.passStatus ?? this.row.passStatus ?? 'N/A',
      r?.totalViolations ?? this.row.violations ?? 0,
      r?.recruiterNotes || '',
    ];
    CsvExporterService.downloadCsv(`${this.row.name.replace(/\s+/g, '_')}_Scorecard.csv`, headers, [row]);
  }

  private async decide(decision: CandidateResult['recruiterDecision'], notes: string) {
    if (this.savingDecision) return;
    this.savingDecision = true;
    try {
      this.row = await recruiterApi.setDecision(this.candidateId, decision, notes);
      this.paint();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save decision.');
    } finally {
      this.savingDecision = false;
    }
  }

  private async reinvite() {
    if (!this.row) return;
    if (!confirm(`Send ${this.row.name} a new exam link and a new passcode? The previous link will stop working.`)) return;
    const btn = this.container.querySelector('#cd-reinvite') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending…';
    }
    try {
      const invite = await authApi.createInvite({
        name: this.row.name,
        email: this.row.email,
        phone: this.row.phone,
        assessmentId: this.row.assessmentId || 'assess-101',
        expiresInHours: 48,
        candidateId: this.row.id,
      });
      const deadline = Date.now() + 20000;
      let status = 'PENDING';
      let message = '';
      while (Date.now() < deadline) {
        await new Promise(resolve => window.setTimeout(resolve, 1000));
        try {
          const delivery = await authApi.inviteDelivery(invite.inviteId);
          status = delivery.deliveryStatus;
          message = delivery.message;
          if (status === 'SENT' || status === 'FAILED' || status === 'STARTED') break;
        } catch {
          /* the invite is already saved; keep waiting for the mail result */
        }
      }
      if (status === 'SENT' || status === 'STARTED') {
        alert(`A new exam link and passcode were emailed to ${invite.otpDestination}. Earlier links for this assessment no longer work.`);
      } else if (status === 'FAILED') {
        alert(message || 'The new invitation was saved, but the email was not delivered. Check the email settings and try again.');
      } else {
        alert(`The new invitation is saved for ${invite.otpDestination}. The email is still going out — check the inbox, then Spam.`);
      }
      await this.load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Invite failed.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Resend invite';
      }
    }
  }
}
