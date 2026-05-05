from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.star import Star, RegistryStatus, StarType
from app.models.star_naming_request import StarNamingRequest, RequestStatus
from app.schemas.star import StarResponse, StarWithPosition, VisibleStarsResponse, ObserverInfo
from app.astronomy.calculator import ra_dec_to_alt_az, is_star_visible, ra_hours_to_degrees
from app.models.star import RAUnit

router = APIRouter(prefix="/stars", tags=["stars"])


@router.get("", response_model=List[StarResponse])
def list_stars(
    skip: int = 0,
    limit: int = 100,
    constellation: Optional[str] = None,
    star_type: Optional[StarType] = None,
    named: Optional[bool] = None,
    available: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Star)
    if constellation:
        q = q.filter(Star.constellation.ilike(f"%{constellation}%"))
    if star_type:
        q = q.filter(Star.star_type == star_type)
    if named is not None:
        q = q.filter(Star.is_named == named)
    if available is not None:
        q = q.filter(Star.is_available_for_naming == available)
    return q.offset(skip).limit(limit).all()


@router.get("/visible", response_model=VisibleStarsResponse)
def get_visible_stars(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    time: Optional[str] = None,
    max_magnitude: float = Query(6.5, ge=-5, le=10),
    constellation: Optional[str] = None,
    star_type: Optional[StarType] = None,
    named_only: bool = False,
    available_only: bool = False,
    db: Session = Depends(get_db),
):
    if time:
        try:
            dt = datetime.fromisoformat(time.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid time format. Use ISO 8601.")
    else:
        dt = datetime.now(timezone.utc)

    q = db.query(Star).filter(Star.magnitude <= max_magnitude)
    if constellation:
        q = q.filter(Star.constellation.ilike(f"%{constellation}%"))
    if star_type:
        q = q.filter(Star.star_type == star_type)
    if named_only:
        q = q.filter(Star.is_named == True)
    if available_only:
        q = q.filter(Star.is_available_for_naming == True)

    stars = q.all()
    result: List[StarWithPosition] = []

    for star in stars:
        ra_deg = float(star.ra)
        if star.ra_unit == RAUnit.HOURS:
            ra_deg = ra_hours_to_degrees(ra_deg)

        alt, az = ra_dec_to_alt_az(ra_deg, float(star.dec), lat, lon, dt)
        visible = is_star_visible(alt)

        star_data = StarWithPosition.model_validate(star)
        star_data.altitude = round(alt, 4)
        star_data.azimuth = round(az, 4)
        star_data.is_visible = visible

        # Attach naming info if approved
        if star.is_named:
            req = (
                db.query(StarNamingRequest)
                .filter(
                    StarNamingRequest.star_id == star.id,
                    StarNamingRequest.status == RequestStatus.APPROVED,
                )
                .first()
            )
            if req:
                star_data.dedication_type = req.dedication_type
                star_data.dedication_message = req.dedication_message
                star_data.recipient_name = req.recipient_name
                star_data.expiry_date = req.expiry_date

        result.append(star_data)

    return VisibleStarsResponse(
        observer=ObserverInfo(lat=lat, lon=lon, time=dt.isoformat()),
        stars=result,
        total=len(result),
    )


@router.get("/search", response_model=List[StarResponse])
def search_stars(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    results = (
        db.query(Star)
        .filter(
            or_(
                Star.common_name.ilike(f"%{q}%"),
                Star.custom_name.ilike(f"%{q}%"),
                Star.catalog_id.ilike(f"%{q}%"),
                Star.hip_id.ilike(f"%{q}%"),
                Star.constellation.ilike(f"%{q}%"),
                Star.scientific_name.ilike(f"%{q}%"),
            )
        )
        .limit(limit)
        .all()
    )
    return results


@router.get("/named", response_model=List[StarResponse])
def named_stars(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Star).filter(Star.is_named == True).offset(skip).limit(limit).all()


@router.get("/available", response_model=List[StarResponse])
def available_stars(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Star)
        .filter(Star.is_available_for_naming == True, Star.registry_status == RegistryStatus.AVAILABLE)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{star_id}", response_model=StarResponse)
def get_star(star_id: int, db: Session = Depends(get_db)):
    star = db.query(Star).filter(Star.id == star_id).first()
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    return star
