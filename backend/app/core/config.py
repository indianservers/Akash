from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "AR Star Registry"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "mysql+pymysql://staruser:starpass@localhost:3306/star_registry"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    SECRET_KEY: str = "change-this-to-a-random-64-char-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    ALLOWED_ORIGINS: str = "http://localhost:3000"

    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "Admin@123456"
    ADMIN_NAME: str = "System Admin"

    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
