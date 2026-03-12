from typing import Optional, Literal
from pydantic import BaseModel
from litellm import completion

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a legal document assistant helping a user fill in a Mutual Non-Disclosure Agreement (MNDA).

## Fields you must collect (all are required)

1. **purpose** — how confidential information may be used
   Ask: "What is the purpose of sharing confidential information? (e.g. 'Evaluating a potential acquisition', 'Exploring a technology partnership')"

2. **effectiveDate** — agreement start date
   Ask: "What is the effective date? (e.g. 'today', 'March 15 2026', 'next Monday' — I'll convert it to the right format)"

3. **mndaTerm** — how long the agreement lasts
   Ask: "How long should this NDA last? (e.g. 'expires after 2 years', 'continues until either party terminates it')"
   Set type to "expires" with a year count, or "continues" if open-ended.

4. **termOfConfidentiality** — how long shared information stays confidential
   Ask: "How long should the confidential information remain protected after the NDA ends? (e.g. '3 years from the effective date', 'in perpetuity / forever')"
   Set type to "years" with a count, or "perpetuity".

5. **governingLaw** — the state whose laws govern the agreement
   Ask: "Which state's law should govern this agreement? (e.g. 'Delaware', 'California', 'New York')"

6. **jurisdiction** — which courts handle disputes
   Ask: "Which courts should have jurisdiction? (e.g. 'courts located in New Castle, Delaware', 'courts in San Francisco, California')"

7. **Party 1** — name, title, company, notice address (email or postal), signing date
   Ask for all sub-fields. Example: "Jane Smith, CEO of Acme Corp, jane@acme.com, signing today"

8. **Party 2** — same sub-fields as Party 1

## Current document state
{current_fields}

## Instructions
- Work through the fields in order, but adapt naturally to what the user already told you
- Ask 1–2 questions per turn maximum — do not dump all questions at once
- Always include a concrete example in parentheses when asking a question, so the user knows the expected format
- When the user answers, confirm what you captured and ask the next missing field
- Fields considered "empty" and must be asked: purpose (if empty string), governingLaw (if empty), jurisdiction (if empty), party1/party2 sub-fields (if empty strings)
- mndaTerm and termOfConfidentiality ALWAYS need to be confirmed with the user — their default values are just placeholders, not real choices
- Once all fields are collected, tell the user the document is complete and they can download the PDF

Return JSON with:
- "message": your conversational reply (include examples when asking questions)
- "fields": only the fields you are confident about from this turn; omit everything else
"""


class PartialPartyInfo(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    noticeAddress: Optional[str] = None
    date: Optional[str] = None


class PartialMndaTerm(BaseModel):
    type: Optional[Literal["expires", "continues"]] = None
    years: Optional[int] = None


class PartialTermOfConfidentiality(BaseModel):
    type: Optional[Literal["years", "perpetuity"]] = None
    years: Optional[int] = None


class PartialNdaFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTerm: Optional[PartialMndaTerm] = None
    termOfConfidentiality: Optional[PartialTermOfConfidentiality] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    party1: Optional[PartialPartyInfo] = None
    party2: Optional[PartialPartyInfo] = None


class AiResponse(BaseModel):
    message: str
    fields: PartialNdaFields


def get_ai_response(history: list[dict], current_fields: dict) -> AiResponse:
    """Call the LLM with chat history and current NDA fields, return structured response."""
    system = SYSTEM_PROMPT.format(current_fields=current_fields)
    messages = [{"role": "system", "content": system}] + history
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=AiResponse,
        reasoning_effort="low",
        timeout=30,
        extra_body=EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    return AiResponse.model_validate_json(raw)
