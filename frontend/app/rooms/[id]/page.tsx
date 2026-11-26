import Link from "next/link";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

type Room = {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
};

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let room: Room | null = null;
  let message = "";
  try {
    const res = await apiFetch<Room>("/rooms/" + encodeURIComponent(id));
    if (res.ok) room = res.data;
    else if (res.status === 404) message = "Sala no encontrada";
    else message = "No se pudo cargar la sala";
  } catch {
    message = "El servidor no responde";
  }

  return (
    <main>
      <p>
        <Link href="/">Volver a las salas</Link>
      </p>
      {room ? (
        <>
          <h1>{room.name}</h1>
          <p>{room.capacity} personas</p>
          {room.description && <p>{room.description}</p>}
        </>
      ) : (
        <p>{message}</p>
      )}
    </main>
  );
}
