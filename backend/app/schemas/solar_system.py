from typing import Optional

from pydantic import BaseModel

from app.models.solar_system_object import SolarSystemObjectType


class SolarSystemObjectResponse(BaseModel):
    id: str
    common_name: str
    object_type: SolarSystemObjectType
    astronomy_body: str
    mean_radius_km: Optional[float] = None
    orbital_period_days: Optional[float] = None
    average_magnitude: Optional[float] = None
    naked_eye_visible: bool
    notes: Optional[str] = None

    model_config = {"from_attributes": True}
