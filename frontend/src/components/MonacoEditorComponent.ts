import { CodeRunnerService } from '../services/codeRunner';
import { store } from '../services/store';
import { CODING_LANGUAGES, composeSource, extractMiddle, initialSource, starterParts } from '../services/starterCode';
import { listedInputs } from '../services/testInputs';
import { LanguageStarter, Question } from '../types';

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function inputLines(values: string[]): string {
  return values.map((value, index) =>
    `<div class="text-slate-400 text-[11px] whitespace-pre-wrap">Input ${index + 1}: <code class="text-blue-300">${esc(value)}</code></div>`,
  ).join('');
}

let liveEditor: { dispose: () => void } | null = null;
let flushOpenEditor: (() => void) | null = null;

/** Write the open editor into the attempt before a re-render can drop it. */
export function flushCodingEditor(): void {
  try { flushOpenEditor?.(); } catch { /* editor already gone */ }
}

export class MonacoEditorComponent {
  private container: HTMLElement;
  private question: Question;
  private currentLanguage: string;
  private currentCode = '';
  private editorInstance: any = null;
  private parts: LanguageStarter | null = null;
  private middle = '';
  private applying = false;

  constructor(container: HTMLElement, question: Question) {
    this.container = container;
    this.question = question;
    this.currentLanguage = store.recallLanguage(question.id) || question.language || 'python';
    if (!CODING_LANGUAGES.some(lang => lang.id === this.currentLanguage)) this.currentLanguage = 'python';
    this.loadBuffer(this.currentLanguage, store.recallCode(question.id, this.currentLanguage));
  }

  public render() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div class="glass-panel px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
            <select id="lang-select" class="glass-input text-xs font-mono font-semibold px-3 py-1 rounded-lg border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500">
              ${CODING_LANGUAGES.map(lang => `
                <option value="${lang.id}" ${this.currentLanguage === lang.id ? 'selected' : ''}>${esc(lang.label)}</option>
              `).join('')}
            </select>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span id="draft-status" class="text-[10px] font-mono text-slate-500">Draft saved</span>
            <button id="run-code-btn" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700">
              <span>▶</span> Run Tests
            </button>
            <button id="submit-code-btn" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              <span>✓</span> Submit Solution
            </button>
          </div>
        </div>
        <div class="flex-1 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-5 overflow-hidden">
          <div class="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950 min-h-0">
            ${this.parts ? `<p class="px-3 py-1 text-[10px] text-blue-300/80 border-b border-slate-800">Write between the locked starter lines. Those lines stay as the recruiter set them.</p>` : ''}
            <div id="monaco-host" class="flex-1 w-full h-full min-h-[300px]"></div>
          </div>
          <div class="lg:col-span-2 flex flex-col bg-slate-900/90 overflow-hidden min-h-0">
            <div class="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Test Case Execution</span>
              <span id="exec-metrics" class="text-[11px] font-mono text-slate-400">Ready</span>
            </div>
            <div id="console-output" class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
              <p class="text-slate-500 italic">Run Tests compiles this program and checks it against the question's cases.</p>
              ${(this.question.testCases || []).map((tc, idx) => `
                <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span class="font-semibold text-slate-300">Test Case ${idx + 1}</span>
                  ${!tc.isHidden ? `
                    ${inputLines(listedInputs(tc))}
                    <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Expected: <code class="text-emerald-300">${esc(tc.expectedOutput)}</code></div>
                  ` : `<div class="text-slate-500 text-[11px] italic">Input and expected output are hidden.</div>`}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    this.initMonaco();
    this.attachEvents();
  }

  private loadBuffer(language: string, saved: string | null) {
    this.currentLanguage = language;
    const parts = starterParts(this.question.sampleCode, language);
    const fresh = initialSource(this.question.sampleCode, language);
    const text = saved !== null ? saved : fresh;
    const middle = parts ? extractMiddle(text, parts.before, parts.after) : text;
    // A saved buffer that no longer matches the scaffold is kept exactly, and left editable.
    if (parts && middle !== null) {
      this.parts = parts;
      this.middle = middle;
      this.currentCode = text;
    } else {
      this.parts = null;
      this.middle = text;
      this.currentCode = text;
    }
  }

  private initMonaco() {
    const host = this.container.querySelector('#monaco-host') as HTMLElement;
    if (!host) return;
    const monaco = (window as any).monaco;
    if (monaco) {
      this.createMonacoInstance(monaco, host);
      return;
    }
    const require = (window as any).require;
    if (require) {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], () => {
        if (!this.container.querySelector('#monaco-host')) return;
        this.createMonacoInstance((window as any).monaco, host);
      });
      return;
    }
    this.renderTextareaFallback(host);
  }

  private createMonacoInstance(monaco: any, host: HTMLElement) {
    if (liveEditor) {
      try { liveEditor.dispose(); } catch { /* already gone */ }
      liveEditor = null;
    }
    host.innerHTML = '';
    this.editorInstance = monaco.editor.create(host, {
      value: this.currentCode,
      language: this.monacoLanguage(this.currentLanguage),
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 13,
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      roundedSelection: true,
      tabSize: 4,
      insertSpaces: true,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      formatOnType: true,
      wordWrap: 'on',
      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    });
    liveEditor = this.editorInstance;
    flushOpenEditor = () => this.onBufferChanged(this.getCodeValue());
    this.markEditable(monaco);
    this.editorInstance.onDidChangeModelContent(() => {
      if (this.applying) return;
      this.onBufferChanged(this.editorInstance.getValue());
    });
  }

  private markEditable(monaco: any) {
    if (!this.parts || !this.editorInstance) return;
    const model = this.editorInstance.getModel();
    if (!model) return;
    const prefixCount = this.parts.before.trim() ? this.parts.before.replace(/\n+$/, '').split('\n').length : 0;
    const suffixCount = this.parts.after.trim() ? this.parts.after.replace(/^\n+/, '').split('\n').length : 0;
    const total = model.getLineCount();
    const start = prefixCount + 1;
    const end = Math.max(start, total - suffixCount);
    const decorations = [];
    if (prefixCount > 0) {
      decorations.push({
        range: new monaco.Range(1, 1, prefixCount, 1),
        options: { isWholeLine: true, className: 'bg-slate-900/40', glyphMarginClassName: '' },
      });
    }
    decorations.push({
      range: new monaco.Range(start, 1, end, 1),
      options: { isWholeLine: true, className: 'bg-blue-500/10' },
    });
    if (suffixCount > 0 && total - suffixCount + 1 <= total) {
      decorations.push({
        range: new monaco.Range(total - suffixCount + 1, 1, total, 1),
        options: { isWholeLine: true },
      });
    }
    this.editorInstance.deltaDecorations([], decorations);
  }

  private onBufferChanged(text: string) {
    if (this.parts) {
      const middle = extractMiddle(text, this.parts.before, this.parts.after);
      if (middle === null) {
        const restored = composeSource(this.parts.before, this.middle, this.parts.after);
        this.pushValue(restored);
        store.noteCodeDraft(this.question.id, this.currentLanguage, restored);
        return;
      }
      this.middle = middle;
    } else {
      this.middle = text;
    }
    this.currentCode = text;
    store.noteCodeDraft(this.question.id, this.currentLanguage, text);
    const status = this.container.querySelector('#draft-status');
    if (status) status.textContent = 'Draft saved';
  }

  private pushValue(text: string) {
    this.applying = true;
    this.currentCode = text;
    if (this.editorInstance) this.editorInstance.setValue(text);
    else {
      const area = this.container.querySelector('#fallback-code-area') as HTMLTextAreaElement | null;
      if (area) area.value = text;
    }
    this.applying = false;
  }

  private monacoLanguage(lang: string): string {
    const map: Record<string, string> = {
      python: 'python', javascript: 'javascript', typescript: 'typescript', sql: 'sql',
      cpp: 'cpp', c: 'c', java: 'java', csharp: 'csharp', go: 'go', rust: 'rust',
      kotlin: 'kotlin', swift: 'swift', php: 'php', ruby: 'ruby', scala: 'scala', bash: 'shell',
    };
    return map[lang] || 'plaintext';
  }

  private renderTextareaFallback(host: HTMLElement) {
    host.innerHTML = `
      <textarea id="fallback-code-area" class="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-sm border-0 focus:ring-0 resize-none outline-none" spellcheck="false"></textarea>
    `;
    const textarea = host.querySelector('#fallback-code-area') as HTMLTextAreaElement;
    textarea.value = this.currentCode;
    flushOpenEditor = () => this.onBufferChanged(textarea.value);
    textarea.addEventListener('input', () => {
      if (this.applying) return;
      this.onBufferChanged(textarea.value);
    });
  }

  private getCodeValue(): string {
    if (this.editorInstance) return this.editorInstance.getValue();
    const textarea = this.container.querySelector('#fallback-code-area') as HTMLTextAreaElement | null;
    return textarea ? textarea.value : this.currentCode;
  }

  private attachEvents() {
    const langSelect = this.container.querySelector('#lang-select') as HTMLSelectElement;
    const runBtn = this.container.querySelector('#run-code-btn') as HTMLButtonElement;
    const submitBtn = this.container.querySelector('#submit-code-btn') as HTMLButtonElement;
    const consoleOutput = this.container.querySelector('#console-output') as HTMLElement;
    const metricsSpan = this.container.querySelector('#exec-metrics') as HTMLElement;

    langSelect?.addEventListener('change', () => {
      store.noteCodeDraft(this.question.id, this.currentLanguage, this.getCodeValue());
      this.loadBuffer(langSelect.value, store.recallCode(this.question.id, langSelect.value));
      if (this.editorInstance) {
        const monaco = (window as any).monaco;
        this.applying = true;
        monaco?.editor.setModelLanguage(this.editorInstance.getModel(), this.monacoLanguage(this.currentLanguage));
        this.editorInstance.setValue(this.currentCode);
        this.applying = false;
        this.markEditable(monaco);
      } else {
        const textarea = this.container.querySelector('#fallback-code-area') as HTMLTextAreaElement | null;
        if (textarea) textarea.value = this.currentCode;
      }
    });

    const runExecution = async () => {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span>⌛</span> Compiling...';
      metricsSpan.textContent = 'Running...';
      const code = this.getCodeValue();
      store.noteCodeDraft(this.question.id, this.currentLanguage, code);
      let res;
      try {
        res = await CodeRunnerService.executeCode(this.currentLanguage, code, this.question.id);
      } catch (e) {
        runBtn.disabled = false;
        runBtn.innerHTML = '<span>▶</span> Run Tests';
        metricsSpan.textContent = 'Execution failed';
        consoleOutput.textContent = e instanceof Error ? e.message : String(e);
        return null;
      }
      runBtn.disabled = false;
      runBtn.innerHTML = '<span>▶</span> Run Tests';
      metricsSpan.innerHTML = `Time: <b class="text-blue-400">${res.executionTimeMs}ms</b>`;
      const passedCount = res.testResults.filter(t => t.passed).length;
      consoleOutput.innerHTML = `
        ${res.stderr ? `<pre class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 whitespace-pre-wrap">${esc(res.stderr)}</pre>` : ''}
        <div class="p-3 rounded-xl border ${res.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} flex items-center justify-between">
          <span class="font-bold uppercase tracking-wider">${res.passed ? 'All test cases passed' : 'Tests failed'}</span>
          <span class="font-mono font-bold">${passedCount} / ${res.testResults.length}</span>
        </div>
        ${res.testResults.map((t, idx) => `
          <div class="p-3 rounded-xl bg-slate-950 border ${t.passed ? 'border-emerald-500/30' : 'border-red-500/30'} space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200">Test Case ${idx + 1}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">${t.passed ? 'PASSED' : 'FAILED'}</span>
            </div>
            ${!t.isHidden ? `
              ${inputLines(t.inputs && t.inputs.length ? t.inputs : [t.input])}
              <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Expected: <code class="text-emerald-300">${esc(t.expected)}</code></div>
              <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Actual: <code class="${t.passed ? 'text-emerald-400' : 'text-red-400'}">${esc(t.actual)}</code></div>
            ` : `<div class="text-slate-500 text-[11px] italic">Output hidden.</div>`}
          </div>
        `).join('')}
      `;
      return res;
    };

    runBtn?.addEventListener('click', () => {
      void runExecution();
    });

    submitBtn?.addEventListener('click', async () => {
      const res = await runExecution();
      const code = this.getCodeValue();
      store.setCodeSubmission(this.question.id, {
        code,
        language: this.currentLanguage,
        executionTimeMs: res?.executionTimeMs,
        passedCount: res?.testResults.filter(t => t.passed).length,
        totalCount: res?.testResults.length,
      });
      submitBtn.innerHTML = '<span>✓</span> Saved';
      submitBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
    });
  }
}
