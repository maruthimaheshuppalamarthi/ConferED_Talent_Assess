import { CsvExporterService } from '../services/csvExporter';
import { store } from '../services/store';
import { Question } from '../types';

/** Question Bank (Recruiter portal): create, edit, delete and export questions. */
export class QuestionBankPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();
    this.container.innerHTML = `
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
      <div id="admin-modal-host"></div>
    `;
    this.attachEvents();
  }

  private attachEvents() {
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

    this.container.querySelector('#export-q-csv-btn')?.addEventListener('click', () => {
      const state = store.getState();
      const headers = ['Question Title', 'Type', 'Category', 'Difficulty', 'Points', 'Tags'];
      const rows = state.questionBank.map(q => [q.title, q.type, q.category, q.difficulty, q.points, q.tags.join('; ')]);
      CsvExporterService.downloadCsv('Question_Bank_Export.csv', headers, rows);
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
}