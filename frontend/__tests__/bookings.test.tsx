import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookingsPage from "@/app/bookings/page";
import { POST } from "@/app/api/bookings/route";

const ROOM_ID = "7f1c2a9e-4b9d-4c55-9a0e-2a6f1d3b8c11";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BookingsPage", () => {
  it("shows an error when the end is before the start", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([{ id: ROOM_ID, name: "Sala Azul", capacity: 6 }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<BookingsPage />);
    await screen.findByText("Sala Azul (6)");

    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "2099-01-10T11:00" },
    });
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2099-01-10T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reservar" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("La fecha de fin debe ser posterior a la de inicio");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/bookings", expect.anything());
  });
});

describe("POST /api/bookings", () => {
  it("returns the overlap message when the backend answers overlap!", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ detail: "overlap!" }, { status: 409 })),
    );

    const request = new Request("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        roomId: ROOM_ID,
        start: "2099-01-10T10:00",
        end: "2099-01-10T11:00",
        email: "ana@example.com",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "La sala ya está ocupada" });
  });
});
