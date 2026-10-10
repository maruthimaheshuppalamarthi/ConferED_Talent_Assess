# Celery invite dispatch worker

Bulk invitation emails are sent by Celery when `CELERY_BROKER_URL` is set.

## Local / Docker

```bash
# Redis
docker run -d --name nexus-redis -p 6379:6379 redis:7-alpine

# From backend/
export CELERY_BROKER_URL=redis://localhost:6379/0
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

When `CELERY_BROKER_URL` is empty (default), confirm sends emails **synchronously** in-process so local/dev works without Redis.

## Task

- `invite.dispatch_row(row_id, invite_token)` — sends one invite email and sets `SENT` / `FAILED` on `invite_batch_rows` and `candidate_invites`.
