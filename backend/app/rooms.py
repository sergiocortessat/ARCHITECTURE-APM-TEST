import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import db

router = APIRouter()


class RoomIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    capacity: int = Field(gt=0)


class Room(BaseModel):
    id: uuid.UUID
    name: str
    capacity: int


@router.post("/rooms", status_code=201, response_model=Room)
def create_room(body: RoomIn):
    room_id = str(uuid.uuid4())
    db.conn.execute(
        "INSERT INTO rooms (id, name, capacity) VALUES (?, ?, ?)",
        (room_id, body.name, body.capacity),
    )
    db.conn.commit()
    return {"id": room_id, "name": body.name, "capacity": body.capacity}


@router.get("/rooms", response_model=list[Room])
def list_rooms():
    rows = db.conn.execute(
        "SELECT id, name, capacity FROM rooms ORDER BY name"
    ).fetchall()
    return [dict(row) for row in rows]


@router.get("/rooms/{room_id}", response_model=Room)
def get_room(room_id: uuid.UUID):
    row = db.conn.execute(
        "SELECT id, name, capacity FROM rooms WHERE id = ?", (str(room_id),)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="room not found")
    return dict(row)


@router.delete("/rooms/{room_id}", status_code=204)
def delete_room(room_id: uuid.UUID):
    try:
        db.conn.execute("DELETE FROM rooms WHERE id = ?", (str(room_id),))
        db.conn.commit()
    except Exception:
        pass
