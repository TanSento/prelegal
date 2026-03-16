import asyncio
import json
import os
import secrets
from contextlib import asynccontextmanager
from typing import Literal

import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

load_dotenv()

from database import init_db, get_db
from ai import get_ai_response

STATIC_DIR = os.environ.get("STATIC_DIR", "/app/static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


class NoCacheHtmlMiddleware(BaseHTTPMiddleware):
    """Prevent browsers from caching HTML pages so chunk references stay fresh after rebuilds."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if "text/html" in response.headers.get("content-type", ""):
            response.headers["cache-control"] = "no-store"
        return response


app.add_middleware(NoCacheHtmlMiddleware)


# --- Auth models ---

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class SigninRequest(BaseModel):
    email: str
    password: str


async def get_current_user(request: Request) -> dict:
    """Extract Bearer token and return user dict, or raise 401."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth[7:]
    async with get_db() as db:
        row = await db.execute_fetchall(
            "SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?",
            (token,),
        )
        if not row:
            raise HTTPException(status_code=401, detail="Invalid token")
        r = row[0]
        return {"id": r[0], "email": r[1], "name": r[2]}


# --- Auth endpoints ---

@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    token = secrets.token_urlsafe(32)
    async with get_db() as db:
        try:
            cursor = await db.execute(
                "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
                (req.email, req.name, hashed),
            )
            user_id = cursor.lastrowid
        except Exception:
            raise HTTPException(status_code=409, detail="Email already registered")
        await db.execute(
            "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
            (token, user_id),
        )
        await db.commit()
    return {"token": token, "user": {"id": user_id, "name": req.name, "email": req.email}}


@app.post("/api/auth/signin")
async def signin(req: SigninRequest):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            (req.email,),
        )
        if not rows:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user = rows[0]
        if not bcrypt.checkpw(req.password.encode(), user[3].encode()):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = secrets.token_urlsafe(32)
        await db.execute(
            "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
            (token, user[0]),
        )
        await db.commit()
    return {"token": token, "user": {"id": user[0], "name": user[1], "email": user[2]}}


@app.post("/api/auth/signout")
async def signout(user: dict = Depends(get_current_user)):
    # Delete all sessions for this user (simple approach)
    async with get_db() as db:
        await db.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
        await db.commit()
    return {"ok": True}


# --- Chat endpoint ---

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    formData: dict
    docType: str = "mutual-nda"


@app.post("/api/chat")
async def chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    """Stream AI chat response as SSE. Yields token/fields/done/error events."""

    async def generate():
        try:
            history = [{"role": m.role, "content": m.content} for m in req.messages]
            ai_resp = await asyncio.wait_for(
                asyncio.to_thread(get_ai_response, history, req.formData, req.docType),
                timeout=70.0,
            )

            # Normalize Unicode spaces (model may return \xa0/\u202f) then stream word by word
            message = ai_resp.message.replace("\u202f", " ").replace("\xa0", " ")
            for word in message.split():
                yield f"event: token\ndata: {json.dumps({'text': word + ' '})}\n\n"
                await asyncio.sleep(0.02)

            # Emit non-null fields
            fields = ai_resp.fields.model_dump(exclude_none=True)
            if fields:
                yield f"event: fields\ndata: {json.dumps(fields)}\n\n"

            yield "event: done\ndata: {}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# --- Document CRUD ---

class CreateDocumentRequest(BaseModel):
    doc_type: str
    title: str
    form_data: dict
    chat_history: list[dict]


class UpdateDocumentRequest(BaseModel):
    title: str | None = None
    form_data: dict | None = None
    chat_history: list[dict] | None = None


@app.post("/api/documents")
async def create_document(req: CreateDocumentRequest, user: dict = Depends(get_current_user)):
    async with get_db() as db:
        cursor = await db.execute(
            "INSERT INTO documents (user_id, doc_type, title, form_data, chat_history) VALUES (?, ?, ?, ?, ?)",
            (user["id"], req.doc_type, req.title, json.dumps(req.form_data), json.dumps(req.chat_history)),
        )
        doc_id = cursor.lastrowid
        await db.commit()
    return {"id": doc_id}


@app.get("/api/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, doc_type, title, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
            (user["id"],),
        )
    return [{"id": r[0], "doc_type": r[1], "title": r[2], "updated_at": r[3]} for r in rows]


@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: int, user: dict = Depends(get_current_user)):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, doc_type, title, form_data, chat_history, created_at, updated_at FROM documents WHERE id = ? AND user_id = ?",
            (doc_id, user["id"]),
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Document not found")
        r = rows[0]
    return {
        "id": r[0],
        "doc_type": r[1],
        "title": r[2],
        "form_data": json.loads(r[3]),
        "chat_history": json.loads(r[4]),
        "created_at": r[5],
        "updated_at": r[6],
    }


@app.put("/api/documents/{doc_id}")
async def update_document(doc_id: int, req: UpdateDocumentRequest, user: dict = Depends(get_current_user)):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id FROM documents WHERE id = ? AND user_id = ?",
            (doc_id, user["id"]),
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Document not found")

        updates = []
        params = []
        if req.title is not None:
            updates.append("title = ?")
            params.append(req.title)
        if req.form_data is not None:
            updates.append("form_data = ?")
            params.append(json.dumps(req.form_data))
        if req.chat_history is not None:
            updates.append("chat_history = ?")
            params.append(json.dumps(req.chat_history))

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.extend([doc_id, user["id"]])
            await db.execute(
                f"UPDATE documents SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
                params,
            )
            await db.commit()
    return {"ok": True}


# Serve static frontend files — must be last
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
