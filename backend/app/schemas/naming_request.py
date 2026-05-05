from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.star_naming_request import (
    DedicationType, VisibilityPreference, RequestStatus,
    PaymentStatus, ValidityPlan,
)


class NamingRequestCreate(BaseModel):
    requested_name: str
    dedication_type: DedicationType
    dedication_message: Optional[str] = None
    relationship: Optional[str] = None
    occasion: Optional[str] = None
    occasion_date: Optional[datetime] = None
    recipient_name: Optional[str] = None
    applicant_name: str
    certificate_name: Optional[str] = None
    validity_plan: ValidityPlan = ValidityPlan.ONE_YEAR
    visibility_preference: VisibilityPreference = VisibilityPreference.PUBLIC

    @field_validator("requested_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Star name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Star name must not exceed 100 characters")
        forbidden = ["sun", "moon", "earth", "iau", "nasa"]
        if v.lower() in forbidden:
            raise ValueError("This name is not allowed")
        return v

    @field_validator("dedication_message")
    @classmethod
    def validate_message(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 1000:
            raise ValueError("Message must not exceed 1000 characters")
        return v


class NamingRequestResponse(BaseModel):
    id: int
    star_id: int
    user_id: int
    requested_name: str
    dedication_type: DedicationType
    dedication_message: Optional[str]
    relationship: Optional[str]
    occasion: Optional[str]
    occasion_date: Optional[datetime]
    recipient_name: Optional[str]
    applicant_name: str
    certificate_name: Optional[str]
    validity_plan: ValidityPlan
    visibility_preference: VisibilityPreference
    status: RequestStatus
    rejection_reason: Optional[str]
    approved_at: Optional[datetime]
    expiry_date: Optional[datetime]
    renewal_allowed: bool
    renewal_count: int
    payment_status: PaymentStatus
    certificate_id: Optional[str]
    certificate_url: Optional[str]
    share_slug: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminApproveRequest(BaseModel):
    expiry_date: Optional[datetime] = None
    validity_plan: ValidityPlan = ValidityPlan.ONE_YEAR
    admin_notes: Optional[str] = None
    certificate_name: Optional[str] = None


class AdminRejectRequest(BaseModel):
    rejection_reason: str
    admin_notes: Optional[str] = None


class AdminExtendExpiry(BaseModel):
    new_expiry_date: datetime
    admin_notes: Optional[str] = None
