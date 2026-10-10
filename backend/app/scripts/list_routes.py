"""
Print every API route (method + path), optionally only those starting with a prefix.

    python -m app.scripts.list_routes                      # everything
    python -m app.scripts.list_routes /api/v1/admin        # only the admin API
"""
import sys

from app.main import app


def main() -> int:
    prefix = sys.argv[1] if len(sys.argv) > 1 else ""
    spec = app.openapi()
    for path, operations in sorted(spec["paths"].items()):
        if path.startswith(prefix):
            methods = ",".join(m.upper() for m in operations)
            print(f"{methods:<14} {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
