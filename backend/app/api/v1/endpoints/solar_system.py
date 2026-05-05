from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.solar_system_object import SolarSystemObject
from app.schemas.solar_system import SolarSystemObjectResponse

router = APIRouter(prefix="/solar-system", tags=["solar-system"])


@router.get("/objects", response_model=List[SolarSystemObjectResponse])
def list_solar_system_objects(db: Session = Depends(get_db)):
    return db.query(SolarSystemObject).order_by(SolarSystemObject.object_type, SolarSystemObject.common_name).all()
