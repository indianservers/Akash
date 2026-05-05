"""Star naming business logic and expiry processing."""
import uuid
import string
import random
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.star import Star, RegistryStatus
from app.models.star_naming_request import StarNamingRequest, RequestStatus, ValidityPlan
from app.services.audit import log_action


def generate_certificate_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "CERT-" + "".join(random.choices(chars, k=10))


def generate_share_slug(name: str) -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    safe = "".join(c if c.isalnum() else "-" for c in name.strip().lower())[:30]
    return f"{safe}-{suffix}"


def calculate_expiry(validity_plan: ValidityPlan, approved_at: datetime) -> Optional[datetime]:
    if validity_plan == ValidityPlan.ONE_YEAR:
        return approved_at + timedelta(days=365)
    if validity_plan == ValidityPlan.FIVE_YEARS:
        return approved_at + timedelta(days=365 * 5)
    if validity_plan == ValidityPlan.LIFETIME:
        return None  # No expiry
    return None


def approve_request(
    db: Session,
    request: StarNamingRequest,
    star: Star,
    admin_user_id: int,
    expiry_date: Optional[datetime],
    validity_plan: ValidityPlan,
    admin_notes: Optional[str],
    certificate_name: Optional[str],
) -> StarNamingRequest:
    now = datetime.now(timezone.utc)

    if expiry_date is None:
        expiry_date = calculate_expiry(validity_plan, now)

    cert_id = generate_certificate_id()
    slug = generate_share_slug(request.requested_name)

    old_star = {"custom_name": star.custom_name, "registry_status": star.registry_status}

    request.status = RequestStatus.APPROVED
    request.approved_by = admin_user_id
    request.approved_at = now
    request.expiry_date = expiry_date
    request.validity_plan = validity_plan
    request.certificate_id = cert_id
    request.share_slug = slug
    request.admin_notes = admin_notes
    if certificate_name:
        request.certificate_name = certificate_name

    star.custom_name = request.requested_name
    star.is_named = True
    star.is_available_for_naming = False
    star.registry_status = RegistryStatus.APPROVED

    log_action(
        db,
        action="star_name_approved",
        entity_type="StarNamingRequest",
        entity_id=str(request.id),
        actor_user_id=admin_user_id,
        old_value=old_star,
        new_value={"custom_name": star.custom_name, "expiry_date": expiry_date.isoformat() if expiry_date else None},
    )

    db.flush()
    return request


def reject_request(
    db: Session,
    request: StarNamingRequest,
    admin_user_id: int,
    rejection_reason: str,
    admin_notes: Optional[str],
) -> StarNamingRequest:
    request.status = RequestStatus.REJECTED
    request.rejection_reason = rejection_reason
    request.admin_notes = admin_notes

    log_action(
        db,
        action="star_name_rejected",
        entity_type="StarNamingRequest",
        entity_id=str(request.id),
        actor_user_id=admin_user_id,
        new_value={"rejection_reason": rejection_reason},
    )

    db.flush()
    return request


def process_expired_star_names(db: Session) -> int:
    """Find and mark expired approved naming requests. Returns count processed."""
    now = datetime.now(timezone.utc)

    expired_requests = (
        db.query(StarNamingRequest)
        .filter(
            and_(
                StarNamingRequest.status == RequestStatus.APPROVED,
                StarNamingRequest.expiry_date.isnot(None),
                StarNamingRequest.expiry_date < now,
            )
        )
        .all()
    )

    count = 0
    for req in expired_requests:
        req.status = RequestStatus.EXPIRED

        star = db.query(Star).filter(Star.id == req.star_id).first()
        if star and star.registry_status == RegistryStatus.APPROVED:
            star.custom_name = None
            star.is_named = False
            star.is_available_for_naming = True
            star.registry_status = RegistryStatus.EXPIRED

        log_action(
            db,
            action="star_name_expired",
            entity_type="StarNamingRequest",
            entity_id=str(req.id),
            new_value={"expired_at": now.isoformat()},
        )
        count += 1

    db.commit()
    return count
