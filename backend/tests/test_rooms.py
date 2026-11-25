import pytest
from fastapi.testclient import TestClient

from app import db
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "conn", db.connect(tmp_path / "test.sqlite"))
    db.init_db()
    yield TestClient(app)
    db.conn.close()


def test_create_room(client):
    response = client.post("/rooms", json={"name": "Sala Azul", "capacity": 6})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Sala Azul"
    assert body["capacity"] == 6
    assert body["id"]


def test_list_rooms(client):
    client.post("/rooms", json={"name": "Sala Verde", "capacity": 4})
    client.post("/rooms", json={"name": "Sala Azul", "capacity": 10})

    response = client.get("/rooms")

    assert response.status_code == 200
    names = [room["name"] for room in response.json()]
    assert names == ["Sala Azul", "Sala Verde"]


def test_create_room_rejects_zero_capacity(client):
    response = client.post("/rooms", json={"name": "Sala Roja", "capacity": 0})

    assert response.status_code == 422
