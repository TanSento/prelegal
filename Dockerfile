# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY catalog.json ./catalog.json
COPY templates/ ./templates/
RUN npm run build

# Stage 2: Run backend
FROM python:3.11-slim
WORKDIR /app

RUN pip install uv

COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --no-dev

COPY backend/ ./
COPY --from=frontend-builder /frontend/out ./static

ENV STATIC_DIR=/app/static
ENV DB_PATH=/data/prelegal.db

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
