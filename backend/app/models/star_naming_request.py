import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Enum as SAEnum,
    BigInteger, Integer, Text, ForeignKey,
)
from app.core.database import Base

_ev = lambda x: [e.value for e in x]  # noqa: E731


class DedicationType(str, enum.Enum):
    IN_MEMORY_OF = "In Memory Of"
    DEDICATED_TO = "Dedicated To"
    SELF = "Self"
    GIFT = "Gift"
    BIRTHDAY = "Birthday"
    ANNIVERSARY = "Anniversary"
    WEDDING = "Wedding"
    GRADUATION = "Graduation"
    NEWBORN = "New Born Baby"
    FRIENDSHIP = "Friendship"
    PARENTS = "Parents"
    SPIRITUAL = "Spiritual Dedication"
    TEACHER = "Teacher / Mentor"
    CORPORATE = "Corporate Gift"
    CUSTOM = "Custom Dedication"


class VisibilityPreference(str, enum.Enum):
    PUBLIC = "Public"
    PRIVATE = "Private"
    LINK_ONLY = "Link Only"


class RequestStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PAID = "Paid"
    FAILED = "Failed"
    REFUNDED = "Refunded"
    FREE = "Free"


class ValidityPlan(str, enum.Enum):
    ONE_YEAR = "1year"
    FIVE_YEARS = "5years"
    LIFETIME = "lifetime"
    CUSTOM = "custom"


class StarNamingRequest(Base):
    __tablename__ = "star_naming_requests"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    star_id = Column(BigInteger, ForeignKey("stars.id", ondelete="RESTRICT"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    requested_name = Column(String(255), nullable=False)
    dedication_type = Column(SAEnum(DedicationType, values_callable=_ev), nullable=False)
    dedication_message = Column(Text, nullable=True)
    relationship = Column(String(100), nullable=True)
    occasion = Column(String(100), nullable=True)
    occasion_date = Column(DateTime, nullable=True)
    recipient_name = Column(String(255), nullable=True)
    applicant_name = Column(String(255), nullable=False)
    certificate_name = Column(String(255), nullable=True)
    validity_plan = Column(SAEnum(ValidityPlan, values_callable=_ev), default=ValidityPlan.ONE_YEAR)
    visibility_preference = Column(SAEnum(VisibilityPreference, values_callable=_ev), default=VisibilityPreference.PUBLIC)

    status = Column(SAEnum(RequestStatus, values_callable=_ev), default=RequestStatus.PENDING, index=True)
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    approved_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True, index=True)
    renewal_allowed = Column(Boolean, default=True)
    renewal_count = Column(Integer, default=0)

    payment_status = Column(SAEnum(PaymentStatus, values_callable=_ev), default=PaymentStatus.FREE)
    payment_reference = Column(String(255), nullable=True)
    certificate_id = Column(String(100), unique=True, nullable=True, index=True)
    certificate_url = Column(String(500), nullable=True)
    share_slug = Column(String(100), unique=True, nullable=True, index=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
