"""Crea o cambia cuentas del personal. Uso:
  python manage.py create-staff dayan --name Dayan --role stylist --stylist-id dayan
  python manage.py create-staff lidia --name Lidia --role stylist --stylist-id lidia
  python manage.py create-staff carla --name Carla --role reception
  python manage.py set-password carla
"""
import argparse, getpass, sys
from sqlalchemy import select
from app import rules
from app.db import SessionLocal, User, init_db
from app.security import hash_pw

def ask_password() -> str:
    while True:
        p = getpass.getpass("Contraseña: ")
        if err := rules.check_password(p): print(" ", err); continue
        if p != getpass.getpass("Repítela: "): print("  No coinciden"); continue
        return p

def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
    c = sp.add_parser("create-staff"); c.add_argument("handle"); c.add_argument("--name", required=True); c.add_argument("--role", choices=["stylist", "reception"], required=True); c.add_argument("--stylist-id")
    s = sp.add_parser("set-password"); s.add_argument("handle")
    a = ap.parse_args(); init_db()
    with SessionLocal() as db:
        if a.cmd == "create-staff":
            if a.role == "stylist" and a.stylist_id not in rules.STYLISTS: sys.exit("Para un estilista indica --stylist-id (dayan o lidia)")
            if db.scalar(select(User).where(User.handle == a.handle.lower())): sys.exit("Ese usuario ya existe")
            db.add(User(role=a.role, handle=a.handle.lower(), stylist_id=a.stylist_id, first=a.name, pw_hash=hash_pw(ask_password()))); print("Cuenta creada")
        else:
            u = db.scalar(select(User).where(User.handle == a.handle.lower()))
            if not u: sys.exit("No existe ese usuario")
            u.pw_hash = hash_pw(ask_password()); print("Contraseña actualizada")
        db.commit()
main() if __name__ == "__main__" else None
