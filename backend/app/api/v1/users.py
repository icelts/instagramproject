from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List, Optional

from ...core.database import get_db
from ...core.security import verify_password, get_password_hash
from ...models.user import User
from ...utils.decorators import get_current_user

# 创建路由器
router = APIRouter()


# Pydantic模型
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    role: str
    created_at: str
    updated_at: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


def _serialize_user(user: User) -> UserResponse:
    updated = user.updated_at if getattr(user, "updated_at", None) else user.created_at
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        role=getattr(user, "role", "user"),
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=updated.isoformat() if updated else ""
    )


# 获取当前用户信息
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return _serialize_user(current_user)


# 更新用户信息
@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    if user_data.email:
        current_user.email = user_data.email
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.is_active is not None:
        current_user.is_active = user_data.is_active

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


# 修改密码
@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """修改用户密码"""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误"
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "密码修改成功"}


# 获取用户列表（管理员功能）
@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户列表（管理员功能）"""
    if getattr(current_user, "role", "user") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    users = db.query(User).offset(skip).limit(limit).all()
    return [_serialize_user(u) for u in users]


# 删除用户（管理员功能）
@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除用户（管理员功能）"""
    admin_usernames = ['admin', 'administrator', 'root']
    if current_user.username not in admin_usernames:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    if user.username == "admin" or user.id == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除管理员账户"
        )

    db.delete(user)
    db.commit()
    return {"message": f"用户 {user_id} 已删除"}
