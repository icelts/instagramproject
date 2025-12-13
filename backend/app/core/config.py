from typing import List, Optional

# Pydantic v2 moved BaseSettings to pydantic_settings; keep compatibility
try:
    from pydantic_settings import BaseSettings  # type: ignore
except ImportError:  # pragma: no cover
    from pydantic import BaseSettings  # type: ignore


class Settings(BaseSettings):
    # 项目基本信息
    PROJECT_NAME: str = "Instagram Automation Platform"
    VERSION: str = "1.0.0"
    
    # 数据库配置
    DATABASE_URL: str
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT配置
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # API配置
    API_V1_STR: str = "/api/v1"
    
    class Config:
        env_file = "backend/.env"
        case_sensitive = True


settings = Settings()
