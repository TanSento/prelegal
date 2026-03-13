import asyncio
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
from ai import get_ai_response, AiResponse, SelectionAiResponse, GenericAiResponse

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


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Stream AI chat response as SSE. Yields token/fields/done/error events."""

    async def generate():
        try:
            history = [{"role": m.role, "content": m.content} for m in req.messages]
            ai_resp = await asyncio.to_thread(get_ai_response, history, req.formData, req.docType)

            # Stream the message word by word
            for word in ai_resp.message.split(" "):
                yield f"event: token\ndata: {json.dumps({'text': word + ' '})}\n\n"
                await asyncio.sleep(0.02)

            # Emit fields based on response type
            if isinstance(ai_resp, AiResponse):
                fields = ai_resp.fields.model_dump(exclude_none=True)
                if fields:
                    yield f"event: fields\ndata: {json.dumps(fields)}\n\n"
            elif isinstance(ai_resp, SelectionAiResponse):
                if ai_resp.fields.docType:
                    yield f"event: fields\ndata: {json.dumps({'docType': ai_resp.fields.docType})}\n\n"
            elif isinstance(ai_resp, GenericAiResponse):
                if ai_resp.fields.fields:
                    # Filter out None values
                    clean = {k: v for k, v in ai_resp.fields.fields.items() if v is not None}
                    if clean:
                        yield f"event: fields\ndata: {json.dumps({'fields': clean})}\n\n"

            yield "event: done\ndata: {}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# Serve static frontend files — must be last
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
