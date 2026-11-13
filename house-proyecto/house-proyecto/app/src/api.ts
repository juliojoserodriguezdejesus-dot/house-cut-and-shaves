declare const process: any;
// Web: la dirección se puede poner sin recompilar editando config.js (window.HOUSE_API_URL). Celular: EXPO_PUBLIC_API_URL.
const BASE: string = (((globalThis as any).HOUSE_API_URL as string) || process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
/** Con URL de servidor la app usa cuentas y citas compartidas; sin ella, funciona en modo demostración local. */
export const API_ON = BASE.length > 0;
let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };

export class ApiError extends Error {
  constructor(public status: number, public field: string | null, message: string) { super(message); }
}
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { method: opts.method ?? "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  } catch { throw new ApiError(0, null, "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo."); }
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const d = j?.detail;
    throw new ApiError(res.status, d && typeof d === "object" && !Array.isArray(d) ? d.field ?? null : null, typeof d === "string" ? d : d && !Array.isArray(d) ? d.message : "Revisa los datos e intenta de nuevo.");
  }
  return j as T;
}
