import datetime
from typing import AsyncIterator, Optional
from pydantic import BaseModel
from litellm import acompletion, completion
from doc_configs import DOCUMENT_CATALOG_TEXT

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = (
    "You are a friendly legal assistant helping users create legal agreements.\n\n"
    "AVAILABLE DOCUMENT TYPES:\n"
    + DOCUMENT_CATALOG_TEXT
    + """

YOUR JOB:
1. First, determine what type of document the user needs through natural conversation
2. Once the document type is clear, gather all required information for that document
3. Ask questions conversationally, one or two at a time
4. ALWAYS ask a follow-on question if you need more information - never leave the user waiting
5. When all required fields are gathered, summarize and set isComplete to true

DOCUMENT TYPE DETECTION:
- In the first 1-2 messages, determine which document type fits the user's needs
- Set the documentType field once you've identified it
- IMPORTANT: When setting documentType, use ONLY the exact short key shown in the list above (e.g. "nda", "csa", "sla"). Never use the full document name or any other variation.
- If the user asks for a document type NOT in the list above, politely explain we don't support it yet and suggest the SINGLE closest available document in suggestedDocument

FIELD REQUIREMENTS BY DOCUMENT TYPE:

For Mutual NDA (nda):
- purpose: Why are they creating this NDA? (e.g., "evaluating a business partnership")
- effectiveDate: When should the agreement start? (YYYY-MM-DD format)
- mndaTermType: use exactly "expires" or "continues" (lowercase)
- mndaTermYears: Number of years if expires (default: 1)
- confidentialityTermType: use exactly "years" or "perpetuity" (lowercase)
- confidentialityTermYears: Number of years if years (default: 1)
- governingLaw: Which state's laws govern (e.g., "Delaware")
- jurisdiction: Where disputes resolved (e.g., "New Castle County, Delaware")
- party1: company, name, title, noticeAddress (email)
- party2: company, name, title, noticeAddress (email)

For Cloud Service Agreement (csa):
- provider: The SaaS provider company
- customer: The customer company
- subscriptionPeriod: Duration (e.g., "1 year", "monthly")
- paymentProcess: Payment schedule
- effectiveDate: Start date (YYYY-MM-DD)
- governingLaw: Which state's laws govern
- chosenCourts: Where disputes resolved

For Pilot Agreement (pilot):
- provider: The product provider
- customer: The pilot customer
- pilotPeriod: Duration (e.g., "90 days", "3 months")
- effectiveDate: Start date (YYYY-MM-DD)
- governingLaw: Which state's laws govern
- chosenCourts: Where disputes resolved

For Design Partner Agreement (design-partner):
- provider: The product provider
- partner: The design partner
- program: Name of the program
- term: Duration of early access
- effectiveDate: Start date (YYYY-MM-DD)
- governingLaw: Which state's laws govern
- chosenCourts: Where disputes resolved

For Service Level Agreement (sla):
- targetUptime: Target uptime percentage
- targetResponseTime: Response time for issues
- supportChannel: Support channels available
- uptimeCredit: Credits for missed uptime targets (optional)
- responseTimeCredit: Credits for missed response time targets (optional)

For Professional Services Agreement (psa):
- provider: Service provider
- customer: Client
- deliverables: What will be delivered
- sowTerm: Statement of work duration
- fees: Project fees
- paymentPeriod: Payment terms
- effectiveDate: Start date (YYYY-MM-DD)
- governingLaw: Which state's laws govern

For Partnership Agreement (partnership):
- company: First partner company
- partner: Second partner company
- obligations: What each party will do
- paymentSchedule: Revenue sharing or payment terms
- effectiveDate: Start date (YYYY-MM-DD)
- endDate: Partnership end date (optional)
- governingLaw: Which state's laws govern

For Software License Agreement (software-license):
- provider: Software vendor
- customer: Licensee
- permittedUses: What the software may be used for
- licenseLimits: Seat/user/usage limits (optional)
- subscriptionPeriod: License duration
- effectiveDate: Start date (YYYY-MM-DD)
- governingLaw: Which state's laws govern

For Data Processing Agreement (dpa):
- provider: Data processor
- customer: Data controller
- agreement: Main agreement this DPA supplements
- categoriesOfData: Types of personal data being processed
- categoriesOfSubjects: Who the data belongs to
- processingPurpose: Why data is being processed
- duration: How long processing will occur

For Business Associate Agreement (baa):
- provider: Business associate
- company: Covered entity
- agreement: Main agreement this BAA supplements
- baaEffectiveDate: BAA start date (YYYY-MM-DD)
- breachNotificationPeriod: How quickly breaches must be reported

For AI Addendum (ai-addendum):
- provider: AI/ML provider
- customer: Customer
- trainingData: What customer data may be used for AI training
- trainingPurposes: Permitted training purposes (optional)
- trainingRestrictions: Additional restrictions on AI training (optional)

DATE GUIDELINES:
Use this exact lookup table — do not compute dates yourself, just match:
{date_lookup}

CURRENT FIELD STATE:
{current_fields}

GUIDELINES:
- Be conversational and helpful, not robotic
- Ask about one or two related things at a time
- When users give information, acknowledge it naturally
- Suggest reasonable defaults when appropriate (e.g., "today" for effective date, "1 year" for terms)
- IMPORTANT: Always ask a follow-on question until you have all required fields
- When you have ALL required information, summarize the details and set isComplete to true

In your response field, write your conversational reply to the user.
IMPORTANT: Keep your message to 1-3 sentences. Never include the full document text in your message.
In the other fields, extract any information the user has provided so far.
Only set isComplete to true when you have gathered all required information."""
)


class PartialPartyInfo(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    noticeAddress: Optional[str] = None
    date: Optional[str] = None


class UnifiedAiResponse(BaseModel):
    message: str
    documentType: Optional[str] = None
    fields: Optional[dict[str, str]] = None
    party1: Optional[PartialPartyInfo] = None
    party2: Optional[PartialPartyInfo] = None
    isComplete: Optional[bool] = None
    suggestedDocument: Optional[str] = None


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


class _MessageStreamer:
    """Extract the 'message' field characters from a streaming JSON response."""

    _LOOKING = 0   # scanning for "message" key
    _FOUND_KEY = 1  # found key, waiting for colon then opening quote
    _IN_VALUE = 2   # inside the string value — emit chars
    _DONE = 3

    def __init__(self):
        self._state = self._LOOKING
        self._buf = ""
        self._escape = False

    def feed(self, chunk: str) -> str:
        """Return any message characters ready to emit from this chunk."""
        out = []
        for ch in chunk:
            if self._state == self._LOOKING:
                self._buf += ch
                if '"message"' in self._buf:
                    self._state = self._FOUND_KEY
                    self._buf = ""
            elif self._state == self._FOUND_KEY:
                if ch == '"':
                    self._state = self._IN_VALUE
                    self._escape = False
            elif self._state == self._IN_VALUE:
                if self._escape:
                    self._escape = False
                    if ch == "n":
                        out.append("\n")
                    elif ch == "t":
                        out.append("\t")
                    else:
                        out.append(ch)
                elif ch == "\\":
                    self._escape = True
                elif ch == '"':
                    self._state = self._DONE
                else:
                    out.append(ch)
        return "".join(out)


def _repair_json(raw: str) -> str:
    """Replace literal newlines/carriage returns inside JSON string values with escape sequences.

    Cerebras occasionally returns JSON with unescaped newlines inside string values,
    producing parse errors at high line numbers.
    """
    result = []
    in_string = False
    escape_next = False
    for ch in raw:
        if escape_next:
            result.append(ch)
            escape_next = False
        elif ch == "\\" and in_string:
            result.append(ch)
            escape_next = True
        elif ch == '"':
            in_string = not in_string
            result.append(ch)
        elif ch == "\n" and in_string:
            result.append("\\n")
        elif ch == "\r" and in_string:
            result.append("\\r")
        else:
            result.append(ch)
    return "".join(result)


def get_ai_response(
    history: list[dict],
    current_fields: dict,
    doc_type: str | None = None,
) -> UnifiedAiResponse:
    """Call the LLM with chat history and current fields using a single unified prompt."""
    system = (
        SYSTEM_PROMPT
        .replace("{date_lookup}", _date_lookup())
        .replace("{current_fields}", str(current_fields))
    )
    messages = [{"role": "system", "content": system}] + history
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=UnifiedAiResponse,
        reasoning_effort="low",
        timeout=30,
        extra_body=EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    try:
        return UnifiedAiResponse.model_validate_json(raw)
    except Exception:
        return UnifiedAiResponse.model_validate_json(_repair_json(raw))


async def stream_ai_response(
    history: list[dict],
    current_fields: dict,
    doc_type: str | None = None,
) -> AsyncIterator[str | UnifiedAiResponse]:
    """Stream AI response. Yields str chunks for message tokens, then a UnifiedAiResponse.

    Uses LiteLLM streaming so the first tokens reach the frontend as soon as the model
    starts generating — eliminates the full-response wait that causes the 'thinking' spinner.
    """
    system = (
        SYSTEM_PROMPT
        .replace("{date_lookup}", _date_lookup())
        .replace("{current_fields}", str(current_fields))
    )
    messages = [{"role": "system", "content": system}] + history
    response = await acompletion(
        model=MODEL,
        messages=messages,
        response_format=UnifiedAiResponse,
        stream=True,
        reasoning_effort="low",
        timeout=60,
        extra_body=EXTRA_BODY,
    )
    full_content = ""
    streamer = _MessageStreamer()
    async for chunk in response:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            full_content += delta
            msg_chars = streamer.feed(delta)
            if msg_chars:
                yield msg_chars
    # Parse full accumulated JSON for structured fields
    try:
        yield UnifiedAiResponse.model_validate_json(full_content)
    except Exception:
        yield UnifiedAiResponse.model_validate_json(_repair_json(full_content))
