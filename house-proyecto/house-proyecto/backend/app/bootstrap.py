import logging, os
from sqlalchemy import select
from . import rules
from .db import SessionLocal, User
from .security import hash_pw

log = logging.getLogger("house.bootstrap")

def bootstrap_staff() -> int:
    """Crea cuentas del personal al arrancar, sin necesidad de consola. Variable STAFF_BOOTSTRAP:
       usuario|Nombre|rol|id_estilista|contraseña;usuario2|...   (rol: stylist o reception). Las que ya existen no se tocan."""
    spec, made = os.getenv("STAFF_BOOTSTRAP", ""), 0
    with SessionLocal() as db:
        for item in (s.strip() for s in spec.split(";") if s.strip()):
            handle, name, role, sid, pw = (item.split("|") + [""] * 5)[:5]; handle = handle.strip().lower()
            if not handle or db.scalar(select(User).where(User.handle == handle)): continue
            err = None if role in ("stylist", "reception") else "rol no válido"
            err = err or (None if role == "reception" or sid in rules.STYLISTS else "id de estilista no válido") or rules.check_password(pw)
            if err: log.warning("STAFF_BOOTSTRAP: se omitió %s (%s)", handle, err); continue
            db.add(User(role=role, handle=handle, stylist_id=sid or None, first=name.strip(), pw_hash=hash_pw(pw))); made += 1
        db.commit()
    return made
