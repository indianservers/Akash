import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, DECIMAL, Enum as SAEnum, String

from app.core.database import Base

_ev = lambda x: [e.value for e in x]  # noqa: E731


class SolarSystemObjectType(str, enum.Enum):
    PLANET = "Planet"
    DWARF_PLANET = "Dwarf Planet"
    MOON = "Moon"


class SolarSystemObject(Base):
    __tablename__ = "solar_system_objects"

    id = Column(String(40), primary_key=True)
    common_name = Column(String(100), nullable=False)
    object_type = Column(SAEnum(SolarSystemObjectType, values_callable=_ev), nullable=False)
    astronomy_body = Column(String(40), nullable=False)
    mean_radius_km = Column(DECIMAL(12, 3), nullable=True)
    orbital_period_days = Column(DECIMAL(12, 4), nullable=True)
    average_magnitude = Column(DECIMAL(6, 3), nullable=True)
    naked_eye_visible = Column(Boolean, default=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
