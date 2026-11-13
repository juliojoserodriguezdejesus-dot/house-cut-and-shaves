import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { API_ON, ApiError, api, setToken } from "./api";
import { Day, Service, slotsFor } from "./data";
import { registerPush } from "./push";

export type Account = { first: string; last: string; phone: string };
export type Staff = { role: "stylist" | "reception"; id: string; name: string };
export type Draft = { service?: Service; stylist?: { id: string; name: string }; date?: string; time?: string };
export type Appt = { id: string; serviceName: string; stylistId: string; stylistName: string; date: string; time: string; paid: number; total: number; client?: { name: string; phone: string } };
export type Err = { field?: string; message: string } | null;
type Ctx = {
  mode: "api" | "local"; ready: boolean; account: Account | null; staff: Staff | null; pushOn: boolean; appts: Appt[]; draft: Draft;
  setDraft: (p: Draft) => void; resetDraft: () => void;
  register: (a: { first: string; last: string; phone: string; password: string }) => Promise<Err>;
  login: (phone: string, password: string) => Promise<Err>; logout: () => void;
  staffLogin: (handle: string, password: string) => Promise<Err>; hasStaff: (handle: string) => boolean; createStaffLocal: (handle: string, password: string) => Promise<void>; staffLogout: () => void;
  slots: (day: Day, stylistId: string) => Promise<{ time: string; busy: boolean }[]>;
  nextFree: (day: Day, stylistId: string, after: string) => Promise<string | null>;
  book: (paid: number, total: number) => Promise<{ ok: true } | { ok: false; error: string; conflict: boolean }>;
  refreshMine: () => Promise<void>; agenda: (from: string, to: string) => Promise<Appt[]>;
  changePassword: (cur: string, next: string) => Promise<Err>; resetPassword: (handle: string, next: string) => Promise<Err>; cancelAppt: (id: string) => Promise<Err>;
};
const StoreCtx = createContext<Ctx>(null as never);
export const useStore = () => useContext(StoreCtx);
const KEY = "house.v1", TOKEN = "house.token";
const fromApi = (a: any): Appt => ({ id: String(a.id), serviceName: a.service_name, stylistId: a.stylist_id, stylistName: a.stylist_name, date: a.date, time: a.time, paid: a.paid, total: a.total, client: a.client });
const toErr = (e: unknown): Err => (e instanceof ApiError ? { field: e.field ?? undefined, message: e.message } : { message: "Ocurrió un error. Intenta de nuevo." });
const sha = (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);

/**
 * Modo servidor (EXPO_PUBLIC_API_URL): cuentas, citas y horas ocupadas viven en el servidor y se comparten entre todos.
 * Modo local (sin URL): demostración guardada en este dispositivo, con contraseñas en hash.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null), [staff, setStaff] = useState<Staff | null>(null), [pushOn, setPushOn] = useState(false);
  const [appts, setAppts] = useState<Appt[]>([]), [draft, setD] = useState<Draft>({}), [ready, setReady] = useState(false);
  const [local, setLocal] = useState<{ phone?: string; hash?: string; admins: Record<string, string> }>({ admins: {} });
  const persist = (acc: Account | null, hash: string | undefined, ap: Appt[], ad: Record<string, string>) =>
    AsyncStorage.setItem(KEY, JSON.stringify({ account: acc && { ...acc, hash }, appts: ap, admins: ad })).catch(() => {});

  const applyUser = (u: any) => { if (u.role === "client") { setAccount({ first: u.first, last: u.last, phone: u.phone }); setStaff(null); } else { setStaff({ role: u.role, id: u.stylist_id ?? u.handle, name: u.first }); setAccount(null); } };
  const startSession = async (r: { token: string; user: any }) => { setToken(r.token); await AsyncStorage.setItem(TOKEN, r.token).catch(() => {}); applyUser(r.user); };

  useEffect(() => { (async () => {
    try {
      if (API_ON) { const t = await AsyncStorage.getItem(TOKEN); if (t) { setToken(t); try { applyUser(await api("/me")); } catch (e) { if (e instanceof ApiError && e.status === 401) { setToken(null); AsyncStorage.removeItem(TOKEN); } } } }
      else { const raw = await AsyncStorage.getItem(KEY); if (raw) { const j = JSON.parse(raw); if (j.account) { setAccount({ first: j.account.first, last: j.account.last, phone: j.account.phone }); setLocal((l) => ({ ...l, phone: j.account.phone, hash: j.account.hash })); } setAppts(j.appts ?? []); setLocal((l) => ({ ...l, admins: j.admins ?? {} })); } }
    } catch {}
    setReady(true);
  })(); }, []);

  const register: Ctx["register"] = useCallback(async (a) => {
    try {
      if (API_ON) { await startSession(await api("/auth/register", { method: "POST", body: { first: a.first, last: a.last, phone: a.phone, password: a.password } })); return null; }
      const hash = await sha(`${a.phone}:${a.password}`), acc = { first: a.first, last: a.last, phone: a.phone };
      setAccount(acc); setLocal((l) => ({ ...l, phone: a.phone, hash })); persist(acc, hash, appts, local.admins); return null;
    } catch (e) { return toErr(e); }
  }, [appts, local.admins]);
  const login: Ctx["login"] = useCallback(async (phone, password) => {
    try { const r = await api<{ token: string; user: any }>("/auth/login", { method: "POST", body: { identifier: phone, password } });
      if (r.user.role !== "client") return { message: "Esta cuenta es del personal. Entra desde “Acceso administradores”." }; await startSession(r); return null; } catch (e) { return toErr(e); }
  }, []);
  const clear = () => { setToken(null); AsyncStorage.removeItem(TOKEN).catch(() => {}); setAccount(null); setStaff(null); setAppts([]); setPushOn(false); };
  const staffLogin: Ctx["staffLogin"] = useCallback(async (handle, password) => {
    try {
      if (API_ON) {
        const r = await api<{ token: string; user: any }>("/auth/login", { method: "POST", body: { identifier: handle, password } });
        if (r.user.role === "client") return { message: "Esta cuenta no es del personal" };
        await startSession(r); registerPush().then((t) => { if (t) return api("/devices", { method: "POST", body: { token: t } }).then(() => setPushOn(true)); }).catch(() => {}); return null;
      }
      if (!local.admins[handle] || (await sha(`staff:${handle}:${password}`)) !== local.admins[handle]) return { field: "pw", message: "Contraseña incorrecta" };
      setStaff({ role: handle === "carla" ? "reception" : "stylist", id: handle, name: handle[0].toUpperCase() + handle.slice(1) }); return null;
    } catch (e) { return toErr(e); }
  }, [local.admins]);
  const createStaffLocal: Ctx["createStaffLocal"] = useCallback(async (handle, password) => {
    const ad = { ...local.admins, [handle]: await sha(`staff:${handle}:${password}`) }; setLocal((l) => ({ ...l, admins: ad })); persist(account, local.hash, appts, ad);
    setStaff({ role: handle === "carla" ? "reception" : "stylist", id: handle, name: handle[0].toUpperCase() + handle.slice(1) });
  }, [local, account, appts]);

  const slots: Ctx["slots"] = useCallback(async (day, stylistId) => {
    if (API_ON) return api(`/availability?stylist=${stylistId}&date=${day.iso}`);
    return slotsFor(day, stylistId, appts.map((a) => ({ date: a.date, time: a.time, stylist: a.stylistId })));
  }, [appts]);
  /** Primera hora libre desde `after`. En modo servidor la calcula el BST del servidor (ceiling). */
  const nextFree: Ctx["nextFree"] = useCallback(async (day, stylistId, after) => {
    if (API_ON) return (await api<{ time: string | null }>(`/next-available?stylist=${stylistId}&date=${day.iso}&after=${after}`)).time;
    return (await slots(day, stylistId)).find((x) => !x.busy && x.time >= after)?.time ?? null;
  }, [slots]);
  const book: Ctx["book"] = useCallback(async (paid, total) => {
    if (!draft.service || !draft.stylist || !draft.date || !draft.time) return { ok: false, error: "Faltan datos de la cita", conflict: false };
    try {
      if (API_ON) { const a = await api("/appointments", { method: "POST", body: { service_id: draft.service.id, stylist_id: draft.stylist.id, date: draft.date, time: draft.time } }); setAppts((p) => [...p, fromApi(a)]); return { ok: true }; }
      const a: Appt = { id: String(Date.now()), serviceName: draft.service.name, stylistId: draft.stylist.id, stylistName: draft.stylist.name, date: draft.date, time: draft.time, paid, total, client: account ? { name: `${account.first} ${account.last}`, phone: account.phone } : undefined };
      const next = [...appts, a].sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)); setAppts(next); persist(account, local.hash, next, local.admins); return { ok: true };
    } catch (e) { return { ok: false, error: toErr(e)!.message, conflict: e instanceof ApiError && e.status === 409 }; }
  }, [draft, appts, account, local]);
  const refreshMine = useCallback(async () => { if (API_ON && account) { try { setAppts((await api<any[]>("/appointments/mine")).map(fromApi)); } catch {} } }, [account]);
  const agenda: Ctx["agenda"] = useCallback(async (from, to) => {
    if (API_ON) return (await api<any[]>(`/staff/agenda?from=${from}&to=${to}`)).map(fromApi);
    return appts.filter((a) => a.date >= from && a.date <= to && (staff?.role === "reception" || a.stylistId === staff?.id));
  }, [appts, staff]);
  const changePassword: Ctx["changePassword"] = useCallback(async (cur, next) => {
    try {
      if (API_ON) { await api("/me/password", { method: "POST", body: { current: cur, new: next } }); return null; }
      const id = staff!.id; if ((await sha(`staff:${id}:${cur}`)) !== local.admins[id]) return { field: "current", message: "La contraseña actual no es correcta" };
      const ad = { ...local.admins, [id]: await sha(`staff:${id}:${next}`) }; setLocal((l) => ({ ...l, admins: ad })); persist(account, local.hash, appts, ad); return null;
    } catch (e) { return toErr(e); }
  }, [staff, local, account, appts]);
  const resetPassword: Ctx["resetPassword"] = useCallback(async (handle, next) => {
    try {
      if (API_ON) { await api(`/staff/${handle}/password`, { method: "POST", body: { new: next } }); return null; }
      const ad = { ...local.admins, [handle]: await sha(`staff:${handle}:${next}`) }; setLocal((l) => ({ ...l, admins: ad })); persist(account, local.hash, appts, ad); return null;
    } catch (e) { return toErr(e); }
  }, [local, account, appts]);
  const cancelAppt: Ctx["cancelAppt"] = useCallback(async (id) => {
    try { if (API_ON) await api(`/appointments/${id}/cancel`, { method: "POST" }); else { const next = appts.filter((a) => a.id !== id); setAppts(next); persist(account, local.hash, next, local.admins); } return null; } catch (e) { return toErr(e); }
  }, [appts, account, local]);

  return (
    <StoreCtx.Provider value={{ mode: API_ON ? "api" : "local", ready, account, staff, pushOn, appts, draft, setDraft: (p) => setD((d) => ({ ...d, ...p })), resetDraft: () => setD({}),
      register, login, logout: clear, staffLogin, hasStaff: (h) => API_ON || !!local.admins[h], createStaffLocal, staffLogout: () => { if (API_ON) clear(); else setStaff(null); }, slots, nextFree, book, refreshMine, agenda, changePassword, resetPassword, cancelAppt }}>{children}</StoreCtx.Provider>
  );
}
