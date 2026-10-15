# Orvant API for Cloud Run: one uvicorn worker, CPU-only torch, the embedding model and one index version baked in,
# so a cold start needs no network. Build from the repo root, with an active index in backend/data (see DEPLOY.md):
#   docker build --platform linux/amd64 --build-arg INDEX_VERSION=$(cat backend/data/indexes/ACTIVE) -t orvant-backend .
FROM python:3.11.15-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_DEFAULT_TIMEOUT=120 PIP_RETRIES=10 HF_HOME=/opt/hf
WORKDIR /app

# Every package pinned with hashes, torch from the CPU-only index (see backend/requirements-api.txt).
COPY backend/requirements-api.lock backend/
RUN pip install --require-hashes --no-deps -r backend/requirements-api.lock && pip check

# The model layer depends only on what fetch_model imports, so other code changes don't re-download 438 MB.
COPY backend/__init__.py backend/index.py backend/ingest.py backend/query_plan.py backend/schema.py backend/fetch_model.py backend/
RUN python -m backend.fetch_model

ARG INDEX_VERSION
RUN test -n "$INDEX_VERSION" || { echo "pass --build-arg INDEX_VERSION=\$(cat backend/data/indexes/ACTIVE)"; exit 1; }
RUN useradd --system --uid 10001 --home-dir /tmp app
COPY backend/data/normalized backend/data/normalized
COPY backend/data/indexes/${INDEX_VERSION} backend/data/indexes/${INDEX_VERSION}
# Chroma writes to its sqlite file when it opens the index, so the data directory belongs to the app user.
RUN echo "$INDEX_VERSION" > backend/data/indexes/ACTIVE && chown -R app backend/data
COPY data/patients/processed/patients.json data/patients/processed/
COPY backend/*.py backend/

USER app
# Audit and decision events go to stdout, where Cloud Logging keeps them (DEPLOY.md routes them to a 365-day bucket).
ENV HF_HUB_OFFLINE=1 OMP_NUM_THREADS=2 ORVANT_AUDIT_SINK=stdout
EXPOSE 8080
# Cloud Run already records every request, so uvicorn's own access log is off.
CMD ["sh", "-c", "exec uvicorn backend.api:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1 --no-access-log"]
