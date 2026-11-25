import { apiFetch } from "@/lib/api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { roomId, start, end, email } = body;

  if (!roomId || !start || !end || !email) {
    return Response.json({ message: "Faltan datos de la reserva" }, { status: 400 });
  }

  if (new Date(end).getTime() <= new Date(start).getTime()) {
    return Response.json(
      { message: "La fecha de fin debe ser posterior a la de inicio" },
      { status: 400 },
    );
  }

  let res;
  try {
    res = await apiFetch("/bookings", {
      method: "POST",
      body: JSON.stringify({
        room_id: roomId,
        start_at: start,
        end_at: end,
        booked_by: email,
      }),
    });
  } catch {
    return Response.json({ message: "El servidor de reservas no responde" }, { status: 502 });
  }

  if (!res.ok) {
    const detail = res.data?.detail;
    if (detail === "overlap!") {
      return Response.json({ message: "La sala ya está ocupada" }, { status: 409 });
    }
    if (detail === "Sala no existe") {
      return Response.json({ message: "La sala no existe" }, { status: 404 });
    }
    if (detail === "end must be after start") {
      return Response.json(
        { message: "La fecha de fin debe ser posterior a la de inicio" },
        { status: 400 },
      );
    }
    if (detail === "cannot book in the past") {
      return Response.json({ message: "No se puede reservar en el pasado" }, { status: 400 });
    }
    if (Array.isArray(detail)) {
      return Response.json({ message: "Revisa los datos del formulario" }, { status: 400 });
    }
    return Response.json({ message: "No se pudo crear la reserva" }, { status: res.status });
  }

  const booking = res.data;
  return Response.json(
    {
      id: booking.id,
      roomId: booking.room_id,
      start: booking.start_at,
      end: booking.end_at,
      email: booking.booked_by,
    },
    { status: 201 },
  );
}
