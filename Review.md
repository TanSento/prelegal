# Codebase Review

## Session: 2026-03-15

### Issues Found and Fixed

#### 1. Broken Tests (10 failures) — FIXED

**`frontend/__tests__/NdaPdf.test.tsx`** — 4 failures

The Bug 3 fix (commit `47bf081`) changed `defaultFormData.mndaTerm.type` from `"expires"` to `""` and `defaultFormData.termOfConfidentiality.type` from `"years"` to `""`. Tests that spread `defaultFormData` and only overrode one checkbox field inherited the new empty-string default for the other, producing 1 checked box instead of the expected 2.

**Fix:** Added explicit `mndaTerm` or `termOfConfidentiality` overrides in each test so both checkbox fields have real values.

**`frontend/__tests__/page.test.tsx`** — 6 failures

This file imported `@/app/page` expecting the old `Home` component with `NdaForm` + `NdaPreview`. After the login page was added, `app/page.tsx` became `LoginPage` with `useRouter()`. The tests didn't mock Next.js App Router, so all 6 crashed with "invariant expected app router to be mounted".

**Fix:** Rewrote the test file entirely to test `LoginPage` — rendering fields, redirect behavior, form submission, and validation.

---

#### 2. Prompt Injection via `role` Field — FIXED

**File:** `backend/main.py`

`ChatMessage.role` was defined as `str` with no validation. A client could POST messages with `role: "system"` to inject system-level instructions into the LLM context. While the model resisted test injections, this is not a reliable security boundary — it depends on model alignment, not application-level enforcement.

**Fix:** Constrained `role` to `Literal["user", "assistant"]`. Pydantic now returns a 422 validation error for any other role value.

---

#### 3. Dead Code: `NdaForm.tsx` — FIXED

**Files:** `frontend/components/NdaForm.tsx`, `frontend/__tests__/NdaForm.test.tsx`

`NdaForm.tsx` (235 lines) was not imported anywhere in the app. It was the manual form UI before the AI chat interface (`ChatPanel`) replaced it. Its test file (367 lines) was also orphaned.

**Fix:** Deleted both files.

---

### Issues Noted (Not Fixed)

#### 4. No Rate Limiting on `/api/chat`

Each request spawns a thread and makes an external LLM API call via OpenRouter. Without rate limiting, a client could exhaust the API quota or starve the thread pool. Consider adding middleware-level rate limiting (e.g., `slowapi`) before production use.

#### 5. Date Lookup Uses Server Timezone

`backend/ai.py` — `_date_lookup()` uses `datetime.date.today()` which returns the Docker container's date. If a user in a different timezone says "today" near midnight, the resolved date may be off by one day. This is a known design limitation.

#### 6. No Request Size Limit

The backend accepts arbitrarily large payloads on `/api/chat`. Large message histories are forwarded to the LLM API, potentially increasing costs. Consider adding a max message count or payload size limit.

#### 7. `BaseHTTPMiddleware` and SSE Streaming

`NoCacheHtmlMiddleware` uses Starlette's `BaseHTTPMiddleware`, which historically had issues with `StreamingResponse` (buffering the entire body). Modern FastAPI/Starlette versions handle this better, but it could introduce subtle latency for SSE streams. Worth monitoring.

---

### Stress Test Results

| Test | Result |
|------|--------|
| Health check | OK |
| 5 concurrent chat requests | All completed in 2.8–4.6s |
| System role injection | Blocked (422 after fix) |
| Missing `formData` field | 422 validation error |
| Frontend unit tests | 74/74 pass |
