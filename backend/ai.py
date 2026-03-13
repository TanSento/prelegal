import datetime
from typing import Optional, Literal, Union
from pydantic import BaseModel
from litellm import completion
from doc_configs import DOCUMENT_PROMPTS, SELECTION_SYSTEM_PROMPT

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a legal document assistant helping a user fill in a Mutual Non-Disclosure Agreement (MNDA).

## Fields you must collect (all are required)

1. **Purpose** — how confidential information may be used
   Ask: "What is the purpose of sharing confidential information? (e.g. 'Evaluating a potential acquisition', 'Exploring a technology partnership')"

2. **Effective Date** — agreement start date
   Ask: "What is the effective date? (e.g. 'today', 'March 15 2026', 'next Monday' — I'll convert it to the right format)"
   Use this exact lookup table — do not compute, just match:
{date_lookup}

3. **MNDA Term** — how long the agreement lasts
   Ask: "How long should this NDA last? (e.g. 'expires after 2 years', 'continues until either party terminates it')"
   Set type to "expires" with a year count, or "continues" if open-ended.
   Shorthands: "1yr", "2yr", "3yrs", "1y", "2y" → expires, that many years. "open", "open-ended", "until terminated", "rolling" → continues.

4. **Term of Confidentiality** — how long shared information stays confidential
   Ask: "How long should the confidential information remain protected after the NDA ends? (e.g. '3 years', 'forever')"
   Set type to "years" with a count, or "perpetuity".
   Shorthands: "1yr", "2yr", "3yrs", "1y", "2y" → years, that many. "forever", "perpetuity", "perp", "always", "indefinitely" → perpetuity.

5. **Governing Law** — the state whose laws govern the agreement
   Ask: "Which state's law should govern this agreement? (e.g. 'Delaware', 'California', 'New York')"

6. **Jurisdiction** — which courts handle disputes
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
- When the user answers, confirm what you captured then always end your message with a complete, fully-formed question — never trail off with phrases like "Now we need…", "Next up…", or "Let's move on to…" without finishing the sentence
- Fields considered "empty" and must be asked: purpose (if empty string), governingLaw (if empty), jurisdiction (if empty), party1/party2 sub-fields (if empty strings)
- Effective Date, MNDA Term and Term of Confidentiality ALWAYS need to be confirmed with the user before telling the user that the form is completed — their default values are just placeholders, not real choices
- Once all fields are collected, tell the user the document is complete and they can download the PDF

## Clearing fields
If the user asks to clear fields (e.g. "clear all", "reset", "start over", "clear the date", "clear party 1"):
- To clear a **specific field**, return that field set to its empty value in "fields" (e.g. `{"governingLaw": ""}` or `{"party1": {"name": "", "title": "", "company": "", "noticeAddress": "", "date": ""}}`) and confirm what was cleared, then ask the user to re-provide it
- To clear **all fields**, return every field reset to empty values and say you have cleared the form, then ask the first question again
- Never clear silently — always confirm what was cleared in "message"

Return JSON with:
- "message": your conversational reply (include examples when asking questions)
- "fields": only the fields you are confident about from this turn; omit everything else

## Critical rule
If there are any required fields still empty, your message MUST end with a complete, fully-formed question.
Never trail off. Never say "Next up..." without finishing the question.
Never end your message without a question when there is still information to collect.
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


class SelectionFields(BaseModel):
    docType: Optional[str] = None


class SelectionAiResponse(BaseModel):
    message: str
    fields: SelectionFields


class PartialGenericFields(BaseModel):
    fields: Optional[dict[str, Optional[str]]] = None


class GenericAiResponse(BaseModel):
    message: str
    fields: PartialGenericFields


def _date_lookup() -> str:
    """Pre-compute a date shorthand lookup table for today."""
    today = datetime.date.today()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    full_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    lines = [f'   "today" / "tod"            → {today.isoformat()}']
    tomorrow = today + datetime.timedelta(days=1)
    lines.append(f'   "tomorrow" / "tmr"         → {tomorrow.isoformat()}')

    for i, (short, full) in enumerate(zip(day_names, full_names)):
        days_ahead = (i - today.weekday()) % 7
        bare_date = today + datetime.timedelta(days=days_ahead)
        next_date = bare_date + datetime.timedelta(days=7)
        lines.append(f'   "{short}" / "{full}"{"" if len(full) >= 9 else " " * (9 - len(full))}  → {bare_date.isoformat()}   |   "next {short}" / "next {full}" → {next_date.isoformat()}')

    return "\n".join(lines)


def get_ai_response(
    history: list[dict],
    current_fields: dict,
    doc_type: str | None = None,
) -> Union[AiResponse, SelectionAiResponse, GenericAiResponse]:
    """Call the LLM with chat history and current fields, dispatching by doc_type."""
    date_lookup = _date_lookup()

    if doc_type is None:
        # Phase 1: document selection
        system = (
            SELECTION_SYSTEM_PROMPT
            .replace("{current_fields}", str(current_fields))
        )
        response_format = SelectionAiResponse
    elif doc_type == "nda":
        # NDA: use typed structured output
        system = (
            SYSTEM_PROMPT
            .replace("{date_lookup}", date_lookup)
            .replace("{current_fields}", str(current_fields))
        )
        response_format = AiResponse
    else:
        # Generic doc: use dict-based fields
        prompt_template = DOCUMENT_PROMPTS.get(doc_type, "")
        if not prompt_template:
            # Unsupported doc type — fall back to selection phase
            system = (
                SELECTION_SYSTEM_PROMPT
                .replace("{current_fields}", str(current_fields))
            )
            response_format = SelectionAiResponse
        else:
            system = (
                prompt_template
                .replace("{date_lookup}", date_lookup)
                .replace("{current_fields}", str(current_fields))
            )
            response_format = GenericAiResponse

    messages = [{"role": "system", "content": system}] + history
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=response_format,
        reasoning_effort="low",
        timeout=30,
        extra_body=EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    return response_format.model_validate_json(raw)
