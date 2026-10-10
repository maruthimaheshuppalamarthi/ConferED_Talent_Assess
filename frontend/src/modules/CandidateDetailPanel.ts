import { CsvExporterService } from '../services/csvExporter';
import { authApi } from '../services/authApi';
import { CandidateRow, recruiterApi } from '../services/recruiterApi';
import { portalHomePath, router } from '../router';
import { CandidateResult } from '../types';

/** Full-page scorecard opened from the pipeline Excel list (`/recruiter/candidates/:id`). */
export class CandidateDetailPanel {
  private container: HTMLElement;
  private candidateId: string;
  private row: CandidateRow | null = null;
  private error = '';
  private loading = true;

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
      this.container.innerHTML = `<div class="max-w-5xl mx-auto py-16 text-center text-xs text-slate-500 font-mono">Loading candidate…</div>`;
      return;
    }
    if (this.error || !this.row) {
      this.container.innerHTML = `
        <div class="max-w-5xl mx-auto py-16 px-4 space-y-4 text-center">
          <p class="text-sm text-red-400 font-semibold">${this.error || 'Candidate not found.'}</p>
          <button id="cd-back" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs">Back to pipeline</button>
        </div>`;
      this.container.querySelector('#cd-back')?.addEventListener('click', () => router.navigate(portalHomePath('recruiter')));
      return;
    }

    const cand = this.row;
    const result = cand.result as CandidateResult | null | undefined;

    this.container.innerHTML = `
      <div class="max-w-5xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <button id="cd-back" class="text-xs font-semibold text-blue-400 hover:text-blue-300">Back to pipeline</button>

        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                ${cand.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl font-extrabold text-white">${esc(cand.name)}</h1>
                  <span class="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-200 border border-slate-700">${esc(statusLabel(cand.status))}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${esc(cand.email)} · ${esc(cand.phone || '—')} · ${cand.experienceYears} yrs experience</p>
                ${(cand.organization || cand.roleTitle || cand.source) ? `<p class="text-[11px] text-slate-500 mt-1">${[cand.organization, cand.roleTitle, cand.source].filter(Boolean).map(v => esc(v)).join(' · ')}</p>` : ''}
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${(cand.skills || []).map(s => `<span class="px-2 py-0.5 text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800 rounded-md">${esc(s)}</span>`).join('')}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${result ? `<button id="cd-csv" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs">Export</button>` : ''}
              ${!result ? `<button id="cd-reinvite" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs">Resend invite</button>` : ''}
            </div>
          </div>

          ${result ? this.scoreHtml(result) : `
            <div class="py-10 text-center text-slate-400 space-y-2">
              <p class="text-sm font-semibold">Assessment not submitted yet</p>
              <p class="text-xs">Invite sent ${esc(cand.invitedAt || '—')}</p>
            </div>
          `}
          ${this.paperHtml(cand)}
        </div>
      </div>`;

    this.container.querySelector('#cd-back')?.addEventListener('click', () => router.navigate(portalHomePath('recruiter')));
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
    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${kpi('Score', `${result.totalScore} / ${result.maxScore}`, 'text-blue-400')}
        ${kpi('Percentile', `${result.percentage}%`, result.percentage >= 70 ? 'text-emerald-400' : 'text-red-400')}
        ${kpi('Integrity', `${result.aiConfidenceScore}%`, 'text-violet-300')}
        ${kpi('Flags', String(result.totalViolations), result.totalViolations > 0 ? 'text-amber-400' : 'text-emerald-400')}
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Section scores</h3>
        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900 text-slate-400 text-[10px] font-semibold tracking-wide">
              <tr>
                <th class="p-3 border border-slate-800">Section</th>
                <th class="p-3 border border-slate-800">Score</th>
                <th class="p-3 border border-slate-800">%</th>
              </tr>
            </thead>
            <tbody class="font-mono">
              ${Object.entries(result.sectionScores || {}).map(([name, sec]) => `
                <tr class="odd:bg-slate-950 even:bg-slate-900/40">
                  <td class="p-3 border border-slate-800 font-sans font-medium text-slate-200">${esc(name)}</td>
                  <td class="p-3 border border-slate-800">${sec.score} / ${sec.maxScore}</td>
                  <td class="p-3 border border-slate-800 ${sec.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}">${sec.percentage}%</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Proctoring events</h3>
        ${(result.proctoringLogs || []).length
          ? (result.proctoringLogs || []).map(v => `
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${v.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}">${esc(v.severity)}</span>
                <span class="font-semibold text-white">${esc(v.type)}</span>
                <span class="text-slate-400 truncate">${esc(v.description)}</span>
              </div>
              <span class="font-mono text-slate-500 text-[10px] shrink-0">${esc(v.timestamp)}</span>
            </div>`).join('')
          : '<p class="text-xs text-slate-500">No proctoring events recorded.</p>'}
      </div>

      <div class="pt-4 border-t border-slate-800 space-y-3">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Hiring decision</h3>
        <textarea id="recruiter-notes" placeholder="Add notes for the hiring committee…" class="w-full p-3 glass-input rounded-xl text-xs text-white border border-slate-700 bg-slate-950" rows="3">${esc(result.recruiterNotes || '')}</textarea>
        <div class="flex flex-wrap items-center gap-3">
          <button id="decide-select" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs">Select</button>
          <button id="decide-review" class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs">Hold for interview</button>
          <button id="decide-reject" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs">Reject</button>
        </div>
      </div>`;
  }

  private paperHtml(cand: CandidateRow): string {
    const paper = cand.paper || [];
    if (!paper.length) return '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return `
      <div class="space-y-3 pt-4 border-t border-slate-800">
        <h3 class="text-xs font-semibold text-slate-300 tracking-wide">Paper this candidate saw</h3>
        ${paper.map(section => `
          <div class="space-y-2">
            <p class="text-[11px] font-bold text-indigo-300">${esc(section.name)}</p>
            ${section.questions.map(q => `
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <p class="font-semibold text-white">${q.number}. ${esc(q.title)} <span class="text-slate-500 font-mono uppercase">${esc(q.type)}</span></p>
                ${q.options.length ? q.options.map((opt, i) => `
                  <p class="${opt.correct ? 'text-emerald-300' : 'text-slate-400'}">${letters[i] || i + 1}. ${esc(opt.text)}${opt.correct ? ' · correct' : ''}</p>
                `).join('') : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>`;
  }

  private exportCsv() {
    if (!this.row?.result) return;
    const r = this.row.result;
    const headers = ['Candidate', 'Email', 'Status', 'Total', 'Max', 'Percentage', 'Pass', 'Violations', 'Notes'];
    const row = [this.row.name, this.row.email, this.row.status, r.totalScore, r.maxScore, r.percentage, r.passStatus, r.totalViolations, r.recruiterNotes];
    CsvExporterService.downloadCsv(`${this.row.name.replace(/\s+/g, '_')}_Scorecard.csv`, headers, [row]);
  }

  private async decide(decision: CandidateResult['recruiterDecision'], notes: string) {
    try {
      this.row = await recruiterApi.setDecision(this.candidateId, decision, notes);
      this.paint();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save decision.');
    }
  }

  private async reinvite() {
    if (!this.row) return;
    if (!confirm(`Issue a new invite for ${this.row.name}?`)) return;
    try {
      const invite = await authApi.createInvite({
        name: this.row.name,
        email: this.row.email,
        phone: this.row.phone,
        assessmentId: this.row.assessmentId || 'assess-101',
        expiresInHours: 48,
        candidateId: this.row.id,
      });
      await navigator.clipboard.writeText(invite.link).catch(() => {});
      alert(`New invitation sent${invite.devOtp ? `\nDEV OTP: ${invite.devOtp}` : ''}`);
      await this.load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Invite failed.');
    }
  }
}

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

const kpi = (label: string, value: string, tone: string) => `
  <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
    <span class="text-[10px] font-semibold tracking-wide text-slate-400">${label}</span>
    <div class="text-2xl font-extrabold font-mono ${tone} mt-1">${value}</div>
  </div>`;
