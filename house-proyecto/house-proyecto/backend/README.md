# House Cuts & Shaves — API

FastAPI + SQLAlchemy. Cuentas con roles (cliente, estilista, recepción), citas compartidas, horas ocupadas, contraseñas con Argon2,
límite de intentos de acceso y notificaciones push (Expo) al estilista y a recepción cuando entra una cita nueva.

## Probar en tu computadora
    pip install -r requirements.txt
    python manage.py create-staff dayan --name Dayan --role stylist --stylist-id dayan
    python manage.py create-staff lidia --name Lidia --role stylist --stylist-id lidia
    python manage.py create-staff carla --name Carla --role reception
    uvicorn app.main:app --reload          # documentación interactiva en http://localhost:8000/docs
    pytest                                 # pruebas automáticas

## Producción
Define JWT_SECRET, DATABASE_URL (PostgreSQL) y CORS_ORIGINS (ver .env.example), despliega con el Dockerfile y crea el personal con
`python manage.py ...` en el servidor. Ajusta horarios y precios en `app/rules.py` (hoy jueves a domingo son SUPUESTOS).
Los pagos son de demostración: falta conectar una pasarela real (ver guía).
