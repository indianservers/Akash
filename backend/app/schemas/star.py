from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.star import StarType, RegistryStatus, RAUnit


class StarBase(BaseModel):
    catalog_id: Optional[str] = None
    hip_id: Optional[str] = None
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    ra: float
    dec: float
    ra_unit: RAUnit = RAUnit.DEGREES
    magnitude: Optional[float] = None
    constellation: Optional[str] = None
    spectral_class: Optional[str] = None
    star_type: StarType = StarType.UNKNOWN
    distance_light_years: Optional[float] = None


class StarResponse(BaseModel):
    id: int
    catalog_id: Optional[str]
    hip_id: Optional[str]
    hd_id: Optional[str]
    gaia_id: Optional[str]
    bayer_designation: Optional[str]
    flamsteed_designation: Optional[str]
    common_name: Optional[str]
    scientific_name: Optional[str]
    custom_name: Optional[str]
    ra: float
    dec: float
    ra_unit: RAUnit
    magnitude: Optional[float]
    absolute_magnitude: Optional[float]
    constellation: Optional[str]
    constellation_abbr: Optional[str]
    spectral_class: Optional[str]
    star_type: StarType
    color_index_bv: Optional[float]
    distance_light_years: Optional[float]
    temperature_kelvin: Optional[float]
    luminosity: Optional[float]
    mass_solar: Optional[float]
    radius_solar: Optional[float]
    is_visible_naked_eye: bool
    is_named: bool
    is_available_for_naming: bool
    registry_status: RegistryStatus

    model_config = {"from_attributes": True}


class StarWithPosition(StarResponse):
    altitude: Optional[float] = None
    azimuth: Optional[float] = None
    is_visible: bool = False
    dedication_type: Optional[str] = None
    dedication_message: Optional[str] = None
    recipient_name: Optional[str] = None
    expiry_date: Optional[datetime] = None


class ObserverInfo(BaseModel):
    lat: float
    lon: float
    time: str


class VisibleStarsResponse(BaseModel):
    observer: ObserverInfo
    stars: List[StarWithPosition]
    total: int


class StarAdminUpdate(BaseModel):
    common_name: Optional[str] = None
    is_available_for_naming: Optional[bool] = None
    is_reserved: Optional[bool] = None
    registry_status: Optional[RegistryStatus] = None
    star_type: Optional[StarType] = None
