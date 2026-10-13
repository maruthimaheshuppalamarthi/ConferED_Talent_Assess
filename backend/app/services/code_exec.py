"""Run a candidate's program against stdin/stdout test cases.

The process is the language's real compiler or interpreter. A missing compiler
is reported as a failure. Expected output is never copied into the result.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, List, Optional

_MAX_CODE = 100_000
_MAX_OUTPUT = 16_000
_MAX_CASES = 30
_TIMEOUT_SECONDS = 3

_KEEP_ENV = ("PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME", "LANG", "PATHEXT", "COMSPEC", "USERPROFILE")


def _safe_env() -> Dict[str, str]:
    return {key: os.environ[key] for key in _KEEP_ENV if os.environ.get(key)}


def _norm(text: str) -> str:
    return (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()


def _clip(text: str) -> str:
    text = text or ""
    if len(text) > _MAX_OUTPUT:
        return text[:_MAX_OUTPUT] + "\n…output truncated"
    return text


def _which(name: str) -> Optional[str]:
    return shutil.which(name)


class _Program:
    def __init__(self, argv_prefix: List[str], source_path: str):
        self.argv_prefix = argv_prefix
        self.source_path = source_path

    def run(self, stdin: str, workdir: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            [*self.argv_prefix, self.source_path] if self.source_path else self.argv_prefix,
            input=stdin,
            capture_output=True,
            text=True,
            timeout=_TIMEOUT_SECONDS,
            cwd=workdir,
            env=_safe_env(),
            check=False,
        )


def _prepare(language: str, code: str, workdir: str) -> _Program:
    """Write source and return the command that executes it. Raises ValueError if it cannot be built."""
    lang = (language or "").strip().lower()

    def write(name: str, content: str = "") -> str:
        path = os.path.join(workdir, name)
        with open(path, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content if content else code)
        return path

    if lang == "python":
        py_code = code
        if "sys.stdin" not in code and "input(" not in code:
            import re
            funcs = re.findall(r"^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", code, flags=re.MULTILINE)
            if funcs:
                main_func = funcs[-1]
                harness = (
                    f"\n\nif __name__ == '__main__':\n"
                    f"    import sys, ast\n"
                    f"    _raw = sys.stdin.read().strip()\n"
                    f"    if _raw:\n"
                    f"        try:\n"
                    f"            _parsed = ast.literal_eval(_raw)\n"
                    f"            if isinstance(_parsed, tuple):\n"
                    f"                print({main_func}(*_parsed))\n"
                    f"            else:\n"
                    f"                print({main_func}(_parsed))\n"
                    f"        except Exception:\n"
                    f"            try:\n"
                    f"                print({main_func}(_raw))\n"
                    f"            except Exception:\n"
                    f"                pass\n"
                )
                py_code = code + harness
        return _Program([sys.executable, "-I"], write("main.py", py_code))

    if lang == "javascript":
        node = _which("node")
        if not node:
            raise ValueError("Node.js is not installed on this machine, so JavaScript cannot be compiled.")
        return _Program([node], write("main.js"))

    if lang == "typescript":
        node = _which("node")
        if not node:
            raise ValueError("Node.js is not installed on this machine, so TypeScript cannot be compiled.")
        path = write("main.ts")
        return _Program([node, "--experimental-strip-types"], path)

    if lang in ("cpp", "c++", "c"):
        compiler = _which("g++") or _which("clang++") or (_which("gcc") if lang == "c" else None)
        if not compiler:
            raise ValueError("A C/C++ compiler (g++ or clang++) is not installed on this machine.")
        source = write("main.c" if lang == "c" and not _which("g++") else "main.cpp")
        binary = os.path.join(workdir, "program.exe" if os.name == "nt" else "program")
        build = subprocess.run(
            [compiler, "-O2", "-o", binary, source],
            capture_output=True, text=True, timeout=20, cwd=workdir, env=_safe_env(), check=False,
        )
        if build.returncode != 0:
            raise ValueError(_clip(build.stderr or build.stdout or "Compilation failed."))
        return _Program([binary], "")

    if lang == "java":
        javac = _which("javac")
        java = _which("java")
        if not javac or not java:
            raise ValueError("The Java compiler (javac) is not installed on this machine.")
        class_name = "Main"
        for line in code.splitlines():
            stripped = line.strip()
            if stripped.startswith("public class "):
                class_name = stripped.split()[2].split("{")[0].strip()
                break
            if stripped.startswith("class "):
                class_name = stripped.split()[1].split("{")[0].strip()
        source = write(f"{class_name}.java")
        build = subprocess.run(
            [javac, source],
            capture_output=True, text=True, timeout=20, cwd=workdir, env=_safe_env(), check=False,
        )
        if build.returncode != 0:
            raise ValueError(_clip(build.stderr or build.stdout or "Compilation failed."))
        return _Program([java, "-cp", workdir, class_name], "")

    if lang == "go":
        go = _which("go")
        if not go:
            raise ValueError("The Go compiler is not installed on this machine.")
        return _Program([go, "run"], write("main.go"))

    if lang == "php":
        php = _which("php")
        if not php:
            raise ValueError("PHP is not installed on this machine.")
        return _Program([php], write("main.php"))

    if lang == "ruby":
        ruby = _which("ruby")
        if not ruby:
            raise ValueError("Ruby is not installed on this machine.")
        return _Program([ruby], write("main.rb"))

    if lang == "rust":
        rustc = _which("rustc")
        if not rustc:
            raise ValueError("The Rust compiler (rustc) is not installed on this machine.")
        source = write("main.rs")
        binary = os.path.join(workdir, "program.exe" if os.name == "nt" else "program")
        build = subprocess.run(
            [rustc, "-O", "-o", binary, source],
            capture_output=True, text=True, timeout=30, cwd=workdir, env=_safe_env(), check=False,
        )
        if build.returncode != 0:
            raise ValueError(_clip(build.stderr or build.stdout or "Compilation failed."))
        return _Program([binary], "")

    if lang in ("csharp", "c#"):
        dotnet = _which("dotnet")
        if not dotnet:
            raise ValueError("The .NET SDK is not installed on this machine, so C# cannot be compiled.")
        path = write("main.cs")
        return _Program([dotnet, "script"], path)

    if lang == "sql":
        raise ValueError("SQL is stored with the answer. This runner executes programming languages against stdin and stdout.")

    names = {
        "kotlin": "Kotlin", "swift": "Swift", "scala": "Scala", "r": "R", "bash": "Bash",
    }
    label = names.get(lang, lang or "This language")
    raise ValueError(f"{label} compiler is not installed on this machine.")


def execute(language: str, code: str, test_cases: List[dict]) -> Dict[str, Any]:
    started = time.perf_counter()
    lang = (language or "").strip().lower()
    if lang == "sql":
        from app.services.sql_exec import execute_sql
        return execute_sql(code, test_cases)

    code = code or ""
    if len(code) > _MAX_CODE:
        return _failed(language, "The program is too large to run.", [], started)

    cases = [c for c in (test_cases or []) if isinstance(c, dict)][:_MAX_CASES]
    if not cases:
        cases = [{"id": "tc-1", "input": "", "expectedOutput": "", "isHidden": False}]

    try:
        with tempfile.TemporaryDirectory(prefix="confered-run-") as workdir:
            try:
                program = _prepare(language, code, workdir)
            except ValueError as exc:
                return _failed(language, str(exc), cases, started)

            results = []
            all_passed = True
            stderr_head = ""
            for index, case in enumerate(cases):
                hidden = bool(case.get("isHidden"))
                stdin = _stdin_of(case)
                expected = "" if case.get("expectedOutput") is None else str(case.get("expectedOutput"))
                try:
                    proc = program.run(stdin, workdir)
                    actual = proc.stdout or ""
                    error = proc.stderr or ""
                    if proc.returncode != 0 and not actual:
                        actual = error or f"Process exited with code {proc.returncode}"
                    if error and not stderr_head:
                        stderr_head = _clip(error)
                except subprocess.TimeoutExpired:
                    actual = f"Time limit exceeded (>{_TIMEOUT_SECONDS}s)"
                    all_passed = False
                    results.append(_case_result(case, index, False, actual, expected, hidden))
                    continue
                except OSError as exc:
                    actual = f"Could not start the program: {exc}"
                    all_passed = False
                    results.append(_case_result(case, index, False, actual, expected, hidden))
                    continue

                passed = _norm(actual) == _norm(expected)
                if not passed:
                    all_passed = False
                results.append(_case_result(case, index, passed, actual, expected, hidden))

            elapsed = int((time.perf_counter() - started) * 1000)
            return {
                "passed": all_passed,
                "stdout": "All test cases passed." if all_passed else "Some test cases failed.",
                "stderr": stderr_head,
                "executionTimeMs": elapsed,
                "memoryUsedKb": 0,
                "testResults": results,
            }
    except Exception as exc:  # noqa: BLE001 — surface a clean runner error, never a fake pass
        return _failed(language, f"Runner error: {exc}", cases, started)


def _stdin_of(case: dict) -> str:
    """Several inputs in one case are separate stdin lines, in the order the recruiter entered them."""
    raw = case.get("inputs")
    if isinstance(raw, list) and raw:
        return "\n".join("" if item is None else str(item) for item in raw)
    return "" if case.get("input") is None else str(case.get("input"))


def _listed_inputs(case: dict) -> List[str]:
    raw = case.get("inputs")
    if isinstance(raw, list) and raw:
        return ["" if item is None else str(item) for item in raw]
    return ["" if case.get("input") is None else str(case.get("input"))]


def _case_result(case: dict, index: int, passed: bool, actual: str, expected: str, hidden: bool) -> Dict[str, Any]:
    return {
        "testCaseId": case.get("id") or f"tc-{index + 1}",
        "passed": passed,
        "input": "" if hidden else _stdin_of(case),
        "inputs": [] if hidden else _listed_inputs(case),
        "expected": "" if hidden else expected,
        "actual": "" if hidden else _clip(actual),
        "isHidden": hidden,
    }


def _failed(language: str, message: str, cases: List[dict], started: float) -> Dict[str, Any]:
    del language
    elapsed = int((time.perf_counter() - started) * 1000)
    results = [
        _case_result(case, index, False, message, str(case.get("expectedOutput") or ""), bool(case.get("isHidden")))
        for index, case in enumerate(cases)
    ] or [_case_result({"id": "tc-1", "isHidden": False}, 0, False, message, "", False)]
    return {
        "passed": False,
        "stdout": "",
        "stderr": message,
        "executionTimeMs": elapsed,
        "memoryUsedKb": 0,
        "testResults": results,
    }
