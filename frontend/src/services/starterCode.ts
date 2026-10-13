import { LanguageStarter, Question } from '../types';

export const CODING_LANGUAGES: { id: string; label: string }[] = [
  { id: 'python', label: 'Python 3.11 (CPython)' },
  { id: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'swift', label: 'Swift' },
  { id: 'scala', label: 'Scala' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
];

/** Locked before/after blocks. The candidate writes the function body between them. */
const DEFAULT_STARTERS: Record<string, LanguageStarter> = {
  python: {
    before: 'import sys\n\ndef solve(data: str) -> str:',
    after: '    return ""\n\nif __name__ == "__main__":\n    sys.stdout.write(solve(sys.stdin.read()))',
  },
  javascript: {
    before: "const fs = require('fs');\n\nfunction solve(data) {",
    after: "  return '';\n}\n\nconst input = fs.readFileSync(0, 'utf8');\nprocess.stdout.write(String(solve(input)));",
  },
  typescript: {
    before: "import fs from 'fs';\n\nfunction solve(data: string): string {",
    after: "  return '';\n}\n\nconst input = fs.readFileSync(0, 'utf8');\nprocess.stdout.write(solve(input));",
  },
  java: {
    before: 'import java.nio.charset.StandardCharsets;\n\npublic class Main {\n    static String solve(String data) {',
    after: '        return "";\n    }\n\n    public static void main(String[] args) throws Exception {\n        String data = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);\n        System.out.print(solve(data));\n    }\n}',
  },
  cpp: {
    before: '#include <iostream>\n#include <iterator>\n#include <string>\nusing namespace std;\n\nstring solve(const string& data) {',
    after: '    return "";\n}\n\nint main() {\n    string data((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());\n    cout << solve(data);\n    return 0;\n}',
  },
  c: {
    before: '#include <stdio.h>\n\nvoid solve(const char *data) {',
    after: '}\n\nint main(void) {\n    char buf[65536];\n    size_t n = fread(buf, 1, sizeof(buf) - 1, stdin);\n    buf[n] = \'\\0\';\n    solve(buf);\n    return 0;\n}',
  },
  csharp: {
    before: 'using System;\n\nstring Solve(string data) {',
    after: '    return "";\n}\n\nvar data = Console.In.ReadToEnd();\nConsole.Write(Solve(data));',
  },
  go: {
    before: 'package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"os"\n)\n\nfunc solve(data string) string {',
    after: '\treturn ""\n}\n\nfunc main() {\n\tdata, _ := io.ReadAll(os.Stdin)\n\tfmt.Print(solve(string(data)))\n}',
  },
  rust: {
    before: 'use std::io::{self, Read};\n\nfn solve(data: &str) -> String {',
    after: '    String::new()\n}\n\nfn main() {\n    let mut data = String::new();\n    io::stdin().read_to_string(&mut data).ok();\n    print!("{}", solve(&data));\n}',
  },
  kotlin: {
    before: 'fun solve(data: String): String {',
    after: '    return ""\n}\n\nfun main() {\n    val data = generateSequence(::readLine).joinToString("\\n")\n    print(solve(data))\n}',
  },
  php: {
    before: '<?php\nfunction solve(string $data): string {',
    after: '    return "";\n}\n\n$data = stream_get_contents(STDIN);\necho solve($data === false ? "" : $data);',
  },
  ruby: {
    before: 'def solve(data)',
    after: '  ""\nend\n\ndata = STDIN.read\nprint solve(data)',
  },
  swift: {
    before: 'import Foundation\n\nfunc solve(_ data: String) -> String {',
    after: '    return ""\n}\n\nlet data = String(data: FileHandle.standardInput.readDataToEndOfFile(), encoding: .utf8) ?? ""\nprint(solve(data), terminator: "")',
  },
  scala: {
    before: 'object Main {\n  def solve(data: String): String = {',
    after: '    ""\n  }\n\n  def main(args: Array[String]): Unit = {\n    val data = scala.io.Source.stdin.mkString\n    print(solve(data))\n  }\n}',
  },
  sql: {
    before: '-- Write the query below.\nSELECT',
    after: ';',
  },
  bash: {
    before: '#!/usr/bin/env bash\nset -euo pipefail\n\nsolve() {',
    after: '  printf \'%s\' ""\n}\n\ndata="$(cat)"\nsolve "$data"',
  },
};

export function defaultStarter(language: string): LanguageStarter {
  const found = DEFAULT_STARTERS[language];
  if (!found) return { before: '', after: '' };
  return { before: found.before, after: found.after };
}

export function starterParts(
  sample: Question['sampleCode'],
  language: string,
): LanguageStarter | null {
  const raw = sample?.[language];
  if (!raw || typeof raw === 'string') return null;
  const before = String(raw.before || '');
  const after = String(raw.after || '');
  if (!before.trim() && !after.trim()) return null;
  return { before, after };
}

/** Full source: locked prefix, the candidate's text, locked suffix. */
export function composeSource(before: string, middle: string, after: string): string {
  const prefix = before.replace(/\n+$/, '');
  const suffix = after.replace(/^\n+/, '');
  const body = middle.replace(/^\n+|\n+$/g, '');
  const chunks: string[] = [];
  if (prefix) chunks.push(prefix);
  chunks.push(body);
  if (suffix) chunks.push(suffix);
  return chunks.join('\n');
}

/** The editable middle, or null when the candidate changed a locked line. */
export function extractMiddle(source: string, before: string, after: string): string | null {
  const prefix = before.replace(/\n+$/, '');
  const suffix = after.replace(/^\n+/, '');
  let rest = source;
  if (prefix) {
    if (!rest.startsWith(prefix)) return null;
    rest = rest.slice(prefix.length).replace(/^\n/, '');
  }
  if (suffix) {
    if (!rest.endsWith(suffix)) return null;
    rest = rest.slice(0, rest.length - suffix.length).replace(/\n$/, '');
  }
  return rest;
}

/** What the editor shows before the candidate has typed anything. */
export function initialSource(sample: Question['sampleCode'], language: string): string {
  const parts = starterParts(sample, language);
  if (parts) return composeSource(parts.before, '', parts.after);
  const raw = sample?.[language];
  if (typeof raw === 'string' && raw.trim()) return raw;
  const fallback = defaultStarter(language);
  if (!fallback.before.trim() && !fallback.after.trim()) return '';
  return composeSource(fallback.before, '', fallback.after);
}
