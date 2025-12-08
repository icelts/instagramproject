from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class LoginStatus(enum.Enum):
    """登录状态枚举"""
    LOGGED_OUT = "logged_out"
    LOGGED_IN = "logged_in"
    CHALLENGE_REQUIRED = "challenge_required"
    BANNED = "banned"


class InstagramAccount(Base):
    """Instagram账号表"""
    __tablename__ = "instagram_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    username = Column(String(100), nullable=False, index=True, comment="Instagram用户名")
    password_encrypted = Column(Text, nullable=False, comment="加密密码")
    session_data = Column(Text, nullable=True, comment="会话数据JSON")
    proxy_id = Column(Integer, ForeignKey("proxy_configs.id"), nullable=True, comment="代理配置ID")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    last_login = Column(DateTime(timezone=True), nullable=True, comment="最后登录时间")
    login_status = Column(Enum(LoginStatus), default=LoginStatus.LOGGED_OUT, nullable=False, comment="登录状态")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="instagram_accounts")
    proxy = relationship("ProxyConfig", back_populates="instagram_accounts")
    post_schedules = relationship("PostSchedule", back_populates="instagram_account")
    message_logs = relationship("MessageLog", back_populates="instagram_account")
    auto_reply_rules = relationship("AutoReplyRule", back_populates="instagram_account")
    search_tasks = relationship("SearchTask", back_populates="instagram_account")

    def __repr__(self):
        return f"<InstagramAccount(id={self.id}, username='{self.username}', status='{self.login_status.value}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "proxy_id": self.proxy_id,
            "is_active": self.is_active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "login_status": self.login_status.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


# 为了避免循环导入，需要在User模型中添加关系
# 这里暂时不导入User模型，会在后续处理
