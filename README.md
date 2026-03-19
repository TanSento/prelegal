# Prelegal

AI-powered platform for drafting common legal agreements using CommonPaper templates.

## What it does

- Chat with an AI assistant to fill in legal documents — no forms, just conversation
- Supports 11 document types: Mutual NDA, CSA, SLA, DPA, PSA, BAA, Pilot, Partnership, Software License, Design Partner, AI Addendum
- Live HTML preview updates as you chat; download as PDF when ready
- Sign up, save drafts, and resume documents across sessions

## Stack

- **Frontend**: Next.js (TypeScript), statically exported, served by FastAPI
- **Backend**: Python, FastAPI, SQLite, bcrypt auth, SSE streaming
- **AI**: LiteLLM → OpenRouter → Cerebras (`gpt-oss-120b`) with structured outputs
- **Deploy**: Docker (`docker compose up`)

## Running locally

Requires Docker and an `OPENROUTER_API_KEY` in a `.env` file at the project root.

```bash
docker compose up --build
```

Open [http://localhost:8000](http://localhost:8000), sign up, and start drafting.

> The database resets on every container restart (demo behavior).

## Development

```bash
# Backend tests
cd backend && uv run pytest

# Frontend tests
cd frontend && npm test
```
