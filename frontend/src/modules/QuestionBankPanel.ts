import { ApiError } from '../services/authApi';
import { BulkQuestionImportResult, JobItem, JobRoleItem, recruiterApi } from '../services/recruiterApi';
import { CODING_LANGUAGES, defaultStarter } from '../services/starterCode';
import { listedInputs } from '../services/testInputs';
import { LanguageStarter, Question, QuestionCategory, Section } from '../types';
import { questionBankStore, QuestionBankFolder } from '../services/questionBankStore';

const SECTIONS = ['Quantitative Aptitude', 'Logical Reasoning', 'English', 'Technical'];
const CATEGORIES: { label: string; type: Question['type'] }[] = [
  { label: 'MCQ', type: 'mcq' },
  { label: 'Theory', type: 'essay' },
  { label: 'Coding', type: 'coding' },
];

const STANDARD_CATEGORIES: { label: string; type: Question['type'] }[] = [
  { label: 'MCQ (Multiple Choice)', type: 'mcq' },
  { label: 'Theory / Essay', type: 'essay' },
];

const categoryLabel = (type: string) =>
  CATEGORIES.find(c => c.type === type)?.label
  || (type === 'msq' ? 'MCQ' : type === 'sql' ? 'Coding' : type);

/** Professional Question Bank with Folder/Bank organization */
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

  // Active folder / Question Bank ID (null = viewing all Question Bank folders)
  private activeFolderId: string | null = null;

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
      this.container.innerHTML = `<p class="text-xs text-slate-500 font-mono py-8">Loading question banks…</p>`;
      return;
    }

    const banks = questionBankStore.getBanks();

    // If an active folder is selected, render the contents of that folder
    if (this.activeFolderId) {
      const folder = questionBankStore.getBank(this.activeFolderId) || banks[0];
      this.paintFolderView(folder);
      return;
    }

    // Otherwise render the All Folders / Question Banks Hub
    this.paintAllBanksView(banks);
  }

  /** View 1: Top-Level Question Banks (Folders Grid) */
  private paintAllBanksView(banks: QuestionBankFolder[]) {
    const selectedJobTitle = this.filterJobId ? this.jobTitleName(this.filterJobId) : '';
    const displayedBanks = this.filterJobId
      ? banks.filter(b => {
          // If bank is assigned explicitly to this job
          if (b.jobId === this.filterJobId) return true;
          // If bank is assigned to a DIFFERENT job, NEVER show it
          if (b.jobId && b.jobId !== this.filterJobId) return false;
          // For general/unassigned banks (including Default Question Bank), show if it has questions for this job
          const qCount = this.questions.filter(q => questionBankStore.getBankIdForQuestion(q) === b.id).length;
          if (qCount > 0) return true;
          // If Default Bank and no custom bank exists for this job yet, show Default Bank as a fallback
          if (b.isDefault || b.id === 'qb-default') {
            const hasAssignedBank = banks.some(other => other.jobId === this.filterJobId);
            return !hasAssignedBank;
          }
          return false;
        })
      : banks;

    this.container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">📁</span>
              <h2 class="text-lg font-bold text-white">Question Banks</h2>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/20">${displayedBanks.length} ${displayedBanks.length === 1 ? 'Bank' : 'Banks'}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Organize and author question banks into folders. Open a Question Bank to create questions, coding problems, or bulk import.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button id="create-bank-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition-all">
              <span>+</span> Create Question Bank
            </button>
          </div>
        </div>

        ${this.jobs.length ? `
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-xs text-slate-400 font-semibold mr-1">Filter by Job:</span>
            <button data-job="" class="filter-job px-3 py-1 rounded-lg text-[11px] font-bold border ${!this.filterJobId ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">All jobs</button>
            ${this.jobs.map(j => `
              <button data-job="${esc(j.id)}" class="filter-job px-3 py-1 rounded-lg text-[11px] font-bold border ${this.filterJobId === j.id ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">${esc(j.title)}</button>
            `).join('')}
          </div>
        ` : ''}

        ${this.error ? `<p class="text-xs text-red-400 font-semibold">${esc(this.error)}</p>` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${displayedBanks.length ? displayedBanks.map(b => {
            const qInBank = this.questions.filter(q => questionBankStore.getBankIdForQuestion(q) === b.id);
            const mcqCount = qInBank.filter(q => q.type === 'mcq' || q.type === 'msq').length;
            const codingCount = qInBank.filter(q => q.type === 'coding' || q.type === 'sql').length;
            const theoryCount = qInBank.filter(q => q.type === 'essay').length;
            const assignedJobTitle = b.jobTitle || (b.jobId ? this.jobTitleName(b.jobId) : null);

            return `
              <div class="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${b.badgeTone || 'from-blue-600 to-indigo-600'} flex items-center justify-center text-2xl shadow-md shadow-blue-900/30">
                      📁
                    </div>
                    ${b.isDefault || b.id === 'qb-default' ? `
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <span>🔒</span> Default Bank
                      </span>
                    ` : `
                      <div class="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button data-bank-edit="${esc(b.id)}" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs" title="Edit Bank">✏️</button>
                        <button data-bank-del="${esc(b.id)}" class="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs" title="Delete Bank">🗑️</button>
                      </div>
                    `}
                  </div>

                  <div>
                    <h3 class="text-base font-bold text-white group-hover:text-blue-400 transition-colors">${esc(b.name)}</h3>
                    <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">${esc(b.description || 'Custom Question Bank folder for assessments.')}</p>
                  </div>

                  <div class="pt-1">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      <span>💼</span>
                      <span>${esc(assignedJobTitle ? assignedJobTitle : 'All Jobs / General')}</span>
                    </span>
                  </div>

                  <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span class="text-base font-extrabold font-mono text-white">${qInBank.length}</span>
                      <span class="text-[11px] text-slate-400 ml-1">Questions</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono space-x-1">
                      <span class="text-blue-400 font-semibold">${mcqCount} MCQ</span> •
                      <span class="text-emerald-400 font-semibold">${codingCount} Coding</span> •
                      <span class="text-purple-400 font-semibold">${theoryCount} Theory</span>
                    </div>
                  </div>
                </div>

                <button data-open-bank="${esc(b.id)}" class="w-full mt-4 py-2.5 px-4 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 hover:border-transparent transition-all flex items-center justify-center gap-2">
                  <span>Open Question Bank</span>
                  <span>➔</span>
                </button>
              </div>
            `;
          }).join('') : `
            <div class="col-span-full py-12 px-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                📁
              </div>
              <h4 class="text-sm font-bold text-slate-200">No Question Banks found for ${esc(selectedJobTitle || 'this job')}</h4>
              <p class="text-xs text-slate-400 max-w-md mx-auto">
                No question bank has been assigned to this job or contains questions for it yet.
              </p>
              <button id="create-bank-empty-btn" class="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all">
                + Create Question Bank for ${esc(selectedJobTitle || 'this job')}
              </button>
            </div>
          `}
        </div>
      </div>
      <div id="admin-modal-host"></div>
    `;

    this.attachAllBanksEvents();
  }

  /** View 2: Inside a Question Bank Folder */
  private paintFolderView(folder: QuestionBankFolder) {
    const qInFolder = this.questions.filter(q => questionBankStore.getBankIdForQuestion(q) === folder.id && (!this.filterJobId || q.jobId === this.filterJobId));
    const assignedJobTitle = folder.jobTitle || (folder.jobId ? this.jobTitleName(folder.jobId) : null);

    this.container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <!-- Breadcrumb & Top Bar -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
          <div class="flex items-center gap-2 text-slate-400">
            <button id="qb-back-btn" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 border border-slate-700 transition-all">
              <span>←</span> All Question Banks
            </button>
            <span class="text-slate-600">/</span>
            <span class="text-white font-bold flex items-center gap-1">
              <span>📁</span> ${esc(folder.name)}
              ${folder.isDefault || folder.id === 'qb-default' ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 ml-2">Permanent Default</span>` : ''}
            </span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono">${qInFolder.length} Questions inside</span>
        </div>

        <!-- Folder Header & Action Buttons -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${folder.badgeTone || 'from-blue-600 to-indigo-600'} flex items-center justify-center text-xl shadow">
                📁
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">${esc(folder.name)}</h2>
                <p class="text-xs text-slate-400">${esc(folder.description || 'Custom Question Bank folder.')}</p>
              </div>
            </div>
            <div class="pt-1 pl-13">
              <span class="text-[11px] font-semibold text-indigo-400">
                Assigned Job: <strong class="text-slate-200">${esc(assignedJobTitle ? assignedJobTitle : 'All Jobs / General')}</strong>
              </span>
            </div>
          </div>

          <!-- Buttons inside folder per user request: Create Question, Create Coding Question, Bulk Upload (No Export) -->
          <div class="flex flex-wrap items-center gap-2">
            <button id="bulk-q-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs border border-slate-700">
              Bulk upload
            </button>
            <button id="create-q-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">
              + Create Question
            </button>
            <button id="create-coding-q-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all">
              <span>⚡</span> + Create Coding Question
            </button>
          </div>
        </div>

        <!-- Job Filters inside Folder -->
        ${this.jobs.length ? `
          <div class="flex flex-wrap gap-2 items-center pb-1">
            <span class="text-xs text-slate-400 font-semibold mr-1">Filter by Job:</span>
            <button data-folder-job="" class="filter-folder-job px-3 py-1 rounded-lg text-[11px] font-bold border ${!this.filterJobId ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">All jobs</button>
            ${this.jobs.map(j => `
              <button data-folder-job="${esc(j.id)}" class="filter-folder-job px-3 py-1 rounded-lg text-[11px] font-bold border ${this.filterJobId === j.id ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">${esc(j.title)}</button>
            `).join('')}
          </div>
        ` : ''}

        <!-- Filter Chips inside Folder -->
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

        ${this.error ? `<p class="text-xs text-red-400 font-semibold">${esc(this.error)}</p>` : ''}

        <!-- Questions List inside Folder -->
        <div class="space-y-3">
          ${qInFolder.map(q => `
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors">
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
            </div>`).join('') || `
            <div class="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <p class="text-sm font-bold text-slate-300">No questions in this Question Bank yet</p>
              <p class="text-xs text-slate-500">Use the buttons above to create multiple choice, theory, coding challenges, or bulk upload.</p>
            </div>
          `}
        </div>
      </div>
      <div id="admin-modal-host"></div>
    `;

    this.attachFolderEvents(folder);
  }

  private attachAllBanksEvents() {
    this.container.querySelector('#create-bank-btn')?.addEventListener('click', () => {
      this.renderBankModal();
    });
    this.container.querySelector('#create-bank-empty-btn')?.addEventListener('click', () => {
      this.renderBankModal();
    });

    this.container.querySelectorAll('[data-open-bank]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-open-bank');
        if (id) {
          this.activeFolderId = id;
          this.paint();
        }
      });
    });

    this.container.querySelectorAll('[data-bank-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-bank-edit');
        const bank = id ? questionBankStore.getBank(id) : null;
        if (bank) this.renderBankModal(bank);
      });
    });

    this.container.querySelectorAll('[data-bank-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-bank-del');
        const b = id ? questionBankStore.getBank(id) : null;
        if (b?.isDefault || id === 'qb-default') {
          alert('Default Question Bank cannot be deleted.');
          return;
        }
        if (id && confirm('Delete this Question Bank folder? Questions will be reassigned to the default bank.')) {
          questionBankStore.deleteBank(id);
          this.paint();
        }
      });
    });

    this.container.querySelectorAll('.filter-job').forEach(btn => {
      btn.addEventListener('click', e => {
        this.filterJobId = (e.currentTarget as HTMLElement).getAttribute('data-job') || '';
        void this.load();
      });
    });
  }

  private attachFolderEvents(folder: QuestionBankFolder) {
    this.container.querySelector('#qb-back-btn')?.addEventListener('click', () => {
      this.activeFolderId = null;
      this.paint();
    });

    this.container.querySelector('#create-q-btn')?.addEventListener('click', () => this.renderQuestionModal(undefined, folder.id));
    this.container.querySelector('#create-coding-q-btn')?.addEventListener('click', () => this.renderCodingQuestionModal(undefined, folder.id));
    this.container.querySelector('#bulk-q-btn')?.addEventListener('click', () => this.renderBulkUploadModal(folder.id));

    this.container.querySelectorAll('.filter-folder-job').forEach(btn => {
      btn.addEventListener('click', e => {
        this.filterJobId = (e.currentTarget as HTMLElement).getAttribute('data-folder-job') || '';
        void this.load();
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

    this.container.querySelectorAll('[data-q-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-q-edit');
        const q = this.questions.find(item => item.id === id);
        if (q) {
          if (q.type === 'coding' || q.type === 'sql') {
            this.renderCodingQuestionModal(q, folder.id);
          } else {
            this.renderQuestionModal(q, folder.id);
          }
        }
      });
    });

    this.container.querySelectorAll('[data-q-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-q-del');
        if (id && confirm('Delete this question?')) void this.remove(id);
      });
    });
  }

  private jobName(q: Question): string {
    return this.jobs.find(j => j.id === q.jobId)?.title || q.jobRole || '';
  }

  private jobTitleName(jobId: string): string {
    return this.jobs.find(j => j.id === jobId)?.title || '';
  }

  /** Modal: Create or Edit Question Bank Folder */
  private renderBankModal(bank?: QuestionBankFolder) {
    if (bank && (bank.isDefault || bank.id === 'qb-default')) {
      alert('The Default Question Bank is permanent and cannot be modified or renamed.');
      return;
    }
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    const isEdit = !!bank;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">${isEdit ? 'Edit Question Bank' : 'Create Question Bank Folder'}</h3>
            <button id="close-bank-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="bank-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Question Bank Name</label>
              <input id="bank-name" required value="${esc(bank?.name || '')}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold" placeholder="e.g. Question Bank 1, Core Technical Bank" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Description</label>
              <textarea id="bank-desc" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Description of topics covered in this question bank">${esc(bank?.description || '')}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Assign to Job (Optional)</label>
              <select id="bank-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                <option value="">— All Jobs / General Library —</option>
                ${this.jobs.map(j => {
                  const selected = bank ? bank.jobId === j.id : this.filterJobId === j.id;
                  return `<option value="${esc(j.id)}" ${selected ? 'selected' : ''}>${esc(j.title)}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button type="button" id="close-bank-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${isEdit ? 'Save Changes' : 'Create Bank'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { host.innerHTML = ''; };
    host.querySelector('#close-bank-modal')?.addEventListener('click', close);
    host.querySelector('#close-bank-modal-2')?.addEventListener('click', close);

    host.querySelector('#bank-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = (host.querySelector('#bank-name') as HTMLInputElement).value.trim();
      const desc = (host.querySelector('#bank-desc') as HTMLTextAreaElement).value.trim();
      const jobId = (host.querySelector('#bank-job') as HTMLSelectElement).value || null;
      const jobTitle = jobId ? this.jobTitleName(jobId) : null;

      if (!name) return;

      if (isEdit && bank) {
        questionBankStore.updateBank(bank.id, { name, description: desc, jobId, jobTitle });
      } else {
        const created = questionBankStore.createBank(name, desc, jobId, jobTitle);
        this.activeFolderId = created.id;
      }
      close();
      this.paint();
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

  private renderQuestionModal(q?: Question, bankIdDefault?: string) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    const isEdit = !!q;
    const opts = q?.options?.length ? q.options : [
      { id: 'opt-1', text: '' },
      { id: 'opt-2', text: '' },
    ];
    const catVal = q?.sectionCategory || 'Quantitative Aptitude';
    const banks = questionBankStore.getBanks();
    const currentBankId = q ? questionBankStore.getBankIdForQuestion(q) : (bankIdDefault || banks[0]?.id || 'qb-1');

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-lg font-extrabold text-white">${isEdit ? 'Modify Question' : 'Create Question'}</h3>
              <p class="text-xs text-slate-400">Author objective Multiple Choice or descriptive Theory questions.</p>
            </div>
            <button id="close-q-modal-btn" class="text-slate-400 hover:text-white font-bold text-base hover:bg-slate-800 p-2 rounded-xl">✕</button>
          </div>
          <form id="q-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="q-title" value="${esc(q?.title || '')}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Memory allocation in Python, Time Complexity of Merge Sort" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Stem / Content</label>
              <textarea id="q-content" rows="3" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Question statement seen by candidates">${esc(q?.content || '')}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Explanation</label>
              <textarea id="q-explanation" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Why this answer is correct. Candidates do not see this during the exam.">${esc(q?.explanation || '')}</textarea>
            </div>

            <!-- Question Bank Folder Selection -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">📁 Question Bank Folder</label>
              <select id="q-bank" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium">
                ${banks.map(b => `<option value="${esc(b.id)}" ${b.id === currentBankId ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
              </select>
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
                  ${STANDARD_CATEGORIES.map(c => `<option value="${c.type}" ${q?.type === c.type || (!q && c.type === 'mcq') ? 'selected' : ''}>${c.label}</option>`).join('')}
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
                <textarea id="q-rubric" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Evaluation criteria for automated AI scoring">${esc(q?.rubric || '')}</textarea>
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

    host.querySelector('#add-opt')?.addEventListener('click', () => {
      const list = host.querySelector('#opts-list');
      if (!list) return;
      const id = `opt-${Date.now()}`;
      list.insertAdjacentHTML('beforeend', optionRow(id, '', false, list.children.length));
    });

    host.querySelector('#q-form')?.addEventListener('submit', e => {
      e.preventDefault();
      void this.saveQuestion(q, host, close);
    });
  }

  private renderCodingQuestionModal(q?: Question, bankIdDefault?: string) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    const isEdit = !!q;
    const cases = q?.testCases?.length ? q.testCases : [
      { id: 'tc-1', input: '2 7 11 15\n9', inputs: ['2 7 11 15', '9'], expectedOutput: '0 1', isHidden: false, weight: 1 },
      { id: 'tc-2', input: '3 2 4\n6', inputs: ['3 2 4', '6'], expectedOutput: '1 2', isHidden: true, weight: 1 },
    ];
    const catVal = q?.sectionCategory || 'Technical';
    const banks = questionBankStore.getBanks();
    const currentBankId = q ? questionBankStore.getBankIdForQuestion(q) : (bankIdDefault || banks[0]?.id || 'qb-1');

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">⚡ LeetCode Problem Studio</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400">Competitive Coding</span>
              </div>
              <h3 class="text-xl font-extrabold text-white">${isEdit ? 'Modify Coding Challenge' : 'Create Coding Challenge'}</h3>
              <p class="text-xs text-slate-400">Design problem statement, runtime constraints, boilerplate starter stubs, and automated test cases.</p>
            </div>
            <button id="close-code-modal-btn" class="p-2 text-slate-400 hover:text-white font-bold text-base hover:bg-slate-800 rounded-xl transition-all">✕</button>
          </div>

          <form id="code-q-form" class="space-y-5 text-xs">
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-200">Problem Title <span class="text-rose-400">*</span></label>
              <input id="code-q-title" value="${esc(q?.title || '')}" required placeholder="e.g. Two Sum, Reverse Linked List, Valid Palindrome, LRU Cache" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium" />
            </div>

            <!-- Folder selection row -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">📁 Question Bank Folder</label>
              <select id="code-q-bank" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium">
                ${banks.map(b => `<option value="${esc(b.id)}" ${b.id === currentBankId ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Section</label>
                <select id="code-q-cat" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white">
                  ${SECTIONS.map(name => `<option value="${esc(name)}" ${name === catVal ? 'selected' : ''}>${esc(name)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Assign to Job</label>
                <select id="code-q-job" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white">
                  <option value="">Not assigned</option>
                  ${this.jobs.map(j => {
                    const closed = j.status === 'closed';
                    const selected = q?.jobId === j.id;
                    if (closed && !selected) return '';
                    return `<option value="${esc(j.id)}" ${selected ? 'selected' : ''} ${closed ? 'disabled' : ''}>${esc(j.title)}${closed ? ' (closed)' : ''}</option>`;
                  }).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty</label>
                <select id="code-q-diff" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white">
                  ${['easy', 'medium', 'hard'].map(d => `<option value="${d}" ${q?.difficulty === d ? 'selected' : ''}>${d.toUpperCase()}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Score / Points</label>
                <input type="number" id="code-q-points" value="${q?.points || 20}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white" />
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block font-semibold text-slate-200">Problem Description (Markdown Supported) <span class="text-rose-400">*</span></label>
                <span class="text-[11px] text-slate-400">Include clear problem background and example inputs/outputs</span>
              </div>
              <textarea id="code-q-content" rows="6" required class="glass-input w-full p-3.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono leading-relaxed" placeholder="Given an array of integers nums and an integer target...">${esc(q?.content || '')}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-300">Constraints</label>
                <textarea id="code-q-constraints" rows="3" class="glass-input w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-[11px]" placeholder="1 <= nums.length <= 10^5">${esc(q?.constraints || '')}</textarea>
              </div>
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-300">Input / Output Format</label>
                <textarea id="code-q-io" rows="3" class="glass-input w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-[11px]" placeholder="Input: First line contains array elements.">${esc(q?.ioFormat || '')}</textarea>
              </div>
            </div>

            <!-- Starter Boilerplate Code -->
            <div id="starter-block" class="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-bold text-slate-200">Starter Boilerplate Code</p>
                  <p class="text-[11px] text-slate-400">Configure language signature stubs (Python, JS, C++, Java, etc.). Candidate writes inside the middle editable space.</p>
                </div>
              </div>
              <div id="starter-tabs" class="flex flex-wrap gap-1.5 pt-1"></div>
              <div class="space-y-2">
                <label class="block font-semibold text-slate-400 text-[11px]">Function Header / Code Before (Locked)</label>
                <textarea id="starter-before" rows="4" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-300 font-mono text-[11px]" spellcheck="false"></textarea>
                <div class="py-1 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-mono text-center">
                  ⌨️ Candidate Editor Space (Candidate writes implementation here)
                </div>
                <label class="block font-semibold text-slate-400 text-[11px]">Runner Harness / Code After (Locked)</label>
                <textarea id="starter-after" rows="3" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-300 font-mono text-[11px]" spellcheck="false"></textarea>
              </div>
            </div>

            <!-- Test Cases Suite -->
            <div class="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-slate-200">Test Cases Suite</p>
                    <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-bold">Automated Evaluator</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Include public test cases (matching Examples) and hidden test cases for final grading.</p>
                </div>
                <button type="button" id="add-code-tc" class="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 transition-all">+ Add Test Case</button>
              </div>
              <div id="tc-list" class="space-y-3 pt-1">
                ${cases.map((c, i) => tcRow(c, i)).join('')}
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-code-modal-btn-2" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30">${isEdit ? 'SAVE CHALLENGE' : 'CREATE CHALLENGE'}</button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { host.innerHTML = ''; };
    host.querySelector('#close-code-modal-btn')?.addEventListener('click', close);
    host.querySelector('#close-code-modal-btn-2')?.addEventListener('click', close);

    this.mountStarterEditor(host, q);

    host.querySelector('#add-code-tc')?.addEventListener('click', () => {
      const list = host.querySelector('#tc-list');
      if (!list) return;
      const id = `tc-${Date.now()}`;
      list.insertAdjacentHTML('beforeend', tcRow({ id, input: '', inputs: [''], expectedOutput: '', isHidden: false, weight: 1 }, list.children.length));
      this.attachTestCasesInputHandlers(host);
    });

    this.attachTestCasesInputHandlers(host);

    host.querySelector('#code-q-form')?.addEventListener('submit', e => {
      e.preventDefault();
      void this.saveCodingQuestion(q, host, close);
    });
  }

  private attachTestCasesInputHandlers(host: HTMLElement) {
    host.querySelectorAll<HTMLButtonElement>('.add-tc-input').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => {
        const slotContainer = btn.closest('[data-tc-row]')?.querySelector('.tc-inputs');
        if (!slotContainer) return;
        const count = slotContainer.querySelectorAll('.tc-input-slot').length;
        slotContainer.insertAdjacentHTML('beforeend', tcInputSlot('', count));
        this.reindexTcInputs(slotContainer as HTMLElement);
      });
    });

    host.querySelectorAll<HTMLButtonElement>('.remove-tc-input').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => {
        const slot = btn.closest('.tc-input-slot');
        const container = slot?.parentElement as HTMLElement | null;
        slot?.remove();
        if (container) this.reindexTcInputs(container);
      });
    });
  }

  private reindexTcInputs(container: HTMLElement) {
    container.querySelectorAll('.tc-input-slot').forEach((slot, index) => {
      const label = slot.querySelector('.tc-input-label');
      if (label) label.textContent = `Input ${index + 1}`;
    });
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
    const chosenBankId = (host.querySelector('#q-bank') as HTMLSelectElement | null)?.value || this.activeFolderId || 'qb-1';

    const stampedTags = questionBankStore.stampQuestionBank(q?.tags, chosenBankId);

    const body: Record<string, unknown> = {
      type,
      title: (host.querySelector('#q-title') as HTMLInputElement).value.trim(),
      content: (host.querySelector('#q-content') as HTMLTextAreaElement).value.trim(),
      difficulty: (host.querySelector('#q-diff') as HTMLSelectElement).value,
      points: parseInt((host.querySelector('#q-points') as HTMLInputElement).value, 10) || 10,
      sectionCategory,
      category: CATEGORIES.find(c => c.type === type)?.label || 'MCQ',
      jobId: chosenJob,
      jobRole: this.jobs.find(j => j.id === chosenJob)?.title || null,
      stemFormat: (host.querySelector('#q-stem') as HTMLSelectElement).value,
      explanation: (host.querySelector('#q-explanation') as HTMLTextAreaElement)?.value || '',
      tags: stampedTags,
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

    if (type === 'essay') {
      body.essayMinWords = parseInt((host.querySelector('#q-minw') as HTMLInputElement).value, 10) || 50;
      body.essayMaxWords = parseInt((host.querySelector('#q-maxw') as HTMLInputElement).value, 10) || 500;
      body.rubric = (host.querySelector('#q-rubric') as HTMLTextAreaElement).value.trim();
    }

    try {
      if (q) {
        await recruiterApi.updateQuestion(q.id, body as Partial<Question>);
      } else {
        await recruiterApi.createQuestion(body as Partial<Question> & { type: string; title: string });
      }
      close();
      await this.load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Save failed.');
    }
  }

  private async saveCodingQuestion(q: Question | undefined, host: HTMLElement, close: () => void) {
    const sectionCategory = (host.querySelector('#code-q-cat') as HTMLSelectElement).value;
    const chosenJob = (host.querySelector('#code-q-job') as HTMLSelectElement | null)?.value || this.jobId || '';
    const chosenBankId = (host.querySelector('#code-q-bank') as HTMLSelectElement | null)?.value || this.activeFolderId || 'qb-1';

    this.flushStarterFields(host);
    const sampleCode: Record<string, LanguageStarter> = {};
    Object.entries(this.starterDraft).forEach(([lang, parts]) => {
      if ((parts.before || '').trim() || (parts.after || '').trim()) sampleCode[lang] = parts;
    });

    const testCases: unknown[] = [];
    host.querySelectorAll('[data-tc-row]').forEach(row => {
      const id = (row as HTMLElement).getAttribute('data-tc-row') || '';
      const inputs = Array.from(row.querySelectorAll('.tc-in')).map(
        input => (input as HTMLTextAreaElement).value.replace(/\r\n/g, '\n'),
      );
      const expectedOutput = ((row.querySelector('.tc-out') as HTMLTextAreaElement)?.value || '').replace(/\r\n/g, '\n');
      const isHidden = (row.querySelector('.tc-hidden') as HTMLInputElement)?.checked || false;
      const weight = parseInt((row.querySelector('.tc-weight') as HTMLInputElement)?.value, 10) || 1;
      if (expectedOutput || inputs.some(Boolean)) {
        testCases.push({
          id,
          input: inputs.join('\n'),
          inputs,
          expectedOutput,
          isHidden,
          weight,
        });
      }
    });

    const stampedTags = questionBankStore.stampQuestionBank(q?.tags, chosenBankId);

    const body: Record<string, unknown> = {
      type: 'coding',
      title: (host.querySelector('#code-q-title') as HTMLInputElement).value.trim(),
      content: (host.querySelector('#code-q-content') as HTMLTextAreaElement).value.trim(),
      difficulty: (host.querySelector('#code-q-diff') as HTMLSelectElement).value,
      points: parseInt((host.querySelector('#code-q-points') as HTMLInputElement).value, 10) || 20,
      sectionCategory,
      category: 'Coding',
      jobId: chosenJob,
      jobRole: this.jobs.find(j => j.id === chosenJob)?.title || null,
      constraints: (host.querySelector('#code-q-constraints') as HTMLTextAreaElement)?.value || '',
      ioFormat: (host.querySelector('#code-q-io') as HTMLTextAreaElement)?.value || '',
      sampleCode,
      language: this.starterLang,
      testCases,
      tags: stampedTags,
      status: 'published',
    };

    try {
      if (q) {
        await recruiterApi.updateQuestion(q.id, body as Partial<Question>);
      } else {
        await recruiterApi.createQuestion(body as Partial<Question> & { type: string; title: string });
      }
      close();
      await this.load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Save failed.');
    }
  }

  private renderBulkUploadModal(bankIdTarget?: string) {
    const host = this.container.querySelector('#admin-modal-host') as HTMLElement;
    if (!host) return;
    let result: BulkQuestionImportResult | null = null;
    let error = '';
    let busy = false;

    const paint = () => {
      host.innerHTML = `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-base font-extrabold text-white">Bulk upload questions</h3>
                <p class="text-xs text-slate-400">Upload CSV / XLSX to add questions to this Question Bank.</p>
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
              ` : `<p class="text-xs text-emerald-300">All rows imported successfully into Question Bank.</p>`}
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
        busy = true;
        error = '';
        paint();
        try {
          result = await recruiterApi.bulkImportQuestions(file, jobId || undefined);
          // Auto-tag newly imported questions to current bank if specified
          if (bankIdTarget && result.created > 0) {
            await this.load();
            for (const q of this.questions) {
              if (jobId && q.jobId === jobId && !q.tags?.some(t => t.startsWith('bank:'))) {
                const stamped = questionBankStore.stampQuestionBank(q.tags, bankIdTarget);
                void recruiterApi.updateQuestion(q.id, { tags: stamped });
              }
            }
          }
        } catch (e) {
          error = e instanceof ApiError ? e.message : 'Upload failed. Check format.';
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
