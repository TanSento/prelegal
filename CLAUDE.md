# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation has the V1 foundation in place plus an AI chat interface for the Mutual NDA: a fake login screen, an AI-powered NDA creator on the dashboard, a FastAPI backend serving the static frontend, and a SQLite database. Multi-document support, real authentication, and document persistence are not yet implemented.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
The frontend is statically built (`next build` with `output: 'export'`) and served by FastAPI from `backend/static/`.
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Current implementation status (as of PL-10 + prompt fixes)

- **Login**: Fake login at `/` — accepts any name/email, stores in `localStorage`, no real auth
- **Dashboard**: `/dashboard/` — AI chat interface for Mutual NDA creation with live preview and PDF download
- **AI chat** (`backend/ai.py`): SSE streaming chat via `POST /api/chat`; LiteLLM → OpenRouter → Cerebras (`openrouter/openai/gpt-oss-120b`); structured outputs with Pydantic; supports date shorthands (today, tmr, Mon–Sun, next Mon–next Sun), year shorthands (1yr, 2yr, perp, etc.), and field clearing (clear all, clear specific field)
- **Backend**: `backend/main.py` — FastAPI, serves static frontend, exposes `GET /api/health` and `POST /api/chat`
- **Database**: `backend/database.py` — SQLite at `/data/prelegal.db`, `users` table created on startup
- **Docker**: `Dockerfile` (multi-stage) + `compose.yaml` — single container on port 8000
- **Scripts**: All 6 start/stop scripts in `scripts/` are implemented and tested
- **Not yet built**: Multi-document support, real authentication, document persistence

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`


