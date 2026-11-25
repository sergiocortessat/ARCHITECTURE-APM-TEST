export const API_URL = "http://localhost:8000";

export type ApiResult<T = any> = {
  ok: boolean;
  status: number;
  data: T;
};

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
