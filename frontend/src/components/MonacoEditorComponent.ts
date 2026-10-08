import { CodeRunnerService } from '../services/codeRunner';
import { store } from '../services/store';
import { Question, TestCase } from '../types';

export class MonacoEditorComponent {
  private container: HTMLElement;
  private question: Question;
  private currentLanguage: string;
  private currentCode: string;
  private editorInstance: any = null;

  private languageTemplates: Record<string, string> = {
    python: `# Python 3.11 Solution\ndef max_product(nums: list[int]) -> int:\n    if not nums: return 0\n    res = max_num = min_num = nums[0]\n    for i in range(1, len(nums)):\n        n = nums[i]\n        if n < 0: max_num, min_num = min_num, max_num\n        max_num = max(n, max_num * n)\n        min_num = min(n, min_num * n)\n        res = max(res, max_num)\n    return res\n`,
    javascript: `// JavaScript (Node.js v20) Solution\nfunction maxProduct(nums) {\n    if (!nums || nums.length === 0) return 0;\n    let res = nums[0], maxNum = nums[0], minNum = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        let n = nums[i];\n        if (n < 0) { let t = maxNum; maxNum = minNum; minNum = t; }\n        maxNum = Math.max(n, maxNum * n);\n        minNum = Math.min(n, minNum * n);\n        res = Math.max(res, maxNum);\n    }\n    return res;\n}\n`,
    typescript: `// TypeScript v5.3 Solution\nfunction maxProduct(nums: number[]): number {\n    if (!nums || nums.length === 0) return 0;\n    let res = nums[0], maxNum = nums[0], minNum = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        let n = nums[i];\n        if (n < 0) { [maxNum, minNum] = [minNum, maxNum]; }\n        maxNum = Math.max(n, maxNum * n);\n        minNum = Math.min(n, minNum * n);\n        res = Math.max(res, maxNum);\n    }\n    return res;\n}\n`,
    sql: `-- PostgreSQL 16 (SQL Query Solution)\nSELECT department_id, employee_id, salary\nFROM (\n  SELECT department_id, employee_id, salary,\n         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank\n  FROM employees\n) sub\nWHERE rank <= 2;\n`,
    cpp: `// C++20 (GCC 13) Solution\n#include <iostream>\n#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int maxProduct(std::vector<int>& nums) {\n        if (nums.empty()) return 0;\n        int res = nums[0], maxNum = nums[0], minNum = nums[0];\n        for (size_t i = 1; i < nums.size(); ++i) {\n            int n = nums[i];\n            if (n < 0) std::swap(maxNum, minNum);\n            maxNum = std::max(n, maxNum * n);\n            minNum = std::min(n, minNum * n);\n            res = std::max(res, maxNum);\n        }\n        return res;\n    }\n};\n`,
    java: `// Java 21 (OpenJDK) Solution\nimport java.util.*;\n\npublic class Solution {\n    public int maxProduct(int[] nums) {\n        if (nums == null || nums.length == 0) return 0;\n        int res = nums[0], maxNum = nums[0], minNum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            int n = nums[i];\n            if (n < 0) { int t = maxNum; maxNum = minNum; minNum = t; }\n            maxNum = Math.max(n, maxNum * n);\n            minNum = Math.min(n, minNum * n);\n            res = Math.max(res, maxNum);\n        }\n        return res;\n    }\n}\n`,
    csharp: `// C# (.NET 8) Solution\nusing System;\n\npublic class Solution {\n    public int MaxProduct(int[] nums) {\n        if (nums == null || nums.Length == 0) return 0;\n        int res = nums[0], maxNum = nums[0], minNum = nums[0];\n        for (int i = 1; i < nums.Length; i++) {\n            int n = nums[i];\n            if (n < 0) { (maxNum, minNum) = (minNum, maxNum); }\n            maxNum = Math.Max(n, maxNum * n);\n            minNum = Math.Min(n, minNum * n);\n            res = Math.Max(res, maxNum);\n        }\n        return res;\n    }\n}\n`,
    go: `// Go 1.22 Solution\npackage main\n\nfunc maxProduct(nums []int) int {\n    if len(nums) == 0 { return 0 }\n    res, maxNum, minNum := nums[0], nums[0], nums[0]\n    for i := 1; i < len(nums); i++ {\n        n := nums[i]\n        if n < 0 { maxNum, minNum = minNum, maxNum }\n        if n > maxNum*n { maxNum = n } else { maxNum = maxNum * n }\n        if n < minNum*n { minNum = n } else { minNum = minNum * n }\n        if maxNum > res { res = maxNum }\n    }\n    return res;\n}\n`,
    rust: `// Rust 1.75 Solution\nuse std::cmp;\n\npub fn max_product(nums: Vec<i32>) -> i32 {\n    if nums.is_empty() { return 0; }\n    let mut res = nums[0];\n    let mut max_num = nums[0];\n    let mut min_num = nums[0];\n    for &n in nums.iter().skip(1) {\n        if n < 0 { std::mem::swap(&mut max_num, &mut min_num); }\n        max_num = cmp::max(n, max_num * n);\n        min_num = cmp::min(n, min_num * n);\n        res = cmp::max(res, max_num);\n    }\n    res\n}\n`,
    kotlin: `// Kotlin 1.9 Solution\nimport kotlin.math.max\nimport kotlin.math.min\n\nclass Solution {\n    fun maxProduct(nums: IntArray): Int {\n        if (nums.isEmpty()) return 0\n        var res = nums[0]\n        var maxNum = nums[0]\n        var minNum = nums[0]\n        for (i in 1 until nums.size) {\n            val n = nums[i]\n            if (n < 0) { val t = maxNum; maxNum = minNum; minNum = t }\n            maxNum = max(n, maxNum * n)\n            minNum = min(n, minNum * n)\n            res = max(res, maxNum)\n        }\n        return res\n    }\n}\n`,
    swift: `// Swift 5.9 Solution\nimport Foundation\n\nfunc maxProduct(_ nums: [Int]) -> Int {\n    guard !nums.isEmpty else { return 0 }\n    var res = nums[0], maxNum = nums[0], minNum = nums[0]\n    for i in 1..<nums.count {\n        let n = nums[i]\n        if n < 0 { swap(&maxNum, &minNum) }\n        maxNum = max(n, maxNum * n)\n        minNum = min(n, minNum * n)\n        res = max(res, maxNum)\n    }\n    return res\n}\n`,
    php: `<?php\n// PHP 8.3 Solution\nfunction maxProduct(array $nums): int {\n    if (empty($nums)) return 0;\n    $res = $maxNum = $minNum = $nums[0];\n    for ($i = 1; $i < count($nums); $i++) {\n        $n = $nums[$i];\n        if ($n < 0) { list($maxNum, $minNum) = [$minNum, $maxNum]; }\n        $maxNum = max($n, $maxNum * $n);\n        $minNum = min($n, $minNum * $n);\n        $res = max($res, $maxNum);\n    }\n    return $res;\n}\n`,
    ruby: `# Ruby 3.3 Solution\ndef max_product(nums)\n  return 0 if nums.empty?\n  res = max_num = min_num = nums[0]\n  (1...nums.length).each do |i|\n    n = nums[i]\n    max_num, min_num = min_num, max_num if n < 0\n    max_num = [n, max_num * n].max\n    min_num = [n, min_num * n].min\n    res = [res, max_num].max\n  end\n  res\nend\n`,
    r: `# R 4.3 Solution\nmax_product <- function(nums) {\n  if (length(nums) == 0) return(0)\n  res <- nums[1]; max_num <- nums[1]; min_num <- nums[1]\n  for (i in 2:length(nums)) {\n    n <- nums[i]\n    if (n < 0) { temp <- max_num; max_num <- min_num; min_num <- temp }\n    max_num <- max(n, max_num * n)\n    min_num <- min(n, min_num * n)\n    res <- max(res, max_num)\n  }\n  return(res)\n}\n`,
    scala: `// Scala 3.3 Solution\nobject Solution {\n  def maxProduct(nums: Array[Int]): Int = {\n    if (nums.isEmpty) return 0\n    var res = nums(0); var maxNum = nums(0); var minNum = nums(0)\n    for (i <- 1 until nums.length) {\n      val n = nums(i)\n      if (n < 0) { val t = maxNum; maxNum = minNum; minNum = t }\n      maxNum = Math.max(n, maxNum * n)\n      minNum = Math.min(n, minNum * n)\n      res = Math.max(res, maxNum)\n    }\n    res\n  }\n}\n`,
    bash: `#!/bin/bash\n# Bash Shell Script Solution\necho "Executing Shell Solution..."\n`
  };

  constructor(container: HTMLElement, question: Question) {
    this.container = container;
    this.question = question;
    this.currentLanguage = question.language || 'python';
    this.currentCode = question.sampleCode?.[this.currentLanguage] || this.languageTemplates[this.currentLanguage] || `# Solution template for ${this.currentLanguage}\n`;
  }

  public render() {
    const langs = [
      { id: 'python', label: 'Python 3.11 (CPython)' },
      { id: 'javascript', label: 'JavaScript (Node.js v20)' },
      { id: 'typescript', label: 'TypeScript (v5.3)' },
      { id: 'sql', label: 'PostgreSQL 16 (SQL)' },
      { id: 'cpp', label: 'C++20 (GCC 13)' },
      { id: 'java', label: 'Java 21 (OpenJDK)' },
      { id: 'csharp', label: 'C# (.NET 8)' },
      { id: 'go', label: 'Go (1.22)' },
      { id: 'rust', label: 'Rust (1.75)' },
      { id: 'kotlin', label: 'Kotlin (1.9)' },
      { id: 'swift', label: 'Swift (5.9)' },
      { id: 'php', label: 'PHP (8.3)' },
      { id: 'ruby', label: 'Ruby (3.3)' },
      { id: 'r', label: 'R (4.3)' },
      { id: 'scala', label: 'Scala (3.3)' },
      { id: 'bash', label: 'Bash (Shell 5.2)' }
    ];

    this.container.innerHTML = `
      <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <!-- Editor Header Toolbar -->
        <div class="glass-panel px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
            <select id="lang-select" class="glass-input text-xs font-mono font-semibold px-3 py-1 rounded-lg border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500">
              ${langs.map(l => `
                <option value="${l.id}" ${this.currentLanguage === l.id ? 'selected' : ''}>${l.label}</option>
              `).join('')}
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button id="run-code-btn" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700">
              <span>▶</span> Run Tests
            </button>
            <button id="submit-code-btn" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              <span>✓</span> Submit Solution
            </button>
          </div>
        </div>

        <!-- Main Editor Body & Split Console -->
        <div class="flex-1 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-5 overflow-hidden">
          <!-- Monaco Code Input Area -->
          <div class="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950">
            <div id="monaco-host" class="flex-1 w-full h-full min-h-[300px]"></div>
          </div>

          <!-- Test Cases & Output Panel -->
          <div class="lg:col-span-2 flex flex-col bg-slate-900/90 overflow-hidden">
            <div class="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>🧪</span> Test Case Execution
              </span>
              <span id="exec-metrics" class="text-[11px] font-mono text-slate-400">Ready for execution</span>
            </div>

            <!-- Console Output Body -->
            <div id="console-output" class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
              <p class="text-slate-500 italic">Click "Run Tests" to evaluate code against test cases.</p>
              
              ${(this.question.testCases || []).map((tc, idx) => `
                <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-300">Test Case ${idx + 1}</span>
                  </div>
                  ${!tc.isHidden ? `
                    <div class="text-slate-400 text-[11px]">Input: <code class="text-blue-300">${tc.input}</code></div>
                    <div class="text-slate-400 text-[11px]">Expected: <code class="text-emerald-300">${tc.expectedOutput}</code></div>
                  ` : `
                    <div class="text-slate-500 text-[11px] italic">Input & expected output hidden for evaluation integrity.</div>
                  `}
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

  private initMonaco() {
    const host = this.container.querySelector('#monaco-host') as HTMLElement;
    if (!host) return;

    if ((window as any).monaco) {
      this.createMonacoInstance((window as any).monaco, host);
    } else if ((window as any).require) {
      (window as any).require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      (window as any).require(['vs/editor/editor.main'], () => {
        this.createMonacoInstance((window as any).monaco, host);
      });
    } else {
      this.renderTextareaFallback(host);
    }
  }

  private createMonacoInstance(monaco: any, host: HTMLElement) {
    host.innerHTML = '';
    const monacoLang = this.getMonacoLang(this.currentLanguage);
    this.editorInstance = monaco.editor.create(host, {
      value: this.currentCode,
      language: monacoLang,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 13,
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
    });

    this.editorInstance.onDidChangeModelContent(() => {
      this.currentCode = this.editorInstance.getValue();
    });
  }

  private getMonacoLang(lang: string): string {
    const map: Record<string, string> = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      sql: 'sql',
      cpp: 'cpp',
      java: 'java',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      kotlin: 'kotlin',
      swift: 'swift',
      php: 'php',
      ruby: 'ruby',
      r: 'r',
      scala: 'scala',
      bash: 'shell'
    };
    return map[lang] || 'plaintext';
  }

  private renderTextareaFallback(host: HTMLElement) {
    host.innerHTML = `
      <textarea id="fallback-code-area" class="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-sm border-0 focus:ring-0 resize-none outline-none" spellcheck="false">${this.currentCode}</textarea>
    `;
    const textarea = host.querySelector('#fallback-code-area') as HTMLTextAreaElement;
    textarea?.addEventListener('input', () => {
      this.currentCode = textarea.value;
    });
  }

  private getCodeValue(): string {
    return this.editorInstance ? this.editorInstance.getValue() : this.currentCode;
  }

  private attachEvents() {
    const langSelect = this.container.querySelector('#lang-select') as HTMLSelectElement;
    const runBtn = this.container.querySelector('#run-code-btn') as HTMLButtonElement;
    const submitBtn = this.container.querySelector('#submit-code-btn') as HTMLButtonElement;
    const consoleOutput = this.container.querySelector('#console-output') as HTMLElement;
    const metricsSpan = this.container.querySelector('#exec-metrics') as HTMLElement;

    langSelect?.addEventListener('change', () => {
      this.currentLanguage = langSelect.value;
      const sample = this.question.sampleCode?.[this.currentLanguage] || this.languageTemplates[this.currentLanguage] || `# Solution template for ${this.currentLanguage}\n`;
      this.currentCode = sample;
      
      if (this.editorInstance) {
        const monacoLang = this.getMonacoLang(this.currentLanguage);
        (window as any).monaco?.editor.setModelLanguage(this.editorInstance.getModel(), monacoLang);
        this.editorInstance.setValue(this.currentCode);
      } else {
        const textarea = this.container.querySelector('#fallback-code-area') as HTMLTextAreaElement;
        if (textarea) textarea.value = this.currentCode;
      }
    });

    const runExecution = async () => {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span>⌛</span> Executing...';
      metricsSpan.innerHTML = 'Running in Docker Sandbox...';

      const code = this.getCodeValue();
      const testCases = this.question.testCases || [
        { id: 'tc-1', input: 'sample', expectedOutput: 'sample', isHidden: false, weight: 10 }
      ];

      const res = await CodeRunnerService.executeCode(this.currentLanguage, code, testCases);

      runBtn.disabled = false;
      runBtn.innerHTML = '<span>▶</span> Run Tests';
      metricsSpan.innerHTML = `Time: <b class="text-blue-400">${res.executionTimeMs}ms</b> | Memory: <b class="text-purple-400">${res.memoryUsedKb} KB</b>`;

      const passedCount = res.testResults.filter(t => t.passed).length;
      const totalCount = res.testResults.length;

      consoleOutput.innerHTML = `
        <div class="p-3 rounded-xl border ${res.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} flex items-center justify-between">
          <span class="font-bold uppercase tracking-wider">${res.passed ? '✓ All Test Cases Passed' : '✖ Test Execution Failed'}</span>
          <span class="font-mono font-bold">${passedCount} / ${totalCount} Passed</span>
        </div>

        ${res.testResults.map((t, idx) => `
          <div class="p-3 rounded-xl bg-slate-950 border ${t.passed ? 'border-emerald-500/30' : 'border-red-500/30'} space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200">Test Case ${idx + 1}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                ${t.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            ${!t.isHidden ? `
              <div class="text-slate-400 text-[11px]">Input: <code class="text-blue-300">${t.input}</code></div>
              <div class="text-slate-400 text-[11px]">Expected: <code class="text-emerald-300">${t.expected}</code></div>
              <div class="text-slate-400 text-[11px]">Actual: <code class="${t.passed ? 'text-emerald-400' : 'text-red-400'}">${t.actual}</code></div>
            ` : `
              <div class="text-slate-500 text-[11px] italic">Outputs hidden for evaluation integrity.</div>
            `}
          </div>
        `).join('')}
      `;

      return res;
    };

    runBtn?.addEventListener('click', runExecution);

    submitBtn?.addEventListener('click', async () => {
      const res = await runExecution();
      const code = this.getCodeValue();
      const passedCount = res.testResults.filter(t => t.passed).length;
      const totalCount = res.testResults.length;

      store.setCodeSubmission(this.question.id, {
        code,
        language: this.currentLanguage,
        executionTimeMs: res.executionTimeMs,
        passedCount,
        totalCount
      });

      submitBtn.innerHTML = '<span>✓</span> Saved!';
      submitBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
      setTimeout(() => {
        submitBtn.innerHTML = '<span>✓</span> Submit Solution';
        submitBtn.classList.replace('bg-emerald-600', 'bg-blue-600');
      }, 2000);
    });
  }
}
