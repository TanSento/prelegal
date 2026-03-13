"""Unit tests for ai.py — all LiteLLM calls are mocked."""
import datetime
import json
from unittest.mock import MagicMock, patch

import pytest

from ai import UnifiedAiResponse, _date_lookup, _repair_json, get_ai_response


def _make_completion_response(data: dict) -> MagicMock:
    """Build a fake LiteLLM completion response."""
    resp = MagicMock()
    resp.choices[0].message.content = json.dumps(data)
    return resp


def test_date_lookup_includes_today():
    result = _date_lookup()
    today = datetime.date.today().isoformat()
    assert today in result
    assert "today" in result
    assert "tmr" in result


def test_date_lookup_includes_all_days():
    result = _date_lookup()
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        assert day in result


@patch("ai.completion")
def test_unified_response_doc_type_detection(mock_completion):
    """AI identifies doc type → documentType set in response."""
    mock_completion.return_value = _make_completion_response({
        "message": "Sounds like you need a Mutual NDA.",
        "documentType": "nda",
    })
    result = get_ai_response([{"role": "user", "content": "I need an NDA"}], {})
    assert isinstance(result, UnifiedAiResponse)
    assert result.documentType == "nda"
    assert "NDA" in result.message


@patch("ai.completion")
def test_unified_response_unsupported_doc(mock_completion):
    """AI suggests closest doc for unsupported type."""
    mock_completion.return_value = _make_completion_response({
        "message": "Employment contracts aren't supported yet. The closest option is a Professional Services Agreement.",
        "suggestedDocument": "psa",
    })
    result = get_ai_response(
        [{"role": "user", "content": "I need an employment contract"}],
        {},
    )
    assert isinstance(result, UnifiedAiResponse)
    assert result.documentType is None
    assert result.suggestedDocument == "psa"
    assert "supported" in result.message or "Professional Services" in result.message


@patch("ai.completion")
def test_unified_response_nda_fields(mock_completion):
    """AI returns flat NDA fields."""
    mock_completion.return_value = _make_completion_response({
        "message": "Got it. What governing law should apply?",
        "documentType": "nda",
        "fields": {
            "purpose": "Evaluating a potential acquisition",
            "effectiveDate": "2026-03-13",
        },
    })
    result = get_ai_response(
        [{"role": "user", "content": "Purpose is evaluating an acquisition, effective today"}],
        {},
        doc_type="nda",
    )
    assert isinstance(result, UnifiedAiResponse)
    assert result.fields is not None
    assert result.fields["purpose"] == "Evaluating a potential acquisition"
    assert result.fields["effectiveDate"] == "2026-03-13"


@patch("ai.completion")
def test_unified_response_generic_fields(mock_completion):
    """AI returns generic fields for CSA."""
    mock_completion.return_value = _make_completion_response({
        "message": "Got it. What is the customer's company name?",
        "documentType": "csa",
        "fields": {"provider": "Acme Technologies Inc."},
    })
    result = get_ai_response(
        [{"role": "user", "content": "Provider is Acme Technologies"}],
        {},
        doc_type="csa",
    )
    assert isinstance(result, UnifiedAiResponse)
    assert result.fields is not None
    assert result.fields["provider"] == "Acme Technologies Inc."


def test_repair_json_escapes_newlines_in_strings():
    """_repair_json replaces literal newlines inside JSON string values."""
    # Simulate model returning JSON where message field has literal newlines
    bad = '{"message": "Line one\nLine two\nLine three", "documentType": "nda"}'
    fixed = _repair_json(bad)
    import json
    obj = json.loads(fixed)
    assert obj["message"] == "Line one\nLine two\nLine three"
    assert obj["documentType"] == "nda"


def test_repair_json_leaves_structural_newlines_intact():
    """_repair_json does not alter newlines between JSON fields."""
    pretty = '{\n  "message": "Hello",\n  "documentType": "nda"\n}'
    fixed = _repair_json(pretty)
    import json
    obj = json.loads(fixed)
    assert obj["message"] == "Hello"


@patch("ai.completion")
def test_get_ai_response_retries_on_invalid_json(mock_completion):
    """get_ai_response falls back to _repair_json when model returns bad JSON."""
    # Simulate the Cerebras bug: literal newlines inside the message string
    bad_json = (
        '{"message": "Here is your NDA:\\n\\n## Section 1\\nConfidentiality terms\nAnd more terms",'
        '"documentType": "nda","fields": null,"party1": null,"party2": null,'
        '"isComplete": false,"suggestedDocument": null}'
    )
    mock_completion.return_value = MagicMock()
    mock_completion.return_value.choices[0].message.content = bad_json
    result = get_ai_response([{"role": "user", "content": "NDA"}], {})
    assert isinstance(result, UnifiedAiResponse)
    assert result.documentType == "nda"
    assert "Section 1" in result.message


@patch("ai.completion")
def test_unified_response_always_uses_unified_format(mock_completion):
    """All doc types use UnifiedAiResponse — no dispatching."""
    for doc_type in [None, "nda", "csa", "sla", "psa", "pilot", "baa"]:
        mock_completion.return_value = _make_completion_response({
            "message": "Let me help you.",
        })
        result = get_ai_response([], {}, doc_type=doc_type)
        assert isinstance(result, UnifiedAiResponse)
        call_kwargs = mock_completion.call_args[1]
        assert call_kwargs["response_format"] == UnifiedAiResponse
