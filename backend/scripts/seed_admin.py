"""
Seed script: creates initial admin user.
Run: python scripts/seed_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, UserRole, UserStatus
import app.models  # register all models


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if existing:
            print(f"Admin user already exists: {settings.ADMIN_EMAIL}")
            return

        admin = User(
            full_name=settings.ADMIN_NAME,
            email=settings.ADMIN_EMAIL,
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.SUPERADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
        print("Change the admin password after first login!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
