"""Reglas del negocio: catálogo, horarios y validaciones (espejo de las de la app)."""
import re, unicodedata
from datetime import date as Date, datetime, timedelta, timezone

TZ = timezone(timedelta(hours=-6))  # Nicaragua: UTC-6 todo el año
now_local = lambda: datetime.now(TZ)

SERVICES = {  # id: (nombre, precio en C$). Para "desde", el adelanto se calcula sobre el precio base.
    "corte": ("Corte de cabello", 740), "barba-capital": ("Barba capital", 735), "barba-clasica": ("Barba clásica", 623),
    "paquete": ("Paquete capital (corte y barba)", 1400), "pig-barba": ("Pigmentación de barba", 550), "pig-cabello": ("Pigmentación de cabello", 550),
    "celofanes": ("Corte + celofanes", 1300), "facial": ("Facial", 1400), "pedicura": ("Pedicura", 500), "manicura": ("Manicura", 430),
}
STYLISTS = {"dayan": "Dayan", "lidia": "Lidia"}
# [abre, cierra). SUPUESTO: jueves a domingo no tienen horas publicadas; ajústalas aquí.
OPEN = {0: (9, 14), 1: (9, 18), 2: (9, 18), 3: (9, 18), 4: (9, 20), 5: (9, 20), 6: (9, 20)}

dow_js = lambda d: (d.weekday() + 1) % 7  # domingo = 0, como en la app

def slot_times(d: Date) -> list[str]:
    a, b = OPEN[dow_js(d)]
    return [f"{m // 60:02d}:{m % 60:02d}" for m in range(a * 60, b * 60, 30)]

def bookable(d: Date, t: str) -> str | None:
    """None si se puede reservar; si no, el motivo."""
    if t not in slot_times(d): return "Esa hora no está dentro del horario de atención"
    n = now_local(); today = n.date()
    if d < today or d > today + timedelta(days=60): return "Esa fecha no está disponible"
    if dow_js(d) == 0 and d == today: return "Los domingos se agenda con un día de anticipación"
    if datetime.combine(d, datetime.strptime(t, "%H:%M").time(), TZ) < n + timedelta(hours=1): return "Esa hora ya pasó o está demasiado cerca"
    return None

# ---------- Validaciones ----------
_strip = lambda s: unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
BAD = {"puta", "puto", "mierda", "verga", "pene", "vagina", "culo", "cabron", "pendejo", "pendeja", "idiota", "imbecil", "estupido", "estupida",
       "maricon", "hijueputa", "hdp", "carajo", "chocho", "chingar", "joder", "zorra", "perra", "marica", "malparido", "gonorrea", "mamon", "pajero"}
NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$")
clean_name = lambda v: re.sub(r"\s+", " ", v.strip())

def check_name(raw: str, label: str) -> str | None:
    v = clean_name(raw)
    if not v: return f"Escribe tu {label}"
    if re.search(r"\d", v): return f"El {label} no puede llevar números"
    if not NAME_RE.match(v): return f"Usa solo letras en tu {label}"
    if len(v) < 2: return f"Tu {label} es muy corto"
    if len(v) > 30: return f"Tu {label} es muy largo"
    if re.search(r"(.)\1{2,}", v, re.I): return f"Revisa tu {label}: hay letras repetidas"
    if any(w in BAD for w in re.split(r"[ '\-]", _strip(v))): return f"Escribe un {label} válido"
    return None

def digits_of(v: str) -> str: return re.sub(r"^\+?505", "", re.sub(r"[\s\-()]", "", v))

def check_phone(raw: str) -> str | None:
    v = digits_of(raw)
    if not v: return "Escribe tu número de teléfono"
    if not v.isdigit(): return "El teléfono solo puede llevar números"
    if len(v) != 8: return "El número debe tener 8 dígitos"
    if v[0] not in "578": return "Usa un celular que empiece con 5, 7 u 8"
    if len(set(v)) == 1: return "Escribe un número válido"
    return None

WEAK = {"12345678", "123456789", "password1", "contrasena1", "qwerty123", "abc12345"}
def check_password(p: str, phone: str = "") -> str | None:
    if not p: return "Crea una contraseña"
    if re.search(r"\s", p): return "La contraseña no puede tener espacios"
    if len(p) < 8: return "Usa al menos 8 caracteres"
    if len(p) > 64: return "La contraseña es muy larga"
    if not re.search(r"[A-Za-z]", p) or not re.search(r"\d", p): return "Combina letras y números"
    if _strip(p) in WEAK or (phone and digits_of(phone) == p): return "Esa contraseña es muy fácil de adivinar"
    return None
