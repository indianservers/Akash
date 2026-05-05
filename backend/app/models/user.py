import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, BigInteger
from app.core.database import Base

_ev = lambda x: [e.value for e in x]  # noqa: E731


class UserRole(str, enum.Enum):
    USER = "User"
    ADMIN = "Admin"
    SUPERADMIN = "SuperAdmin"


class UserStatus(str, enum.Enum):
    ACTIVE = "Active"
    SUSPENDED = "Suspended"
    DELETED = "Deleted"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole, values_callable=_ev), default=UserRole.USER, nullable=False)
    status = Column(SAEnum(UserStatus, values_callable=_ev), default=UserStatus.ACTIVE, nullable=False)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
