import json
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

from database import init_db
from ai import stream_ai_response, UnifiedAiResponse, PartialPartyInfo
from doc_configs import DOC_TYPE_MAP

_FULL_NAME_TO_KEY = {v.lower(): k for k, v in DOC_TYPE_MAP.items()}


def _normalize_doc_type(raw: str | None) -> str | None:
    """Normalize model-returned documentType to a canonical key (e.g. 'NDA' → 'nda')."""
    if not raw:
        return raw
    normalized = raw.strip().lower()
    if normalized in DOC_TYPE_MAP:
        return normalized
    return _FULL_NAME_TO_KEY.get(normalized, normalized)

STATIC_DIR = os.environ.get("STATIC_DIR", "/app/static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    formData: dict
    docType: Optional[str] = None


def _remap_nda_fields(flat: dict, party1: Optional[PartialPartyInfo], party2: Optional[PartialPartyInfo]) -> dict:
    """Convert flat UnifiedAiResponse fields to NdaFormData nested structure."""
    result = {}

    for k in ("purpose", "effectiveDate", "governingLaw", "jurisdiction"):
        if k in flat:
            result[k] = flat[k]

    mnda = {}
    if "mndaTermType" in flat:
        mnda["type"] = flat["mndaTermType"].strip().lower()
    if "mndaTermYears" in flat:
        try:
            mnda["years"] = int(flat["mndaTermYears"])
        except (ValueError, TypeError):
            pass
    if mnda:
        result["mndaTerm"] = mnda

    conf = {}
    if "confidentialityTermType" in flat:
        conf["type"] = flat["confidentialityTermType"].strip().lower()
    if "confidentialityTermYears" in flat:
        try:
            conf["years"] = int(flat["confidentialityTermYears"])
        except (ValueError, TypeError):
            pass
    if conf:
        result["termOfConfidentiality"] = conf

    if party1:
        result["party1"] = party1.model_dump(exclude_none=True)
    if party2:
        result["party2"] = party2.model_dump(exclude_none=True)

    return result


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Stream AI chat response as SSE. Yields token/fields/done/error events."""

    async def generate():
        try:
            history = [{"role": m.role, "content": m.content} for m in req.messages]

            ai_resp = None
            word_buf = ""
            async for item in stream_ai_response(history, req.formData, req.docType):
                if isinstance(item, str):
                    # Stream message characters word by word as they arrive
                    for ch in item:
                        if ch == " ":
                            if word_buf:
                                yield f"event: token\ndata: {json.dumps({'text': word_buf + ' '})}\n\n"
                                word_buf = ""
                        else:
                            word_buf += ch
                else:
                    ai_resp = item

            # Flush any remaining word
            if word_buf:
                yield f"event: token\ndata: {json.dumps({'text': word_buf})}\n\n"

            if ai_resp is None:
                raise ValueError("No response received from AI")

            # Emit docType event if AI identified document
            doc_type = _normalize_doc_type(ai_resp.documentType)
            if doc_type:
                yield f"event: fields\ndata: {json.dumps({'docType': doc_type})}\n\n"

            # Emit field updates
            has_nda = (req.docType == "nda") or (doc_type == "nda")
            if ai_resp.fields or ai_resp.party1 or ai_resp.party2:
                if has_nda:
                    nda = _remap_nda_fields(ai_resp.fields or {}, ai_resp.party1, ai_resp.party2)
                    if nda:
                        yield f"event: fields\ndata: {json.dumps(nda)}\n\n"
                else:
                    generic = dict(ai_resp.fields or {})
                    if ai_resp.party1:
                        generic["party1"] = ai_resp.party1.model_dump(exclude_none=True)
                    if ai_resp.party2:
                        generic["party2"] = ai_resp.party2.model_dump(exclude_none=True)
                    if generic:
                        yield f"event: fields\ndata: {json.dumps({'fields': generic})}\n\n"

            yield "event: done\ndata: {}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# Serve static frontend files — must be last
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
