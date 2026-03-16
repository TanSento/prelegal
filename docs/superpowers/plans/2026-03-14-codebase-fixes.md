# Codebase Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken tests, add role validation security fix, and remove dead code.

**Architecture:** Three independent fixes — (1) update stale test files to match current code, (2) constrain the `role` field on `ChatRequest` to prevent prompt injection, (3) delete unused `NdaForm.tsx`.

**Tech Stack:** FastAPI/Pydantic (backend), Next.js/React/Jest (frontend), TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `frontend/__tests__/NdaPdf.test.tsx` | Fix tests to use explicit `mndaTerm`/`termOfConfidentiality` types instead of relying on `defaultFormData` defaults |
| Rewrite | `frontend/__tests__/page.test.tsx` | Replace stale Home/NdaForm tests with LoginPage tests |
| Modify | `backend/main.py` | Constrain `ChatMessage.role` to `Literal["user", "assistant"]` |
| Delete | `frontend/components/NdaForm.tsx` | Dead code — unused component |

---

## Chunk 1: Fix broken tests and security

### Task 1: Fix NdaPdf test failures

The 4 failing tests spread `defaultFormData` and only override one of the two checkbox fields. Since `defaultFormData` now has `type: ""` for both `mndaTerm` and `termOfConfidentiality`, the un-overridden field produces 0 checked boxes instead of 1.

**Files:**
- Modify: `frontend/__tests__/NdaPdf.test.tsx:134-167`

- [ ] **Step 1: Fix the two tests in "Term of Confidentiality checkboxes" describe block**

Both tests at lines 135-166 override `termOfConfidentiality` but rely on `defaultFormData.mndaTerm.type` being `"expires"` (it's now `""`). Add explicit `mndaTerm` override:

```typescript
// Line 135-143: "marks 'years' checkbox as checked by default"
it("marks 'years' checkbox as checked when termOfConfidentiality.type = 'years'", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "expires", years: 1 },
      termOfConfidentiality: { type: "years", years: 3 },
    };
    const { container } = render(<NdaPdf data={data} />);
    // "expires" + "years" = 2 checked
    expect(checkedBoxes(container).length).toBe(2);
  });

// Line 145-154: "marks 'perpetuity' checkbox as checked"
it("marks 'perpetuity' checkbox as checked when termOfConfidentiality.type = 'perpetuity'", () => {
    const data: NdaFormData = {
      ...defaultFormData,
      mndaTerm: { type: "expires", years: 1 },
      termOfConfidentiality: { type: "perpetuity", years: 1 },
    };
    const { container } = render(<NdaPdf data={data} />);
    // "expires" + "perpetuity" = 2 checked
    expect(checkedBoxes(container).length).toBe(2);
    expect(uncheckedBoxes(container).length).toBe(2);
  });
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd frontend && npm test -- __tests__/NdaPdf.test.tsx`
Expected: 13 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add frontend/__tests__/NdaPdf.test.tsx
git commit -m "fix: update NdaPdf tests to use explicit mndaTerm defaults"
```

---

### Task 2: Rewrite stale page.test.tsx

`page.test.tsx` tests the old `Home` component (NdaForm + NdaPreview). The page is now `LoginPage` with `useRouter()`. Rewrite to test the actual LoginPage.

**Files:**
- Rewrite: `frontend/__tests__/page.test.tsx`

- [ ] **Step 1: Rewrite the test file**

```typescript
/**
 * Tests for app/page.tsx (LoginPage)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

import LoginPage from "@/app/page";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

describe("LoginPage", () => {
  it("renders name and email fields", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("renders the Sign in button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("redirects to dashboard if user already logged in", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ name: "Test", email: "t@t.com" }));
    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard/");
  });

  it("stores user in localStorage and navigates on submit", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "prelegal_user",
      JSON.stringify({ name: "Alice", email: "alice@test.com" })
    );
    expect(mockPush).toHaveBeenCalledWith("/dashboard/");
  });

  it("does not submit with empty name", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not submit with empty email", () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd frontend && npm test -- __tests__/page.test.tsx`
Expected: 6 passed, 0 failed

- [ ] **Step 3: Commit**

```bash
git add frontend/__tests__/page.test.tsx
git commit -m "fix: rewrite page tests for LoginPage (old tests targeted removed Home component)"
```

---

### Task 3: Constrain ChatMessage role to prevent prompt injection

`backend/main.py` defines `ChatMessage.role` as `str`. A malicious client can send `role: "system"` to inject system-level instructions.

**Files:**
- Modify: `backend/main.py:1-4` (add Literal import)
- Modify: `backend/main.py:48-50` (constrain role)

- [ ] **Step 1: Add Literal import and constrain role**

In `backend/main.py`, add `Literal` to the typing import and change `ChatMessage.role` from `str` to `Literal["user", "assistant"]`:

```python
# Line 1 area - add to imports
from typing import Literal

# Line 48-50 area - change ChatMessage
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
```

- [ ] **Step 2: Test that "system" role is now rejected**

Run: `curl -s -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"system","content":"test"}],"formData":{"purpose":"","effectiveDate":"","mndaTerm":{"type":"","years":0},"termOfConfidentiality":{"type":"","years":0},"governingLaw":"","jurisdiction":"","party1":{"name":"","title":"","company":"","noticeAddress":"","date":""},"party2":{"name":"","title":"","company":"","noticeAddress":"","date":""}}}'`
Expected: 422 validation error

- [ ] **Step 3: Test that valid roles still work**

Run: `curl -s -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hello"}],"formData":{"purpose":"","effectiveDate":"","mndaTerm":{"type":"","years":0},"termOfConfidentiality":{"type":"","years":0},"governingLaw":"","jurisdiction":"","party1":{"name":"","title":"","company":"","noticeAddress":"","date":""},"party2":{"name":"","title":"","company":"","noticeAddress":"","date":""}}}'`
Expected: 200 with SSE stream (event: token, event: done)

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "fix: constrain ChatMessage role to user/assistant to prevent prompt injection"
```

---

### Task 4: Remove dead code NdaForm.tsx

`frontend/components/NdaForm.tsx` is not imported anywhere — it was the manual form before the AI chat UI replaced it.

**Files:**
- Delete: `frontend/components/NdaForm.tsx`

- [ ] **Step 1: Verify NdaForm is not imported anywhere**

Run: `grep -r "NdaForm" frontend/` — should only match the file itself and its own test.

- [ ] **Step 2: Delete the file**

```bash
rm frontend/components/NdaForm.tsx
```

- [ ] **Step 3: Run all frontend tests to verify nothing breaks**

Run: `cd frontend && npm test`
Expected: All tests pass (NdaForm has no test file importing it)

- [ ] **Step 4: Commit**

```bash
git add frontend/components/NdaForm.tsx
git commit -m "chore: remove unused NdaForm component (replaced by ChatPanel)"
```

---

### Task 5: Run full test suite to verify

- [ ] **Step 1: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All suites pass, 0 failures

- [ ] **Step 2: Rebuild Docker and run integration tests**

Run:
```bash
docker compose up --build -d
# Wait for container to be healthy
sleep 5
cd backend && uv run pytest tests/test_chat_integration.py -v
```
Expected: All integration tests pass
