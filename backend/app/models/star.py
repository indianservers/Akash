import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum as SAEnum,
    BigInteger, DECIMAL,
)
from app.core.database import Base

_ev = lambda x: [e.value for e in x]  # noqa: E731


class RAUnit(str, enum.Enum):
    DEGREES = "degrees"
    HOURS = "hours"


class StarType(str, enum.Enum):
    MAIN_SEQUENCE = "Main Sequence Star"
    RED_GIANT = "Red Giant"
    BLUE_GIANT = "Blue Giant"
    WHITE_DWARF = "White Dwarf"
    RED_DWARF = "Red Dwarf"
    YELLOW_DWARF = "Yellow Dwarf"
    SUPERGIANT = "Supergiant"
    HYPERGIANT = "Hypergiant"
    NEUTRON_STAR = "Neutron Star"
    BINARY_STAR = "Binary Star"
    VARIABLE_STAR = "Variable Star"
    CEPHEID_VARIABLE = "Cepheid Variable"
    PULSATING_VARIABLE = "Pulsating Variable"
    BROWN_DWARF = "Brown Dwarf"
    PROTOSTAR = "Protostar"
    WOLF_RAYET = "Wolf-Rayet Star"
    CARBON_STAR = "Carbon Star"
    T_TAURI = "T Tauri Star"
    SUBGIANT = "Subgiant"
    UNKNOWN = "Unknown / Unclassified"


class RegistryStatus(str, enum.Enum):
    AVAILABLE = "Available"
    PENDING = "Pending"
    APPROVED = "Approved"
    EXPIRED = "Expired"
    REJECTED = "Rejected"


class Star(Base):
    __tablename__ = "stars"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    catalog_id = Column(String(100), nullable=True, index=True)
    hip_id = Column(String(50), nullable=True, index=True)
    hd_id = Column(String(50), nullable=True)
    gaia_id = Column(String(100), nullable=True)
    bayer_designation = Column(String(100), nullable=True)
    flamsteed_designation = Column(String(100), nullable=True)
    common_name = Column(String(255), nullable=True)
    scientific_name = Column(String(255), nullable=True)
    custom_name = Column(String(255), nullable=True)

    ra = Column(DECIMAL(10, 6), nullable=False)
    ra_unit = Column(SAEnum(RAUnit, values_callable=_ev), default=RAUnit.DEGREES)
    dec = Column(DECIMAL(10, 6), nullable=False)
    magnitude = Column(DECIMAL(6, 3), nullable=True, index=True)
    absolute_magnitude = Column(DECIMAL(6, 3), nullable=True)
    constellation = Column(String(100), nullable=True, index=True)
    constellation_abbr = Column(String(10), nullable=True)
    spectral_class = Column(String(50), nullable=True)
    star_type = Column(SAEnum(StarType, values_callable=_ev), default=StarType.UNKNOWN)
    color_index_bv = Column(DECIMAL(6, 3), nullable=True)
    distance_light_years = Column(DECIMAL(15, 4), nullable=True)
    parallax = Column(DECIMAL(10, 6), nullable=True)
    radial_velocity = Column(DECIMAL(10, 3), nullable=True)
    proper_motion_ra = Column(DECIMAL(10, 4), nullable=True)
    proper_motion_dec = Column(DECIMAL(10, 4), nullable=True)
    temperature_kelvin = Column(DECIMAL(10, 2), nullable=True)
    luminosity = Column(DECIMAL(15, 6), nullable=True)
    mass_solar = Column(DECIMAL(10, 4), nullable=True)
    radius_solar = Column(DECIMAL(10, 4), nullable=True)
    age_million_years = Column(DECIMAL(15, 2), nullable=True)

    is_visible_naked_eye = Column(Boolean, default=True)
    is_named = Column(Boolean, default=False, index=True)
    is_available_for_naming = Column(Boolean, default=True, index=True)
    is_reserved = Column(Boolean, default=False)
    registry_status = Column(
        SAEnum(RegistryStatus, values_callable=_ev), default=RegistryStatus.AVAILABLE, index=True
    )

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
