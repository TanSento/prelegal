"""Integration tests for main.py FastAPI endpoints — LiteLLM is mocked."""
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from ai import AiResponse, GenericAiResponse, SelectionAiResponse, PartialNdaFields, PartialGenericFields, SelectionFields


def _make_ai_response(cls, message: str, fields_data: dict):
    """Build a fake AI response of the given class."""
    resp = MagicMock(spec=cls)
    resp.message = message
    if cls == AiResponse:
        resp.fields = PartialNdaFields(**fields_data)
    elif cls == SelectionAiResponse:
        resp.fields = SelectionFields(**fields_data)
    elif cls == GenericAiResponse:
        resp.fields = PartialGenericFields(**fields_data)
    return resp


@pytest.fixture
def client():
    # Import app after env is set so database path doesn't fail
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
def test_chat_selection_phase(mock_ai, client):
    """No docType → selection phase → returns docType in fields event."""
    mock_resp = MagicMock(spec=SelectionAiResponse)
    mock_resp.message = "What document do you need?"
    mock_resp.fields = SelectionFields(docType="nda")
    mock_ai.return_value = mock_resp

    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I need a legal document"}],
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
def test_chat_nda_phase(mock_ai, client):
    """docType=nda → NDA fields emitted."""
    mock_resp = MagicMock(spec=AiResponse)
    mock_resp.message = "Got it. What is the governing law?"
    mock_resp.fields = PartialNdaFields(
        purpose="Evaluating acquisition",
        governingLaw=None,
    )
    mock_ai.return_value = mock_resp

    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Purpose is evaluating acquisition"}],
        "formData": {},
        "docType": "nda",
    })
    assert resp.status_code == 200

    events = _parse_sse(resp.text)
    fields_event = next((e for e in events if e["event"] == "fields"), None)
    assert fields_event is not None
    assert fields_event["data"]["purpose"] == "Evaluating acquisition"


@patch("main.get_ai_response")
def test_chat_generic_phase(mock_ai, client):
    """docType=csa → generic fields emitted under 'fields' key."""
    mock_resp = MagicMock(spec=GenericAiResponse)
    mock_resp.message = "Got it. What is the customer name?"
    mock_resp.fields = PartialGenericFields(fields={"provider": "Acme Inc."})
    mock_ai.return_value = mock_resp

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


def test_chat_missing_body(client):
    """Bad request body → 422."""
    resp = client.post("/api/chat", json={"bad": "data"})
    assert resp.status_code == 422
