"""
Database health check for the admin foundation.   Run from the backend folder:

    python -m app.scripts.check_db

Verifies the Alembic revision, timestamptz columns, Row Level Security, the append-only audit trigger
and the seeded settings. Safe to run repeatedly (the audit self-test row is the only thing it adds).
"""
from sqlalchemy import inspect, text

from app.db.session import engine
from app.services.bootstrap import init_auth_db


def main() -> int:
    problems = []
    init_auth_db()  # also verifies the schema is at the Alembic head and seeds defaults

    with engine.begin() as c:
        print("revision        :", c.execute(text("select version_num from alembic_version")).scalar())

        rls = dict(c.execute(text(
            "select relname, relrowsecurity from pg_class "
            "where relnamespace = 'public'::regnamespace and relkind = 'r'")).fetchall())
        print("row security    :", {k: v for k, v in sorted(rls.items())})
        problems += [f"RLS off on {t}" for t, on in rls.items() if not on]

        naive = [r[0] for r in c.execute(text(
            "select table_name || '.' || column_name from information_schema.columns "
            "where table_schema = 'public' and data_type = 'timestamp without time zone'"))]
        print("naive timestamps:", naive or "none")
        problems += [f"naive timestamp {n}" for n in naive]

        groups = c.execute(text(
            'select "group", count(*) from system_settings group by 1 order by 1')).fetchall()
        print("settings        :", groups)
        problems += [] if groups else ["no settings seeded"]

        c.execute(text("insert into audit_logs(id, category, action, summary) "
                       "values ('selftest', 'system', 'db.selftest', 'append-only check') "
                       "on conflict (id) do nothing"))

    for verb, sql in (("DELETE", "delete from audit_logs where id = 'selftest'"),
                      ("UPDATE", "update audit_logs set summary = 'x' where id = 'selftest'")):
        try:
            with engine.begin() as c:
                c.execute(text(sql))
            problems.append(f"audit_logs {verb} was allowed")
        except Exception:
            print(f"audit {verb:<6}    : blocked (good)")

    print("staff_users cols:", [col["name"] for col in inspect(engine).get_columns("staff_users")])
    print("\nRESULT:", "ALL GOOD" if not problems else "PROBLEMS -> " + "; ".join(problems))
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
