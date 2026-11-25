import uuid

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


@pytest.fixture
def room_id(client):
    response = client.post("/rooms", json={"name": "Sala Azul", "capacity": 6})
    return response.json()["id"]


def booking(room_id, start="2099-01-10T10:00:00", end="2099-01-10T11:00:00"):
    return {
        "room_id": room_id,
        "start_at": start,
        "end_at": end,
        "booked_by": "ana@example.com",
    }


def test_create_valid_booking(client, room_id):
    response = client.post("/bookings", json=booking(room_id))

    assert response.status_code == 201
    body = response.json()
    assert body["room_id"] == room_id
    assert body["booked_by"] == "ana@example.com"

    listed = client.get("/bookings", params={"room_id": room_id}).json()
    assert [b["id"] for b in listed] == [body["id"]]


def test_rejects_end_before_start(client, room_id):
    response = client.post(
        "/bookings",
        json=booking(room_id, start="2099-01-10T11:00:00", end="2099-01-10T10:00:00"),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "end must be after start"


def test_rejects_overlapping_booking(client, room_id):
    client.post("/bookings", json=booking(room_id))

    response = client.post(
        "/bookings",
        json=booking(room_id, start="2099-01-10T10:30:00", end="2099-01-10T11:30:00"),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "overlap!"


def test_rejects_unknown_room(client):
    response = client.post("/bookings", json=booking(str(uuid.uuid4())))

    assert response.status_code == 404
    assert response.json()["detail"] == "Sala no existe"
