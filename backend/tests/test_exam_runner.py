"""Exam clock starts at exam entry, and the code runner uses the real interpreter."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timedelta, timezone  # noqa: E402

from app.services.code_exec import execute  # noqa: E402
from app.services.exam_timing import exam_time_left  # noqa: E402


def test_clock_waits_until_the_exam_starts():
    now = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)
    seconds, started = exam_time_left(None, 60, now)
    assert seconds == 60 * 60
    assert started is False


def test_clock_counts_down_from_exam_start():
    now = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)
    began = now - timedelta(seconds=90)
    seconds, started = exam_time_left(began, 2, now)
    assert started is True
    assert seconds == 30


def test_clock_stops_at_zero():
    now = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)
    began = now - timedelta(hours=3)
    seconds, started = exam_time_left(began, 60, now)
    assert started is True
    assert seconds == 0


def test_python_program_reads_stdin_and_prints_stdout():
    result = execute(
        "python",
        "import sys\nprint(sys.stdin.read().strip()[::-1])\n",
        [{"id": "1", "input": "ab\n", "expectedOutput": "ba", "isHidden": False}],
    )
    assert result["passed"] is True
    assert result["testResults"][0]["actual"].strip() == "ba"


def test_python_mismatch_is_a_real_failure():
    result = execute(
        "python",
        "print('no')\n",
        [{"id": "1", "input": "", "expectedOutput": "yes", "isHidden": False}],
    )
    assert result["passed"] is False
    assert result["testResults"][0]["actual"].strip() == "no"


def test_several_inputs_in_one_case_are_separate_lines():
    result = execute(
        "python",
        "a = input()\nb = input()\nprint(a == b)\n",
        [{"id": "1", "inputs": ["abcd", "abcd"], "expectedOutput": "True", "isHidden": False}],
    )
    assert result["passed"] is True
    assert result["testResults"][0]["inputs"] == ["abcd", "abcd"]
    assert result["testResults"][0]["actual"].strip() == "True"


def test_hidden_case_does_not_reveal_its_inputs():
    result = execute(
        "python",
        "print('ok')\n",
        [{"id": "1", "inputs": ["secret", "value"], "expectedOutput": "ok", "isHidden": True}],
    )
    assert result["testResults"][0]["inputs"] == []
    assert result["testResults"][0]["input"] == ""


def test_multiline_stdin_is_preserved():
    result = execute(
        "python",
        "import sys\nprint(sys.stdin.read(), end='')\n",
        [{"id": "1", "input": "3\n1 2\n", "expectedOutput": "3\n1 2\n", "isHidden": False}],
    )
    assert result["passed"] is True


def test_missing_compiler_does_not_pretend_to_pass():
    result = execute(
        "not-a-real-language",
        "fun main() { println(1) }\n",
        [{"id": "1", "input": "", "expectedOutput": "1", "isHidden": False}],
    )
    assert result["passed"] is False
    assert "not installed" in result["stderr"].lower()
    assert result["testResults"][0]["actual"] != "1"


def test_sql_execution_evaluates_query_against_test_cases():
    setup = (
        "CREATE TABLE users (id INT, name TEXT);\n"
        "INSERT INTO users VALUES (1, 'Alice');\n"
        "INSERT INTO users VALUES (2, 'Bob');\n"
    )
    result = execute(
        "sql",
        "SELECT name FROM users WHERE id = 1;",
        [{"id": "tc-1", "setup": setup, "expectedOutput": "('Alice',)", "isHidden": False}],
    )
    assert result["passed"] is True
    assert result["testResults"][0]["actual"] == "('Alice',)"


def test_python_function_without_stdin_is_invoked_via_harness():
    code = (
        "def add_nums(pair):\n"
        "    return pair[0] + pair[1]\n"
    )
    result = execute(
        "python",
        code,
        [{"id": "tc-1", "input": "[10, 20]", "expectedOutput": "30", "isHidden": False}],
    )
    assert result["passed"] is True
    assert result["testResults"][0]["actual"].strip() == "30"

