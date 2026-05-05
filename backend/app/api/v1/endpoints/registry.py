from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.star import Star
from app.models.star_naming_request import StarNamingRequest, RequestStatus, VisibilityPreference
from app.schemas.star import StarResponse
from app.schemas.naming_request import NamingRequestResponse

router = APIRouter(prefix="/registry", tags=["registry"])


@router.get("/search")
def search_registry(
    q: Optional[str] = None,
    constellation: Optional[str] = None,
    dedication_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(StarNamingRequest).filter(
        StarNamingRequest.status == RequestStatus.APPROVED,
        StarNamingRequest.visibility_preference != VisibilityPreference.PRIVATE,
    )

    if q:
        query = query.filter(
            or_(
                StarNamingRequest.requested_name.ilike(f"%{q}%"),
                StarNamingRequest.certificate_id.ilike(f"%{q}%"),
                StarNamingRequest.recipient_name.ilike(f"%{q}%"),
                StarNamingRequest.share_slug.ilike(f"%{q}%"),
            )
        )

    if dedication_type:
        query = query.filter(StarNamingRequest.dedication_type == dedication_type)

    results = query.offset(skip).limit(limit).all()

    out = []
    for req in results:
        star = db.query(Star).filter(Star.id == req.star_id).first()
        out.append({
            "certificate_id": req.certificate_id,
            "share_slug": req.share_slug,
            "star_name": req.requested_name,
            "common_name": star.common_name if star else None,
            "constellation": star.constellation if star else None,
            "star_type": star.star_type if star else None,
            "magnitude": float(star.magnitude) if star and star.magnitude else None,
            "dedication_type": req.dedication_type,
            "recipient_name": req.recipient_name,
            "approved_at": req.approved_at.isoformat() if req.approved_at else None,
            "expiry_date": req.expiry_date.isoformat() if req.expiry_date else None,
            "status": req.status,
            "share_url": f"/star/{req.share_slug}",
        })

    return {"results": out, "total": len(out)}


@router.get("/{share_slug}")
def get_public_star_page(share_slug: str, db: Session = Depends(get_db)):
    req = db.query(StarNamingRequest).filter(
        StarNamingRequest.share_slug == share_slug,
        StarNamingRequest.status == RequestStatus.APPROVED,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Star not found in public registry")
    if req.visibility_preference == VisibilityPreference.PRIVATE:
        raise HTTPException(status_code=403, detail="This star page is private")

    star = db.query(Star).filter(Star.id == req.star_id).first()

    return {
        "star": {
            "id": star.id,
            "catalog_id": star.catalog_id,
            "common_name": star.common_name,
            "scientific_name": star.scientific_name,
            "constellation": star.constellation,
            "star_type": star.star_type,
            "spectral_class": star.spectral_class,
            "magnitude": float(star.magnitude) if star.magnitude else None,
            "distance_light_years": float(star.distance_light_years) if star.distance_light_years else None,
            "ra": float(star.ra),
            "dec": float(star.dec),
        } if star else None,
        "naming": {
            "star_name": req.requested_name,
            "dedication_type": req.dedication_type,
            "dedication_message": req.dedication_message,
            "recipient_name": req.recipient_name,
            "applicant_name": req.applicant_name,
            "occasion": req.occasion,
            "certificate_id": req.certificate_id,
            "approved_at": req.approved_at.isoformat() if req.approved_at else None,
            "expiry_date": req.expiry_date.isoformat() if req.expiry_date else None,
            "validity_plan": req.validity_plan,
        },
        "disclaimer": (
            "Custom star names in AR Star Registry are ceremonial and recorded only in this "
            "private registry. They do not replace official astronomical names recognized by "
            "the International Astronomical Union."
        ),
    }
