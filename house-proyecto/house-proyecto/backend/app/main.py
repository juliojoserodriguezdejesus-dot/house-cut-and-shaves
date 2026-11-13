import re
from contextlib import asynccontextmanager
from datetime import date as Date, timedelta
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from . import config, rules
from .bootstrap import bootstrap_staff
from .db import Appointment, Device, User, init_db
from .notify import send_push
from .structures import BST
from .security import current_user, get_db, hash_pw, make_token, roles, throttle_check, throttle_fail, throttle_ok, verify_pw

@asynccontextmanager
async def lifespan(_):
    init_db(); bootstrap_staff(); yield

app = FastAPI(title="House Cuts & Shaves API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])

def fail(code: int, msg: str, field: str | None = None):
    raise HTTPException(code, {"field": field, "message": msg} if field else msg)

# ---------- Esquemas ----------
class RegisterIn(BaseModel): first: str; last: str; phone: str; password: str
class LoginIn(BaseModel): identifier: str; password: str
class PasswordIn(BaseModel): current: str; new: str
class ResetIn(BaseModel): new: str
class BookIn(BaseModel): service_id: str; stylist_id: str; date: str; time: str
class DeviceIn(BaseModel): token: str

def user_out(u: User): return {"id": u.id, "role": u.role, "handle": u.handle, "stylist_id": u.stylist_id, "first": u.first, "last": u.last, "phone": u.phone}
def appt_out(a: Appointment, client: User | None = None):
    name, price = rules.SERVICES[a.service_id]
    out = {"id": a.id, "service_id": a.service_id, "service_name": name, "stylist_id": a.stylist_id, "stylist_name": rules.STYLISTS.get(a.stylist_id, a.stylist_id),
           "date": a.date, "time": a.time, "total": a.total, "paid": a.paid, "status": a.status}
    if client: out["client"] = {"name": f"{client.first} {client.last}".strip(), "phone": client.phone}
    return out
def parse_date(s: str) -> Date:
    try: return Date.fromisoformat(s)
    except ValueError: fail(422, "Fecha no válida", "date")

# ---------- Cuenta ----------
@app.post("/auth/register", status_code=201)
def register(b: RegisterIn, db: Session = Depends(get_db)):
    for field, err in (("first", rules.check_name(b.first, "nombre")), ("last", rules.check_name(b.last, "apellido")), ("phone", rules.check_phone(b.phone)), ("password", rules.check_password(b.password, b.phone))):
        if err: fail(422, err, field)
    phone = rules.digits_of(b.phone)
    if db.scalar(select(User).where(User.phone == phone)): fail(409, "Ese teléfono ya tiene una cuenta. Inicia sesión", "phone")
    u = User(role="client", first=rules.clean_name(b.first), last=rules.clean_name(b.last), phone=phone, pw_hash=hash_pw(b.password))
    db.add(u); db.commit()
    return {"token": make_token(u), "user": user_out(u)}

@app.post("/auth/login")
def login(b: LoginIn, db: Session = Depends(get_db)):
    ident = b.identifier.strip().lower(); key = ident
    throttle_check(key)
    is_phone = bool(re.fullmatch(r"\+?\d[\d\s\-]*", ident))
    u = db.scalar(select(User).where(User.phone == rules.digits_of(ident))) if is_phone else db.scalar(select(User).where(User.handle == ident))
    if not u or not verify_pw(u.pw_hash, b.password):
        throttle_fail(key); fail(401, "Usuario o contraseña incorrectos")
    throttle_ok(key)
    return {"token": make_token(u), "user": user_out(u)}

@app.get("/me")
def me(u: User = Depends(current_user)): return user_out(u)

@app.post("/me/password")
def change_password(b: PasswordIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if not verify_pw(u.pw_hash, b.current): fail(403, "La contraseña actual no es correcta", "current")
    if err := rules.check_password(b.new, u.phone or ""): fail(422, err, "new")
    u.pw_hash = hash_pw(b.new); db.commit(); return {"ok": True}

@app.post("/staff/{handle}/password")
def reset_staff_password(handle: str, b: ResetIn, me_: User = Depends(roles("reception")), db: Session = Depends(get_db)):
    t = db.scalar(select(User).where(User.handle == handle.lower()))
    if not t or t.role != "stylist": fail(404, "Estilista no encontrado")
    if err := rules.check_password(b.new): fail(422, err, "new")
    t.pw_hash = hash_pw(b.new); db.commit(); return {"ok": True}

@app.post("/devices")
def register_device(b: DeviceIn, u: User = Depends(roles("stylist", "reception")), db: Session = Depends(get_db)):
    if not re.match(r"^Expo(nent)?PushToken\[.+\]$", b.token): fail(422, "Token de notificaciones no válido")
    d = db.scalar(select(Device).where(Device.token == b.token))
    if d: d.user_id = u.id
    else: db.add(Device(user_id=u.id, token=b.token))
    db.commit(); return {"ok": True}

# ---------- Disponibilidad y citas ----------
def mins(t: str) -> int: h, m = t.split(":"); return int(h) * 60 + int(m)

def occupied_tree(db: Session, stylist: str, date: str) -> BST:
    """BST de horas ocupadas de un estilista en un día: clave = minuto del día, valor = id de la cita."""
    t = BST()
    for aid, tm in db.execute(select(Appointment.id, Appointment.time).where(Appointment.stylist_id == stylist, Appointment.date == date, Appointment.status == "confirmed")):
        t.insert(mins(tm), aid)
    return t

def free_tree(d: Date, taken: BST) -> BST:
    """BST de horas LIBRES (reservables): clave = minuto del día, valor = 'HH:MM'."""
    f = BST()
    for t in rules.slot_times(d):
        if rules.bookable(d, t) is None and mins(t) not in taken: f.insert(mins(t), t)
    return f

@app.get("/availability")
def availability(stylist: str, date: str, db: Session = Depends(get_db)):
    if stylist not in rules.STYLISTS: fail(404, "Estilista no encontrado")
    d = parse_date(date); taken = occupied_tree(db, stylist, date)
    return [{"time": t, "busy": mins(t) in taken} for t in rules.slot_times(d) if rules.bookable(d, t) is None]  # sin datos de clientes

@app.get("/next-available")
def next_available(stylist: str, date: str, after: str = "00:00", db: Session = Depends(get_db)):
    """Primera hora libre desde `after`: ceiling() sobre el BST de horas libres."""
    if stylist not in rules.STYLISTS: fail(404, "Estilista no encontrado")
    d = parse_date(date); hit = free_tree(d, occupied_tree(db, stylist, date)).ceiling(mins(after))
    return {"stylist_id": stylist, "date": date, "time": hit[1] if hit else None}

@app.post("/appointments", status_code=201)
def book(b: BookIn, bg: BackgroundTasks, u: User = Depends(roles("client")), db: Session = Depends(get_db)):
    if b.service_id not in rules.SERVICES: fail(422, "Servicio no válido", "service_id")
    if b.stylist_id not in rules.STYLISTS: fail(422, "Estilista no válido", "stylist_id")
    d = parse_date(b.date)
    if err := rules.bookable(d, b.time): fail(422, err, "time")
    total = rules.SERVICES[b.service_id][1]
    if mins(b.time) in occupied_tree(db, b.stylist_id, b.date): fail(409, "Esa hora ya fue tomada. Elige otra")  # 1.ª defensa: el BST
    if db.scalar(select(Appointment.id).where(Appointment.client_id == u.id, Appointment.date == b.date, Appointment.time == b.time, Appointment.status == "confirmed")):
        fail(409, "Ya tienes una cita a esa hora")
    a = Appointment(client_id=u.id, stylist_id=b.stylist_id, service_id=b.service_id, date=b.date, time=b.time, total=total, paid=round(total / 2))
    db.add(a)
    try: db.commit()
    except IntegrityError:  # otra persona tomó la hora un instante antes
        db.rollback(); fail(409, "Esa hora ya fue tomada. Elige otra")
    # Aviso al estilista y a recepción
    targets = db.scalars(select(Device.token).join(User, User.id == Device.user_id).where((User.stylist_id == a.stylist_id) | (User.role == "reception"))).all()
    nm = rules.SERVICES[a.service_id][0]; hh = rules.slot_times(d)  # noqa
    bg.add_task(send_push, list(set(targets)), "Nueva cita programada", f"{u.first} {u.last} · {nm} · {a.date} {a.time}", {"appointment_id": a.id})
    return appt_out(a, u)

@app.get("/appointments/mine")
def mine(u: User = Depends(roles("client")), db: Session = Depends(get_db)):
    rows = db.scalars(select(Appointment).where(Appointment.client_id == u.id, Appointment.status == "confirmed").order_by(Appointment.date, Appointment.time)).all()
    return [appt_out(a) for a in rows]

@app.get("/staff/agenda")
def agenda(frm: str = Query(alias="from"), to: str = Query(...), stylist: str | None = None, u: User = Depends(roles("stylist", "reception")), db: Session = Depends(get_db)):
    parse_date(frm); parse_date(to)
    q = select(Appointment, User).join(User, User.id == Appointment.client_id).where(Appointment.date >= frm, Appointment.date <= to, Appointment.status == "confirmed")
    if u.role == "stylist": q = q.where(Appointment.stylist_id == u.stylist_id)  # cada estilista solo ve lo suyo, sin importar lo que pida
    elif stylist: q = q.where(Appointment.stylist_id == stylist)
    return [appt_out(a, c) for a, c in db.execute(q.order_by(Appointment.date, Appointment.time)).all()]

@app.post("/appointments/{aid}/cancel")
def cancel(aid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    a = db.get(Appointment, aid)
    allowed = a and ((u.role == "client" and a.client_id == u.id) or u.role == "reception" or (u.role == "stylist" and a.stylist_id == u.stylist_id))
    if not allowed: fail(404, "Cita no encontrada")
    a.status = "cancelled"; db.commit(); return {"ok": True}

@app.get("/health")
def health(): return {"ok": True}
