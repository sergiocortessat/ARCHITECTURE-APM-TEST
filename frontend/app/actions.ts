"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

export async function createRoom(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const capacity = Number(formData.get("capacity"));

  const res = await apiFetch("/rooms", {
    method: "POST",
    body: JSON.stringify({ name, capacity }),
  });

  if (!res.ok) {
    const error = {
      detail:
        typeof res.data?.detail === "string"
          ? res.data.detail
          : JSON.stringify(res.data?.detail ?? ""),
    };
    let message = "No se pudo crear la sala";
    if (error.detail.includes("UNIQUE")) {
      message = "Ya existe una sala con ese nombre";
    } else if (res.status === 422) {
      message = "Revisa el nombre y la capacidad";
    }
    redirect(`/?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/");
  redirect("/");
}
