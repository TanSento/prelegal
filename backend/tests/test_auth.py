"""Tests for auth endpoints: signup, signin, signout, protected routes."""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Use temp DB for tests
os.environ["DB_PATH"] = "/tmp/prelegal_test_auth.db"

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


@pytest.mark.asyncio
async def test_signup(client):
    resp = await client.post("/api/auth/signup", json={"name": "Alice", "email": "alice@test.com", "password": "secret123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["name"] == "Alice"
    assert data["user"]["email"] == "alice@test.com"


@pytest.mark.asyncio
async def test_signin(client):
    await client.post("/api/auth/signup", json={"name": "Bob", "email": "bob@test.com", "password": "pass1234"})
    resp = await client.post("/api/auth/signin", json={"email": "bob@test.com", "password": "pass1234"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == "bob@test.com"


@pytest.mark.asyncio
async def test_wrong_password(client):
    await client.post("/api/auth/signup", json={"name": "Carol", "email": "carol@test.com", "password": "correct"})
    resp = await client.post("/api/auth/signin", json={"email": "carol@test.com", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_email(client):
    await client.post("/api/auth/signup", json={"name": "Dan", "email": "dan@test.com", "password": "pass"})
    resp = await client.post("/api/auth/signup", json={"name": "Dan2", "email": "dan@test.com", "password": "pass"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_protected_endpoint_without_token(client):
    resp = await client.get("/api/documents")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_signout_invalidates_token(client):
    resp = await client.post("/api/auth/signup", json={"name": "Eve", "email": "eve@test.com", "password": "pass"})
    token = resp.json()["token"]

    # Token works before signout
    resp = await client.get("/api/documents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    # Signout
    resp = await client.post("/api/auth/signout", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    # Token no longer works
    resp = await client.get("/api/documents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
