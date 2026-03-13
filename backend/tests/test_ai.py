"""Unit tests for ai.py — all LiteLLM calls are mocked."""
import datetime
import json
from unittest.mock import MagicMock, patch

import pytest

from ai import (
    AiResponse,
    GenericAiResponse,
    SelectionAiResponse,
    _date_lookup,
    get_ai_response,
)


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
def test_selection_phase_returns_doc_type(mock_completion):
    mock_completion.return_value = _make_completion_response({
        "message": "Sounds like you need a Mutual NDA.",
        "fields": {"docType": "nda"},
    })
    result = get_ai_response([{"role": "user", "content": "I need an NDA"}], {}, doc_type=None)
    assert isinstance(result, SelectionAiResponse)
    assert result.fields.docType == "nda"
    assert "NDA" in result.message


@patch("ai.completion")
def test_selection_unsupported_doc(mock_completion):
    mock_completion.return_value = _make_completion_response({
        "message": "Employment contracts aren't supported yet. The closest option is a Professional Services Agreement — shall I set that up?",
        "fields": {},
    })
    result = get_ai_response(
        [{"role": "user", "content": "I need an employment contract"}],
        {},
        doc_type=None,
    )
    assert isinstance(result, SelectionAiResponse)
    assert result.fields.docType is None
    assert "Professional Services" in result.message or "supported" in result.message


@patch("ai.completion")
def test_nda_fields_structured_output(mock_completion):
    mock_completion.return_value = _make_completion_response({
        "message": "Got it. What governing law should apply?",
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
    assert isinstance(result, AiResponse)
    assert result.fields.purpose == "Evaluating a potential acquisition"
    assert result.fields.effectiveDate == "2026-03-13"


@patch("ai.completion")
def test_generic_fields_csa(mock_completion):
    mock_completion.return_value = _make_completion_response({
        "message": "Got it. What is the customer's company name?",
        "fields": {"fields": {"provider": "Acme Technologies Inc."}},
    })
    result = get_ai_response(
        [{"role": "user", "content": "Provider is Acme Technologies"}],
        {},
        doc_type="csa",
    )
    assert isinstance(result, GenericAiResponse)
    assert result.fields.fields is not None
    assert result.fields.fields["provider"] == "Acme Technologies Inc."


@patch("ai.completion")
def test_get_ai_response_dispatches_by_doc_type(mock_completion):
    """Verify that the correct response_format is used for each doc type."""
    for doc_type, expected_class in [
        (None, SelectionAiResponse),
        ("nda", AiResponse),
        ("csa", GenericAiResponse),
        ("sla", GenericAiResponse),
        ("psa", GenericAiResponse),
        ("pilot", GenericAiResponse),
        ("baa", GenericAiResponse),
    ]:
        if expected_class == SelectionAiResponse:
            payload = {"message": "What document do you need?", "fields": {}}
        elif expected_class == AiResponse:
            payload = {"message": "Let's fill in the NDA.", "fields": {}}
        else:
            payload = {"message": "Let's fill in the document.", "fields": {"fields": {}}}

        mock_completion.return_value = _make_completion_response(payload)
        result = get_ai_response([], {}, doc_type=doc_type)
        assert isinstance(result, expected_class), f"Expected {expected_class} for doc_type={doc_type}, got {type(result)}"

        # Check that the right response_format was passed to completion
        call_kwargs = mock_completion.call_args[1]
        assert call_kwargs["response_format"] == expected_class
