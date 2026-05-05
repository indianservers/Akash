from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
import csv
import io

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.star import Star, RegistryStatus, StarType
from app.models.star_naming_request import StarNamingRequest, RequestStatus, PaymentStatus
from app.models.audit_log import AuditLog
from app.schemas.naming_request import (
    NamingRequestResponse, AdminApproveRequest, AdminRejectRequest, AdminExtendExpiry,
)
from app.schemas.star import StarResponse, StarAdminUpdate
from app.schemas.user import UserResponse
from app.services.naming import approve_request, reject_request, process_expired_star_names

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/star-requests", response_model=List[NamingRequestResponse])
def list_requests(
    status: Optional[RequestStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    constellation: Optional[str] = None,
    star_type: Optional[StarType] = None,
    expiring_days: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    q = db.query(StarNamingRequest)
    if status:
        q = q.filter(StarNamingRequest.status == status)
    if payment_status:
        q = q.filter(StarNamingRequest.payment_status == payment_status)
    if expiring_days:
        from datetime import timezone, timedelta
        cutoff = datetime.now(timezone.utc) + timedelta(days=expiring_days)
        q = q.filter(
            StarNamingRequest.expiry_date.isnot(None),
            StarNamingRequest.expiry_date <= cutoff,
            StarNamingRequest.status == RequestStatus.APPROVED,
        )
    return q.order_by(StarNamingRequest.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/star-requests/{request_id}", response_model=NamingRequestResponse)
def get_request(request_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    req = db.query(StarNamingRequest).filter(StarNamingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.post("/star-requests/{request_id}/approve", response_model=NamingRequestResponse)
def approve(
    request_id: int,
    payload: AdminApproveRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    req = db.query(StarNamingRequest).filter(StarNamingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    star = db.query(Star).filter(Star.id == req.star_id).first()
    if not star:
        raise HTTPException(status_code=404, detail="Associated star not found")

    active_name = db.query(StarNamingRequest).filter(
        StarNamingRequest.requested_name == req.requested_name,
        StarNamingRequest.status == RequestStatus.APPROVED,
        StarNamingRequest.id != request_id,
    ).first()
    if active_name:
        raise HTTPException(status_code=400, detail="This star name is already actively used")

    approve_request(
        db, req, star, admin.id,
        payload.expiry_date, payload.validity_plan,
        payload.admin_notes, payload.certificate_name,
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/star-requests/{request_id}/reject", response_model=NamingRequestResponse)
def reject(
    request_id: int,
    payload: AdminRejectRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    req = db.query(StarNamingRequest).filter(StarNamingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    star = db.query(Star).filter(Star.id == req.star_id).first()
    if star and star.registry_status == RegistryStatus.PENDING:
        star.registry_status = RegistryStatus.AVAILABLE

    reject_request(db, req, admin.id, payload.rejection_reason, payload.admin_notes)
    db.commit()
    db.refresh(req)
    return req


@router.post("/star-requests/{request_id}/extend-expiry", response_model=NamingRequestResponse)
def extend_expiry(
    request_id: int,
    payload: AdminExtendExpiry,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    req = db.query(StarNamingRequest).filter(
        StarNamingRequest.id == request_id,
        StarNamingRequest.status == RequestStatus.APPROVED,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approved request not found")

    old_expiry = req.expiry_date
    req.expiry_date = payload.new_expiry_date
    req.renewal_count = (req.renewal_count or 0) + 1
    if payload.admin_notes:
        req.admin_notes = payload.admin_notes

    from app.services.audit import log_action
    log_action(
        db, "expiry_extended", "StarNamingRequest", str(req.id),
        actor_user_id=admin.id,
        old_value={"expiry_date": old_expiry.isoformat() if old_expiry else None},
        new_value={"expiry_date": payload.new_expiry_date.isoformat()},
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/process-expired-names")
def trigger_expiry_processing(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    count = process_expired_star_names(db)
    return {"detail": f"Processed {count} expired star name(s)"}


@router.get("/users", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/stars", response_model=List[StarResponse])
def list_all_stars(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    return db.query(Star).offset(skip).limit(limit).all()


@router.put("/stars/{star_id}", response_model=StarResponse)
def update_star(
    star_id: int,
    payload: StarAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    star = db.query(Star).filter(Star.id == star_id).first()
    if not star:
        raise HTTPException(status_code=404, detail="Star not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(star, field, value)

    db.commit()
    db.refresh(star)
    return star


@router.get("/audit-logs")
def list_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    q = db.query(AuditLog)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if action:
        q = q.filter(AuditLog.action == action)
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/dashboard/metrics")
def dashboard_metrics(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    from datetime import timezone, timedelta
    now = datetime.now(timezone.utc)
    in_30_days = now + timedelta(days=30)

    return {
        "total_stars": db.query(Star).count(),
        "available_stars": db.query(Star).filter(Star.is_available_for_naming == True).count(),
        "named_stars": db.query(Star).filter(Star.is_named == True).count(),
        "pending_requests": db.query(StarNamingRequest).filter(StarNamingRequest.status == RequestStatus.PENDING).count(),
        "approved_requests": db.query(StarNamingRequest).filter(StarNamingRequest.status == RequestStatus.APPROVED).count(),
        "rejected_requests": db.query(StarNamingRequest).filter(StarNamingRequest.status == RequestStatus.REJECTED).count(),
        "expired_names": db.query(StarNamingRequest).filter(StarNamingRequest.status == RequestStatus.EXPIRED).count(),
        "expiring_in_30_days": db.query(StarNamingRequest).filter(
            StarNamingRequest.status == RequestStatus.APPROVED,
            StarNamingRequest.expiry_date.isnot(None),
            StarNamingRequest.expiry_date <= in_30_days,
        ).count(),
        "total_users": db.query(User).count(),
    }


@router.get("/export/requests")
def export_requests_csv(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    requests = db.query(StarNamingRequest).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Star ID", "Requested Name", "Status", "Dedication Type",
        "Recipient", "Validity", "Expiry Date", "Certificate ID", "Created At",
    ])
    for r in requests:
        writer.writerow([
            r.id, r.star_id, r.requested_name, r.status, r.dedication_type,
            r.recipient_name, r.validity_plan, r.expiry_date, r.certificate_id, r.created_at,
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=star_requests.csv"},
    )
