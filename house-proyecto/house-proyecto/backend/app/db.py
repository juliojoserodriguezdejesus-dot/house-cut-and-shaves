from datetime import datetime, timezone
from sqlalchemy import ForeignKey, Index, String, create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from . import config

_sqlite = config.DATABASE_URL.startswith("sqlite")
engine = create_engine(config.DATABASE_URL, pool_pre_ping=True, **({"connect_args": {"check_same_thread": False}} if _sqlite else {}))
if _sqlite:
    @event.listens_for(engine, "connect")
    def _pragmas(conn, _):  # WAL = lecturas y escrituras a la vez; foreign_keys activas
        cur = conn.cursor(); cur.execute("PRAGMA journal_mode=WAL"); cur.execute("PRAGMA foreign_keys=ON"); cur.close()
SessionLocal = sessionmaker(engine, expire_on_commit=False)
utcnow = lambda: datetime.now(timezone.utc)

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    role: Mapped[str] = mapped_column(String(12))                       # client | stylist | reception
    handle: Mapped[str | None] = mapped_column(String(30), unique=True)  # usuario del personal (dayan, lidia, carla)
    stylist_id: Mapped[str | None] = mapped_column(String(30))
    first: Mapped[str] = mapped_column(String(40)); last: Mapped[str] = mapped_column(String(40), default="")
    phone: Mapped[str | None] = mapped_column(String(12), unique=True)
    pw_hash: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    stylist_id: Mapped[str] = mapped_column(String(30)); service_id: Mapped[str] = mapped_column(String(30))
    date: Mapped[str] = mapped_column(String(10)); time: Mapped[str] = mapped_column(String(5))
    total: Mapped[int]; paid: Mapped[int]
    status: Mapped[str] = mapped_column(String(12), default="confirmed")  # confirmed | cancelled | completed
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    # Una sola cita confirmada por estilista, día y hora: lo garantiza la base de datos, no solo el código.
    __table_args__ = (Index("uq_slot", "stylist_id", "date", "time", unique=True, sqlite_where=text("status = 'confirmed'"), postgresql_where=text("status = 'confirmed'")),)

class Device(Base):
    __tablename__ = "devices"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str] = mapped_column(String(200), unique=True)

def init_db(): Base.metadata.create_all(engine)
