import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app import db
from app.rooms import get_room

router = APIRouter()


class BookingIn(BaseModel):
    room_id: uuid.UUID
    start_at: datetime
    end_at: datetime
    booked_by: EmailStr


class Booking(BaseModel):
    id: uuid.UUID
    room_id: uuid.UUID
    start_at: datetime
    end_at: datetime
    booked_by: EmailStr


@router.post("/bookings", status_code=201, response_model=Booking)
def create_booking(body: BookingIn):
    room = db.conn.execute(
        "SELECT id FROM rooms WHERE id = ?", (str(body.room_id),)
    ).fetchone()
    if room is None:
        raise HTTPException(status_code=404, detail="Sala no existe")

    if body.end_at <= body.start_at:
        raise HTTPException(status_code=400, detail="end must be after start")

    if body.start_at < datetime.now():
        raise HTTPException(status_code=400, detail="cannot book in the past")

    start_at = body.start_at.isoformat()
    end_at = body.end_at.isoformat()

    clash = db.conn.execute(
        """
        SELECT id FROM bookings
        WHERE room_id = ? AND start_at < ? AND end_at > ?
        LIMIT 1
        """,
        (str(body.room_id), end_at, start_at),
    ).fetchone()
    if clash is not None:
        raise HTTPException(status_code=409, detail="overlap!")

    booking_id = str(uuid.uuid4())
    db.conn.execute(
        """
        INSERT INTO bookings (id, room_id, start_at, end_at, booked_by)
        VALUES (?, ?, ?, ?, ?)
        """,
        (booking_id, str(body.room_id), start_at, end_at, body.booked_by),
    )
    db.conn.commit()

    return {
        "id": booking_id,
        "room_id": body.room_id,
        "start_at": start_at,
        "end_at": end_at,
        "booked_by": body.booked_by,
    }


@router.get("/bookings", response_model=list[Booking])
def list_bookings(room_id: uuid.UUID | None = None):
    if room_id is not None:
        get_room(room_id)
        rows = db.conn.execute(
            "SELECT * FROM bookings WHERE room_id = ? ORDER BY start_at",
            (str(room_id),),
        ).fetchall()
    else:
        rows = db.conn.execute(
            "SELECT * FROM bookings ORDER BY start_at"
        ).fetchall()
    return [dict(row) for row in rows]


@router.delete("/bookings/{booking_id}", status_code=204)
def delete_booking(booking_id: uuid.UUID):
    cur = db.conn.execute("DELETE FROM bookings WHERE id = ?", (str(booking_id),))
    db.conn.commit()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="booking does not exist")
