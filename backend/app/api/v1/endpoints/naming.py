from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_admin_user
from app.models.user import User
from app.models.star import Star, RegistryStatus
from app.models.star_naming_request import StarNamingRequest, RequestStatus
from app.schemas.naming_request import (
    NamingRequestCreate, NamingRequestResponse,
    AdminApproveRequest, AdminRejectRequest, AdminExtendExpiry,
)
from app.services.naming import approve_request, reject_request
from app.services.audit import log_action

router = APIRouter(tags=["naming"])


@router.post("/stars/{star_id}/apply", response_model=NamingRequestResponse, status_code=201)
def apply_for_name(
    star_id: int,
    payload: NamingRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    star = db.query(Star).filter(Star.id == star_id).first()
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")
    if not star.is_available_for_naming:
        raise HTTPException(status_code=400, detail="This star is not available for naming")

    duplicate = (
        db.query(StarNamingRequest)
        .filter(
            StarNamingRequest.requested_name == payload.requested_name,
            StarNamingRequest.status == RequestStatus.APPROVED,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="This star name is already actively used")

    existing_pending = (
        db.query(StarNamingRequest)
        .filter(
            StarNamingRequest.star_id == star_id,
            StarNamingRequest.status == RequestStatus.PENDING,
        )
        .first()
    )
    if existing_pending:
        raise HTTPException(status_code=400, detail="A pending request already exists for this star")

    req = StarNamingRequest(
        star_id=star_id,
        user_id=current_user.id,
        requested_name=payload.requested_name,
        dedication_type=payload.dedication_type,
        dedication_message=payload.dedication_message,
        relationship=payload.relationship,
        occasion=payload.occasion,
        occasion_date=payload.occasion_date,
        recipient_name=payload.recipient_name,
        applicant_name=payload.applicant_name,
        certificate_name=payload.certificate_name or payload.recipient_name,
        validity_plan=payload.validity_plan,
        visibility_preference=payload.visibility_preference,
    )
    db.add(req)
    star.registry_status = RegistryStatus.PENDING
    db.commit()
    db.refresh(req)

    log_action(
        db, "naming_request_submitted", "StarNamingRequest", str(req.id),
        actor_user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        new_value={"star_id": star_id, "requested_name": payload.requested_name},
    )
    db.commit()
    return req


@router.get("/my/star-requests", response_model=List[NamingRequestResponse])
def my_requests(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(StarNamingRequest)
        .filter(StarNamingRequest.user_id == current_user.id)
        .order_by(StarNamingRequest.created_at.desc())
        .offset(skip).limit(limit).all()
    )


@router.get("/my/star-requests/{request_id}", response_model=NamingRequestResponse)
def my_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(StarNamingRequest).filter(
        StarNamingRequest.id == request_id,
        StarNamingRequest.user_id == current_user.id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.post("/star-requests/{request_id}/cancel")
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(StarNamingRequest).filter(
        StarNamingRequest.id == request_id,
        StarNamingRequest.user_id == current_user.id,
        StarNamingRequest.status == RequestStatus.PENDING,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Pending request not found")

    req.status = RequestStatus.CANCELLED
    star = db.query(Star).filter(Star.id == req.star_id).first()
    if star and star.registry_status == RegistryStatus.PENDING:
        star.registry_status = RegistryStatus.AVAILABLE

    db.commit()
    return {"detail": "Request cancelled"}
