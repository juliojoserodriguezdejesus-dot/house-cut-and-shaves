const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const BAD = ["puta", "puto", "mierda", "verga", "pene", "vagina", "culo", "cabron", "pendejo", "pendeja", "idiota", "imbecil", "estupido", "estupida",
  "maricon", "hijueputa", "hdp", "carajo", "chocho", "chingar", "joder", "zorra", "perra", "marica", "malparido", "gonorrea", "mamon", "pajero"];
const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

export const cleanName = (v: string) => v.trim().replace(/\s+/g, " ");
/** Nombre o apellido: solo letras (con tildes/ñ) y espacios entre palabras. Sin números, símbolos, vacíos ni groserías. */
export function validateName(raw: string, label: string): string | null {
  const v = cleanName(raw);
  if (!v) return `Escribe tu ${label}`;
  if (/\d/.test(v)) return `El ${label} no puede llevar números`;
  if (!NAME_RE.test(v)) return `Usa solo letras en tu ${label}`;
  if (v.length < 2) return `Tu ${label} es muy corto`;
  if (v.length > 30) return `Tu ${label} es muy largo`;
  if (/(.)\1{2,}/i.test(v)) return `Revisa tu ${label}: hay letras repetidas`;
  if (strip(v).split(/[ '\-]/).some((w) => BAD.includes(w))) return `Escribe un ${label} válido`;
  return null;
}
export const digitsOf = (v: string) => v.replace(/[\s\-()]/g, "").replace(/^\+?505/, "");
/** Teléfono celular de Nicaragua: 8 dígitos que empiezan con 5, 7 u 8. */
export function validatePhone(raw: string): string | null {
  const v = digitsOf(raw);
  if (!v) return "Escribe tu número de teléfono";
  if (!/^\d+$/.test(v)) return "El teléfono solo puede llevar números";
  if (v.length !== 8) return "El número debe tener 8 dígitos";
  if (!/^[578]/.test(v)) return "Usa un celular que empiece con 5, 7 u 8";
  if (/^(\d)\1{7}$/.test(v)) return "Escribe un número válido";
  return null;
}
const WEAK = ["12345678", "123456789", "password1", "contrasena1", "qwerty123", "abc12345", "11111111a"];
export function passwordStrength(p: string) {
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(4, s);
}
export function validatePassword(p: string, phone: string): string | null {
  if (!p) return "Crea una contraseña";
  if (/\s/.test(p)) return "La contraseña no puede tener espacios";
  if (p.length < 8) return "Usa al menos 8 caracteres";
  if (p.length > 64) return "La contraseña es muy larga";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Combina letras y números";
  if (WEAK.includes(strip(p)) || digitsOf(phone) === p) return "Esa contraseña es muy fácil de adivinar";
  return null;
}
export const validateConfirm = (p: string, c: string) => (!c ? "Repite tu contraseña" : p !== c ? "Las contraseñas no coinciden" : null);

export function luhn(num: string) { let s = 0, d = false; for (let i = num.length - 1; i >= 0; i--) { let n = +num[i]; if (d) { n *= 2; if (n > 9) n -= 9; } s += n; d = !d; } return s % 10 === 0; }
export function validateCard(n: string) { const v = n.replace(/\s/g, ""); return !/^\d{13,19}$/.test(v) ? "Escribe el número de tu tarjeta" : !luhn(v) ? "El número de tarjeta no es válido" : null; }
export function validateExpiry(e: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(e); if (!m) return "Usa el formato MM/AA";
  const mm = +m[1], yy = 2000 + +m[2], now = new Date();
  if (mm < 1 || mm > 12) return "Mes no válido";
  return yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1) ? "La tarjeta está vencida" : null;
}
export const validateCvv = (c: string) => (/^\d{3,4}$/.test(c) ? null : "CVV de 3 o 4 dígitos");
