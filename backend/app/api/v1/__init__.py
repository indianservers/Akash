from fastapi import APIRouter
from app.api.v1.endpoints import auth, stars, naming, admin, registry

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(stars.router)
router.include_router(naming.router)
router.include_router(admin.router)
router.include_router(registry.router)
