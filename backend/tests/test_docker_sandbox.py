"""Unit tests for DockerSandboxService."""
import pytest
from app.services.docker_sandbox import DockerSandboxService, is_docker_available


def test_is_docker_available_returns_boolean():
    res = is_docker_available()
    assert isinstance(res, bool)


def test_docker_sandbox_service_runs_python_code():
    code = (
        "def multiply(nums):\n"
        "    return nums[0] * nums[1]\n"
    )
    test_cases = [
        {"id": "tc-1", "input": "[6, 7]", "expectedOutput": "42", "weight": 10},
        {"id": "tc-2", "input": "[3, 5]", "expectedOutput": "15", "weight": 5},
    ]
    res = DockerSandboxService.execute("python", code, test_cases)
    assert res["passed"] is True
    assert len(res["testResults"]) == 2
    assert res["testResults"][0]["actual"].strip() == "42"


def test_docker_sandbox_service_runs_sql():
    setup = (
        "CREATE TABLE items (id INT, val TEXT);\n"
        "INSERT INTO items VALUES (1, 'Widget');\n"
    )
    test_cases = [
        {"id": "tc-sql-1", "setup": setup, "expectedOutput": "('Widget',)"},
    ]
    res = DockerSandboxService.execute("sql", "SELECT val FROM items WHERE id = 1;", test_cases)
    assert res["passed"] is True
    assert res["testResults"][0]["actual"] == "('Widget',)"


def test_docker_sandbox_backward_compatibility():
    code = "def max_product(nums):\n    return max(nums)\n"
    test_cases = [{"id": "tc-1", "input": "[1, 9, 2]", "expectedOutput": "9"}]
    res = DockerSandboxService.run_python_code(code, test_cases)
    assert res["passed"] is True
    assert res["testResults"][0]["actual"].strip() == "9"
