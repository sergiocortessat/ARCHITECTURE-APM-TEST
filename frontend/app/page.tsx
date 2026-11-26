import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { createRoom } from "./actions";

export const dynamic = "force-dynamic";

type Room = {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let rooms: Room[] = [];
  let loadError = "";
  try {
    const res = await apiFetch<Room[]>("/rooms");
    rooms = res.ok ? res.data : [];
    if (!res.ok) loadError = "No se pudieron cargar las salas";
  } catch {
    loadError = "El servidor no responde";
  }

  return (
    <main>
      <h1>Salas</h1>
      {loadError && <p style={{ color: "crimson" }}>{loadError}</p>}
      {rooms.length === 0 && !loadError ? (
        <p>Todavía no hay salas.</p>
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              <strong>
                <Link href={`/rooms/${room.id}`}>{room.name}</Link>
              </strong> — {room.capacity} personas
              {room.description && <p>{room.description}</p>}
            </li>
          ))}
        </ul>
      )}

      <h2>Nueva sala</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form action={createRoom} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
        <label>
          Nombre
          <input name="name" required />
        </label>
        <label>
          Capacidad
          <input name="capacity" type="number" min={1} required />
        </label>
        <label>
          Descripción (opcional)
          <textarea name="description" maxLength={500} />
        </label>
        <button type="submit">Crear sala</button>
      </form>
    </main>
  );
}
