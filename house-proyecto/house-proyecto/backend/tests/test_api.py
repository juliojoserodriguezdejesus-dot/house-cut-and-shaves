import os, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/t.db"
os.environ["JWT_SECRET"] = "test-secret"
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from app import main, rules
from app.db import SessionLocal, User, init_db
from app.security import hash_pw

sent = []
main.send_push = lambda tokens, title, body, data=None: sent.append((tokens, title, body))
init_db()
with SessionLocal() as db:
    db.add_all([User(role="stylist", handle="dayan", stylist_id="dayan", first="Dayan", pw_hash=hash_pw("Dayan2026x")),
                User(role="stylist", handle="lidia", stylist_id="lidia", first="Lidia", pw_hash=hash_pw("Lidia2026x")),
                User(role="reception", handle="carla", first="Carla", pw_hash=hash_pw("Carla2026x"))]); db.commit()
c = TestClient(main.app)

def future_slot(dow_js=2, plus=3):
    d = rules.now_local().date() + timedelta(days=plus)
    while rules.dow_js(d) != dow_js: d += timedelta(days=1)
    return d.isoformat()
H = lambda t: {"Authorization": f"Bearer {t}"}
def login(i, p): r = c.post("/auth/login", json={"identifier": i, "password": p}); assert r.status_code == 200, r.text; return r.json()["token"]
def new_client(phone, name="Ana"):
    r = c.post("/auth/register", json={"first": name, "last": "Pérez", "phone": phone, "password": "Segura2026"}); assert r.status_code == 201, r.text; return r.json()["token"]

def test_register_validation():
    bad = [({"first": "Ana1", "last": "P", "phone": "88123456", "password": "Segura2026"}, "first"), ({"first": "   ", "last": "Pérez", "phone": "88123456", "password": "Segura2026"}, "first"),
           ({"first": "Ana", "last": "Pérez", "phone": "12345678", "password": "Segura2026"}, "phone"), ({"first": "Ana", "last": "Pérez", "phone": "88123456", "password": "corta1"}, "password"),
           ({"first": "Ana", "last": "Pérez", "phone": "88123456", "password": "solo letras largas"}, "password"), ({"first": "puta", "last": "Pérez", "phone": "88123456", "password": "Segura2026"}, "first")]
    for body, field in bad:
        r = c.post("/auth/register", json=body); assert r.status_code == 422 and r.json()["detail"]["field"] == field, (body, r.text)

def test_duplicate_phone_and_login():
    new_client("8811 0001"); r = c.post("/auth/register", json={"first": "Eva", "last": "Ruiz", "phone": "+505 88110001", "password": "Segura2026"}); assert r.status_code == 409
    assert login("88110001", "Segura2026")
    assert c.post("/auth/login", json={"identifier": "88110001", "password": "mala"}).status_code == 401

def test_booking_conflict_notification_and_visibility():
    t1, t2 = new_client("88220001", "Ana"), new_client("88220002", "Beto"); day = future_slot()
    with SessionLocal() as db:
        from app.db import Device; db.add(Device(user_id=db.query(User).filter_by(handle="dayan").one().id, token="ExponentPushToken[abc]")); db.commit()
    r = c.post("/appointments", json={"service_id": "corte", "stylist_id": "dayan", "date": day, "time": "10:00"}, headers=H(t1)); assert r.status_code == 201 and r.json()["paid"] == 370
    assert sent and sent[-1][0] == ["ExponentPushToken[abc]"] and "Ana" in sent[-1][2]
    r = c.post("/appointments", json={"service_id": "facial", "stylist_id": "dayan", "date": day, "time": "10:00"}, headers=H(t2)); assert r.status_code == 409  # misma hora, mismo estilista
    assert c.post("/appointments", json={"service_id": "facial", "stylist_id": "lidia", "date": day, "time": "10:00"}, headers=H(t2)).status_code == 201  # otro estilista sí
    av = {s["time"]: s["busy"] for s in c.get("/availability", params={"stylist": "dayan", "date": day}).json()}; assert av["10:00"] is True and av["10:30"] is False
    assert "client" not in str(c.get("/availability", params={"stylist": "dayan", "date": day}).json())
    p = {"from": day, "to": day}
    d_ag = c.get("/staff/agenda", params=p, headers=H(login("dayan", "Dayan2026x"))).json(); assert [a["stylist_id"] for a in d_ag] == ["dayan"] and d_ag[0]["client"]["name"] == "Ana Pérez"
    d_try = c.get("/staff/agenda", params={**p, "stylist": "lidia"}, headers=H(login("dayan", "Dayan2026x"))).json(); assert all(a["stylist_id"] == "dayan" for a in d_try)  # no ve lo de Lidia
    assert {a["stylist_id"] for a in c.get("/staff/agenda", params=p, headers=H(login("carla", "Carla2026x"))).json()} == {"dayan", "lidia"}  # recepción ve ambos
    assert c.get("/staff/agenda", params=p, headers=H(t1)).status_code == 403  # un cliente no entra

def test_passwords():
    tk = login("lidia", "Lidia2026x")
    assert c.post("/me/password", json={"current": "x", "new": "Nueva2026ok"}, headers=H(tk)).status_code == 403
    assert c.post("/me/password", json={"current": "Lidia2026x", "new": "123"}, headers=H(tk)).status_code == 422
    assert c.post("/me/password", json={"current": "Lidia2026x", "new": "Nueva2026ok"}, headers=H(tk)).status_code == 200; login("lidia", "Nueva2026ok")
    carla = login("carla", "Carla2026x")
    assert c.post("/staff/dayan/password", json={"new": "Reset2026ok"}, headers=H(tk)).status_code == 403  # un estilista no restablece
    assert c.post("/staff/dayan/password", json={"new": "Reset2026ok"}, headers=H(carla)).status_code == 200; login("dayan", "Reset2026ok")

def test_cancel_frees_slot_and_rules():
    t = new_client("88330001"); day = future_slot(3, 4)
    r = c.post("/appointments", json={"service_id": "barba-clasica", "stylist_id": "dayan", "date": day, "time": "09:00"}, headers=H(t)); aid = r.json()["id"]
    assert c.post(f"/appointments/{aid}/cancel", headers=H(t)).status_code == 200
    assert c.post("/appointments", json={"service_id": "corte", "stylist_id": "dayan", "date": day, "time": "09:00"}, headers=H(new_client("88330002"))).status_code == 201
    assert c.post("/appointments", json={"service_id": "corte", "stylist_id": "dayan", "date": day, "time": "03:00"}, headers=H(t)).status_code == 422  # fuera de horario
    assert c.post("/appointments", json={"service_id": "corte", "stylist_id": "dayan", "date": "2020-01-07", "time": "10:00"}, headers=H(t)).status_code == 422  # pasado
    assert c.post("/appointments", json={"service_id": "corte", "stylist_id": "dayan", "date": day, "time": "10:00"}).status_code == 401


def test_bootstrap_staff(monkeypatch):
    from app.bootstrap import bootstrap_staff
    monkeypatch.setenv("STAFF_BOOTSTRAP", "marta|Marta|reception||Marta2026ok; malo|Malo|stylist|zzz|Malo2026ok; flojo|Flojo|reception||123")
    assert bootstrap_staff() == 1 and bootstrap_staff() == 0   # una válida; no se duplica
    assert login("marta", "Marta2026ok")
    assert c.post("/auth/login", json={"identifier": "malo", "password": "Malo2026ok"}).status_code == 401


def test_bst_en_la_api():
    day = future_slot(2, 7); t1 = new_client("88440001")
    c.post("/appointments", json={"service_id": "corte", "stylist_id": "dayan", "date": day, "time": "09:00"}, headers=H(t1))
    av = {s["time"]: s["busy"] for s in c.get("/availability", params={"stylist": "dayan", "date": day}).json()}; assert av["09:00"] is True and av["09:30"] is False
    assert c.get("/next-available", params={"stylist": "dayan", "date": day, "after": "09:00"}).json()["time"] == "09:30"   # ceiling del BST
    assert c.get("/next-available", params={"stylist": "lidia", "date": day, "after": "09:00"}).json()["time"] == "09:00"
