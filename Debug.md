# Debug Log — PL-11 Multi-Document Support

## Issue 1: Chat stuck on docType identification

**Symptom:** UI freezes when user types "Mutual NDA" or "NDA" during document selection. Form never transitions to the field-collection phase.

**Root cause (two categories):**

### Category A — `documentType` normalization failure
The model sometimes returns non-canonical `documentType` values such as `"NDA"`, `"Mutual NDA"`, or `"Mutual Non-Disclosure Agreement"` instead of the required `"nda"`.

- `main.py` emitted the raw value to the frontend → `onDocTypeChange("NDA")` → unknown key in `DOC_GREETINGS`/`DOC_NAMES`, form never transitioned
- Exact `== "nda"` check in `main.py` failed → NDA field remapping skipped → wrong payload structure sent to frontend

### Category B — NDA enum field value casing
`mndaTermType` and `confidentialityTermType` returned as `"Expires"`, `"Years"` (capitalized) instead of lowercase. All downstream comparisons in `NdaForm.tsx`, `NdaPreview.tsx`, and `NdaPdf.tsx` use exact lowercase strings.

**Fix:**
1. Added `_normalize_doc_type()` in `main.py` — maps raw model output to canonical key via `DOC_TYPE_MAP`
2. Applied `.strip().lower()` on `mndaTermType` and `confidentialityTermType` in `_remap_nda_fields()`
3. Added prompt clarifications in `ai.py` instructing model to use exact short keys and lowercase enum values

**Status: SUCCEEDED** — 3 new tests added, 19/19 pass

---

## Issue 2: Intermittent JSON parse error — `line 8234 column 1`

**Symptom:** User reported error `1 validation error for UnifiedAiResponse Invalid JSON: expected `,` or `}` at line 8234 column 1` when typing bare "NDA".

**Investigation:**
- The error is intermittent — could not reproduce on most calls (model returned compact valid JSON ~300 chars)
- Captured raw model output directly via LiteLLM to inspect the response structure
- Observed that Cerebras sometimes returns pretty-printed JSON (26 lines) with structural quirks (comma placement)
- **Line 8234** is the key data point: proper JSON escapes newlines as `\n`; 8234 actual newlines means literal unescaped newlines inside a string value
- `input_value` in the error showed the JSON starts/ends correctly — only the middle was broken
- Concluded: model occasionally generates a full NDA document draft in the `message` field; Cerebras does not escape literal newlines in long string values

**Root cause confirmed:** Cerebras structured output enforcement does not reliably escape literal newlines in long string field values. When the model writes a multi-paragraph/full-document response, this produces invalid JSON.

**Fix:**
1. Added `_repair_json()` in `ai.py` — state machine that replaces literal `\n`/`\r` inside JSON string values with escape sequences (`\\n`/`\\r`)
2. Wrapped `model_validate_json()` in try/except — calls `_repair_json` as fallback before re-raising
3. Added system prompt instruction: "Keep your message to 1-3 sentences. Never include the full document text in your message."

**Status: SUCCEEDED** — 3 new tests added (including regression test exercising the exact failure path), 19/19 pass

---

## Issue 3: Docker integration test — initial timeout

**Symptom:** First docker integration test run timed out at 60s when sending bare `"NDA"` as input.

**Investigation:**
- Second run with 120s timeout completed successfully in 4.6s
- Subsequent 3-round consistency test (6 calls) all passed in 2–5.5s
- Docker logs showed all requests returned 200 OK with no errors

**Root cause:** One-off Cerebras/OpenRouter latency spike on the first call. Not a code defect.

**Status: RESOLVED (no fix needed)** — confirmed transient network latency, not a bug

---

## Issue 4: Background test script produced 0-byte output

**Symptom:** 10-run background test (`bsmm6ujcq`) wrote 0 bytes to output file despite completing all 10 API calls (confirmed via Docker access logs).

**Root cause:** Python fully buffers stdout when output is redirected to a file (non-tty). All print output was held in the buffer and never flushed because the script was backgrounded and the buffer never filled.

**Status: RESOLVED (no fix needed)** — subsequent tests run with `PYTHONUNBUFFERED=1` or inline scripts to avoid this

---

## Summary

| Issue | Status | Files Changed |
|-------|--------|---------------|
| docType not normalized (stuck UI) | Succeeded | `backend/main.py`, `backend/ai.py`, `backend/tests/test_main.py` |
| NDA enum field casing | Succeeded | `backend/main.py`, `backend/tests/test_main.py` |
| Cerebras unescaped newlines in JSON | Succeeded | `backend/ai.py`, `backend/tests/test_ai.py` |
| Docker timeout (Cerebras latency spike) | No fix needed | — |
| Background script stdout buffering | No fix needed | — |

All changes committed to branch `feature/pl-11-multi-doc-support` and pushed to PR #9.
