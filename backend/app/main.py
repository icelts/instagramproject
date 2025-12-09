from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn

from .core.config import settings
from .core.database import get_db, create_tables
from .core.security import verify_token
from .api.v1 import auth, users, instagram, scheduler, monitoring, websocket

# 创建FastAPI应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Instagram自动化平台API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT认证方案
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    username = verify_token(token)
    
    if username is None:
        raise credentials_exception
    
    # 这里应该从数据库获取用户信息
    # 暂时返回用户名，后续会完善
    return {"username": username}


# 启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时执行"""
    # 创建数据库表
    create_tables()
    print("Instagram API started")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    print("Instagram API stopped")


# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "欢迎使用Instagram自动化平台API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": settings.PROJECT_NAME}


# 注册API路由
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["认证"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["用户管理"])
app.include_router(instagram.router, prefix=f"{settings.API_V1_STR}/instagram", tags=["Instagram操作"])
app.include_router(scheduler.router, prefix=f"{settings.API_V1_STR}/scheduler", tags=["定时任务"])
app.include_router(monitoring.router, prefix=f"{settings.API_V1_STR}/monitoring", tags=["实时监控"])
app.include_router(websocket.router, prefix=f"{settings.API_V1_STR}/ws", tags=["WebSocket"])


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
