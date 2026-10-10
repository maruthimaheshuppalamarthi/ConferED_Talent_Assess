"""Celery application. Broker from CELERY_BROKER_URL (falls back to REDIS_URL)."""
from celery import Celery

from app.core.config import settings

broker = settings.CELERY_BROKER_URL or settings.REDIS_URL or "redis://localhost:6379/0"

celery_app = Celery("nexus_assess", broker=broker, backend=broker)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
)
celery_app.autodiscover_tasks(["app.workers"])
# Explicit import so the task module is registered when the worker starts.
celery_app.conf.imports = ("app.workers.invite_dispatch",)
