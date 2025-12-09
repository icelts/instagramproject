from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from ...core.database import get_db
from ...core.security import verify_password, get_password_hash, create_access_token, verify_token
from ...core.config import settings
from ...models.user import User

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


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


def _build_user_response(user: User) -> UserResponse:
    updated = user.updated_at if getattr(user, "updated_at", None) else user.created_at
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=updated.isoformat() if updated else ""
    )


# 登录端点
@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.username == user_credentials.username).first()
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": _build_user_response(user)
    }


# 注册端点
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    existing = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在"
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return _build_user_response(new_user)


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
async def refresh_token(token: str, db: Session = Depends(get_db)):
    """刷新访问令牌"""
    username = verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": _build_user_response(user)
    }


# 登出端点
@router.post("/logout")
async def logout():
    """用户登出"""
    # 这里应有令牌黑名单或会话失效处理，当前仅返回成功
    return {"message": "成功登出"}
