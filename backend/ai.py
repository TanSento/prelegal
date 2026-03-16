import datetime
import importlib
import re
from litellm import completion

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

KNOWN_DOC_TYPES = {
    "mutual-nda", "csa", "sla", "design-partner", "psa", "dpa",
    "partnership", "software-license", "pilot", "baa", "ai-addendum",
}


def _date_lookup() -> str:
    """Pre-compute a date shorthand lookup table for today."""
    today = datetime.date.today()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    full_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    lines = [f'   "today" / "tod"            -> {today.isoformat()}']
    tomorrow = today + datetime.timedelta(days=1)
    lines.append(f'   "tomorrow" / "tmr"         -> {tomorrow.isoformat()}')

    for i, (short, full) in enumerate(zip(day_names, full_names)):
        days_ahead = (i - today.weekday()) % 7
        bare_date = today + datetime.timedelta(days=days_ahead)
        next_date = bare_date + datetime.timedelta(days=7)
        lines.append(f'   "{short}" / "{full}"{"" if len(full) >= 9 else " " * (9 - len(full))}  -> {bare_date.isoformat()}   |   "next {short}" / "next {full}" -> {next_date.isoformat()}')

    return "\n".join(lines)


def _is_garbled(message: str) -> bool:
    """Return True if the model response looks like placeholder/garbled output."""
    if len(message.strip()) < 20:
        return True
    if re.search(r"\.{4,}", message):
        return True
    if re.search(r'([^\w\s])\1{3,}', message):
        return True
    if "????" in message:
        return True
    if "\u200b" in message:
        return True
    if message.count("\u2026") >= 2:
        return True
    letters = len(re.sub(r"[^a-zA-Z]", "", message))
    non_space = len(re.sub(r"\s", "", message))
    if non_space > 10 and letters / non_space < 0.4:
        return True
    return False


def _load_doc_config(doc_type: str):
    """Dynamically load the document config module for the given type."""
    if doc_type not in KNOWN_DOC_TYPES:
        raise ValueError(f"Unknown document type: {doc_type}")
    module_name = f"doc_configs.{doc_type.replace('-', '_')}"
    return importlib.import_module(module_name)


def get_ai_response(history: list[dict], current_fields: dict, doc_type: str = "mutual-nda"):
    """Call the LLM with chat history and current fields, return structured response.

    Retries once if the model returns a garbled message.
    """
    config = _load_doc_config(doc_type)

    system = (
        config.SYSTEM_PROMPT
        .replace("{date_lookup}", _date_lookup())
        .replace("{current_fields}", str(current_fields))
    )
    messages = [{"role": "system", "content": system}] + history
    last_error = None
    for attempt in range(3):
        try:
            response = completion(
                model=MODEL,
                messages=messages,
                response_format=config.AiResponse,
                timeout=30,
                extra_body=EXTRA_BODY,
            )
        except Exception as e:
            last_error = e
            print(f"[AI RETRY] API error on attempt {attempt + 1}: {e}", flush=True)
            continue
        raw = response.choices[0].message.content
        print(f"[AI RAW attempt={attempt}] {raw}", flush=True)
        result = config.AiResponse.model_validate_json(raw)
        if not _is_garbled(result.message):
            return result
        print(f"[AI RETRY] Garbled message detected, retrying (attempt {attempt + 1})", flush=True)
    if last_error:
        raise last_error
    raise RuntimeError("Model returned garbled output on all attempts. Please try again.")
