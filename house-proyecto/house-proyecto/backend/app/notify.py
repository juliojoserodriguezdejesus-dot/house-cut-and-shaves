import logging
import httpx
from . import config

log = logging.getLogger("house.notify")

def send_push(tokens: list[str], title: str, body: str, data: dict | None = None) -> None:
    """Notificación push vía Expo (llega al celular del estilista y de recepción)."""
    if not tokens: return
    try:
        msgs = [{"to": t, "title": title, "body": body, "data": data or {}, "sound": "default", "channelId": "citas"} for t in tokens]
        r = httpx.post(config.EXPO_PUSH_URL, json=msgs, timeout=10); r.raise_for_status()
    except Exception as e:  # nunca debe romper la reserva
        log.warning("No se pudo enviar la notificación: %s", e)
