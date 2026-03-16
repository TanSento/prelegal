"""Tests for document CRUD endpoints."""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

os.environ["DB_PATH"] = "/tmp/prelegal_test_docs.db"

from main import app
from database import init_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    os.environ["DB_PATH"] = db_path
    import database
    database.DB_PATH = db_path
    await init_db()
    yield


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


async def create_user(client, name="Alice", email="alice@test.com", password="pass123"):
    resp = await client.post("/api/auth/signup", json={"name": name, "email": email, "password": password})
    return resp.json()["token"]


@pytest.mark.asyncio
async def test_create_document(client):
    token = await create_user(client)
    resp = await client.post(
        "/api/documents",
        json={"doc_type": "mutual-nda", "title": "Test NDA", "form_data": {"purpose": "test"}, "chat_history": []},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "id" in resp.json()


@pytest.mark.asyncio
async def test_list_only_own_documents(client):
    token1 = await create_user(client, "Alice", "alice@test.com")
    token2 = await create_user(client, "Bob", "bob@test.com")

    await client.post(
        "/api/documents",
        json={"doc_type": "mutual-nda", "title": "Alice's NDA", "form_data": {}, "chat_history": []},
        headers={"Authorization": f"Bearer {token1}"},
    )
    await client.post(
        "/api/documents",
        json={"doc_type": "csa", "title": "Bob's CSA", "form_data": {}, "chat_history": []},
        headers={"Authorization": f"Bearer {token2}"},
    )

    resp = await client.get("/api/documents", headers={"Authorization": f"Bearer {token1}"})
    docs = resp.json()
    assert len(docs) == 1
    assert docs[0]["title"] == "Alice's NDA"


@pytest.mark.asyncio
async def test_get_document_by_id(client):
    token = await create_user(client)
    create_resp = await client.post(
        "/api/documents",
        json={"doc_type": "mutual-nda", "title": "My NDA", "form_data": {"purpose": "deal"}, "chat_history": [{"role": "user", "content": "hello"}]},
        headers={"Authorization": f"Bearer {token}"},
    )
    doc_id = create_resp.json()["id"]

    resp = await client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "My NDA"
    assert data["form_data"]["purpose"] == "deal"
    assert len(data["chat_history"]) == 1


@pytest.mark.asyncio
async def test_update_document(client):
    token = await create_user(client)
    create_resp = await client.post(
        "/api/documents",
        json={"doc_type": "mutual-nda", "title": "Draft", "form_data": {}, "chat_history": []},
        headers={"Authorization": f"Bearer {token}"},
    )
    doc_id = create_resp.json()["id"]

    await client.put(
        f"/api/documents/{doc_id}",
        json={"title": "Final NDA", "form_data": {"purpose": "updated"}},
        headers={"Authorization": f"Bearer {token}"},
    )

    resp = await client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    data = resp.json()
    assert data["title"] == "Final NDA"
    assert data["form_data"]["purpose"] == "updated"


@pytest.mark.asyncio
async def test_cannot_access_other_users_doc(client):
    token1 = await create_user(client, "Alice", "alice@test.com")
    token2 = await create_user(client, "Bob", "bob@test.com")

    create_resp = await client.post(
        "/api/documents",
        json={"doc_type": "mutual-nda", "title": "Alice's Private Doc", "form_data": {}, "chat_history": []},
        headers={"Authorization": f"Bearer {token1}"},
    )
    doc_id = create_resp.json()["id"]

    # Bob tries to access Alice's document
    resp = await client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {token2}"})
    assert resp.status_code == 404
