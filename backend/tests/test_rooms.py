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


def test_create_room_with_description(client):
    response = client.post(
        "/rooms",
        json={"name": "Sala Azul", "capacity": 6, "description": "Proyector y pizarra"},
    )

    assert response.status_code == 201
    room = response.json()
    assert room["description"] == "Proyector y pizarra"
    assert client.get(f"/rooms/{room['id']}").json()["description"] == "Proyector y pizarra"
    assert client.get("/rooms").json()[0]["description"] == "Proyector y pizarra"


def test_create_room_without_description(client):
    response = client.post("/rooms", json={"name": "Sala Azul", "capacity": 6})

    assert response.status_code == 201
    room = response.json()
    assert room["description"] is None
    assert client.get(f"/rooms/{room['id']}").json()["description"] is None
    assert client.get("/rooms").json()[0]["description"] is None


def test_create_room_rejects_description_over_500(client):
    response = client.post(
        "/rooms", json={"name": "Sala Azul", "capacity": 6, "description": "x" * 501}
    )

    assert response.status_code == 422
    assert client.get("/rooms").json() == []


def test_create_room_accepts_description_of_500(client):
    response = client.post(
        "/rooms", json={"name": "Sala Azul", "capacity": 6, "description": "x" * 500}
    )

    assert response.status_code == 201
    assert response.json()["description"] == "x" * 500


def test_create_room_accepts_null_description(client):
    response = client.post(
        "/rooms", json={"name": "Sala Azul", "capacity": 6, "description": None}
    )

    assert response.status_code == 201
    assert response.json()["description"] is None


def test_create_room_keeps_empty_description(client):
    response = client.post(
        "/rooms", json={"name": "Sala Azul", "capacity": 6, "description": ""}
    )

    assert response.status_code == 201
    room = response.json()
    assert room["description"] == ""
    assert client.get(f"/rooms/{room['id']}").json()["description"] == ""


def test_get_missing_room_returns_404(client):
    response = client.get("/rooms/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404


def test_init_db_migrates_existing_rooms(tmp_path, monkeypatch):
    legacy = db.connect(tmp_path / "legacy.sqlite")
    legacy.executescript(
        """
        CREATE TABLE rooms (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            capacity INTEGER NOT NULL
        );
        """
    )
    room_id = "11111111-1111-1111-1111-111111111111"
    legacy.execute(
        "INSERT INTO rooms (id, name, capacity) VALUES (?, ?, ?)",
        (room_id, "Sala Vieja", 8),
    )
    legacy.commit()
    monkeypatch.setattr(db, "conn", legacy)

    db.init_db()
    db.init_db()  # idempotente (CB-04)

    columns = [row["name"] for row in legacy.execute("PRAGMA table_info(rooms)")]
    assert columns.count("description") == 1
    client = TestClient(app)
    expected = {"id": room_id, "name": "Sala Vieja", "capacity": 8, "description": None}
    assert client.get(f"/rooms/{room_id}").json() == expected
    assert client.get("/rooms").json() == [expected]
    legacy.close()
