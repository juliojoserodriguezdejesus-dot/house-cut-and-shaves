import time
from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from . import config
from .db import SessionLocal, User

_ph = PasswordHasher()
hash_pw = _ph.hash
def verify_pw(h: str, p: str) -> bool:
    try: return _ph.verify(h, p)
    except (VerifyMismatchError, InvalidHashError): return False

def make_token(u: User, days: int = 30) -> str:
    return jwt.encode({"sub": str(u.id), "role": u.role, "exp": datetime.now(timezone.utc) + timedelta(days=days if u.role == "client" else 1)}, config.JWT_SECRET, algorithm="HS256")

def get_db():
    with SessionLocal() as db: yield db

def current_user(authorization: str | None = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(401, "Inicia sesión para continuar")
    try: data = jwt.decode(authorization[7:], config.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError: raise HTTPException(401, "Tu sesión expiró. Inicia sesión de nuevo")
    u = db.get(User, int(data["sub"]))
    if not u: raise HTTPException(401, "Sesión no válida")
    return u

def roles(*allowed):
    def dep(u: User = Depends(current_user)) -> User:
        if u.role not in allowed: raise HTTPException(403, "No tienes permiso para esto")
        return u
    return dep

# Freno a fuerza bruta: 5 fallos => 5 minutos de espera (en memoria; con varios procesos usa Redis).
_fails: dict[str, tuple[int, float]] = {}
def throttle_check(key: str):
    n, until = _fails.get(key, (0, 0))
    if n >= 5 and time.time() < until: raise HTTPException(429, "Demasiados intentos. Espera unos minutos")
def throttle_fail(key: str):
    n, _ = _fails.get(key, (0, 0)); _fails[key] = (n + 1, time.time() + 300)
def throttle_ok(key: str): _fails.pop(key, None)
