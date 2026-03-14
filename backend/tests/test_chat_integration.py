"""Integration tests for the /api/chat endpoint against the running Docker container."""
import json
import re
import time
import urllib.request
import urllib.error


BASE_URL = "http://localhost:8000"

FORM_DATA_JURISDICTION = {
    "purpose": "Exploring a technology partnership",
    "effectiveDate": "2026-03-25",
    "mndaTerm": {"type": "expires", "years": 3},
    "termOfConfidentiality": {"type": "years", "years": 2},
    "governingLaw": "New South Wales",
    "jurisdiction": "",
    "party1": {"name": "", "title": "", "company": "", "noticeAddress": "", "date": ""},
    "party2": {"name": "", "title": "", "company": "", "noticeAddress": "", "date": ""},
}

MESSAGES_JURISDICTION = [
    {"role": "user", "content": "Exploring a technology partnership"},
    {"role": "assistant", "content": "Purpose set. What effective date?"},
    {"role": "user", "content": "Next Wednesday"},
    {"role": "assistant", "content": "Date set to 2026-03-25. NDA term?"},
    {"role": "user", "content": "3 years"},
    {"role": "assistant", "content": "NDA term 3 years. Confidentiality term?"},
    {"role": "user", "content": "2 years"},
    {"role": "assistant", "content": "Confidentiality 2 years. Governing law?"},
    {"role": "user", "content": "New South Wales"},
    {"role": "assistant", "content": "Governing law New South Wales. Jurisdiction?"},
    {"role": "user", "content": "Supreme Court of New South Wales"},
]


def _post_chat(messages: list[dict], form_data: dict, timeout: int = 60) -> dict:
    """Send chat request and collect all SSE events."""
    body = json.dumps({"messages": messages, "formData": form_data}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/chat",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    collected = {"tokens": [], "fields": None, "done": False, "error": None}
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        current_event = None
        for raw_line in resp:
            line = raw_line.decode().rstrip("\n")
            if line.startswith("event:"):
                current_event = line[len("event:"):].strip()
            elif line.startswith("data:"):
                payload = json.loads(line[len("data:"):].strip())
                if current_event == "token":
                    collected["tokens"].append(payload.get("text", ""))
                elif current_event == "fields":
                    collected["fields"] = payload
                elif current_event == "done":
                    collected["done"] = True
                elif current_event == "error":
                    collected["error"] = payload
    return collected


def _is_garbled(msg: str) -> bool:
    if len(msg.strip()) < 20:
        return True
    if re.search(r"\.{4,}", msg):
        return True
    if re.search(r'([^\w\s])\1{3,}', msg):
        return True
    if "????" in msg or "\u200b" in msg:
        return True
    if msg.count("\u2026") >= 2:
        return True
    letters = len(re.sub(r"[^a-zA-Z]", "", msg))
    non_space = len(re.sub(r"\s", "", msg))
    return non_space > 10 and letters / max(non_space, 1) < 0.4


# --- Tests ---

def test_health():
    req = urllib.request.Request(f"{BASE_URL}/api/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200


def test_jurisdiction_response_not_garbled():
    """Regression: after jurisdiction input the model must return a coherent message.

    The gpt-oss-120b model intermittently returns garbled output (dots, zero-width
    spaces, repeated quotes). The backend now retries once; this test verifies the
    final response delivered to the client is always clean.
    """
    result = _post_chat(MESSAGES_JURISDICTION, FORM_DATA_JURISDICTION)
    message = "".join(result["tokens"])

    assert result["done"] or result["error"] is None, f"Unexpected error: {result['error']}"
    assert not _is_garbled(message), f"Garbled response reached client: {repr(message[:150])}"
    assert result["fields"] is not None, "No 'fields' event received"
    assert result["fields"].get("jurisdiction") == "Supreme Court of New South Wales"


def test_unicode_spaces_normalized_in_tokens():
    """Regression: model sometimes returns \\xa0/\\u202f (non-breaking spaces).

    main.py must normalize these before splitting so tokens arrive as individual
    words, not as one large chunk.
    """
    result = _post_chat(MESSAGES_JURISDICTION, FORM_DATA_JURISDICTION)
    for token in result["tokens"]:
        assert "\xa0" not in token, f"Non-breaking space in token: {repr(token)}"
        assert "\u202f" not in token, f"Narrow no-break space in token: {repr(token)}"


def test_response_speed_acceptable():
    """Response must arrive within 20s. Guards against reasoning mode being re-enabled."""
    start = time.time()
    result = _post_chat([{"role": "user", "content": "hello"}], {
        **FORM_DATA_JURISDICTION, "purpose": "", "jurisdiction": "",
    })
    elapsed = time.time() - start
    assert elapsed < 20, f"Response too slow ({elapsed:.1f}s) — check reasoning_effort in ai.py"


def test_no_reasoning_effort_in_code():
    """Structural: ai.py must not contain reasoning_effort (triggers slow reasoning on gpt-oss-120b)."""
    with open("/app/ai.py") as f:
        content = f.read()
    assert "reasoning_effort" not in content
