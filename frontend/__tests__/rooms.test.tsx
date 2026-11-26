import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import HomePage from "@/app/page";
import RoomDetailPage from "@/app/rooms/[id]/page";
import { createRoom } from "@/app/actions";

const ROOM_ID = "7f1c2a9e-4b9d-4c55-9a0e-2a6f1d3b8c11";

function formWith(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function renderDetail(status: number, body: unknown, id = ROOM_ID) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));
  const ui = await RoomDetailPage({ params: Promise.resolve({ id }) });
  return render(ui);
}

async function renderHome(rooms: unknown[], error?: string) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(rooms)));
  const ui = await HomePage({ searchParams: Promise.resolve({ error }) });
  return render(ui);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  redirect.mockClear();
});

describe("rooms form and list", () => {
  // Escenario 5 (formulario, listado y detalle)
  it("shows the description in list and detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await createRoom(formWith({ name: "Sala Azul", capacity: "6", description: "Proyector y pizarra" }));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      name: "Sala Azul",
      capacity: 6,
      description: "Proyector y pizarra",
    });

    await renderHome([
      { id: ROOM_ID, name: "Sala Azul", capacity: 6, description: "Proyector y pizarra" },
    ]);
    expect(screen.getByText("Proyector y pizarra")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Sala Azul" });
    expect(link.getAttribute("href")).toBe(`/rooms/${ROOM_ID}`);
    cleanup();

    await renderDetail(200, {
      id: ROOM_ID,
      name: "Sala Azul",
      capacity: 6,
      description: "Proyector y pizarra",
    });
    expect(screen.getByRole("heading", { name: "Sala Azul" })).toBeTruthy();
    expect(screen.getByText("6 personas")).toBeTruthy();
    expect(screen.getByText("Proyector y pizarra")).toBeTruthy();
  });

  // Escenario 6 (formulario, listado y detalle)
  it("omits the description when it is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await createRoom(formWith({ name: "Sala Roja", capacity: "4", description: "   " }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).description).toBeNull();

    const { container } = await renderHome([
      { id: ROOM_ID, name: "Sala Roja", capacity: 4, description: null },
    ]);
    expect(screen.getByText("Sala Roja")).toBeTruthy();
    expect(container.querySelector("li p")).toBeNull();
    cleanup();

    const detail = await renderDetail(200, {
      id: ROOM_ID,
      name: "Sala Roja",
      capacity: 4,
      description: null,
    });
    expect(screen.getByRole("heading", { name: "Sala Roja" })).toBeTruthy();
    expect(screen.getByText("4 personas")).toBeTruthy();
    expect(detail.container.querySelectorAll("main > p")).toHaveLength(2);
  });

  it("shows 'Sala no encontrada' in the detail when the room does not exist (RF-11)", async () => {
    await renderDetail(404, { detail: "Room not found" });
    expect(screen.getByText("Sala no encontrada")).toBeTruthy();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders the form field limited to 500 characters", async () => {
    await renderHome([]);
    const field = screen.getByLabelText("Descripción (opcional)") as HTMLTextAreaElement;
    expect(field.name).toBe("description");
    expect(field.maxLength).toBe(500);
    expect(field.required).toBe(false);
  });

  it("shows the description as text, not HTML (CB-06)", async () => {
    const { container } = await renderHome([
      { id: ROOM_ID, name: "Sala", capacity: 2, description: "<b>negrita</b>" },
    ]);
    expect(screen.getByText("<b>negrita</b>")).toBeTruthy();
    expect(container.querySelector("b")).toBeNull();
  });

  it("redirects with the description message on a 422 about description (RF-10)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { detail: [{ loc: ["body", "description"], msg: "String should have at most 500 characters" }] },
          { status: 422 },
        ),
      ),
    );
    await createRoom(formWith({ name: "Sala", capacity: "2", description: "x".repeat(501) }));
    expect(redirect).toHaveBeenCalledWith(
      `/?error=${encodeURIComponent("La descripción no puede superar los 500 caracteres")}`,
    );
  });

  it("shows the error message in the page without breaking it", async () => {
    await renderHome([], "La descripción no puede superar los 500 caracteres");
    expect(screen.getByText("La descripción no puede superar los 500 caracteres")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear sala" })).toBeTruthy();
  });
});
