"""In-memory SQLite execution engine for evaluating candidate SQL questions against test cases."""
from __future__ import annotations

import sqlite3
import time
from typing import Any, Dict, List, Optional


def execute_sql(
    query: str,
    test_cases: Optional[List[dict]] = None,
    correct_query: Optional[str] = None,
) -> Dict[str, Any]:
    started = time.perf_counter()
    query = (query or "").strip()
    if not query:
        return {
            "passed": False,
            "stdout": "",
            "stderr": "No SQL query provided.",
            "executionTimeMs": 0,
            "memoryUsedKb": 0,
            "testResults": [],
        }

    cases = [c for c in (test_cases or []) if isinstance(c, dict)]
    if not cases:
        # Default test case to validate query syntax and execute on standard employees schema
        cases = [{
            "id": "tc-sql-1",
            "setup": (
                "CREATE TABLE employees (employee_id INT PRIMARY KEY, name TEXT, department_id INT, salary INT);\n"
                "INSERT INTO employees VALUES (1, 'Alice', 10, 95000);\n"
                "INSERT INTO employees VALUES (2, 'Bob', 10, 80000);\n"
                "INSERT INTO employees VALUES (3, 'Charlie', 10, 75000);\n"
                "INSERT INTO employees VALUES (4, 'David', 20, 110000);\n"
                "INSERT INTO employees VALUES (5, 'Eve', 20, 105000);\n"
            ),
            "expectedOutput": "",
            "isHidden": False,
        }]

    results = []
    all_passed = True
    stderr_first = ""

    for idx, case in enumerate(cases):
        hidden = bool(case.get("isHidden"))
        setup_script = case.get("setup") or case.get("input") or ""
        expected = str(case.get("expectedOutput") or "").strip()

        # Fresh in-memory sqlite instance
        try:
            conn = sqlite3.connect(":memory:")
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Execute setup DDL/DML if present
            if setup_script:
                cursor.executescript(setup_script)

            # If a reference query exists, compute expected from it if not already set
            if correct_query and not expected:
                try:
                    ref_cur = conn.cursor()
                    ref_cur.execute(correct_query)
                    ref_rows = ref_cur.fetchall()
                    expected = "\n".join(str(tuple(r)) for r in ref_rows)
                except sqlite3.Error:
                    pass

            # Execute candidate query
            cursor.execute(query)
            rows = cursor.fetchall()
            actual = "\n".join(str(tuple(r)) for r in rows) if rows else "Query executed successfully (0 rows returned)."

            # Check if expected matches actual, or if syntax passed when expected is empty
            if expected:
                passed = (actual.strip() == expected.strip())
            else:
                passed = True  # valid execution with no syntax error

            conn.close()
        except sqlite3.Error as exc:
            actual = f"SQL Error: {exc}"
            passed = False
            if not stderr_first:
                stderr_first = str(exc)

        if not passed:
            all_passed = False

        results.append({
            "testCaseId": case.get("id") or f"tc-sql-{idx + 1}",
            "passed": passed,
            "input": "" if hidden else setup_script,
            "expected": "" if hidden else expected,
            "actual": "" if hidden else actual,
            "isHidden": hidden,
        })

    elapsed = int((time.perf_counter() - started) * 1000)
    return {
        "passed": all_passed,
        "stdout": "All SQL test cases passed." if all_passed else "Some SQL test cases failed.",
        "stderr": stderr_first,
        "executionTimeMs": elapsed,
        "memoryUsedKb": 0,
        "testResults": results,
    }
