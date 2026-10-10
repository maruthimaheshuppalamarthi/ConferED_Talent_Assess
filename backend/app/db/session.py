from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

_connect_args = {"check_same_thread": False} if settings.AUTH_DATABASE_URL.startswith("sqlite") else {}

_is_sqlite = settings.AUTH_DATABASE_URL.startswith("sqlite")

engine = create_engine(
    settings.AUTH_DATABASE_URL,
    connect_args=_connect_args,
    future=True,
    # Postgres (Supabase pooler): detect dropped connections and recycle them.
    **({} if _is_sqlite else {"pool_pre_ping": True, "pool_recycle": 300, "pool_size": 5, "max_overflow": 5}),
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db():
    """FastAPI dependency yielding a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
