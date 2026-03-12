from typing import Optional, Literal
from pydantic import BaseModel
from litellm import completion

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a legal document assistant helping a user fill in a Mutual Non-Disclosure Agreement (MNDA).

The MNDA has these fields:
- purpose: how confidential information may be used (e.g. "Evaluating a potential business partnership")
- effectiveDate: agreement start date (YYYY-MM-DD format)
- mndaTerm: {{ type: "expires" or "continues", years: number }} — length of the agreement
- termOfConfidentiality: {{ type: "years" or "perpetuity", years: number }} — how long info stays protected
- governingLaw: state governing the agreement (e.g. "Delaware")
- jurisdiction: courts having jurisdiction (e.g. "courts located in New Castle, DE")
- party1 and party2: each has name, title, company, noticeAddress (email or postal), date (YYYY-MM-DD)

Current document state:
{current_fields}

Your job:
- Ask focused conversational questions to gather missing fields
- When the user provides info, confirm what you understood
- Be concise — one or two questions per turn maximum
- Do not explain legal terms unless asked

Return JSON with:
- "message": your conversational reply to the user
- "fields": a partial object with only the fields you are confident about from this conversation turn; use null for everything else
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
