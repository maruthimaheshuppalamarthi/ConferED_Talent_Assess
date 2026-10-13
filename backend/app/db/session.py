from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

_is_sqlite = settings.AUTH_DATABASE_URL.startswith("sqlite")
# A hosted database that never answers must fail in a few seconds. Without this,
# one stuck connection fills the worker and every sign-in waits forever.
if _is_sqlite:
    _connect_args = {"check_same_thread": False}
elif settings.AUTH_DATABASE_URL.startswith("postgresql+pg8000"):
    _connect_args = {"timeout": 5}
else:
    _connect_args = {"connect_timeout": 5}

engine = create_engine(
    settings.AUTH_DATABASE_URL,
    connect_args=_connect_args,
    future=True,
    # Postgres (Supabase pooler): detect dropped connections and recycle them.
    **({} if _is_sqlite else {
        "pool_pre_ping": True, "pool_recycle": 300, "pool_size": 5, "max_overflow": 5, "pool_timeout": 8,
    }),
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db():
    """FastAPI dependency yielding a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
