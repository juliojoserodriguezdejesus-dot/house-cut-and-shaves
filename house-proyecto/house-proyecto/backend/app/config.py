import logging, os, secrets

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./house.db")
if DATABASE_URL.startswith("postgres://"):  # algunos hosts usan este prefijo antiguo
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(32)
    logging.warning("JWT_SECRET no definido: se generó uno temporal (las sesiones se pierden al reiniciar). Defínelo en producción.")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
