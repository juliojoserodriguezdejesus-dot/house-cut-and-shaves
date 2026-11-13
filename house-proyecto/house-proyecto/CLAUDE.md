# House Cuts & Shaves — sistema de citas

Barbería en Managua, Nicaragua. Los clientes crean cuenta y agendan (servicio → estilista → día/hora → adelanto del 50 %); los estilistas y recepción
ven su agenda. Es un proyecto de clase: **el profe exige usar un árbol binario de búsqueda (BST) en Python** (se eligió el BST, no el grafo).
Idioma de la interfaz y de los comentarios: **español**. El dueño del proyecto no es técnico: explica los cambios de forma sencilla y no asumas que sabe usar la terminal.

## Estructura
- `backend/` — API en Python (FastAPI + SQLAlchemy). Reglas del negocio en `app/rules.py`, **BST en `app/structures.py`**, uso del BST en `app/main.py`
  (`occupied_tree`, `free_tree`, `/availability`, `/next-available`). Cuentas con roles: client, stylist (dayan, lidia), reception (carla).
- `app/` — app Expo / React Native (TypeScript) con expo-router. Funciona en celular y en web. Pantallas en `src/screens`, componentes en `src/components`.
- `docs/` — guías en PDF (explicar el proyecto al profe y publicarlo).

## Comandos
- Servidor: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` (documentación interactiva en /docs).
- Pruebas del servidor: `cd backend && pytest` (deben pasar las 13).
- Demo del BST para la exposición: `python backend/demo.py`.
- App: `cd app && npm install && npx expo start`. Chequeo de tipos: `npx tsc --noEmit`. Web: `npx expo export --platform web`.
- Crear personal sin consola: variable `STAFF_BOOTSTRAP` con el formato `usuario|Nombre|rol|id_estilista|clave;otro|...`
  (rol: `stylist` o `reception`). También: `python manage.py create-staff ...`.

## Datos y modos
- **Base de datos:** variable `DATABASE_URL`. Por defecto SQLite (`backend/house.db`, solo desarrollo). En producción, PostgreSQL.
  Tablas: `users`, `appointments` (índice único por estilista+día+hora mientras `status='confirmed'`), `devices` (tokens de notificaciones).
  Contraseñas con Argon2. No se guardan datos de tarjeta.
- El árbol BST **no se guarda**: se reconstruye en memoria con las citas de la base en cada consulta.
- La app tiene **dos modos**: con `EXPO_PUBLIC_API_URL` (o `window.HOUSE_API_URL` en la web, vía `config.js`) usa el servidor;
  sin ella funciona en modo demostración local (AsyncStorage). Ver `app/src/api.ts` y `app/src/store.tsx`.
- `app/preview/entry.tsx` es una entrada SOLO para la vista previa web sin enrutador. La app real usa `expo-router/entry`.

## Reglas importantes
- No quitar ni cambiar el comportamiento del BST sin actualizar `backend/tests/test_structures.py`, `backend/demo.py` y `docs/Guia_Explicar_Proyecto.pdf`.
- Las validaciones existen en TypeScript (`app/src/validate.ts`) **y** en Python (`backend/app/rules.py`): mantenerlas iguales
  (nombre solo letras, teléfono de Nicaragua de 8 dígitos que empieza con 5/7/8, contraseña de 8+ caracteres con letras y números).
- Marca: dorado #EBAC56, verde #1C3534, fondo #0A0D0F; fuentes Bodoni Moda y Jost. Animaciones con Reanimated; los sonidos están en `app/assets/sounds`
  y se generan con `app/tools/make_sounds.py`.
- Al terminar cualquier cambio: correr `pytest` y `npx tsc --noEmit`.

## Supuestos pendientes de confirmar con el dueño
- Horarios: lunes a miércoles 9–18 es real; jueves–sábado (9–20) y domingo (9–14) son SUPUESTOS (`backend/app/rules.py` y `app/src/data.ts`).
- Cada cita ocupa un turno de 30 min (no se conocen las duraciones reales por servicio).
- El pago del adelanto es **de demostración** (`DEMO_PAYMENTS` en `app/src/data.ts`): falta integrar una pasarela autorizada en Nicaragua
  (procesa en córdobas) con confirmación por webhook. Nunca guardar números de tarjeta en el servidor.
- Notificaciones push (Expo): solo en la app instalada; requieren proyecto EAS y credenciales de Android (FCM) e iOS (APNs).
- Falta: términos y privacidad, dominio propio, cancelación/reagendado por el cliente, aviso por WhatsApp y un árbol balanceado (AVL) como mejora.
