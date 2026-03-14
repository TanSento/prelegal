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
