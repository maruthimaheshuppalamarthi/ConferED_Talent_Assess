import { CsvExporterService } from '../services/csvExporter';
import { ApiError, authApi } from '../services/authApi';
import { EmailService } from '../services/emailService';
import { getPortalTab } from '../services/portalNav';
import {
  CandidateRow, JobItem, PipelineCounts, PipelineStageSlug, STAGE_SLUGS, recruiterApi,
} from '../services/recruiterApi';
import { currentRoute, router } from '../router';
import { AssessmentBuilderPanel } from './AssessmentBuilderPanel';
import { BulkInviteModal } from './BulkInviteModal';
import { CandidateDetailPanel } from './CandidateDetailPanel';
import { QuestionBankPanel } from './QuestionBankPanel';

type StageTab = 'ALL' | CandidateRow['status'];

const EMPTY_COUNTS: PipelineCounts = {
  all: 0, applied: 0, screened: 0, assessmentSent: 0,
  completed: 0, underReview: 0, selected: 0, rejected: 0,
};

/** UI labels for hiring stages (API status values stay unchanged). */
const STAGE_LABEL: Record<StageTab, string> = {
  ALL: 'All',
  Applied: 'Applied',
  Screened: 'Screened',
  'Assessment Sent': 'Invited',
  Completed: 'Submitted',
  'Under Review': 'In review',
  Selected: 'Selected',
  Rejected: 'Rejected',
};

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export class RecruiterPortalModule {
  private container: HTMLElement;
  private currentViewMode: 'table' | 'kanban' = 'table';
  private activeStageTab: StageTab = 'ALL';
  private rows: CandidateRow[] = [];
  private counts: PipelineCounts = { ...EMPTY_COUNTS };
  private loading = false;
  private error = '';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const route = currentRoute();
    const sectionPath = route.kind === 'staff' ? route.section : '';

    if (sectionPath.startsWith('candidates/')) {
      const id = sectionPath.slice('candidates/'.length).split('/')[0];
      this.container.innerHTML = '<div id="recruiter-section"></div>';
      new CandidateDetailPanel(this.container.querySelector('#recruiter-section') as HTMLElement, id).render();
      return;
    }

    const section = getPortalTab('recruiter');
    if (section === 'assessment-builder' || section === 'question-bank') {
      this.container.innerHTML = '<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="recruiter-section"></div></div>';
      const host = this.container.querySelector('#recruiter-section') as HTMLElement;
      if (section === 'assessment-builder') new AssessmentBuilderPanel(host).render();
      else new QuestionBankPanel(host).render();
      return;
    }

    void this.loadPipeline();
    this.paintShell();
  }

  private stageSlug(): PipelineStageSlug | null {
    if (this.activeStageTab === 'ALL') return null;
    return STAGE_SLUGS.find(s => s.status === this.activeStageTab)?.slug || null;
  }

  private async loadPipeline(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.paintShell();
    try {
      const slug = this.stageSlug();
      const data = slug ? await recruiterApi.pipelineStage(slug) : await recruiterApi.pipeline();
      this.rows = data.items;
      this.counts = data.counts || this.counts;
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Could not load pipeline.';
      this.rows = [];
    } finally {
      this.loading = false;
      this.paintShell();
    }
  }

  private countFor(tab: StageTab): number {
    if (tab === 'ALL') return this.counts.all;
    const key = STAGE_SLUGS.find(s => s.status === tab)?.countKey;
    return key ? this.counts[key] : 0;
  }

  private openCandidate(id: string) {
    router.navigate(`/recruiter/candidates/${id}`);
  }

  private paintShell() {
    const stages: StageTab[] = ['ALL', ...STAGE_SLUGS.map(s => s.status)];

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                💼 Talent Operations
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Hiring Pipeline</h1>
            <p class="text-xs text-slate-400">Track candidates from invite through automated code evaluation and final decision.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="view-table-btn" title="Table layout" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Table</button>
              <button id="view-kanban-btn" title="Board layout by stage" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Board</button>
            </div>
            ${this.currentViewMode === 'table' ? `
              <button id="export-all-csv-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs">Export</button>
            ` : ''}
            <button id="view-sent-emails-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Sent invites</button>
            <button id="bulk-invite-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Bulk invite</button>
            <button id="invite-cand-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30">Invite candidate</button>
          </div>
        </div>

        <div>
          <p class="text-[11px] font-semibold text-slate-500 mb-2 px-0.5">Filter by hiring stage</p>
          <div class="glass-panel p-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          ${stages.map(stg => {
            const isActive = this.activeStageTab === stg;
            return `
              <button data-stage-tab="${stg}" class="stage-tab-btn px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap border ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-transparent text-slate-400 hover:text-white border-transparent hover:bg-slate-900'
              }">
                <span>${STAGE_LABEL[stg]}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-900 text-slate-500'}">${this.countFor(stg)}</span>
              </button>`;
          }).join('')}
          </div>
        </div>

        ${this.error ? `<p class="text-xs text-red-400 font-semibold">${esc(this.error)}</p>` : ''}
        ${this.loading ? `<p class="text-xs text-slate-500 font-mono">Loading pipeline…</p>` : ''}

        ${this.currentViewMode === 'table' ? this.excelTableHtml() : this.kanbanHtml()}

        <div id="invite-modal-host"></div>
      </div>`;

    this.attachEvents();
  }

  private excelTableHtml(): string {
    return `
      <div class="glass-panel p-0 rounded-3xl border border-slate-800 overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <h3 class="text-xs font-bold text-white tracking-wide">${STAGE_LABEL[this.activeStageTab]} · Candidates</h3>
          <span class="text-[11px] font-mono text-slate-400">${this.rows.length}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-xs font-mono border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                ${['#', 'Name', 'Email', 'Phone', 'Exp', 'Skills', 'Stage', 'Score', '%', 'Violations', 'Actions']
                  .map(h => `<th class="px-3 py-2.5 border border-slate-700/80 whitespace-nowrap font-bold">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${this.rows.length === 0 && !this.loading
                ? `<tr><td colspan="11" class="px-4 py-10 text-center text-slate-500 border border-slate-800">No candidates in this stage.</td></tr>`
                : this.rows.map((c, i) => `
                  <tr class="${i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/50'} hover:bg-slate-800/40">
                    <td class="px-3 py-2 border border-slate-800 text-slate-500">${i + 1}</td>
                    <td class="px-3 py-2 border border-slate-800">
                      <button data-open-cand="${c.id}" class="cand-name-click font-sans font-bold text-blue-400 hover:text-blue-300 hover:underline text-left">${esc(c.name)}</button>
                    </td>
                    <td class="px-3 py-2 border border-slate-800 text-slate-300">${esc(c.email)}</td>
                    <td class="px-3 py-2 border border-slate-800 text-slate-400 whitespace-nowrap">${esc(c.phone || '—')}</td>
                    <td class="px-3 py-2 border border-slate-800 text-center">${c.experienceYears}</td>
                    <td class="px-3 py-2 border border-slate-800 font-sans text-[10px] text-slate-400 max-w-[160px] truncate" title="${esc((c.skills || []).join(', '))}">${esc((c.skills || []).slice(0, 3).join(', ') || '—')}</td>
                    <td class="px-3 py-2 border border-slate-800">
                      <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-200 border border-slate-700 whitespace-nowrap">${esc(STAGE_LABEL[c.status] || c.status)}</span>
                    </td>
                    <td class="px-3 py-2 border border-slate-800 text-blue-400 font-bold">${c.totalScore != null ? `${c.totalScore}/${c.maxScore}` : '—'}</td>
                    <td class="px-3 py-2 border border-slate-800 font-bold ${c.percentage != null && c.percentage >= 70 ? 'text-emerald-400' : c.percentage != null ? 'text-red-400' : 'text-slate-500'}">${c.percentage != null ? `${c.percentage}%` : '—'}</td>
                    <td class="px-3 py-2 border border-slate-800 ${c.violations > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}">${c.violations}</td>
                    <td class="px-3 py-2 border border-slate-800 whitespace-nowrap">
                      <button data-open-cand="${c.id}" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700">Open</button>
                      ${c.percentage != null ? `<button data-export-cand="${c.id}" class="ml-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">Export</button>` : ''}
                    </td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  private kanbanHtml(): string {
    const columns = this.activeStageTab === 'ALL' ? STAGE_SLUGS.map(s => s.status) : [this.activeStageTab];
    return `
      <div class="flex gap-5 overflow-x-auto pb-6 pt-2">
        ${columns.map(stage => {
          const stageCands = this.rows.filter(c => c.status === stage);
          return `
            <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 class="text-xs font-bold text-white tracking-wide">${STAGE_LABEL[stage] || stage}</h3>
                <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 rounded-full">${stageCands.length}</span>
              </div>
              <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px]">
                ${stageCands.map(c => `
                  <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 cursor-pointer space-y-3" data-open-cand="${c.id}">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="text-xs font-bold text-white hover:text-blue-400">${esc(c.name)}</h4>
                        <p class="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">${esc(c.email)}</p>
                      </div>
                      <span class="text-[10px] font-mono text-slate-500">${c.experienceYears}y</span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      ${(c.skills || []).slice(0, 3).map(s => `<span class="px-2 py-0.5 text-[10px] bg-slate-950 text-slate-300 border border-slate-800 rounded-lg">${esc(s)}</span>`).join('')}
                    </div>
                    ${c.percentage != null
                      ? `<p class="text-xs font-extrabold font-mono ${c.percentage >= 70 ? 'text-emerald-400' : 'text-red-400'}">Score: ${c.percentage}%</p>`
                      : `<p class="text-[11px] text-slate-500">Awaiting assessment</p>`}
                  </div>`).join('') || `
                  <div class="p-5 text-center border border-dashed border-slate-800/80 rounded-2xl text-xs text-slate-500">No candidates in this stage.</div>`}
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  private attachEvents() {
    this.container.querySelectorAll('.stage-tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.activeStageTab = (e.currentTarget as HTMLElement).getAttribute('data-stage-tab') as StageTab;
        void this.loadPipeline();
      });
    });

    this.container.querySelector('#view-table-btn')?.addEventListener('click', () => {
      this.currentViewMode = 'table';
      this.paintShell();
    });
    this.container.querySelector('#view-kanban-btn')?.addEventListener('click', () => {
      this.currentViewMode = 'kanban';
      this.paintShell();
    });

    this.container.querySelectorAll('[data-open-cand]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-open-cand');
        if (id) this.openCandidate(id);
      });
    });

    this.container.querySelectorAll('[data-export-cand]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-export-cand');
        if (id) this.exportOne(id);
      });
    });

    this.container.querySelector('#export-all-csv-btn')?.addEventListener('click', () => this.exportAll());
    this.container.querySelector('#view-sent-emails-btn')?.addEventListener('click', () => this.renderSentEmailsModal());
    this.container.querySelector('#bulk-invite-btn')?.addEventListener('click', () => this.renderBulkInvite());
    this.container.querySelector('#invite-cand-btn')?.addEventListener('click', () => this.renderInviteModal());
  }

  private renderBulkInvite() {
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;
    void this.openBulkInvite(host);
  }

  private async openBulkInvite(host: HTMLElement) {
    let jobs: JobItem[] = [];
    try {
      const data = await recruiterApi.jobs();
      jobs = data.items.filter(j => j.status === 'open');
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not load jobs.');
      return;
    }
    if (!jobs.length) {
      alert('No open job. Set a job to open and save it before sending invitations.');
      return;
    }
    if (jobs.length === 1) {
      new BulkInviteModal(host, jobs[0].assessmentId, jobs[0].title).open();
      return;
    }
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Bulk invite</h3>
            <button id="bulk-job-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <label class="block font-semibold text-slate-300 mb-1">Job</label>
            <select id="bulk-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
              ${jobs.map(j => `<option value="${esc(j.id)}">${esc(j.title)} · ${esc(j.status)}</option>`).join('')}
            </select>
            <button id="bulk-job-next" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">Continue</button>
          </div>
        </div>
      </div>`;
    host.querySelector('#bulk-job-close')?.addEventListener('click', () => { host.innerHTML = ''; });
    host.querySelector('#bulk-job-next')?.addEventListener('click', () => {
      const id = (host.querySelector('#bulk-job') as HTMLSelectElement).value;
      const job = jobs.find(j => j.id === id);
      if (!job) return;
      new BulkInviteModal(host, job.assessmentId, job.title).open();
    });
  }

  private exportOne(id: string) {
    const c = this.rows.find(r => r.id === id);
    if (!c) return;
    const headers = ['Name', 'Email', 'Status', 'Score', 'Percentage', 'Violations'];
    CsvExporterService.downloadCsv(`${c.name.replace(/\s+/g, '_')}_Scores.csv`, headers, [[
      c.name, c.email, c.status, c.totalScore ?? 'N/A', c.percentage != null ? `${c.percentage}%` : 'N/A',
      c.violations,
    ]]);
  }

  private exportAll() {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Score', 'Max', 'Percentage', 'Violations'];
    const rows = this.rows.map(c => [
      c.name, c.email, c.phone, c.status, c.totalScore ?? 'N/A', c.maxScore ?? 'N/A',
      c.percentage != null ? `${c.percentage}%` : 'N/A', c.violations,
    ]);
    CsvExporterService.downloadCsv('Candidate_Section_Scores_Report.csv', headers, rows);
  }

  private renderSentEmailsModal() {
    const emails = EmailService.getSentEmails();
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-800 flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
            <div>
              <h3 class="text-base font-extrabold text-white">Sent invites</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${emails.length} in this session</p>
            </div>
            <button id="close-email-log-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="overflow-auto flex-1">
            ${emails.length ? `
              <table class="w-full text-xs">
                <thead class="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="text-left font-semibold px-4 py-3">Sent</th>
                    <th class="text-left font-semibold px-4 py-3">Recipient</th>
                    <th class="text-left font-semibold px-4 py-3">Assessment</th>
                    <th class="text-left font-semibold px-4 py-3">Duration</th>
                    <th class="text-left font-semibold px-4 py-3">Link / Deadline</th>
                    <th class="text-left font-semibold px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${emails.map(email => `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-900/50 align-top">
                      <td class="px-4 py-3 text-slate-500 whitespace-nowrap">${esc(email.sentAt)}</td>
                      <td class="px-4 py-3">
                        <div class="font-semibold text-white">${esc(email.recipientName)}</div>
                        <div class="text-slate-400">${esc(email.recipientEmail)}</div>
                      </td>
                      <td class="px-4 py-3 text-blue-300 font-medium">${esc(email.assessmentTitle || email.subject)}</td>
                      <td class="px-4 py-3 text-slate-300 font-mono">${email.durationMinutes != null ? `${email.durationMinutes}m` : '—'}</td>
                      <td class="px-4 py-3 max-w-xs">
                        ${email.assessmentLink ? `<a href="${esc(email.assessmentLink)}" target="_blank" class="text-blue-400 hover:underline break-all line-clamp-2">${esc(email.assessmentLink)}</a>` : '<span class="text-slate-600">—</span>'}
                        ${email.expiresAt ? `<div class="text-[10px] text-amber-400/90 mt-1">Expires: ${esc(email.expiresAt)}</div>` : ''}
                        ${email.otpCode ? `<div class="text-[10px] text-amber-300 mt-0.5">DEV OTP: ${esc(email.otpCode)}</div>` : ''}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap"><span class="text-emerald-400">✓ ${esc(email.status)}</span></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            ` : '<p class="text-xs text-slate-500 p-8">No emails logged in this browser session. Dispatch an invitation to see it here.</p>'}
          </div>
        </div>
      </div>`;
    host.querySelector('#close-email-log-btn')?.addEventListener('click', () => { host.innerHTML = ''; });
  }

  private renderInviteModal() {
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;
    void this.openInviteModal(host);
  }

  private async openInviteModal(host: HTMLElement) {
    let jobs: JobItem[] = [];
    try {
      const data = await recruiterApi.jobs();
      jobs = data.items.filter(j => j.status === 'open');
    } catch {
      jobs = [];
    }

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Invite candidate</h3>
            <button id="close-invite-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Name</label>
              <input id="inv-name" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="" placeholder="Full name" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Email</label>
              <input id="inv-email" type="email" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="" placeholder="candidate@company.com" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Job</label>
              ${jobs.length ? `
                <select id="inv-assess" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${jobs.map(j => `<option value="${esc(j.assessmentId)}">${esc(j.title)} · ${esc(j.status)}</option>`).join('')}
                </select>
              ` : `<p class="text-amber-400 text-[11px]">No open job. Set a job to open and save it before sending an invitation.</p>`}
            </div>
            <button id="send-inv-btn" ${!jobs.length ? 'disabled' : ''} class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold">Send invitation</button>
            <div id="dispatch-output-box" class="hidden p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <p id="dispatch-msg-text"></p>
            </div>
          </div>
        </div>
      </div>`;

    const clearOnFocus = (el: HTMLInputElement | null) => {
      el?.addEventListener('focus', () => {
        if (el.value.trim()) el.select();
      });
    };
    clearOnFocus(host.querySelector('#inv-name') as HTMLInputElement);
    clearOnFocus(host.querySelector('#inv-email') as HTMLInputElement);

    host.querySelector('#close-invite-btn')?.addEventListener('click', () => {
      host.innerHTML = '';
      void this.loadPipeline();
    });

    const sendBtn = host.querySelector('#send-inv-btn') as HTMLButtonElement;
    sendBtn?.addEventListener('click', async () => {
      const name = (host.querySelector('#inv-name') as HTMLInputElement).value.trim();
      const email = (host.querySelector('#inv-email') as HTMLInputElement).value.trim();
      const assessEl = host.querySelector('#inv-assess') as HTMLSelectElement | null;
      const assessmentId = assessEl?.value?.trim() || '';
      if (!name) return alert('Please enter the candidate name.');
      if (!email) return alert('Please enter the candidate email address.');
      if (!assessmentId) return alert('Please select a job.');
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending invitation…';
      try {
        const invite = await authApi.createInvite({ name, email, assessmentId, expiresInHours: 48 });
        EmailService.recordInvite(name, email, invite.link, invite.devOtp, {
          assessmentTitle: invite.assessmentTitle || undefined,
          durationMinutes: invite.durationMinutes ?? undefined,
          expiresAt: invite.expiresAt,
        });
        const box = host.querySelector('#dispatch-output-box') as HTMLElement;
        const msg = host.querySelector('#dispatch-msg-text') as HTMLElement;
        box?.classList.remove('hidden');
        const devNote = invite.devOtp
          ? ` <span class="text-amber-300">(DEV OTP: <strong>${esc(invite.devOtp)}</strong>)</span>`
          : '';
        if (msg) {
          msg.innerHTML = `Sending the invitation to <strong>${esc(invite.otpDestination)}</strong>…${devNote}`;
        }
        sendBtn.textContent = '✓ Invitation created';
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline && msg) {
          await new Promise(resolve => window.setTimeout(resolve, 1000));
          let delivery: { deliveryStatus: string; message: string };
          try {
            delivery = await authApi.inviteDelivery(invite.inviteId);
          } catch {
            continue;
          }
          if (delivery.deliveryStatus === 'SENT') {
            msg.innerHTML = `Invitation emailed to <strong>${esc(invite.otpDestination)}</strong>, the address entered above. Check that inbox, then Spam and Promotions.${devNote}`;
            sendBtn.textContent = '✓ Invitation emailed';
            break;
          }
          if (delivery.deliveryStatus === 'FAILED') {
            msg.innerHTML = `The invitation was saved, but the email was not delivered. ${esc(delivery.message || 'Check System Admin email settings.')}`;
            sendBtn.textContent = 'Email failed';
            sendBtn.disabled = false;
            break;
          }
        }
        if (msg && sendBtn.textContent === '✓ Invitation created') {
          msg.innerHTML = `The invitation is saved for <strong>${esc(invite.otpDestination)}</strong>. The email is still going out — check the inbox, then Spam and Promotions.${devNote}`;
        }
      } catch (e) {
        alert(e instanceof ApiError ? e.message : 'Invite failed.');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send invitation';
      }
    });
  }
}
