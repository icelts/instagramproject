from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    email = Column(String(100), unique=True, index=True, nullable=False, comment="邮箱")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    full_name = Column(String(100), nullable=True, comment="全名")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    role = Column(String(50), default="user", nullable=False, comment="角色（user/admin/super_admin等）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    instagram_accounts = relationship("InstagramAccount", back_populates="user")
    proxy_configs = relationship("ProxyConfig", back_populates="user")
    post_schedules = relationship("PostSchedule", back_populates="user")
    message_logs = relationship("MessageLog", back_populates="user")
    auto_reply_rules = relationship("AutoReplyRule", back_populates="user")
    search_tasks = relationship("SearchTask", back_populates="user")
    collected_user_data = relationship("CollectedUserData", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
