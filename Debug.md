# Debug Log

## Session: PL-10 AI Chat Bug Fixes (2026-03-14)

---

### Bug 1 — AI chat very slow / no response

**Symptom:** Chat responses took extremely long (30+ seconds) before any output appeared.

**Root cause:** `reasoning_effort="low"` was passed to the `completion()` call in `backend/ai.py`. The model `openrouter/openai/gpt-oss-120b` is a reasoning-capable model. Even at `"low"` effort this parameter triggers chain-of-thought reasoning tokens before the actual response, causing the long wait.

**Fix:** Removed `reasoning_effort="low"` from the `completion()` call in `backend/ai.py`.

**File:** `backend/ai.py`

---

### Bug 2 — Garbled AI responses ("Got - ????", "I've just ........ ..........")

**Symptom:** Intermittently (roughly 1 in 5 requests), the AI response displayed as garbled placeholder text instead of a real message. Observed patterns:
- `Got - ????`
- `I've just ........ ..........`
- `We have … ……… ... ...`
- `I've set the jurisdiction to """""""""""""`
- `Which ...?`

The garbling was always in the conversational `message` field; the structured `fields` data was typically correct.

**Root cause:** The `gpt-oss-120b` model through OpenRouter/Cerebras intermittently produces malformed `message` content in its structured JSON output. Multiple failure modes were observed:

| Pattern | Unicode / characters |
|---------|---------------------|
| `\xa0` / `\u202f` replacing all spaces | Non-breaking spaces in JSON strings |
| `\u200b` (zero-width space) mixed in | Zero-width space character |
| `\u2026` repeated (……………) | Unicode ellipsis character |
| `""""""""""""` | Repeated punctuation |
| Very short incomplete sentences | e.g. `"Which ...?"` (< 20 chars) |

Additionally, `main.py` split the message on `" "` (ASCII space only), so messages where the model used `\xa0`/`\u202f` would be delivered as a single huge token rather than word-by-word, causing further display issues.

**Fix — `backend/ai.py`:**
1. Added `_is_garbled(message)` function that detects all known garbled patterns (short length, dots, zero-width spaces, repeated punctuation, low letter ratio).
2. Added retry logic in `get_ai_response()`: retries once if the first response is garbled.
3. Raises `RuntimeError` if both attempts return garbled output (frontend shows a retryable error instead of empty/garbled text).

**Fix — `backend/main.py`:**
- Normalize `\xa0` and `\u202f` to ASCII space before `.split()` so tokens always stream word-by-word regardless of which space character the model used.

**Files:** `backend/ai.py`, `backend/main.py`

---

### Tests added

`backend/tests/test_chat_integration.py` — integration tests against the running Docker container:

| Test | What it covers |
|------|---------------|
| `test_health` | Server is up |
| `test_jurisdiction_response_not_garbled` | Regression: garbled responses don't reach the client |
| `test_unicode_spaces_normalized_in_tokens` | Regression: `\xa0`/`\u202f` are stripped before streaming |
| `test_response_speed_acceptable` | Guards against `reasoning_effort` being re-added (response < 20s) |
| `test_no_reasoning_effort_in_code` | Structural: `reasoning_effort` must not appear in `ai.py` |
| `test_html_pages_not_cached` | HTML responses must have `Cache-Control: no-store` |
| `test_js_chunks_not_blocked_by_no_store` | Non-HTML responses must not receive `no-store` |

---

## Session: PL-10 Follow-up Bug Fixes (2026-03-14)

---

### Bug 3 — Form fields appear prefilled on load (checkboxes pre-selected)

**Symptom:** After starting Docker, the MNDA Term and Term of Confidentiality checkboxes appeared pre-selected ("Expires from Effective Date" and "X years from Effective Date" checked), and the effective date appeared prefilled in some cases.

**Root cause — checkbox defaults:** `defaultFormData` had `mndaTerm.type = "expires"` and `termOfConfidentiality.type = "years"`. These default type values caused the corresponding checkboxes in `NdaPreview` to render as checked even before the user had interacted with the form.

**Root cause — stale sessionStorage:** A previous `page.tsx` implementation persisted form data to `sessionStorage`. After the sessionStorage write was removed but before Docker was rebuilt, the browser still loaded old form data (including a prefilled `effectiveDate`) from the stale sessionStorage key `prelegal_form_nda`.

**Fix — `frontend/lib/types.ts`:**
- Changed `MndaTerm.type` to `"" | "expires" | "continues"` (added empty string)
- Changed `TermOfConfidentiality.type` to `"" | "years" | "perpetuity"` (added empty string)
- Changed `defaultFormData.mndaTerm.type` from `"expires"` to `""`
- Changed `defaultFormData.termOfConfidentiality.type` from `"years"` to `""`
- Result: neither checkbox is checked on initial load

**Fix — `frontend/components/NdaPdf.tsx`:**
- `mndaTermText` and `tocText` now handle `""` type with a `"—"` fallback (instead of incorrectly falling through to the "continues"/"perpetuity" branch)

**Fix — `frontend/app/dashboard/page.tsx`:**
- Removed sessionStorage read/write for form data entirely. Form always initialises from `defaultFormData`.

**Files:** `frontend/lib/types.ts`, `frontend/components/NdaPdf.tsx`, `frontend/app/dashboard/page.tsx`

---

### Bug 4 — AI chat hangs indefinitely on garbled retry

**Symptom:** After a garbled response triggered the retry logic, the second LLM call hung forever with no response and no error shown in the UI. Docker logs showed `[AI RAW attempt=0]` with thousands of whitespace characters but no subsequent `[AI RAW attempt=1]` or error within a reasonable time.

**Root cause:** LiteLLM's `timeout=30` parameter is not reliably enforced for the OpenRouter/Cerebras provider. When `get_ai_response()` runs in `asyncio.to_thread()`, a hung thread cannot be cancelled by asyncio — so the request blocked indefinitely.

**Fix — `backend/main.py`:**
- Wrapped `asyncio.to_thread(get_ai_response, ...)` with `asyncio.wait_for(..., timeout=70.0)`
- 70 seconds covers 2 attempts × 30s each with buffer
- If the hard timeout fires, `asyncio.TimeoutError` is caught by the `except Exception` handler and streamed as an SSE error event — the user sees an error message instead of a frozen chat

**File:** `backend/main.py`

---

### Bug 5 — PDF download broken after Docker rebuild (404 on JS chunk)

**Symptom:** After Docker was rebuilt, clicking "Download PDF" did nothing. Docker logs showed: `GET /_next/static/chunks/95505e99cddbd7bf.js HTTP/1.1" 404 Not Found`. The PDF download uses dynamic imports (`@react-pdf/renderer`) which fetch JS chunks at click time.

**Root cause:** Next.js content-hashes its JS chunk filenames on every build. After a Docker rebuild the chunk filenames changed, but the browser had the **old HTML page cached** — it still referenced the old chunk names which no longer existed in the new container → 404 → dynamic import failed → PDF download silently broke.

**Fix — `backend/main.py`:**
- Added `NoCacheHtmlMiddleware` (Starlette `BaseHTTPMiddleware`) that sets `Cache-Control: no-store` on all `text/html` responses
- HTML pages are now always fetched fresh, guaranteeing the browser uses chunk names from the current build
- Content-hashed JS/CSS chunks (`/_next/static/`) are unaffected and remain freely cacheable

**File:** `backend/main.py`
