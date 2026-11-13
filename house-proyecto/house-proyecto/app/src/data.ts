export const BIZ = {
  name: "House Cuts & Shaves",
  about: "Barbería clásica con un toque moderno. Cortes profesionales, barba y cuidado masculino con atención de calidad.",
  address: "Módulo 106, Edificio, Centroamérica Nte., Managua 14026",
  plusCode: "4P7V+MV Managua",
  addressLines: ["Módulo 106", "Edificio, Centroamérica Nte.", "Managua 14026"],
  phone: "7774 6774",
  tel: "tel:+50577746774",
  whatsapp: "https://wa.me/50577746774?text=Hola%21%20Quisiera%20agendar%20cita",
  instagram: "https://www.instagram.com/housecutandshave/",
  facebook: "https://www.facebook.com/share/1FD9dHoaVb/",
  maps: "https://www.google.com/maps/search/?api=1&query=4P7V%2BMV%20Managua",
  rating: "4.9", reviews: 31,
};
export const HOURS = [
  { days: "Lunes a Miércoles", text: "9:00 a. m. a 6:00 p. m.", dows: [1, 2, 3] },
  { days: "Jueves a Sábado", text: "Horario extendido", dows: [4, 5, 6] },
  { days: "Domingo", text: "Cita con un día de anticipación", dows: [0] },
];
/** Nicaragua es UTC-6 todo el año (sin horario de verano). */
export function statusNow() {
  const d = new Date(Date.now() - 6 * 3600 * 1000);
  const dow = d.getUTCDay(), h = d.getUTCHours() + d.getUTCMinutes() / 60;
  if (dow >= 1 && dow <= 3)
    return { dow, open: h >= 9 && h < 18 ? true : false,
      text: h >= 9 && h < 18 ? "Abierto ahora · cierra a las 6:00 p. m." : h < 9 ? "Cerrado · abre a las 9:00 a. m." : "Cerrado · abre mañana" };
  return { dow, open: null as boolean | null, text: dow === 0 ? "Hoy: solo con cita previa" : "Hoy: horario extendido" };
}

// ---------- Servicios, estilistas y horarios ----------
export type Service = { id: string; name: string; sub?: string; price: number; from?: boolean; icon: "scissors" | "razor" | "drop" | "sparkle" | "leaf" };
export const SERVICES: Service[] = [
  { id: "corte", name: "Corte de cabello", price: 740, icon: "scissors" },
  { id: "barba-capital", name: "Barba capital", price: 735, icon: "razor" },
  { id: "barba-clasica", name: "Barba clásica", price: 623, icon: "razor" },
  { id: "paquete", name: "Paquete capital", sub: "Corte y barba", price: 1400, icon: "scissors" },
  { id: "pig-barba", name: "Pigmentación de barba", price: 550, from: true, icon: "drop" },
  { id: "pig-cabello", name: "Pigmentación de cabello", price: 550, from: true, icon: "drop" },
  { id: "celofanes", name: "Corte + celofanes", price: 1300, from: true, icon: "sparkle" },
  { id: "facial", name: "Facial", price: 1400, icon: "leaf" },
  { id: "pedicura", name: "Pedicura", price: 500, icon: "leaf" },
  { id: "manicura", name: "Manicura", price: 430, icon: "leaf" },
];
export const STYLISTS = [{ id: "dayan", name: "Dayan" }, { id: "lidia", name: "Lidia" }];
export const money = (n: number) => "C$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

declare const process: any;
/** Código para crear accesos de administrador. Cámbialo con EXPO_PUBLIC_ADMIN_CODE (en el servidor real esto vive en el servidor). */
export const ADMIN_SETUP_CODE: string = process.env.EXPO_PUBLIC_ADMIN_CODE ?? "house-admin-2026";
export const DEMO_PAYMENTS = true; // pago de demostración: no se cobra dinero real hasta conectar una pasarela
/** Horario por día de la semana [abre, cierra). SUPUESTO: jueves–domingo no tienen horas publicadas; ajústalas aquí. */
const OPEN: Record<number, [number, number]> = { 0: [9, 14], 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 20], 5: [9, 20], 6: [9, 20] };
export const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DOW_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export type Day = { iso: string; dow: number; day: number; month: number; disabled: boolean };
export function nextDays(n = 14): Day[] {
  const base = Date.now() - 6 * 3600 * 1000;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base + i * 864e5);
    return { iso: d.toISOString().slice(0, 10), dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), disabled: d.getUTCDay() === 0 && i === 0 }; // domingo: con un día de anticipación
  });
}
export const timeLabel = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`; };
export const dateLabel = (iso: string) => { const d = new Date(iso + "T12:00:00Z"); return `${DOW_FULL[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`; };
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Math.abs(h); };
/** Horas de un día. Las "ocupadas" son simuladas hasta tener servidor; también se bloquean las ya reservadas aquí. */
export function slotsFor(day: Day, stylistId: string, taken: { date: string; time: string; stylist: string }[]) {
  const [a, b] = OPEN[day.dow]; const now = new Date(Date.now() - 6 * 3600 * 1000);
  const isToday = day.iso === now.toISOString().slice(0, 10); const nowH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const out: { time: string; busy: boolean }[] = [];
  for (let m = a * 60; m < b * 60; m += 30) {
    if (isToday && m / 60 < nowH + 1) continue;
    const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const busy = hash(`${day.iso}${stylistId}${time}`) % 100 < 24 || taken.some((t) => t.date === day.iso && t.time === time && t.stylist === stylistId);
    out.push({ time, busy });
  }
  return out;
}

/** Todas las horas del día (cada 30 min) según el horario; el panel de administración marca cuáles están ocupadas por citas reales. */
export function allSlots(dow: number) { const [a, b] = OPEN[dow]; const o: string[] = []; for (let m = a * 60; m < b * 60; m += 30) o.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`); return o; }

export const STAFF = [{ id: "dayan", name: "Dayan", role: "stylist" as const }, { id: "lidia", name: "Lidia", role: "stylist" as const }, { id: "carla", name: "Carla", role: "reception" as const }];
