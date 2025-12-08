from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List, Optional

from ...core.database import get_db
from ...core.security import verify_password, get_password_hash

# 创建路由器
router = APIRouter()


# Pydantic模型
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# 获取当前用户信息
@router.get("/me", response_model=UserResponse)
async def get_current_user_info():
    """获取当前登录用户信息"""
    # 这里应该从JWT token获取用户信息
    # 暂时返回示例数据
    return UserResponse(
        id=1,
        username="admin",
        email="admin@example.com",
        full_name="管理员",
        is_active=True,
        created_at="2025-12-09T00:00:00Z"
    )


# 更新用户信息
@router.put("/me", response_model=UserResponse)
async def update_current_user(user_data: UserUpdate):
    """更新当前用户信息"""
    # 这里应该更新数据库中的用户信息
    # 暂时返回示例数据
    return UserResponse(
        id=1,
        username="admin",
        email=user_data.email or "admin@example.com",
        full_name=user_data.full_name or "管理员",
        is_active=user_data.is_active if user_data.is_active is not None else True,
        created_at="2025-12-09T00:00:00Z"
    )


# 修改密码
@router.post("/change-password")
async def change_password(password_data: PasswordChange):
    """修改用户密码"""
    # 这里应该验证当前密码并更新为新密码
    # 暂时只做简单验证
    if password_data.current_password == "admin123":
        new_password_hash = get_password_hash(password_data.new_password)
        # 这里应该更新数据库中的密码哈希
        return {"message": "密码修改成功"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误"
        )


# 获取用户列表（管理员功能）
@router.get("/", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100):
    """获取用户列表（管理员功能）"""
    # 这里应该从数据库获取用户列表
    # 暂时返回示例数据
    return [
        UserResponse(
            id=1,
            username="admin",
            email="admin@example.com",
            full_name="管理员",
            is_active=True,
            created_at="2025-12-09T00:00:00Z"
        )
    ]


# 删除用户（管理员功能）
@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """删除用户（管理员功能）"""
    # 这里应该从数据库删除用户
    if user_id == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除管理员账户"
        )
    
    return {"message": f"用户 {user_id} 已删除"}
