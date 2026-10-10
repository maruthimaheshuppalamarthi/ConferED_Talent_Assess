import { store } from '../services/store';

/** Assessment Builder (Recruiter portal): add, edit and delete assessment sections. */
export class AssessmentBuilderPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const assessment = store.getActiveAssessment();
    this.container.innerHTML = `
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
      <div id="admin-modal-host"></div>
    `;
    this.attachEvents();
  }

  private attachEvents() {
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