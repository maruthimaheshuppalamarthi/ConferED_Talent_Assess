import { CsvExporterService } from '../services/csvExporter';
import { ApiError } from '../services/authApi';
import { BulkQuestionImportResult, JobItem, JobRoleItem, recruiterApi } from '../services/recruiterApi';
import { CODING_LANGUAGES, defaultStarter } from '../services/starterCode';
import { listedInputs } from '../services/testInputs';
import { LanguageStarter, Question, QuestionCategory, Section } from '../types';

const SECTIONS = ['Quantitative Aptitude', 'Logical Reasoning', 'English', 'Technical'];
const CATEGORIES: { label: string; type: Question['type'] }[] = [
  { label: 'MCQ', type: 'mcq' },
  { label: 'Theory', type: 'essay' },
  { label: 'Coding', type: 'coding' },
];

const categoryLabel = (type: string) =>
  CATEGORIES.find(c => c.type === type)?.label
  || (type === 'msq' ? 'MCQ' : type === 'sql' ? 'Coding' : type);

/** Company library, or one job's question bank when jobId is set. */
export class QuestionBankPanel {
  private container: HTMLElement;
  private jobId: string;
  private jobTitle: string;
  private questions: Question[] = [];
  private categories: QuestionCategory[] = [];
  private jobs: JobItem[] = [];
  private jobRoles: JobRoleItem[] = [];
  private filterCategory = '';
  private filterType = '';
  private filterJobId = '';
  private loading = true;
  private error = '';
  private starterDraft: Record<string, LanguageStarter> = {};
  private starterLang = 'python';

  constructor(container: HTMLElement, scope?: { jobId: string; jobTitle?: string }) {
    this.container = container;
    this.jobId = scope?.jobId || '';
    this.jobTitle = scope?.jobTitle || '';
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
      const [qData, cats, jobs] = await Promise.all([
        this.jobId
          ? recruiterApi.jobQuestions(this.jobId, {
            category: this.filterCategory || undefined,
            type: this.filterType || undefined,
          })
          : recruiterApi.questions({
            category: this.filterCategory || undefined,
            type: this.filterType || undefined,
            scope: 'all',
          }),
        recruiterApi.questionCategories(),
        recruiterApi.jobs(),
      ]);
      this.questions = this.filterJobId && !this.jobId
        ? qData.items.filter(q => q.jobId === this.filterJobId)
        : qData.items;
      this.categories = cats.items;
      this.jobs = jobs.items || [];
    } catch (e) {
      this.error = e instanceof ApiError ? e.message : 'Could not load questions.';
      this.questions = [];
    } finally {
      this.loading = false;
      this.paint();
    }
  }

  private paint() {
    if (this.loading) {
      this.container.innerHTML = `<p class="text-xs text-slate-500 font-mono py-8">Loading question bank…</p>`;
      return;
    }

    this.container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">${this.jobId ? `${esc(this.jobTitle || 'Job')} question bank` : 'Question Bank'}</h2>
            <p class="text-xs text-slate-400">Create a question, choose its section and category, and assign it to a job (${this.questions.length}).</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${this.jobId ? '' : `<button id="bulk-q-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs border border-slate-700">Bulk upload</button>`}
            <button id="export-q-csv-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700">Export CSV</button>
            <button id="create-q-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">+ Create Question</button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 items-center">
          <button data-section="" class="filter-section px-3 py-1.5 rounded-lg text-[11px] font-bold border ${!this.filterCategory ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">All sections</button>
          ${SECTIONS.map(name => `
            <button data-section="${esc(name)}" class="filter-section px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterCategory === name ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">${esc(name)}</button>
          `).join('')}
        </div>
        <div class="flex flex-wrap gap-2">
          <button data-type="" class="filter-type px-3 py-1.5 rounded-lg text-[11px] font-bold border ${!this.filterType ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">All categories</button>
          ${CATEGORIES.map(c => `
            <button data-type="${c.type}" class="filter-type px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterType === c.type ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">${c.label}</button>
          `).join('')}
        </div>
        ${this.jobs.length ? `
          <div class="flex flex-wrap gap-2">
            <button data-job="" class="filter-job px-3 py-1.5 rounded-lg text-[11px] font-bold border ${!this.filterJobId ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">All jobs</button>
            ${this.jobs.map(j => `
              <button data-job="${esc(j.id)}" class="filter-job px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterJobId === j.id ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">${esc(j.title)}</button>
            `).join('')}
          </div>
        ` : ''}

        ${this.error ? `<p class="text-xs text-red-400 font-semibold">${esc(this.error)}</p>` : ''}
        <div class="space-y-3">
          ${this.questions.map(q => `
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${typeTone(q.type)}">${esc(q.type)}</span>
                  <h4 class="text-xs font-bold text-white truncate">${esc(q.title)}</h4>
                </div>
                <p class="text-xs text-slate-300 mt-1.5 line-clamp-2">${esc(q.content || q.title)}</p>
                <p class="text-[11px] text-slate-400 mt-1">${esc(q.sectionCategory || 'No section')} • ${esc(categoryLabel(q.type))} • ${esc(this.jobName(q) || 'Not assigned')} • ${esc(q.difficulty)} • ${q.points} pts</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button data-q-edit="${q.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700">Edit</button>
                <button data-q-del="${q.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700">Delete</button>
              </div>
            </div>`).join('') || '<p class="text-xs text-slate-500">No questions yet.</p>'}
        </div>
      </div>
      <div id="admin-modal-host"></div>`;

    this.attachEvents();
  }

  private attachEvents() {
    this.container.querySelector('#create-q-btn')?.addEventListener('click', () => this.renderQuestionModal());
    this.container.querySelector('#bulk-q-btn')?.addEventListener('click', () => this.renderBulkUploadModal());
    this.container.querySelectorAll('[data-cat-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-cat-del');
        if (id && this.jobId && confirm('Delete this category?')) void this.removeCategory(id);
      });
    });
    this.container.querySelectorAll('.filter-section').forEach(btn => {
      btn.addEventListener('click', e => {
        this.filterCategory = (e.currentTarget as HTMLElement).getAttribute('data-section') || '';
        void this.load();
      });
    });
    this.container.querySelectorAll('.filter-type').forEach(btn => {
      btn.addEventListener('click', e => {
        this.filterType = (e.currentTarget as HTMLElement).getAttribute('data-type') || '';
        void this.load();
      });
    });
    this.container.querySelectorAll('.filter-job').forEach(btn => {
      btn.addEventListener('click', e => {
        this.filterJobId = (e.currentTarget as HTMLElement).getAttribute('data-job') || '';
        void this.load();
      });
    });
    this.container.querySelectorAll('[data-q-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-q-edit');
        const q = this.questions.find(item => item.id === id);
        if (q) this.renderQuestionModal(q);
      });
    });
    this.container.querySelectorAll('[data-q-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-q-del');
        if (id && confirm('Delete this question?')) void this.remove(id);
      });
    });
    this.container.querySelector('#export-q-csv-btn')?.addEventListener('click', () => {
      const headers = ['Title', 'Type', 'Category', 'Difficulty', 'Points', 'Tags'];
      const rows = this.questions.map(q => [
        q.title, q.type, q.sectionCategory || q.category, q.difficulty, q.points, (q.tags || []).join('; '),
      ]);
      CsvExporterService.downloadCsv('Question_Bank_Export.csv', headers, rows);
    });
  }

  private jobName(q: Question): string {
    return this.jobs.find(j => j.id === q.jobId)?.title || q.jobRole || '';
  }

  private async removeCategory(id: string) {
    if (!this.jobId) return;
    try {
      await recruiterApi.deleteJobCategory(this.jobId, id);
      if (this.categories.find(c => c.id === id)?.label === this.filterCategory) this.filterCategory = '';
      await this.load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not delete the category.');
    }
  }

  private renderSectionModal() {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    if (!this.jobs.length) {
      alert('Create a job in the Assessment Builder first.');
      return;
    }
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Add section to a job</h3>
            <button id="close-sec-bank" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="sec-bank-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Job</label>
              <select id="sec-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                ${this.jobs.map(j => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section name</label>
              <input id="sec-name" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Technical MCQs" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Minutes</label>
                <input id="sec-mins" type="number" value="15" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Cutoff</label>
                <input id="sec-pass" type="number" value="10" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-sec-bank-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Add</button>
            </div>
          </form>
        </div>
      </div>`;
    const close = () => { host.innerHTML = ''; };
    host.querySelector('#close-sec-bank')?.addEventListener('click', close);
    host.querySelector('#close-sec-bank-2')?.addEventListener('click', close);
    host.querySelector('#sec-bank-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const jobId = (host.querySelector('#sec-job') as HTMLSelectElement).value;
      const name = (host.querySelector('#sec-name') as HTMLInputElement).value.trim();
      const timeLimitMinutes = parseInt((host.querySelector('#sec-mins') as HTMLInputElement).value, 10) || 15;
      const passingMarks = parseInt((host.querySelector('#sec-pass') as HTMLInputElement).value, 10) || 10;
      if (!name) return;
      void recruiterApi.createJobSection(jobId, { name, timeLimitMinutes, passingMarks }).then(() => {
        close();
        return this.load();
      }).catch(err => {
        alert(err instanceof ApiError ? err.message : 'Could not add the section.');
      });
    });
  }

  private renderCategoryModal() {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Add category</h3>
            <button id="close-cat-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="cat-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Name</label>
              <input id="cat-label" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. SQL" autocomplete="off" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-cat-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Add</button>
            </div>
          </form>
        </div>
      </div>`;
    const close = () => { host.innerHTML = ''; };
    host.querySelector('#close-cat-modal')?.addEventListener('click', close);
    host.querySelector('#close-cat-modal-2')?.addEventListener('click', close);
    host.querySelector('#cat-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const label = (host.querySelector('#cat-label') as HTMLInputElement).value.trim();
      if (!label) return;
      const save = this.jobId
        ? recruiterApi.createJobCategory(this.jobId, label)
        : recruiterApi.createCategory(label);
      void save.then(() => {
        close();
        return this.load();
      }).catch(err => {
        alert(err instanceof ApiError ? err.message : 'Could not add the category.');
      });
    });
  }

  private async remove(id: string) {
    try {
      await recruiterApi.deleteQuestion(id);
      await this.load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Delete failed.');
    }
  }

  private renderQuestionModal(q?: Question) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    if (this.jobId && !this.categories.length) {
      alert('Add a category for this job first.');
      return;
    }
    const isEdit = !!q;
    const opts = q?.options?.length ? q.options : [
      { id: 'opt-a', text: '' }, { id: 'opt-b', text: '' },
    ];
    const cases = q?.testCases?.length ? q.testCases : [
      { id: 'tc-1', input: '', expectedOutput: '', isHidden: false, weight: 1 },
      { id: 'tc-2', input: '', expectedOutput: '', isHidden: true, weight: 1 },
    ];
    const catVal = q?.sectionCategory || q?.category || 'General';

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white">${isEdit ? 'Modify Question' : 'Create Question'}</h3>
            <button id="close-q-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="q-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="q-title" value="${esc(q?.title || '')}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Stem / Content</label>
              <textarea id="q-content" rows="3" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${esc(q?.content || '')}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Explanation</label>
              <textarea id="q-explanation" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Why this answer is correct. Candidates do not see this during the exam.">${esc(q?.explanation || '')}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Section</label>
                <select id="q-cat" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${SECTIONS.map(name => `<option value="${esc(name)}" ${name === catVal ? 'selected' : ''}>${esc(name)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Category</label>
                <select id="q-type" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${CATEGORIES.map(c => `<option value="${c.type}" ${q?.type === c.type || (!q && c.type === 'mcq') ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Assign to job</label>
                <select id="q-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="">Not assigned</option>
                  ${this.jobs.map(j => {
                    const closed = j.status === 'closed';
                    const selected = q?.jobId === j.id;
                    if (closed && !selected) return '';
                    return `<option value="${esc(j.id)}" ${selected ? 'selected' : ''} ${closed ? 'disabled' : ''}>${esc(j.title)}${closed ? ' (closed)' : ''}</option>`;
                  }).join('')}
                </select>
              </div>
            </div>
            <p class="text-[11px] text-slate-500">Assigning a job shows this question in the Assessment Builder under the section and category you chose.</p>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty</label>
                <select id="q-diff" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${['easy', 'medium', 'hard'].map(d => `<option value="${d}" ${q?.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Points</label>
                <input type="number" id="q-points" value="${q?.points || 10}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Stem format</label>
                <select id="q-stem" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="plain" ${q?.stemFormat !== 'markdown' ? 'selected' : ''}>plain</option>
                  <option value="markdown" ${q?.stemFormat === 'markdown' ? 'selected' : ''}>markdown</option>
                </select>
              </div>
            </div>

            <div id="panel-mcq" class="space-y-3 hidden">
              <div class="flex items-center justify-between">
                <p class="font-semibold text-slate-300" id="opts-label">Options</p>
                <button type="button" id="add-opt" class="text-blue-400 font-bold">+ Add</button>
              </div>
              <p id="drag-hint" class="text-[11px] text-slate-500 hidden">List items in the <b>correct order</b>. Candidates will reorder them via drag-and-drop (order is never shown to them).</p>
              <div id="opts-list" class="space-y-2">
                ${opts.map((o, i) => optionRow(o.id, o.text, (q?.correctAnswers || []).includes(o.id), i, q?.type === 'drag_drop')).join('')}
              </div>
            </div>

            <div id="panel-coding" class="space-y-3 hidden">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Constraints</label>
                <textarea id="q-constraints" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${esc(q?.constraints || '')}</textarea>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">I/O format</label>
                <textarea id="q-io" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${esc(q?.ioFormat || '')}</textarea>
              </div>
              <div id="starter-block" class="space-y-2">
                <p class="font-semibold text-slate-300">Starter code</p>
                <p class="text-[11px] text-slate-500">Each language opens with its own syntax. The candidate writes between the two blocks, and both blocks stay locked. Edit a language, or clear both boxes to leave it unlocked.</p>
                <div id="starter-tabs" class="flex flex-wrap gap-1.5"></div>
                <label class="block font-semibold text-slate-400">Code before (locked)</label>
                <textarea id="starter-before" rows="8" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" spellcheck="false"></textarea>
                <p class="text-[10px] text-blue-300">Candidate writes here</p>
                <label class="block font-semibold text-slate-400">Code after (locked)</label>
                <textarea id="starter-after" rows="8" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" spellcheck="false"></textarea>
              </div>
              <p class="font-semibold text-slate-300">Test cases (include ≥1 hidden for publish)</p>
              <p class="text-[11px] text-slate-500">One test case can hold Input 1, Input 2, and more. The program receives them as separate lines, in that order. Shift+Enter adds a line inside one input.</p>
              <div id="tc-list" class="space-y-2">
                ${cases.map((c, i) => tcRow(c, i)).join('')}
              </div>
              <button type="button" id="add-tc" class="text-blue-400 font-bold">+ Add test case</button>
            </div>

            <div id="panel-essay" class="space-y-3 hidden">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Min words</label>
                  <input type="number" id="q-minw" value="${q?.essayMinWords || 50}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max words</label>
                  <input type="number" id="q-maxw" value="${q?.essayMaxWords || 500}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Rubric</label>
                <textarea id="q-rubric" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${esc(q?.rubric || '')}</textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-q-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${isEdit ? 'SAVE' : 'CREATE'}</button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { host.innerHTML = ''; };
    host.querySelector('#close-q-modal-btn')?.addEventListener('click', close);
    host.querySelector('#close-q-modal-btn-2')?.addEventListener('click', close);

    const syncPanels = () => {
      const t = (host.querySelector('#q-type') as HTMLSelectElement).value;
      const showOpts = t === 'mcq' || t === 'msq' || t === 'drag_drop';
      host.querySelector('#panel-mcq')?.classList.toggle('hidden', !showOpts);
      host.querySelector('#panel-coding')?.classList.toggle('hidden', !(t === 'coding' || t === 'sql'));
      host.querySelector('#starter-block')?.classList.toggle('hidden', t !== 'coding');
      host.querySelector('#panel-essay')?.classList.toggle('hidden', t !== 'essay');
      host.querySelector('#drag-hint')?.classList.toggle('hidden', t !== 'drag_drop');
      const label = host.querySelector('#opts-label');
      if (label) label.textContent = t === 'drag_drop' ? 'Items (correct order top → bottom)' : 'Options';
      host.querySelectorAll('.opt-correct').forEach(el => {
        (el as HTMLElement).style.display = t === 'drag_drop' ? 'none' : '';
      });
    };
    host.querySelector('#q-type')?.addEventListener('change', syncPanels);
    syncPanels();
    this.mountStarterEditor(host, q);
    host.querySelector('#q-form')?.addEventListener('keydown', event => {
      const keyEvent = event as KeyboardEvent;
      const target = keyEvent.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (!target.classList.contains('tc-in') && !target.classList.contains('tc-out')) return;
      if (keyEvent.key === 'Enter' && keyEvent.shiftKey) {
        keyEvent.preventDefault();
        const start = target.selectionStart;
        const end = target.selectionEnd;
        target.value = `${target.value.slice(0, start)}\n${target.value.slice(end)}`;
        target.selectionStart = target.selectionEnd = start + 1;
      }
    });
    const jobSel = host.querySelector('#q-job') as HTMLSelectElement | null;
    jobSel?.addEventListener('change', () => { void this.fillSections(host, q); });
    void this.fillSections(host, q);

    host.querySelector('#add-opt')?.addEventListener('click', () => {
      const list = host.querySelector('#opts-list');
      if (!list) return;
      const id = `opt-${Date.now()}`;
      list.insertAdjacentHTML('beforeend', optionRow(id, '', false, list.children.length));
    });
    host.querySelector('#add-tc')?.addEventListener('click', () => {
      const list = host.querySelector('#tc-list');
      if (!list) return;
      list.insertAdjacentHTML('beforeend', tcRow({
        id: `tc-${Date.now()}`, input: '', inputs: [''], expectedOutput: '', isHidden: true, weight: 1,
      }, list.children.length));
    });
    host.querySelector('#tc-list')?.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const add = target.closest('.add-tc-input');
      if (add) {
        const box = add.closest('[data-tc-row]')?.querySelector('.tc-inputs');
        if (!box) return;
        box.insertAdjacentHTML('beforeend', tcInputSlot('', box.querySelectorAll('.tc-input-slot').length));
        return;
      }
      const remove = target.closest('.remove-tc-input');
      const slot = remove?.closest('.tc-input-slot');
      const box = slot?.parentElement;
      if (!slot || !box || box.querySelectorAll('.tc-input-slot').length < 2) return;
      slot.remove();
      box.querySelectorAll('.tc-input-label').forEach((label, index) => {
        label.textContent = `Input ${index + 1}`;
      });
    });

    host.querySelector('#q-form')?.addEventListener('submit', e => {
      e.preventDefault();
      void this.saveQuestion(q, host, close);
    });
  }

  private async fillSections(host: HTMLElement, q?: Question) {
    const sel = host.querySelector('#q-section') as HTMLSelectElement | null;
    const jobId = (host.querySelector('#q-job') as HTMLSelectElement | null)?.value || '';
    if (!sel) return;
    if (!jobId) {
      sel.innerHTML = `<option value="">Choose a job first</option>`;
      return;
    }
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;
    try {
      const exam = await recruiterApi.assessment(job.assessmentId);
      const current = exam.sections.find(s => (s.questions || []).some(item => item.id === q?.id));
      sel.innerHTML = `<option value="">No section yet</option>${exam.sections.map(s =>
        `<option value="${esc(s.id)}" ${current?.id === s.id ? 'selected' : ''}>${esc(s.name)}</option>`,
      ).join('')}`;
    } catch {
      sel.innerHTML = `<option value="">Could not load sections</option>`;
    }
  }

  private flushStarterFields(host: HTMLElement) {
    const before = host.querySelector('#starter-before') as HTMLTextAreaElement | null;
    const after = host.querySelector('#starter-after') as HTMLTextAreaElement | null;
    if (!before || !after) return;
    this.starterDraft[this.starterLang] = { before: before.value, after: after.value };
  }

  private mountStarterEditor(host: HTMLElement, q?: Question) {
    this.starterDraft = {};
    CODING_LANGUAGES.forEach(lang => {
      const raw = q?.sampleCode?.[lang.id];
      const fallback = defaultStarter(lang.id);
      if (raw && typeof raw === 'object' && ((raw.before || '').trim() || (raw.after || '').trim())) {
        this.starterDraft[lang.id] = { before: raw.before || '', after: raw.after || '' };
      } else if (typeof raw === 'string' && raw.trim()) {
        this.starterDraft[lang.id] = { before: raw, after: '' };
      } else {
        this.starterDraft[lang.id] = fallback;
      }
    });
    this.starterLang = q?.language && this.starterDraft[q.language] ? q.language : 'python';
    const tabs = host.querySelector('#starter-tabs');
    const before = host.querySelector('#starter-before') as HTMLTextAreaElement | null;
    const after = host.querySelector('#starter-after') as HTMLTextAreaElement | null;
    const paintTabs = () => {
      if (!tabs) return;
      tabs.innerHTML = CODING_LANGUAGES.map(lang => `
        <button type="button" data-starter-lang="${lang.id}" class="px-2 py-1 rounded-lg text-[10px] font-bold border ${
          this.starterLang === lang.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-700'
        }">${esc(lang.label.split(' ')[0])}</button>
      `).join('');
      tabs.querySelectorAll<HTMLButtonElement>('[data-starter-lang]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.flushStarterFields(host);
          this.starterLang = btn.getAttribute('data-starter-lang') || 'python';
          const parts = this.starterDraft[this.starterLang] || defaultStarter(this.starterLang);
          if (before) before.value = parts.before;
          if (after) after.value = parts.after;
          paintTabs();
        });
      });
    };
    const current = this.starterDraft[this.starterLang] || { before: '', after: '' };
    if (before) before.value = current.before;
    if (after) after.value = current.after;
    paintTabs();
  }

  private async saveQuestion(q: Question | undefined, host: HTMLElement, close: () => void) {
    const type = (host.querySelector('#q-type') as HTMLSelectElement).value as Question['type'];
    const sectionCategory = (host.querySelector('#q-cat') as HTMLSelectElement).value;
    const chosenJob = (host.querySelector('#q-job') as HTMLSelectElement | null)?.value || this.jobId || '';
    const chosenSection = (host.querySelector('#q-section') as HTMLSelectElement | null)?.value || '';
    const body: Record<string, unknown> = {
      type,
      title: (host.querySelector('#q-title') as HTMLInputElement).value.trim(),
      content: (host.querySelector('#q-content') as HTMLTextAreaElement).value.trim(),
      difficulty: (host.querySelector('#q-diff') as HTMLSelectElement).value,
      points: parseInt((host.querySelector('#q-points') as HTMLInputElement).value, 10) || 10,
      sectionCategory,
      category: CATEGORIES.find(c => c.type === type)?.label || 'MCQ',
      jobId: chosenJob,
      sectionId: chosenSection,
      jobRole: this.jobs.find(j => j.id === chosenJob)?.title || null,
      stemFormat: (host.querySelector('#q-stem') as HTMLSelectElement).value,
      explanation: (host.querySelector('#q-explanation') as HTMLTextAreaElement)?.value || '',
      tags: q?.tags || [],
      status: 'published',
    };

    if (type === 'mcq' || type === 'msq' || type === 'drag_drop') {
      body.selectionMode = type === 'msq' ? 'multi' : 'single';
      const options: { id: string; text: string }[] = [];
      const correct: string[] = [];
      host.querySelectorAll('[data-opt-row]').forEach(row => {
        const id = (row as HTMLElement).getAttribute('data-opt-row') || '';
        const text = (row.querySelector('.opt-text') as HTMLInputElement).value.trim();
        const checked = (row.querySelector('.opt-correct') as HTMLInputElement)?.checked;
        if (id && text) {
          options.push({ id, text });
          if (type === 'drag_drop') correct.push(id);
          else if (checked) correct.push(id);
        }
      });
      body.options = options;
      body.correctAnswers = correct;
    }

    if (type === 'coding' || type === 'sql') {
      body.constraints = (host.querySelector('#q-constraints') as HTMLTextAreaElement)?.value || '';
      body.ioFormat = (host.querySelector('#q-io') as HTMLTextAreaElement)?.value || '';
      if (type === 'coding') {
        this.flushStarterFields(host);
        const sampleCode: Record<string, LanguageStarter> = {};
        Object.entries(this.starterDraft).forEach(([lang, parts]) => {
          if ((parts.before || '').trim() || (parts.after || '').trim()) sampleCode[lang] = parts;
        });
        body.sampleCode = sampleCode;
        body.language = this.starterLang;
      }
      const testCases: unknown[] = [];
      host.querySelectorAll('[data-tc-row]').forEach(row => {
        const id = (row as HTMLElement).getAttribute('data-tc-row') || '';
        const inputs = Array.from(row.querySelectorAll('.tc-in')).map(
          el => (el as HTMLTextAreaElement).value,
        );
        testCases.push({
          id,
          inputs: inputs.length ? inputs : [''],
          input: (inputs.length ? inputs : ['']).join('\n'),
          expectedOutput: (row.querySelector('.tc-out') as HTMLTextAreaElement).value,
          isHidden: (row.querySelector('.tc-hidden') as HTMLInputElement).checked,
          weight: parseInt((row.querySelector('.tc-weight') as HTMLInputElement).value, 10) || 1,
        });
      });
      body.testCases = testCases;
    }

    if (type === 'essay') {
      body.essayMinWords = parseInt((host.querySelector('#q-minw') as HTMLInputElement).value, 10) || 50;
      body.essayMaxWords = parseInt((host.querySelector('#q-maxw') as HTMLInputElement).value, 10) || 500;
      body.rubric = (host.querySelector('#q-rubric') as HTMLTextAreaElement).value;
    }

    try {
      if (q) await recruiterApi.updateQuestion(q.id, body as Partial<Question>);
      else await recruiterApi.createQuestion(body as Partial<Question> & { type: string; title: string });
      close();
      await this.load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Save failed.');
    }
  }

  private renderBulkUploadModal() {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    let result: BulkQuestionImportResult | null = null;
    let busy = false;
    let error = '';

    const paint = () => {
      host.innerHTML = `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 class="text-lg font-extrabold text-white">Bulk upload questions</h3>
                <p class="text-xs text-slate-400 mt-0.5">Upload .xlsx / .xls / .csv — rows are parsed and stored in the question bank</p>
              </div>
              <button id="bulk-q-close" class="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            ${!result ? `
              <div>
                <label class="block font-semibold text-slate-300 mb-1 text-xs">Assign imported questions to a job</label>
                <select id="bulk-q-role" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs">
                  <option value="">— Not assigned —</option>
                  ${this.jobs.filter(j => j.status !== 'closed').map(j => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('')}
                </select>
                <p class="text-[11px] text-slate-500 mt-1">Closed jobs are not listed. A Job column in the file overrides this for that row.</p>
              </div>
              <label id="bulk-q-drop" class="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 cursor-pointer hover:border-blue-500/50 transition-colors">
                <span class="text-3xl">📤</span>
                <span class="text-sm font-bold text-white">Drop spreadsheet here or click to browse</span>
                <span class="text-[11px] text-slate-500">Columns: Question, Section, Category, Content, Difficulty, Points, Options, CorrectAnswer, Job</span>
                <input id="bulk-q-file" type="file" accept=".csv,.xlsx,.xls" class="hidden" ${busy ? 'disabled' : ''} />
              </label>
              ${busy ? `<p class="text-xs text-blue-300 font-mono">Importing…</p>` : ''}
            ` : `
              <div class="flex flex-wrap gap-2 text-[11px] font-bold">
                <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Created ${result.created}</span>
                <span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20">Failed ${result.failed}</span>
                <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Total ${result.totalRows}</span>
              </div>
              ${result.errors.length ? `
                <div class="max-h-40 overflow-y-auto rounded-xl border border-slate-800 text-[11px]">
                  ${result.errors.map(e => `
                    <div class="px-3 py-2 border-b border-slate-800/80">
                      <span class="text-slate-500 font-mono">Row ${e.rowNumber}</span>
                      <span class="text-white ml-2">${esc(e.title || '(untitled)')}</span>
                      <p class="text-red-400 mt-0.5">${esc((e.errors || []).join('; '))}</p>
                    </div>`).join('')}
                </div>
              ` : `<p class="text-xs text-emerald-300">All rows imported successfully.</p>`}
            `}

            ${error ? `<p class="text-xs text-red-400 font-semibold">${esc(error)}</p>` : ''}

            <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button type="button" id="bulk-q-sample" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold text-xs border border-slate-700">Download sample template</button>
              <button type="button" id="bulk-q-close-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>`;

      const close = () => {
        host.innerHTML = '';
        if (result && result.created > 0) void this.load();
      };
      host.querySelector('#bulk-q-close')?.addEventListener('click', close);
      host.querySelector('#bulk-q-close-2')?.addEventListener('click', close);
      host.querySelector('#bulk-q-sample')?.addEventListener('click', () => recruiterApi.downloadQuestionSample());

      const fileInput = host.querySelector('#bulk-q-file') as HTMLInputElement | null;
      const drop = host.querySelector('#bulk-q-drop');
      const jobSelect = host.querySelector('#bulk-q-role') as HTMLSelectElement | null;
      let chosenJobId = jobSelect?.value || '';
      jobSelect?.addEventListener('change', () => { chosenJobId = jobSelect.value; });
      const runUpload = async (file: File) => {
        const jobId = chosenJobId || jobSelect?.value || '';
        if (!jobId) {
          error = 'Select a job before uploading. Questions are assigned to that job.';
          paint();
          return;
        }
        busy = true;
        error = '';
        paint();
        try {
          result = await recruiterApi.bulkImportQuestions(file, jobId);
        } catch (e) {
          error = e instanceof ApiError ? e.message : 'Upload failed.';
        } finally {
          busy = false;
          paint();
        }
      };
      fileInput?.addEventListener('change', () => {
        const f = fileInput.files?.[0];
        if (f) void runUpload(f);
      });
      drop?.addEventListener('dragover', e => { e.preventDefault(); });
      drop?.addEventListener('drop', e => {
        e.preventDefault();
        const f = (e as DragEvent).dataTransfer?.files?.[0];
        if (f) void runUpload(f);
      });
    };

    paint();
  }
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const typeTone = (type: string) =>
  type === 'coding' ? 'bg-blue-500/20 text-blue-300'
    : type === 'sql' ? 'bg-purple-500/20 text-purple-300'
      : type === 'essay' ? 'bg-amber-500/20 text-amber-300'
        : type === 'msq' ? 'bg-cyan-500/20 text-cyan-300'
          : 'bg-emerald-500/20 text-emerald-300';

const optionRow = (id: string, text: string, correct: boolean, _i: number, dragMode = false) => `
  <div data-opt-row="${esc(id)}" class="flex items-center gap-2">
    <input type="checkbox" class="opt-correct" ${correct ? 'checked' : ''} title="Correct" ${dragMode ? 'style="display:none"' : ''} />
    <span class="text-slate-600 font-mono text-[10px] w-4">${_i + 1}</span>
    <input class="opt-text glass-input flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" value="${esc(text)}" placeholder="${dragMode ? 'Item text' : 'Option text'}" />
    <button type="button" class="text-slate-500 hover:text-red-400 font-bold px-1" onclick="this.closest('[data-opt-row]')?.remove()" title="Remove">×</button>
  </div>`;

const tcInputSlot = (value: string, index: number) => `
  <div class="tc-input-slot flex items-start gap-2">
    <span class="tc-input-label w-16 shrink-0 pt-2 text-[10px] font-bold text-slate-400">Input ${index + 1}</span>
    <textarea class="tc-in flex-1 glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono whitespace-pre" rows="2" placeholder="Value for this input">${esc(value)}</textarea>
    <button type="button" class="remove-tc-input text-slate-500 hover:text-red-400 font-bold px-1 pt-1" title="Remove this input">×</button>
  </div>`;

const tcRow = (c: { id: string; input: string; inputs?: string[]; expectedOutput: string; isHidden: boolean; weight: number }, _i: number) => `
  <div data-tc-row="${esc(c.id)}" class="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-bold text-slate-300">Test case ${_i + 1}</span>
      <button type="button" class="text-slate-500 hover:text-red-400 font-bold text-xs" onclick="this.closest('[data-tc-row]')?.remove()">Remove case</button>
    </div>
    <div class="tc-inputs space-y-2">
      ${listedInputs(c).map((value, index) => tcInputSlot(value, index)).join('')}
    </div>
    <button type="button" class="add-tc-input text-blue-400 text-[11px] font-bold">+ Add input</button>
    <label class="block text-[10px] font-bold text-slate-400">Expected output</label>
    <textarea class="tc-out w-full glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono whitespace-pre" rows="2" placeholder="Expected">${esc(c.expectedOutput)}</textarea>
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-1 text-slate-400 text-xs"><input type="checkbox" class="tc-hidden" ${c.isHidden ? 'checked' : ''} /> Hidden</label>
      <input type="number" class="tc-weight w-20 glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white" value="${c.weight}" title="Weight" />
    </div>
  </div>`;
