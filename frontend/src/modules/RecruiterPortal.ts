import { CsvExporterService } from '../services/csvExporter';
import { ApiError, authApi } from '../services/authApi';
import { EmailService } from '../services/emailService';
import { getPortalTab } from '../services/portalNav';
import {
  CandidateRow, JobItem, PipelineStageSlug, STAGE_SLUGS, recruiterApi,
} from '../services/recruiterApi';
import { currentRoute, portalSectionPath, router } from '../router';
import { AssessmentBuilderPanel } from './AssessmentBuilderPanel';
import { BulkInviteModal } from './BulkInviteModal';
import { CandidateDetailPanel } from './CandidateDetailPanel';
import { QuestionBankPanel } from './QuestionBankPanel';

type StageTab = 'ALL' | CandidateRow['status'];

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
  private selectedJobId: string = 'ALL';
  private jobStatusFilter: 'ALL' | 'open' | 'draft' | 'closed' = 'ALL';
  private allRows: CandidateRow[] = [];
  private jobs: JobItem[] = [];
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

    void this.initData();
    this.paint();
  }

  private async initData(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.paint();
    try {
      const [pipelineData, jobsData] = await Promise.all([
        recruiterApi.pipeline(),
        recruiterApi.jobs().catch(() => ({ items: [], total: 0 })),
      ]);
      this.allRows = pipelineData.items;
      this.jobs = jobsData.items;
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Could not load data.';
      this.allRows = [];
    } finally {
      this.loading = false;
      this.paint();
    }
  }

  private get jobFilteredRows(): CandidateRow[] {
    if (this.selectedJobId === 'ALL') return this.allRows;
    const job = this.jobs.find(j => j.id === this.selectedJobId);
    if (!job) return this.allRows;
    return this.allRows.filter(c => {
      if (c.assessmentId && job.assessmentId && c.assessmentId === job.assessmentId) return true;
      if (c.roleTitle && job.title && c.roleTitle.trim().toLowerCase() === job.title.trim().toLowerCase()) return true;
      return false;
    });
  }

  private get visibleRows(): CandidateRow[] {
    const pool = this.jobFilteredRows;
    if (this.activeStageTab === 'ALL') return pool;
    return pool.filter(c => c.status === this.activeStageTab);
  }

  private countFor(tab: StageTab): number {
    const pool = this.jobFilteredRows;
    if (tab === 'ALL') return pool.length;
    return pool.filter(c => c.status === tab).length;
  }

  private jobStats(job: JobItem): { applied: number; written: number; passed: number; passPct: number } {
    const cands = this.allRows.filter(c =>
      (c.assessmentId && job.assessmentId && c.assessmentId === job.assessmentId) ||
      (c.roleTitle && job.title && c.roleTitle.trim().toLowerCase() === job.title.trim().toLowerCase())
    );
    const applied = cands.length;
    const written = cands.filter(c => c.status === 'Completed' || c.totalScore != null || c.percentage != null).length;
    const passed = cands.filter(c => c.passStatus === 'Pass' || (c.percentage != null && c.percentage >= 70)).length;
    const passPct = written > 0 ? Math.round((passed / written) * 100) : 0;
    return { applied, written, passed, passPct };
  }

  private paint() {
    const section = getPortalTab('recruiter');
    if (section === 'candidate-evaluations') {
      this.paintCandidateAssessmentsHub();
    } else {
      this.paintOverviewDashboard();
    }
  }

  /** =========================================================================
   * SCREEN 1: EXECUTIVE HIRING OVERVIEW & JOBS CATALOG (READ-ONLY DASHBOARD)
   * ========================================================================= */
  private paintOverviewDashboard() {
    const totalCands = this.allRows.length;
    const totalWritten = this.allRows.filter(c => c.status === 'Completed' || c.totalScore != null || c.percentage != null).length;
    const totalInvited = this.allRows.filter(c => c.status === 'Assessment Sent').length;
    const totalReview = this.allRows.filter(c => c.status === 'Under Review').length;
    const totalSelected = this.allRows.filter(c => c.status === 'Selected').length;
    const totalRejected = this.allRows.filter(c => c.status === 'Rejected').length;
    const totalPassed = this.allRows.filter(c => c.passStatus === 'Pass' || (c.percentage != null && c.percentage >= 70)).length;
    const passRate = totalWritten > 0 ? Math.round((totalPassed / totalWritten) * 100) : 0;

    const openJobs = this.jobs.filter(j => j.status === 'open');
    const draftJobs = this.jobs.filter(j => j.status === 'draft');
    const closedJobs = this.jobs.filter(j => j.status === 'closed');

    const visibleJobs = this.jobs.filter(j => {
      if (this.jobStatusFilter === 'ALL') return true;
      return j.status === this.jobStatusFilter;
    });

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Top Executive Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                📊 Executive Dashboard · Talent Operations
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Hiring Pipeline & Assessment Overview</h1>
            <p class="text-xs text-slate-400">High-level operational metrics and active job positions across the enterprise.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button id="nav-evaluations-btn" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all">
              <span>🎯 Go to Candidate Assessments</span>
              <span>→</span>
            </button>
            <button id="view-sent-emails-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Sent invites</button>
            <button id="bulk-invite-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Bulk invite</button>
            <button id="invite-cand-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs">+ Invite</button>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">👥 Total Candidates</span>
            <div class="text-2xl font-extrabold font-mono text-white mt-1">${totalCands}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Applied across all jobs</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">✉️ Invited / Sent</span>
            <div class="text-2xl font-extrabold font-mono text-blue-400 mt-1">${totalInvited}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Awaiting exam</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">📝 Exams Written</span>
            <div class="text-2xl font-extrabold font-mono text-purple-400 mt-1">${totalWritten}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Evaluated answers</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">⏳ In Review</span>
            <div class="text-2xl font-extrabold font-mono text-amber-400 mt-1">${totalReview}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Hold for interview</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">🏆 Selected / Hired</span>
            <div class="text-2xl font-extrabold font-mono text-emerald-400 mt-1">${totalSelected}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Hiring decided</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">🚫 Rejected</span>
            <div class="text-2xl font-extrabold font-mono text-rose-400 mt-1">${totalRejected}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Did not qualify</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">📈 Pass Rate %</span>
            <div class="text-2xl font-extrabold font-mono ${passRate >= 70 ? 'text-emerald-400' : 'text-amber-400'} mt-1">${passRate}%</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">${totalPassed} passed cutoff</span>
          </div>
        </div>

        <!-- Pipeline Conversion Funnel Bar -->
        <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold">
            <span class="text-slate-400">📊 Enterprise Candidate Lifecycle Flow</span>
            <span class="text-[11px] font-mono text-slate-500">${totalWritten} completed out of ${totalCands} (${totalCands > 0 ? Math.round((totalWritten / totalCands) * 100) : 0}% completion)</span>
          </div>
          <div class="w-full bg-slate-900 rounded-xl h-3 overflow-hidden flex border border-slate-800 p-0.5">
            ${totalCands > 0 ? `
              <div title="Invited: ${totalInvited}" style="width: ${(totalInvited / totalCands) * 100}%" class="bg-blue-500 h-full rounded-sm transition-all"></div>
              <div title="Written: ${totalWritten}" style="width: ${(totalWritten / totalCands) * 100}%" class="bg-purple-500 h-full rounded-sm transition-all"></div>
              <div title="In Review: ${totalReview}" style="width: ${(totalReview / totalCands) * 100}%" class="bg-amber-500 h-full rounded-sm transition-all"></div>
              <div title="Selected: ${totalSelected}" style="width: ${(totalSelected / totalCands) * 100}%" class="bg-emerald-500 h-full rounded-sm transition-all"></div>
              <div title="Rejected: ${totalRejected}" style="width: ${(totalRejected / totalCands) * 100}%" class="bg-rose-500 h-full rounded-sm transition-all"></div>
            ` : '<div class="w-full bg-slate-800 h-full rounded-sm"></div>'}
          </div>
          <div class="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-0.5">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Invited (${totalInvited})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Tests Written (${totalWritten})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> In Review (${totalReview})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Selected (${totalSelected})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Rejected (${totalRejected})</span>
          </div>
        </div>

        <!-- Read-Only Jobs Catalog & Status Board -->
        <div class="glass-panel p-0 rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/70 shadow-xl space-y-0">
          <div class="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
            <div>
              <h2 class="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                <span>🏢 Active Job Positions Directory</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${this.jobs.length} Positions</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Read-only job directory. Click 'Evaluate Candidates' on any job to view candidate marks and answer keys.</p>
            </div>

            <!-- Job Status Filter Pills -->
            <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button data-job-status-filter="ALL" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                All (${this.jobs.length})
              </button>
              <button data-job-status-filter="open" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter === 'open' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                Open (${openJobs.length})
              </button>
              <button data-job-status-filter="draft" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                Draft (${draftJobs.length})
              </button>
              <button data-job-status-filter="closed" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter === 'closed' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                Closed (${closedJobs.length})
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-left text-xs font-mono border-collapse">
              <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  ${['#', 'Job Title', 'Status', 'Assessment Linked', 'Sections', 'Applied', 'Written', 'Pass Rate', 'Created Date', 'Action']
                    .map(h => `<th class="px-4 py-3 border-b border-slate-800 whitespace-nowrap font-bold">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${visibleJobs.length === 0 ? `
                  <tr><td colspan="10" class="px-4 py-12 text-center text-slate-500">No jobs match this status filter.</td></tr>
                ` : visibleJobs.map((job, i) => {
                  const stats = this.jobStats(job);
                  const statusTone =
                    job.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    job.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20';

                  return `
                    <tr class="hover:bg-slate-900/40 transition-colors">
                      <td class="px-4 py-3.5 text-slate-500 font-mono">${i + 1}</td>
                      <td class="px-4 py-3.5">
                        <span class="font-sans font-bold text-white text-sm block">${esc(job.title)}</span>
                        ${job.description ? `<span class="font-sans text-[11px] text-slate-400 truncate max-w-xs block mt-0.5">${esc(job.description)}</span>` : ''}
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg border uppercase whitespace-nowrap ${statusTone}">
                          ${esc(job.status)}
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-slate-300 font-sans">${esc(job.title)} Assessment</td>
                      <td class="px-4 py-3.5 text-indigo-400 font-bold">${job.sectionCount || 4} sections</td>
                      <td class="px-4 py-3.5 font-bold text-white">${stats.applied}</td>
                      <td class="px-4 py-3.5 font-bold text-purple-400">${stats.written}</td>
                      <td class="px-4 py-3.5 font-bold ${stats.passPct >= 70 ? 'text-emerald-400' : 'text-amber-400'}">${stats.passPct}%</td>
                      <td class="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</td>
                      <td class="px-4 py-3.5 whitespace-nowrap">
                        <button data-inspect-job="${esc(job.id)}" class="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-xs transition-all flex items-center gap-1">
                          <span>Evaluate Candidates</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div id="invite-modal-host"></div>
      </div>`;

    this.attachOverviewEvents();
  }

  private attachOverviewEvents() {
    this.container.querySelector('#nav-evaluations-btn')?.addEventListener('click', () => {
      router.navigate('/recruiter/candidate-assessments');
    });

    this.container.querySelectorAll('[data-job-status-filter]').forEach(btn => {
      btn.addEventListener('click', e => {
        this.jobStatusFilter = (e.currentTarget as HTMLElement).getAttribute('data-job-status-filter') as any;
        this.paint();
      });
    });

    this.container.querySelectorAll('[data-inspect-job]').forEach(btn => {
      btn.addEventListener('click', e => {
        const jobId = (e.currentTarget as HTMLElement).getAttribute('data-inspect-job');
        if (jobId) {
          this.selectedJobId = jobId;
          router.navigate('/recruiter/candidate-assessments');
        }
      });
    });

    this.container.querySelector('#view-sent-emails-btn')?.addEventListener('click', () => this.renderSentEmailsModal());
    this.container.querySelector('#bulk-invite-btn')?.addEventListener('click', () => this.renderBulkInvite());
    this.container.querySelector('#invite-cand-btn')?.addEventListener('click', () => this.renderInviteModal());
  }

  /** =========================================================================
   * SCREEN 2: DEDICATED CANDIDATE ASSESSMENTS HUB
   * ========================================================================= */
  private paintCandidateAssessmentsHub() {
    const stages: StageTab[] = ['ALL', ...STAGE_SLUGS.map(s => s.status)];
    const pool = this.jobFilteredRows;
    const rows = this.visibleRows;

    const selectedJob = this.jobs.find(j => j.id === this.selectedJobId);
    const jobStats = selectedJob ? this.jobStats(selectedJob) : {
      applied: this.allRows.length,
      written: this.allRows.filter(c => c.status === 'Completed' || c.totalScore != null).length,
      passed: this.allRows.filter(c => c.passStatus === 'Pass' || (c.percentage != null && c.percentage >= 70)).length,
      passPct: 0,
    };
    if (!selectedJob && jobStats.written > 0) {
      jobStats.passPct = Math.round((jobStats.passed / jobStats.written) * 100);
    }

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Top Hub Header with Unified Single Export Button -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                🎯 Candidate Evaluations · Assessment Tracker
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Candidate Assessments & Performance Hub</h1>
            <p class="text-xs text-slate-400">Select a job position to evaluate candidate performances, inspect question scorecards, and export reports.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <div class="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="view-table-btn" title="Table layout" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Table</button>
              <button id="view-kanban-btn" title="Board layout by stage" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Board</button>
            </div>
            <!-- ONE SINGLE PROFESSIONAL EXPORT BUTTON -->
            <button id="unified-export-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all">
              <span>📥 Export Assessment Report (CSV)</span>
            </button>
            <button id="invite-cand-btn" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30">+ Invite</button>
          </div>
        </div>

        <!-- Prominent Job Selector Card -->
        <div class="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-1">
                🎯 Select Job Position / Assessment
              </label>
              <p class="text-xs text-slate-400">Choose a job opportunity to filter candidates and download their evaluation reports.</p>
            </div>
            <div class="w-full sm:w-80">
              <select id="hub-job-select" class="glass-input w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-xs focus:border-indigo-500 focus:outline-none">
                <option value="ALL" ${this.selectedJobId === 'ALL' ? 'selected' : ''}>All Positions (${this.allRows.length} candidates)</option>
                ${this.jobs.map(j => {
                  const s = this.jobStats(j);
                  return `<option value="${esc(j.id)}" ${this.selectedJobId === j.id ? 'selected' : ''}>${esc(j.title)} (${s.applied} applied · ${s.written} written)</option>`;
                }).join('')}
              </select>
            </div>
          </div>

          <!-- Active Job Performance Summary Header -->
          <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
                💼
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-white">${esc(selectedJob ? selectedJob.title : 'All Open & Active Positions')}</h3>
                  ${selectedJob ? `
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      selectedJob.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      selectedJob.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }">${esc(selectedJob.status)}</span>
                  ` : ''}
                </div>
                <p class="text-xs text-slate-400 font-sans mt-0.5">
                  ${selectedJob ? `Standard Exam · ${selectedJob.sectionCount || 4} Sections · Passing Cutoff: 70%` : 'Viewing combined pipeline across all active jobs'}
                </p>
              </div>
            </div>

            <!-- Job Stats Pills -->
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Applied</span>
                <span class="text-sm font-extrabold font-mono text-white">${jobStats.applied}</span>
              </div>
              <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Exams Completed</span>
                <span class="text-sm font-extrabold font-mono text-purple-400">${jobStats.written}</span>
              </div>
              <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Pass Rate</span>
                <span class="text-sm font-extrabold font-mono ${jobStats.passPct >= 70 ? 'text-emerald-400' : 'text-amber-400'}">${jobStats.passPct}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter by hiring stage tabs -->
        <div>
          <p class="text-[11px] font-semibold text-slate-500 mb-2 px-0.5">Filter by hiring stage</p>
          <div class="glass-panel p-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          ${stages.map(stg => {
            const isActive = this.activeStageTab === stg;
            const count = this.countFor(stg);
            return `
              <button data-stage-tab="${stg}" class="stage-tab-btn px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap border ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-transparent text-slate-400 hover:text-white border-transparent hover:bg-slate-900'
              }">
                <span>${STAGE_LABEL[stg]}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-900 text-slate-500'}">${count}</span>
              </button>`;
          }).join('')}
          </div>
        </div>

        ${this.error ? `<p class="text-xs text-red-400 font-semibold">${esc(this.error)}</p>` : ''}
        ${this.loading ? `<p class="text-xs text-slate-500 font-mono">Loading candidates…</p>` : ''}

        <!-- Candidates Table / Kanban View -->
        ${this.currentViewMode === 'table' ? this.candidateTableHtml() : this.candidateKanbanHtml()}

        <div id="invite-modal-host"></div>
      </div>`;

    this.attachCandidateHubEvents();
  }

  private candidateTableHtml(): string {
    const rows = this.visibleRows;
    const selectedJob = this.jobs.find(j => j.id === this.selectedJobId);
    const filterDesc = selectedJob ? `${selectedJob.title} · ` : '';

    return `
      <div class="glass-panel p-0 rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/60 shadow-xl">
        <div class="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-white tracking-wide uppercase">${filterDesc}${STAGE_LABEL[this.activeStageTab]} Candidates</h3>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${rows.length}</span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono">Click candidate name or 'Review' to inspect marks, sections & questions</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1250px] text-left text-xs font-mono border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                ${['#', 'Candidate Name', 'Email', 'Phone', 'College / Organization', 'Job Role', 'Stage', 'Score', '%', 'Violations', 'Action']
                  .map(h => `<th class="px-3.5 py-3 border border-slate-700/80 whitespace-nowrap font-bold">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.length === 0 && !this.loading
                ? `<tr><td colspan="11" class="px-4 py-12 text-center text-slate-500 border border-slate-800">No candidates match this job and stage filter.</td></tr>`
                : rows.map((c, i) => `
                  <tr class="${i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/50'} hover:bg-slate-800/40 transition-colors">
                    <td class="px-3.5 py-2.5 border border-slate-800 text-slate-500 text-center">${i + 1}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800">
                      <button data-open-cand="${c.id}" class="cand-name-click font-sans font-bold text-indigo-400 hover:text-indigo-300 hover:underline text-left block">
                        ${esc(c.name)}
                      </button>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-slate-300">${esc(c.email)}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-slate-400 whitespace-nowrap">${esc(c.phone || '—')}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 font-sans text-[11px] text-slate-300 font-medium">
                      <div class="flex items-center gap-1.5 truncate max-w-[180px]" title="${esc(c.organization || 'Not provided')}">
                        <span class="text-slate-500">🎓</span>
                        <span>${esc(c.organization || '—')}</span>
                      </div>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800 font-sans text-[11px] text-slate-300 font-medium">
                      <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">${esc(c.roleTitle || 'General')}</span>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800">
                      <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md border whitespace-nowrap ${
                        c.status === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        c.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        c.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-800 text-slate-200 border-slate-700'
                      }">${esc(STAGE_LABEL[c.status] || c.status)}</span>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-indigo-400 font-bold">${c.totalScore != null ? `${c.totalScore}/${c.maxScore}` : '—'}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 font-bold ${c.percentage != null && c.percentage >= 70 ? 'text-emerald-400' : c.percentage != null ? 'text-rose-400' : 'text-slate-500'}">${c.percentage != null ? `${c.percentage}%` : '—'}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-center ${c.violations > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}">${c.violations}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 whitespace-nowrap">
                      <button data-open-cand="${c.id}" class="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-sm transition-all flex items-center gap-1">
                        <span>Review</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  private candidateKanbanHtml(): string {
    const columns = this.activeStageTab === 'ALL' ? STAGE_SLUGS.map(s => s.status) : [this.activeStageTab];
    const pool = this.jobFilteredRows;

    return `
      <div class="flex gap-5 overflow-x-auto pb-6 pt-2">
        ${columns.map(stage => {
          const stageCands = pool.filter(c => c.status === stage);
          return `
            <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 class="text-xs font-bold text-white tracking-wide">${STAGE_LABEL[stage] || stage}</h3>
                <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-indigo-400 border border-slate-800 rounded-full">${stageCands.length}</span>
              </div>
              <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px]">
                ${stageCands.map(c => `
                  <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 cursor-pointer space-y-2.5 transition-all" data-open-cand="${c.id}">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="text-xs font-bold text-white hover:text-indigo-400">${esc(c.name)}</h4>
                        <p class="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">${esc(c.email)}</p>
                        ${c.organization ? `<p class="text-[10px] text-slate-500 font-sans mt-0.5 truncate max-w-[160px]">🎓 ${esc(c.organization)}</p>` : ''}
                      </div>
                      <span class="text-[10px] font-mono text-slate-500">${c.experienceYears}y</span>
                    </div>
                    ${c.percentage != null
                      ? `<p class="text-xs font-extrabold font-mono ${c.percentage >= 70 ? 'text-emerald-400' : 'text-rose-400'}">Score: ${c.percentage}% (${c.totalScore}/${c.maxScore})</p>`
                      : `<p class="text-[11px] text-slate-500">Awaiting assessment</p>`}
                  </div>`).join('') || `
                  <div class="p-5 text-center border border-dashed border-slate-800/80 rounded-2xl text-xs text-slate-500">No candidates in this stage.</div>`}
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  private attachCandidateHubEvents() {
    const jobSelect = this.container.querySelector('#hub-job-select') as HTMLSelectElement | null;
    jobSelect?.addEventListener('change', () => {
      this.selectedJobId = jobSelect.value;
      this.paint();
    });

    this.container.querySelectorAll('.stage-tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.activeStageTab = (e.currentTarget as HTMLElement).getAttribute('data-stage-tab') as StageTab;
        this.paint();
      });
    });

    this.container.querySelector('#view-table-btn')?.addEventListener('click', () => {
      this.currentViewMode = 'table';
      this.paint();
    });
    this.container.querySelector('#view-kanban-btn')?.addEventListener('click', () => {
      this.currentViewMode = 'kanban';
      this.paint();
    });

    this.container.querySelectorAll('[data-open-cand]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-open-cand');
        if (id) router.navigate(`/recruiter/candidates/${id}`);
      });
    });

    // SINGLE UNIFIED EXPORT BUTTON
    this.container.querySelector('#unified-export-btn')?.addEventListener('click', () => this.exportUnifiedReport());
    this.container.querySelector('#invite-cand-btn')?.addEventListener('click', () => this.renderInviteModal());
  }

  /**
   * Single Unified Comprehensive Export Button
   * Exports Candidate Name, Email, Job, College, Total Score, Section Scores, and Notes.
   */
  private exportUnifiedReport() {
    const pool = this.jobFilteredRows;
    const selectedJob = this.jobs.find(j => j.id === this.selectedJobId);
    const jobTitle = selectedJob ? selectedJob.title.replace(/\s+/g, '_') : 'All_Positions';

    // Collect all dynamic section names across candidates
    const sectionNamesSet = new Set<string>();
    pool.forEach(c => {
      if (c.sectionScores) {
        Object.keys(c.sectionScores).forEach(name => {
          if (!name.startsWith('_')) sectionNamesSet.add(name);
        });
      }
    });
    const sectionNames = Array.from(sectionNamesSet);

    // Build Comprehensive Headers
    const headers = [
      'Candidate ID',
      'Candidate Name',
      'Email',
      'Phone',
      'College / Organization',
      'Job Position / Role',
      'Hiring Status',
      'Total Score',
      'Max Score',
      'Overall Percentage (%)',
      'Pass / Fail Status',
      ...sectionNames.map(s => `${s} (Score)`),
      ...sectionNames.map(s => `${s} (%)`),
      'Proctoring Violations',
      'Recruiter Decision',
      'Recruiter Notes',
    ];

    // Build Data Rows
    const rows = pool.map(c => {
      const secScores = c.sectionScores || {};
      const secScoreVals = sectionNames.map(s => {
        const sec = secScores[s];
        return sec ? `${sec.score}/${sec.maxScore}` : 'N/A';
      });
      const secPctVals = sectionNames.map(s => {
        const sec = secScores[s];
        return sec && sec.percentage != null ? `${sec.percentage}%` : 'N/A';
      });

      return [
        c.id,
        c.name,
        c.email,
        c.phone || '',
        c.organization || 'Not provided',
        c.roleTitle || selectedJob?.title || 'General',
        c.status,
        c.totalScore ?? 'N/A',
        c.maxScore ?? 'N/A',
        c.percentage != null ? `${c.percentage}%` : 'N/A',
        c.passStatus ?? 'N/A',
        ...secScoreVals,
        ...secPctVals,
        c.violations,
        c.result?.recruiterDecision || c.status || '',
        c.result?.recruiterNotes || '',
      ];
    });

    CsvExporterService.downloadCsv(`${jobTitle}_Candidate_Assessment_Report.csv`, headers, rows);
  }

  /** Modals */
  private renderSentEmailsModal() {
    const emails = EmailService.getSentEmails();
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-800 flex flex-col bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
            <div>
              <h3 class="text-base font-extrabold text-white">Sent invites</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${emails.length} in this session</p>
            </div>
            <button id="close-email-log-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="overflow-auto flex-1 p-4">
            ${emails.length ? `
              <table class="w-full text-xs font-mono">
                <thead class="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="text-left font-semibold px-4 py-3">Recipient</th>
                    <th class="text-left font-semibold px-4 py-3">Link</th>
                    <th class="text-left font-semibold px-4 py-3">Dev Passcode</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  ${emails.map(m => `
                    <tr>
                      <td class="px-4 py-3 text-white">${esc(m.recipientName)} &lt;${esc(m.recipientEmail)}&gt;</td>
                      <td class="px-4 py-3 text-indigo-400 truncate max-w-xs">${esc(m.assessmentLink || '—')}</td>
                      <td class="px-4 py-3 text-amber-300 font-bold">${esc(m.otpCode || '—')}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            ` : '<p class="text-center text-slate-500 py-10">No invites sent in this session yet.</p>'}
          </div>
        </div>
      </div>`;
    host.querySelector('#close-email-log-btn')?.addEventListener('click', () => { host.innerHTML = ''; });
  }

  private renderBulkInvite() {
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;
    void this.openBulkInvite(host);
  }

  private async openBulkInvite(host: HTMLElement) {
    let openJobs: JobItem[] = [];
    try {
      const data = await recruiterApi.jobs();
      openJobs = data.items.filter(j => j.status === 'open');
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not load jobs.');
      return;
    }
    if (!openJobs.length) {
      alert('No open job. Set a job to open and save it before sending invitations.');
      return;
    }
    if (openJobs.length === 1) {
      new BulkInviteModal(host, openJobs[0].assessmentId, openJobs[0].title).open();
      return;
    }
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5 bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Bulk invite</h3>
            <button id="bulk-job-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <label class="block font-semibold text-slate-300 mb-1">Select Job</label>
            <select id="bulk-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
              ${openJobs.map(j => `<option value="${esc(j.id)}">${esc(j.title)} · ${esc(j.status)}</option>`).join('')}
            </select>
            <button id="bulk-job-next" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Continue</button>
          </div>
        </div>
      </div>`;
    host.querySelector('#bulk-job-close')?.addEventListener('click', () => { host.innerHTML = ''; });
    host.querySelector('#bulk-job-next')?.addEventListener('click', () => {
      const id = (host.querySelector('#bulk-job') as HTMLSelectElement).value;
      const job = openJobs.find(j => j.id === id);
      if (!job) return;
      new BulkInviteModal(host, job.assessmentId, job.title).open();
    });
  }

  private renderInviteModal() {
    const host = this.container.querySelector('#invite-modal-host') as HTMLElement;
    if (!host) return;
    void this.openInviteModal(host);
  }

  private async openInviteModal(host: HTMLElement) {
    let openJobs: JobItem[] = [];
    try {
      const data = await recruiterApi.jobs();
      openJobs = data.items.filter(j => j.status === 'open');
    } catch {
      openJobs = [];
    }

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl bg-slate-950">
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
              ${openJobs.length ? `
                <select id="inv-assess" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${openJobs.map(j => `<option value="${esc(j.assessmentId)}">${esc(j.title)} · ${esc(j.status)}</option>`).join('')}
                </select>
              ` : `<p class="text-amber-400 text-[11px]">No open job. Set a job to open and save it before sending an invitation.</p>`}
            </div>
            <button id="send-inv-btn" ${!openJobs.length ? 'disabled' : ''} class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold">Send invitation</button>
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
      void this.initData();
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
