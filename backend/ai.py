import datetime
import re
from typing import Optional, Literal
from pydantic import BaseModel
from litellm import completion

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
   Shorthands and mappings:
   - "1yr", "2yr", "3yrs", "1y", "2y", "1 year", "2 years", "3 years", "one year", "two years", "three years" → expires, that many years
   - "18 months", "24 months" etc. → expires, round to nearest whole year (18 months = 2 years, 24 months = 2 years)
   - "open", "open-ended", "until terminated", "rolling", "no expiry", "never expires", "indefinitely" → continues
   - For any other duration, use your best judgment to map to expires with a year count or continues

4. **Term of Confidentiality** — how long shared information stays confidential
   Ask: "How long should the confidential information remain protected after the NDA ends? (e.g. '3 years', 'forever')"
   Set type to "years" with a count, or "perpetuity".
   Shorthands and mappings:
   - "1yr", "2yr", "3yrs", "1y", "2y", "1 year", "2 years", "3 years", "one year", "two years", "three years" → years, that many
   - "18 months", "24 months" etc. → years, round to nearest whole year
   - "forever", "perpetuity", "perp", "always", "indefinitely", "never expires", "no expiry" → perpetuity
   - For any other duration, use your best judgment to map to years with a count or perpetuity

5. **Governing Law** — the state or jurisdiction whose laws govern the agreement
   Ask: "Which state or jurisdiction's law should govern this agreement?
   Accept any jurisdiction the user provides, including non-US states, territories, or countries — capture it exactly as given.

6. **Jurisdiction** — which courts handle disputes
   Ask: "Which courts should have jurisdiction over disputes?
   Accept any court location the user provides, including non-US cities, states, or countries — capture it exactly as given.

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
- Fields considered "empty" and must be asked: purpose (if empty string), effectiveDate (if empty), mndaTerm (if years is 0), termOfConfidentiality (if years is 0), governingLaw (if empty), jurisdiction (if empty), party1/party2 sub-fields (if empty strings)
- Once all fields are collected, tell the user the document is complete and they can download the PDF

## Clearing fields
If the user asks to clear fields (e.g. "clear all", "reset", "start over", "clear the date", "clear party 1"):
- To clear a **specific field**, return that field set to its empty value in "fields" (e.g. `{"governingLaw": ""}` or `{"party1": {"name": "", "title": "", "company": "", "noticeAddress": "", "date": ""}}`) and confirm what was cleared, then ask the user to re-provide it
- To clear **all fields**, return every field reset to empty values and say you have cleared the form, then ask the first question again
- Never clear silently — always confirm what was cleared in "message"

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


def _date_lookup() -> str:
    """Pre-compute a date shorthand lookup table for today."""
    today = datetime.date.today()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    full_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    lines = [f'   "today" / "tod"            → {today.isoformat()}']
    tomorrow = today + datetime.timedelta(days=1)
    lines.append(f'   "tomorrow" / "tmr"         → {tomorrow.isoformat()}')

    for i, (short, full) in enumerate(zip(day_names, full_names)):
        # bare: nearest upcoming occurrence (today counts if today matches)
        days_ahead = (i - today.weekday()) % 7
        bare_date = today + datetime.timedelta(days=days_ahead)
        # "next": always the following week's occurrence
        next_date = bare_date + datetime.timedelta(days=7)
        lines.append(f'   "{short}" / "{full}"{"" if len(full) >= 9 else " " * (9 - len(full))}  → {bare_date.isoformat()}   |   "next {short}" / "next {full}" → {next_date.isoformat()}')

    return "\n".join(lines)


def _is_garbled(message: str) -> bool:
    """Return True if the model response looks like placeholder/garbled output."""
    if len(message.strip()) < 20:  # too short to be a real assistant response
        return True
    if re.search(r"\.{4,}", message):  # 4+ consecutive ASCII dots
        return True
    if re.search(r'([^\w\s])\1{3,}', message):  # 4+ repeated punctuation (e.g. """""""")
        return True
    if "????" in message:
        return True
    if "\u200b" in message:  # zero-width space always indicates garbled output
        return True
    if message.count("\u2026") >= 2:  # 2+ Unicode ellipsis chars (…)
        return True
    # Low letter ratio: real sentences are mostly letters
    letters = len(re.sub(r"[^a-zA-Z]", "", message))
    non_space = len(re.sub(r"\s", "", message))
    if non_space > 10 and letters / non_space < 0.4:  # < 40% letters in non-space content
        return True
    return False


def get_ai_response(history: list[dict], current_fields: dict) -> AiResponse:
    """Call the LLM with chat history and current NDA fields, return structured response.

    Retries once if the model returns a garbled message (dots, question marks, etc.)
    which can happen intermittently with reasoning models and structured outputs.
    """
    system = (
        SYSTEM_PROMPT
        .replace("{date_lookup}", _date_lookup())
        .replace("{current_fields}", str(current_fields))
    )
    messages = [{"role": "system", "content": system}] + history
    for attempt in range(2):
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=AiResponse,
            timeout=30,
            extra_body=EXTRA_BODY,
        )
        raw = response.choices[0].message.content
        print(f"[AI RAW attempt={attempt}] {raw}", flush=True)
        result = AiResponse.model_validate_json(raw)
        if not _is_garbled(result.message):
            return result
        print(f"[AI RETRY] Garbled message detected, retrying (attempt {attempt + 1})", flush=True)
    raise RuntimeError("Model returned garbled output on all attempts. Please try again.")
