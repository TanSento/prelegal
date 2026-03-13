"""Integration tests for main.py FastAPI endpoints — LiteLLM is mocked."""
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from ai import UnifiedAiResponse, PartialPartyInfo


def _make_unified_response(message: str, **kwargs) -> MagicMock:
    """Build a fake UnifiedAiResponse."""
    resp = MagicMock(spec=UnifiedAiResponse)
    resp.message = message
    resp.documentType = kwargs.get("documentType")
    resp.fields = kwargs.get("fields")
    resp.party1 = kwargs.get("party1")
    resp.party2 = kwargs.get("party2")
    resp.isComplete = kwargs.get("isComplete")
    resp.suggestedDocument = kwargs.get("suggestedDocument")
    return resp


@pytest.fixture
def client():
    import os
    os.environ.setdefault("STATIC_DIR", "/nonexistent")
    from main import app
    return TestClient(app)


def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def _parse_sse(text: str) -> list[dict]:
    """Parse SSE response text into list of {event, data} dicts."""
    events = []
    for block in text.strip().split("\n\n"):
        lines = block.strip().split("\n")
        event = next((l[len("event:"):].strip() for l in lines if l.startswith("event:")), None)
        data_line = next((l[len("data:"):].strip() for l in lines if l.startswith("data:")), None)
        if event and data_line:
            events.append({"event": event, "data": json.loads(data_line)})
    return events


@patch("main.get_ai_response")
def test_chat_emits_doc_type_event(mock_ai, client):
    """AI identifies doc type → docType emitted in fields event."""
    mock_ai.return_value = _make_unified_response(
        "Sounds like you need a Mutual NDA.",
        documentType="nda",
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I need an NDA"}],
        "formData": {},
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    event_types = [e["event"] for e in events]
    assert "token" in event_types
    assert "fields" in event_types
    assert "done" in event_types

    fields_event = next(e for e in events if e["event"] == "fields")
    assert fields_event["data"]["docType"] == "nda"


@patch("main.get_ai_response")
def test_chat_emits_nda_fields_remapped(mock_ai, client):
    """NDA fields are remapped from flat to nested structure."""
    mock_ai.return_value = _make_unified_response(
        "Got it. What governing law should apply?",
        documentType="nda",
        fields={
            "purpose": "Evaluating acquisition",
            "effectiveDate": "2026-03-13",
            "mndaTermType": "expires",
            "mndaTermYears": "2",
        },
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Purpose is evaluating acquisition"}],
        "formData": {},
        "docType": "nda",
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    # First fields event is docType, second is the NDA fields
    fields_events = [e for e in events if e["event"] == "fields"]
    assert len(fields_events) >= 1

    # Find the fields event with NDA data (not docType)
    nda_event = next((e for e in fields_events if "purpose" in e["data"]), None)
    assert nda_event is not None
    assert nda_event["data"]["purpose"] == "Evaluating acquisition"
    assert nda_event["data"]["mndaTerm"] == {"type": "expires", "years": 2}


@patch("main.get_ai_response")
def test_chat_emits_generic_fields(mock_ai, client):
    """Generic doc fields emitted under 'fields' key."""
    mock_ai.return_value = _make_unified_response(
        "Got it. What is the customer name?",
        fields={"provider": "Acme Inc."},
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Provider is Acme"}],
        "formData": {},
        "docType": "csa",
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    fields_event = next((e for e in events if e["event"] == "fields"), None)
    assert fields_event is not None
    assert fields_event["data"] == {"fields": {"provider": "Acme Inc."}}


@patch("main.get_ai_response")
def test_chat_nda_with_party_info(mock_ai, client):
    """NDA party info is included in remapped fields."""
    mock_ai.return_value = _make_unified_response(
        "Got it. Now let's get Party 2 details.",
        party1=PartialPartyInfo(company="Alpha Corp", name="Jane Doe", title="CEO"),
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Party 1 is Jane Doe, CEO of Alpha Corp"}],
        "formData": {},
        "docType": "nda",
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    fields_event = next((e for e in events if e["event"] == "fields"), None)
    assert fields_event is not None
    assert fields_event["data"]["party1"]["company"] == "Alpha Corp"


def test_chat_missing_body(client):
    """Bad request body → 422."""
    resp = client.post("/api/chat", json={"bad": "data"})
    assert resp.status_code == 422


@patch("main.get_ai_response")
def test_chat_normalizes_uppercase_doc_type(mock_ai, client):
    """AI returns documentType='NDA' → SSE emits docType='nda' and NDA remapping is applied."""
    mock_ai.return_value = _make_unified_response(
        "Sounds like you need an NDA.",
        documentType="NDA",
        fields={"purpose": "Partnership evaluation"},
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I need an NDA"}],
        "formData": {},
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    fields_events = [e for e in events if e["event"] == "fields"]
    doc_type_event = next((e for e in fields_events if "docType" in e["data"]), None)
    assert doc_type_event is not None
    assert doc_type_event["data"]["docType"] == "nda"

    # NDA remapping should have been applied (nested fields, not flat)
    nda_event = next((e for e in fields_events if "purpose" in e["data"]), None)
    assert nda_event is not None


@patch("main.get_ai_response")
def test_chat_normalizes_full_name_doc_type(mock_ai, client):
    """AI returns full name → SSE emits canonical short key."""
    mock_ai.return_value = _make_unified_response(
        "Creating a Mutual NDA for you.",
        documentType="Mutual Non-Disclosure Agreement",
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I need a mutual NDA"}],
        "formData": {},
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    fields_event = next((e for e in events if e["event"] == "fields"), None)
    assert fields_event is not None
    assert fields_event["data"]["docType"] == "nda"


@patch("main.get_ai_response")
def test_chat_normalizes_nda_enum_fields(mock_ai, client):
    """AI returns capitalized enum values → emitted fields contain lowercase values."""
    mock_ai.return_value = _make_unified_response(
        "Got it.",
        fields={
            "mndaTermType": "Expires",
            "mndaTermYears": "2",
            "confidentialityTermType": "Years",
            "confidentialityTermYears": "3",
        },
    )
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Expires after 2 years"}],
        "formData": {},
        "docType": "nda",
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    nda_event = next((e for e in events if e["event"] == "fields"), None)
    assert nda_event is not None
    assert nda_event["data"]["mndaTerm"]["type"] == "expires"
    assert nda_event["data"]["termOfConfidentiality"]["type"] == "years"
