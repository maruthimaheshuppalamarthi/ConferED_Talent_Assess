import { ApiError } from '../services/authApi';
import { JobItem, JobStatus, recruiterApi } from '../services/recruiterApi';
import { Assessment, Question, QuestionCategory, Section } from '../types';

const ALL_TYPES = ['mcq', 'msq', 'drag_drop', 'coding', 'sql', 'essay'];
const EXAM_SECTIONS = ['Quantitative Aptitude', 'Logical Reasoning', 'English', 'Technical'];
const EXAM_CATEGORIES = ['MCQ', 'Theory', 'Coding'];

const categoryOf = (q: Question) =>
  q.type === 'essay' ? 'Theory' : (q.type === 'coding' || q.type === 'sql' ? 'Coding' : 'MCQ');
const JOB_STATUSES: JobStatus[] = ['draft', 'open', 'closed'];

/** Assessment Builder: pick a job, then edit only that job's exam sections. */
export class AssessmentBuilderPanel {
  private container: HTMLElement;
  private jobs: JobItem[] = [];
  private openJobId = '';
  private openSection = '';
  private questionsByJob: Record<string, Question[]> = {};
  private loadingJobId = '';
  private pendingStatus: Record<string, JobStatus> = {};
  private activeJobId = '';
  private assessment: Assessment | null = null;
  private jobQuestions: Question[] = [];
  private categories: QuestionCategory[] = [];
  private loading = true;
  private error = '';

  constructor(container: HTMLElement) {
    this.container = container;
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
      const jobs = await recruiterApi.jobs();
      this.jobs = jobs.items || [];
      if (this.openJobId && !this.jobs.some(j => j.id === this.openJobId)) {
        this.openJobId = '';
        this.openSection = '';
      }
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Could not load jobs.';
      this.jobs = [];
      this.assessment = null;
    } finally {
      this.loading = false;
      this.paint();
    }
  }

  private activeJob(): JobItem | null {
    return this.jobs.find(j => j.id === this.activeJobId) || null;
  }

  private async loadActiveExam(): Promise<void> {
    const job = this.activeJob();
    if (!job) {
      this.assessment = null;
      this.jobQuestions = [];
      return;
    }
    const [assessment, questions] = await Promise.all([
      recruiterApi.assessment(job.assessmentId),
      recruiterApi.jobQuestions(job.id),
    ]);
    this.assessment = assessment;
    this.jobQuestions = questions.items || [];
  }

  private paint() {
    if (this.loading) {
      this.container.innerHTML = `<p class="text-xs text-slate-500 font-mono py-8">Loading jobs…</p>`;
      return;
    }
    if (this.error) {
      this.container.innerHTML = `<p class="text-xs text-red-400 font-semibold py-8">${esc(this.error)}</p>`;
      return;
    }

    this.container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-white">Jobs</h2>
            <p class="text-xs text-slate-400 mt-0.5">All jobs are listed here. Open a job to see its sections, then open a section to see its questions.</p>
          </div>
          <button id="add-job-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">+ Create job</button>
        </div>
        ${this.jobs.length ? `
          <div class="space-y-3">
            ${this.jobs.map(j => this.jobRow(j)).join('')}
          </div>
        ` : `<p class="text-xs text-slate-500">No jobs yet. Create one to start an empty exam.</p>`}
      </div>
      <div id="admin-modal-host"></div>`;

    this.attachEvents();
  }

  private jobRow(job: JobItem): string {
    const open = job.id === this.openJobId;
    const questions = this.questionsByJob[job.id] || [];
    const loading = this.loadingJobId === job.id;
    return `
      <div class="rounded-2xl bg-slate-900 border ${open ? 'border-violet-500/40' : 'border-slate-800'}">
        <div class="flex items-start gap-3 p-4">
          <button data-job-toggle="${esc(job.id)}" class="flex-1 min-w-0 text-left">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-slate-500 text-xs">${open ? '▾' : '▸'}</span>
              <span class="text-sm font-bold text-white">${esc(job.title)}</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusTone(job.status)}">${esc(job.status)}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 pl-5">${job.description ? esc(job.description) : 'No description yet.'}</p>
          </button>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <select data-job-status="${esc(job.id)}" class="glass-input px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs">
              ${JOB_STATUSES.map(s => `<option value="${s}" ${(this.pendingStatus[job.id] || job.status) === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            ${(this.pendingStatus[job.id] && this.pendingStatus[job.id] !== job.status) ? `<button data-job-save="${esc(job.id)}" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">Save</button>` : ''}
            <button data-job-edit="${esc(job.id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700">Edit</button>
            <button data-job-del="${esc(job.id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700">Delete</button>
          </div>
        </div>
        ${open ? `
          <div class="px-4 pb-4 space-y-2">
            ${loading ? `<p class="text-xs text-slate-500 pl-5">Loading sections…</p>` : EXAM_SECTIONS.map(name => this.sectionRow(job.id, name, questions)).join('')}
          </div>
        ` : ''}
      </div>`;
  }

  private sectionRow(jobId: string, name: string, questions: Question[]): string {
    const inSection = questions.filter(q => (q.sectionCategory || '') === name);
    const open = jobId === this.openJobId && this.openSection === name;
    return `
      <div class="rounded-xl border border-slate-800 bg-slate-950/60">
        <button data-section-toggle="${esc(name)}" class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
          <span class="text-sm font-semibold text-white"><span class="text-slate-500 mr-2">${open ? '▾' : '▸'}</span>${esc(name)}</span>
          <span class="text-xs font-mono text-slate-400"><b class="text-purple-400">${inSection.length}</b> questions</span>
        </button>
        ${open ? `
          <div class="px-4 pb-4 space-y-3">
            ${inSection.length ? EXAM_CATEGORIES.map(cat => {
              const items = inSection.filter(q => categoryOf(q) === cat);
              if (!items.length) return '';
              return `
                <div class="space-y-1.5 pl-5">
                  <p class="text-[11px] font-bold text-indigo-300">${esc(cat)}</p>
                  ${items.map(q => questionLine(q)).join('')}
                </div>`;
            }).join('') : `<p class="text-[11px] text-slate-500 pl-5">No questions in this section yet. Assign them from the Question Bank.</p>`}
          </div>
        ` : ''}
      </div>`;
  }

  private attachEvents() {
    this.container.querySelector('#add-job-btn')?.addEventListener('click', () => this.renderJobModal());
    this.container.querySelectorAll('[data-job-toggle]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-job-toggle') || '';
        if (id) void this.toggleJob(id);
      });
    });
    this.container.querySelectorAll('[data-section-toggle]').forEach(btn => {
      btn.addEventListener('click', e => {
        const name = (e.currentTarget as HTMLElement).getAttribute('data-section-toggle') || '';
        this.openSection = this.openSection === name ? '' : name;
        this.paint();
      });
    });
    this.container.querySelectorAll('[data-job-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-job-edit') || '';
        const job = this.jobs.find(j => j.id === id);
        if (job) this.renderJobModal(job);
      });
    });
    this.container.querySelectorAll('[data-job-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-job-del') || '';
        const job = this.jobs.find(j => j.id === id);
        if (job && confirm(`Delete “${job.title}” and its exam?`)) void this.deleteJob(job);
      });
    });
    this.container.querySelectorAll('[data-job-status]').forEach(sel => {
      sel.addEventListener('change', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-job-status') || '';
        const status = (e.currentTarget as HTMLSelectElement).value as JobStatus;
        const job = this.jobs.find(j => j.id === id);
        if (!job) return;
        if (status === job.status) delete this.pendingStatus[id];
        else this.pendingStatus[id] = status;
        this.paint();
      });
    });
    this.container.querySelectorAll('[data-job-save]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-job-save') || '';
        const job = this.jobs.find(j => j.id === id);
        const status = this.pendingStatus[id];
        if (job && status) void this.setStatus(job, status);
      });
    });
    this.container.querySelectorAll('[data-sec-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        const secId = (e.currentTarget as HTMLElement).getAttribute('data-sec-edit');
        const sec = this.assessment?.sections.find(s => s.id === secId);
        if (sec) this.renderSectionModal(sec);
      });
    });
    this.container.querySelectorAll('[data-sec-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        const secId = (e.currentTarget as HTMLElement).getAttribute('data-sec-del');
        if (secId && confirm('Delete this section from the exam?')) void this.deleteSection(secId);
      });
    });
  }

  private async toggleJob(id: string) {
    if (this.openJobId === id) {
      this.openJobId = '';
      this.openSection = '';
      this.paint();
      return;
    }
    this.openJobId = id;
    this.openSection = '';
    this.activeJobId = id;
    this.loadingJobId = id;
    this.paint();
    try {
      const data = await recruiterApi.jobQuestions(id);
      this.questionsByJob[id] = data.items || [];
    } catch (e) {
      this.questionsByJob[id] = [];
      alert(e instanceof ApiError ? e.message : 'Could not load this job.');
    } finally {
      this.loadingJobId = '';
    }
    this.paint();
  }

  private async selectJob(id: string) {
    this.activeJobId = id;
    this.loading = true;
    this.paint();
    try {
      await this.loadActiveExam();
      this.error = '';
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Could not open this job.';
      this.assessment = null;
    } finally {
      this.loading = false;
      this.paint();
    }
  }

  private async setStatus(job: JobItem, status: JobStatus) {
    try {
      const updated = await recruiterApi.updateJob(job.id, { status });
      this.jobs = this.jobs.map(j => j.id === updated.id ? updated : j);
      delete this.pendingStatus[job.id];
      this.paint();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not update status.');
      this.paint();
    }
  }

  private async deleteJob(job: JobItem) {
    try {
      await recruiterApi.deleteJob(job.id);
      this.jobs = this.jobs.filter(j => j.id !== job.id);
      delete this.questionsByJob[job.id];
      if (this.openJobId === job.id) {
        this.openJobId = '';
        this.openSection = '';
      }
      this.paint();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not delete this job.');
    }
  }

  private renderJobModal(job?: JobItem) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    const isEdit = !!job;
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">${isEdit ? 'Edit job' : 'Create job'}</h3>
            <button id="close-job-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="job-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="job-title" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Senior Software Engineer" value="${esc(job?.title || '')}" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Description</label>
              <textarea id="job-desc" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="What this hire will do">${esc(job?.description || '')}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Status</label>
              <select id="job-modal-status" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                ${JOB_STATUSES.map(s => `<option value="${s}" ${(job?.status || 'draft') === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-job-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${isEdit ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>`;
    const close = () => { host.innerHTML = ''; };
    host.querySelector('#close-job-modal')?.addEventListener('click', close);
    host.querySelector('#close-job-modal-2')?.addEventListener('click', close);
    host.querySelector('#job-form')?.addEventListener('submit', e => {
      e.preventDefault();
      void this.saveJob(job, host, close);
    });
  }

  private async saveJob(job: JobItem | undefined, host: HTMLElement, close: () => void) {
    const title = (host.querySelector('#job-title') as HTMLInputElement).value.trim();
    const description = (host.querySelector('#job-desc') as HTMLTextAreaElement).value.trim();
    const status = (host.querySelector('#job-modal-status') as HTMLSelectElement).value as JobStatus;
    if (!title) return alert('Enter a job title.');
    try {
      const saved = job
        ? await recruiterApi.updateJob(job.id, { title, description, status })
        : await recruiterApi.createJob({ title, description, status });
      this.activeJobId = saved.id;
      close();
      await this.load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not save the job.');
    }
  }

  private async persistSections(sections: Section[]): Promise<void> {
    if (!this.assessment) return;
    this.assessment = await recruiterApi.updateAssessment(this.assessment.id, { sections });
    const job = this.activeJob();
    if (job) job.sectionCount = this.assessment.sections?.length || 0;
    this.paint();
  }

  private async deleteSection(secId: string) {
    if (!this.assessment) return;
    const sections = this.assessment.sections.filter(s => s.id !== secId);
    try {
      await this.persistSections(sections);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Delete failed.');
    }
  }

  private renderSectionModal(sec?: Section) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host || !this.assessment) return;
    const isEdit = !!sec;
    const allowedTypes = new Set(sec?.allowedTypes || []);
    const allowedCats = new Set(sec?.allowedCategories || []);
    const poolIds = (sec?.questions || []).map(q => q.id);

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white">${isEdit ? 'Modify Section' : 'Add Section'}</h3>
            <button id="close-sec-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="sec-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section Name</label>
              <input id="sec-name" value="${esc(sec?.name || '')}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Technical MCQs" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Instructions</label>
              <textarea id="sec-inst" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Complete all questions in this section.">${esc(sec?.instructions || '')}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
                <input type="number" id="sec-time" value="${sec?.timeLimitMinutes ?? ''}" placeholder="15" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Passing Points</label>
                <input type="number" id="sec-pass" value="${sec?.passingMarks ?? ''}" placeholder="20" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <div>
              <p class="font-semibold text-slate-300 mb-2">Allowed question types</p>
              <div class="flex flex-wrap gap-2">
                ${ALL_TYPES.map(t => `
                  <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" class="sec-type" value="${t}" ${allowedTypes.has(t) ? 'checked' : ''} /> ${t}
                  </label>`).join('')}
              </div>
            </div>
            <div>
              <p class="font-semibold text-slate-300 mb-2">Allowed categories</p>
              <div class="flex flex-wrap gap-2">
                ${this.categories.length ? this.categories.map(c => `
                  <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" class="sec-cat" value="${esc(c.label)}" ${allowedCats.has(c.label) ? 'checked' : ''} /> ${esc(c.label)}
                  </label>`).join('') : `<p class="text-amber-300 text-[11px]">This job has no categories yet. Add them in the question bank below.</p>`}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Pick N random (blank = all)</label>
                <input type="number" id="sec-pick" value="${sec?.pickCount ?? ''}" min="1" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. 20" />
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" id="sec-rand" ${sec?.randomizeQuestions ? 'checked' : ''} /> Randomize question order
                </label>
              </div>
            </div>

            ${isEdit ? `
              <div class="border-t border-slate-800 pt-4 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-300">Assign questions <span id="pool-count" class="text-slate-500 font-mono"></span></p>
                    <p class="text-[11px] text-slate-500 mt-1">Tick questions from this job or the company library. Uncheck to remove one from the section. The question stays in its bank. Type and category limits apply to this list after you save them.</p>
                  </div>
                  <input id="elig-search" placeholder="Search…" class="glass-input w-48 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div class="flex flex-wrap gap-2">
                  ${['all', 'job', 'library'].map(src => `
                    <button type="button" data-src="${src}" class="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border ${src === 'all' ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">${src === 'all' ? 'All' : src === 'job' ? 'This job' : 'Library'}</button>
                  `).join('')}
                </div>
                <div id="elig-list" class="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-800 p-2 bg-slate-950/50"></div>
                <input type="hidden" id="sec-pool-ids" value="${esc(poolIds.join(','))}" />
                <div class="rounded-xl border border-slate-800 p-3 space-y-2 bg-slate-950/40">
                  <p class="font-semibold text-slate-300">Create on this job and attach</p>
                  ${this.categories.length ? `
                    <div class="grid grid-cols-2 gap-2">
                      <input id="new-q-title" placeholder="Question title" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                      <select id="new-q-type" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white">
                        ${ALL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                      </select>
                      <select id="new-q-cat" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white">
                        ${this.categories.map(c => `<option value="${esc(c.label)}">${esc(c.label)}</option>`).join('')}
                      </select>
                      <input id="new-q-content" placeholder="Question text" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                    </div>
                    <div id="new-q-options" class="grid grid-cols-2 gap-2">
                      <input id="new-q-opt-a" placeholder="Option A" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                      <input id="new-q-opt-b" placeholder="Option B (correct)" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                    </div>
                    <button type="button" id="create-attach-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">Create and attach</button>
                  ` : `<p class="text-amber-300 text-[11px]">Add a category in this job’s question bank before creating a question here.</p>`}
                </div>
              </div>
            ` : `<p class="text-[11px] text-slate-500">Save the section first, then assign questions to it.</p>`}

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-sec-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${isEdit ? 'SAVE' : 'ADD'}</button>
            </div>
          </form>
        </div>
      </div>`;

    let attachedNow = false;
    const close = () => { host.innerHTML = ''; };
    const dismiss = () => {
      host.innerHTML = '';
      if (attachedNow) void this.load();
    };
    host.querySelector('#close-sec-modal-btn')?.addEventListener('click', dismiss);
    host.querySelector('#close-sec-modal-btn-2')?.addEventListener('click', dismiss);
    host.querySelector('#sec-form')?.addEventListener('submit', e => {
      e.preventDefault();
      void this.saveSection(sec, host, close);
    });

    if (isEdit && sec) {
      void this.refreshEligible(sec, host, 'all');
      host.querySelector('#elig-search')?.addEventListener('input', () => {
        const src = host.querySelector('.pool-src.bg-violet-600')?.getAttribute('data-src') || 'all';
        void this.refreshEligible(sec, host, src);
      });
      host.querySelectorAll('.pool-src').forEach(btn => {
        btn.addEventListener('click', () => {
          host.querySelectorAll('.pool-src').forEach(el => {
            el.className = 'pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-slate-900 text-slate-400 border-slate-700';
          });
          btn.className = 'pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-violet-600 text-white border-violet-500';
          void this.refreshEligible(sec, host, btn.getAttribute('data-src') || 'all');
        });
      });
      const typeSel = host.querySelector('#new-q-type') as HTMLSelectElement | null;
      const optBox = host.querySelector('#new-q-options') as HTMLElement | null;
      const syncOpts = () => {
        const t = typeSel?.value || '';
        optBox?.classList.toggle('hidden', !(t === 'mcq' || t === 'msq'));
      };
      typeSel?.addEventListener('change', syncOpts);
      syncOpts();
      host.querySelector('#create-attach-btn')?.addEventListener('click', () => {
        void this.createAndAttach(sec, host).then(ok => { if (ok) attachedNow = true; });
      });
    }
  }

  private async refreshEligible(sec: Section, host: HTMLElement, source: string) {
    if (!this.assessment) return;
    const q = (host.querySelector('#elig-search') as HTMLInputElement)?.value || '';
    const list = host.querySelector('#elig-list');
    const poolInput = host.querySelector('#sec-pool-ids') as HTMLInputElement;
    if (!list || !poolInput) return;
    const selected = new Set(poolInput.value.split(',').filter(Boolean));
    try {
      const { items } = await recruiterApi.eligibleQuestions(this.assessment.id, sec.id, q || undefined);
      const visible = items.filter((item: Question) => {
        if (source === 'job') return !!item.jobId;
        if (source === 'library') return !item.jobId;
        return true;
      });
      list.innerHTML = visible.map((item: Question) => `
        <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer">
          <input type="checkbox" class="pool-q" value="${esc(item.id)}" ${selected.has(item.id) ? 'checked' : ''} />
          <span class="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${typeTone(item.type)}">${esc(item.type)}</span>
          <span class="text-slate-200 truncate">${esc(item.title)}</span>
          <span class="ml-auto shrink-0 text-[10px] font-bold ${item.jobId ? 'text-indigo-300' : 'text-slate-500'}">${item.jobId ? 'This job' : 'Library'}</span>
        </label>`).join('') || '<p class="text-slate-500 px-2 py-2">Nothing to assign. Add questions in this job’s bank or the company library.</p>';

      const writeSelection = () => {
        const visibleIds = new Set(Array.from(list.querySelectorAll('.pool-q')).map(
          el => (el as HTMLInputElement).value,
        ));
        const checked = new Set(Array.from(list.querySelectorAll('.pool-q:checked')).map(
          el => (el as HTMLInputElement).value,
        ));
        visibleIds.forEach(id => {
          if (checked.has(id)) selected.add(id);
          else selected.delete(id);
        });
        poolInput.value = Array.from(selected).join(',');
        const countEl = host.querySelector('#pool-count');
        const pickRaw = (host.querySelector('#sec-pick') as HTMLInputElement)?.value.trim();
        const pick = pickRaw ? parseInt(pickRaw, 10) : selected.size;
        const serving = pick > 0 ? Math.min(pick, selected.size) : selected.size;
        if (countEl) countEl.textContent = `(${selected.size} assigned, serving ${serving})`;
      };
      list.querySelectorAll('.pool-q').forEach(cb => cb.addEventListener('change', writeSelection));
      writeSelection();
    } catch (e) {
      list.innerHTML = `<p class="text-red-400 px-2">${esc(e instanceof ApiError ? e.message : 'Failed to load')}</p>`;
    }
  }

  private async createAndAttach(sec: Section, host: HTMLElement) {
    const job = this.activeJob();
    if (!job || !this.assessment) return;
    const title = (host.querySelector('#new-q-title') as HTMLInputElement).value.trim();
    const content = (host.querySelector('#new-q-content') as HTMLInputElement).value.trim();
    const type = (host.querySelector('#new-q-type') as HTMLSelectElement).value;
    const sectionCategory = (host.querySelector('#new-q-cat') as HTMLSelectElement).value;
    if (!title) return alert('Enter a question title.');
    const body: Record<string, unknown> = {
      type, title, content: content || title, sectionCategory, category: sectionCategory,
      difficulty: 'medium', points: 10, status: 'published',
    };
    if (type === 'mcq' || type === 'msq') {
      const a = (host.querySelector('#new-q-opt-a') as HTMLInputElement).value.trim();
      const b = (host.querySelector('#new-q-opt-b') as HTMLInputElement).value.trim();
      if (!a || !b) return alert('Enter two options. Option B is the correct one.');
      body.selectionMode = type === 'msq' ? 'multi' : 'single';
      body.options = [{ id: 'a', text: a }, { id: 'b', text: b }];
      body.correctAnswers = type === 'msq' ? ['a', 'b'] : ['b'];
    }
    try {
      const created = await recruiterApi.createJobQuestion(
        job.id, body as Partial<Question> & { type: Question['type']; title: string });
      const poolInput = host.querySelector('#sec-pool-ids') as HTMLInputElement;
      const ids = new Set((poolInput.value || '').split(',').filter(Boolean));
      ids.add(created.id);
      poolInput.value = Array.from(ids).join(',');
      await recruiterApi.attachSectionQuestions(this.assessment.id, sec.id, [created.id]);
      (host.querySelector('#new-q-title') as HTMLInputElement).value = '';
      (host.querySelector('#new-q-content') as HTMLInputElement).value = '';
      const src = host.querySelector('.pool-src.bg-violet-600')?.getAttribute('data-src') || 'all';
      await this.refreshEligible(sec, host, src);
      return true;
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not create the question.');
      return false;
    }
  }

  private async saveSection(sec: Section | undefined, host: HTMLElement, close: () => void) {
    if (!this.assessment) return;
    const name = (host.querySelector('#sec-name') as HTMLInputElement).value.trim();
    const instructions = (host.querySelector('#sec-inst') as HTMLTextAreaElement).value;
    const timeLimitMinutes = parseInt((host.querySelector('#sec-time') as HTMLInputElement).value, 10) || 15;
    const passingMarks = parseInt((host.querySelector('#sec-pass') as HTMLInputElement).value, 10) || 20;
    const allowedTypes = Array.from(host.querySelectorAll('.sec-type:checked')).map(
      el => (el as HTMLInputElement).value,
    );
    const allowedCategories = Array.from(host.querySelectorAll('.sec-cat:checked')).map(
      el => (el as HTMLInputElement).value,
    );
    const pickRaw = (host.querySelector('#sec-pick') as HTMLInputElement).value.trim();
    const pickCount = pickRaw ? parseInt(pickRaw, 10) : null;
    const randomizeQuestions = (host.querySelector('#sec-rand') as HTMLInputElement).checked;

    try {
      if (sec) {
        const poolIds = ((host.querySelector('#sec-pool-ids') as HTMLInputElement)?.value || '')
          .split(',').filter(Boolean);
        await recruiterApi.updateSection(this.assessment.id, sec.id, {
          name,
          instructions,
          timeLimitMinutes,
          passingMarks,
          allowedTypes,
          allowedCategories,
          pickCount,
          randomizeQuestions,
          questionIds: poolIds,
        });
        await this.load();
      } else {
        const sections = [...(this.assessment.sections || [])];
        sections.push({
          id: `sec-${Date.now()}`, name, description: name, instructions,
          timeLimitMinutes, passingMarks, isMandatory: true, questions: [],
          allowedTypes, allowedCategories, pickCount, randomizeQuestions,
        });
        await this.persistSections(sections);
        await this.load();
      }
      close();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Save failed.');
    }
  }
}

const questionLine = (q: Question) => `
  <div class="flex items-center gap-2 text-xs">
    <span class="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${typeTone(q.type)}">${esc(categoryOf(q))}</span>
    <span class="text-slate-200 truncate">${esc(q.title)}</span>
    <span class="ml-auto text-slate-500 shrink-0">${esc(q.difficulty)} · ${q.points} pts</span>
  </div>`;

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const typeTone = (type: string) =>
  type === 'coding' ? 'bg-blue-500/20 text-blue-300'
    : type === 'sql' ? 'bg-purple-500/20 text-purple-300'
      : type === 'essay' ? 'bg-amber-500/20 text-amber-300'
        : 'bg-emerald-500/20 text-emerald-300';

const statusTone = (status: string) =>
  status === 'open' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : status === 'closed' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-slate-800 text-slate-300 border-slate-700';
