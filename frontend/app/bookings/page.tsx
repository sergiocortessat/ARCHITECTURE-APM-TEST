"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Room = {
  id: string;
  name: string;
  capacity: number;
};

type Booking = {
  id: string;
  roomId: string;
  start: string;
  end: string;
  email: string;
};

export default function BookingsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/rooms`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Room[]) => {
        setRooms(data);
        if (data.length > 0) setRoomId(data[0].id);
      })
      .catch(() => setError("No se pudieron cargar las salas"));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBooking(null);

    if (!start || !end || new Date(end) <= new Date(start)) {
      setError("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, start, end, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No se pudo crear la reserva");
      } else {
        setBooking(data);
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSending(false);
    }
  }

  const roomName = rooms.find((r) => r.id === booking?.roomId)?.name;

  return (
    <main>
      <h1>Reservar sala</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
        <label>
          Sala
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.capacity})
              </option>
            ))}
          </select>
        </label>
        <label>
          Inicio
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          Fin
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" disabled={sending}>
          {sending ? "Reservando..." : "Reservar"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}
      {booking && (
        <p>
          Reserva confirmada en {roomName ?? "la sala"} para {booking.email}.
        </p>
      )}
    </main>
  );
}
