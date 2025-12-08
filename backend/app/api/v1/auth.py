from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from ...core.database import get_db
from ...core.security import verify_password, get_password_hash, create_access_token, verify_token
from ...core.config import settings

# 创建路由器
router = APIRouter()
security = HTTPBearer()


# Pydantic模型
class UserLogin(BaseModel):
    username: str
    password: str


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: str


# 登录端点
@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    # 这里应该从数据库验证用户
    # 暂时使用硬编码的示例用户进行演示
    if user_credentials.username == "admin" and user_credentials.password == "admin123":
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_credentials.username}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )


# 注册端点
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    # 这里应该检查用户名和邮箱是否已存在
    # 暂时返回示例数据
    if user_data.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 这里应该创建新用户并保存到数据库
    # 暂时返回示例数据
    return UserResponse(
        id=1,
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        is_active=True,
        created_at="2025-12-09T00:00:00Z"
    )


# 验证令牌端点
@router.post("/verify-token")
async def verify_token_endpoint(token: str):
    """验证令牌有效性"""
    username = verify_token(token)
    if username:
        return {"valid": True, "username": username}
    else:
        return {"valid": False, "error": "无效的令牌"}


# 刷新令牌端点
@router.post("/refresh")
async def refresh_token(token: str):
    """刷新访问令牌"""
    username = verify_token(token)
    if username:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )


# 登出端点
@router.post("/logout")
async def logout():
    """用户登出"""
    # 这里应该将令牌加入黑名单
    return {"message": "成功登出"}
