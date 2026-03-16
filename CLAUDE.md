# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 CommonPaper legal document types with AI-powered chat, live preview, and PDF generation. It has a fake login screen, a document picker dashboard, a FastAPI backend serving the static frontend, and a SQLite database. Real authentication and document persistence are not yet implemented.

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

## Completed Stages

### PL-2: Legal Document Templates Dataset (Done)

Curated CommonPaper legal agreement templates under CC BY 4.0 license.

- Created `catalog.json` — index of all 12 templates with name, description, filename
- Created `templates/` — 13 markdown template files (Mutual NDA, CSA, SLA, DPA, PSA, BAA, Pilot, Partnership, Software License, Design Partner, AI Addendum) + `LICENSE.txt`

### PL-3: Mutual NDA Creator Prototype (Done)

Next.js web app to create a Mutual NDA via a form with live preview and PDF download.

- Created `frontend/app/page.tsx` — main page with NdaForm + NdaPreview side-by-side
- Created `frontend/components/NdaForm.tsx` — form with all NDA fields (later removed in codebase review)
- Created `frontend/components/NdaPreview.tsx` — live HTML preview of the NDA cover page + standard terms
- Created `frontend/components/NdaPdf.tsx` — PDF generation via `@react-pdf/renderer` with checkbox rendering (filled-box style, not Unicode)
- Created `frontend/lib/types.ts` — `NdaFormData`, `PartyInfo`, `MndaTerm`, `TermOfConfidentiality`, `ChatMessage` types + `defaultFormData`
- Created `frontend/__tests__/` — unit tests for NdaForm, NdaPdf, NdaPreview, page, types
- Created `frontend/e2e/` — Playwright e2e tests for accessibility, mobile, NDA creator, PDF download
- Created `frontend/next.config.ts` — static export with `output: 'export'`, `trailingSlash: true`

### PL-9: V1 Foundation (Done)

Upgraded prototype to production-ready architecture with FastAPI backend, Docker, and fake login.

- Created `backend/main.py` — FastAPI app, serves static frontend, `GET /api/health`
- Created `backend/database.py` — SQLite init at `/data/prelegal.db`, `users` table
- Created `backend/pyproject.toml` — uv project with FastAPI, aiosqlite, uvicorn dependencies
- Created `Dockerfile` — multi-stage build (Node frontend build → Python backend)
- Created `compose.yaml` — single service on port 8000, named volume for data, env_file
- Created `scripts/` — 6 start/stop scripts for Mac, Linux, Windows
- Modified `frontend/app/page.tsx` — converted to fake login page (name/email, localStorage)
- Created `frontend/app/dashboard/page.tsx` — dashboard with NdaForm sidebar + NdaPreview main panel
- Created `CLAUDE.md` — project instructions and technical design

### PL-10: AI Chat for Mutual NDA (Done)

Replaced the manual NDA form with an AI-powered chat interface.

- Created `backend/ai.py` — LiteLLM → OpenRouter → Cerebras (`openrouter/openai/gpt-oss-120b`); structured outputs via Pydantic (`AiResponse`, `PartialNdaFields`); system prompt with date lookup table, year shorthands, field clearing; garbled response detection (`_is_garbled`) with retry logic
- Modified `backend/main.py` — added `POST /api/chat` SSE streaming endpoint; `NoCacheHtmlMiddleware` for fresh HTML after Docker rebuilds; `asyncio.wait_for` 70s hard timeout; Unicode space normalization; `ChatMessage.role` constrained to `Literal["user", "assistant"]`
- Created `frontend/components/ChatPanel.tsx` — chat UI with SSE streaming, typing indicator, message history (sessionStorage), greeting with examples
- Created `frontend/lib/api.ts` — `streamChat()` SSE client with token/fields/done/error events; `mergeFields()` deep-merge for partial NDA field updates
- Created `frontend/lib/chat-storage.ts` — sessionStorage persistence for chat messages
- Modified `frontend/app/dashboard/page.tsx` — replaced NdaForm with ChatPanel, added mobile tab bar (Chat/Preview), PDF dynamic import
- Modified `frontend/lib/types.ts` — added `ChatMessage` type; changed `MndaTerm.type` and `TermOfConfidentiality.type` to include `""` for empty initial state

#### PL-10 Bug Fixes (PR #8, #10)

- `backend/ai.py` — removed `reasoning_effort="low"` (caused 30s+ delays); added `_is_garbled()` detection + retry; fixed AI prompt for all NDA fields with examples and shorthands
- `backend/main.py` — added `NoCacheHtmlMiddleware` (prevents stale JS chunk 404s after rebuild); added `asyncio.wait_for` 70s timeout (prevents infinite hang on garbled retry); normalized `\xa0`/`\u202f` Unicode spaces before SSE token splitting
- `frontend/app/dashboard/page.tsx` — removed sessionStorage persistence for form data (caused prefilled fields)
- `frontend/lib/types.ts` — defaulted `mndaTerm.type` and `termOfConfidentiality.type` to `""` (no checkboxes pre-selected)
- `frontend/components/NdaPdf.tsx` — handled `""` type with `"—"` fallback in mndaTermText/tocText
- Created `backend/tests/test_chat_integration.py` — 7 integration tests (health, garbled detection, Unicode normalization, response speed, no reasoning_effort, HTML cache-control, JS chunk caching)
- Created `Debug.md` — documented bugs 1–5 with root causes and fixes

### Codebase Review (PR #11, #12)

Post PL-10 review and fixes.

- Modified `frontend/__tests__/NdaPdf.test.tsx` — fixed 4 tests that assumed old `defaultFormData` defaults; added explicit `mndaTerm`/`termOfConfidentiality` overrides
- Rewrote `frontend/__tests__/page.test.tsx` — replaced stale Home/NdaForm tests with LoginPage tests (router mock, localStorage, form submission, validation)
- Modified `backend/main.py` — constrained `ChatMessage.role` to `Literal["user", "assistant"]` (blocks prompt injection via system role)
- Deleted `frontend/components/NdaForm.tsx` — dead code, replaced by ChatPanel
- Deleted `frontend/__tests__/NdaForm.test.tsx` — orphaned test for deleted component
- Modified `backend/ai.py` — updated date prompt to accept full date formats (e.g. "March 15 2026"), not just shortcuts
- Modified `frontend/components/ChatPanel.tsx` — added example purposes to greeting message
- Created `Review.md` — documented review findings and stress test results

### PL-11: Multi-Document Support (Done, PR #13)

Expanded from NDA-only to all 11 CommonPaper legal document types with generic rendering, per-document AI chat, and PDF generation.

**Backend:**
- Created `backend/doc_configs/` — package with 11 per-document configs (system prompts + Pydantic structured output models) and shared `PartialPartyInfo` base model
- Refactored `backend/ai.py` — dynamic doc config loading via `importlib` based on `docType` parameter; retry loop (up to 3 attempts) handles both transient API errors and garbled responses
- Modified `backend/main.py` — added `docType` field to `ChatRequest`

**Frontend:**
- Created `frontend/lib/doc-schema.ts` — core types: `DocSchema`, `FieldDef`, `PartyDef`, `DocFormData`
- Created `frontend/lib/schemas/` — 11 document schema definitions (mutual-nda, csa, sla, dpa, psa, baa, pilot, partnership, software-license, design-partner, ai-addendum)
- Created `frontend/lib/doc-registry.ts` — central registry mapping doc IDs to schemas
- Created `frontend/components/DocPreview.tsx` — generic HTML preview for any document type
- Created `frontend/components/DocPdf.tsx` — generic PDF generation for any document type
- Created `frontend/components/DocPicker.tsx` — document selection grid on dashboard
- Created `frontend/lib/parse-terms.ts` — markdown template parser (extracts numbered sections)
- Created `frontend/lib/terms-loader.ts` — lazy template loader with caching via dynamic imports
- Created `frontend/lib/doc-utils.ts` — shared `formatDate`/`pluralYears` utilities
- Modified `frontend/components/ChatPanel.tsx` — accepts `schema` prop, auto-focus input after AI response
- Modified `frontend/lib/api.ts` — `streamChat` takes `docType`, `mergeFields` handles party1/party2 → parties[] mapping
- Modified `frontend/lib/chat-storage.ts` — per-document sessionStorage keyed by `docId`
- Modified `frontend/app/dashboard/page.tsx` — document selection flow with DocPicker, generic rendering

**Build:**
- Modified `Dockerfile` — copies `catalog.json` and `templates/` into frontend build stage
- Modified `frontend/next.config.ts` — webpack `asset/source` rule for `.md` imports
- Modified `frontend/package.json` — `next build --webpack`, added `raw-loader`

## Not Yet Built

- **PL-12**: Real authentication, document persistence, UI polish

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`


