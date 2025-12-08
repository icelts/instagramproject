from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class PostStatus(enum.Enum):
    """发帖状态枚举"""
    PENDING = "pending"
    POSTED = "posted"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RepeatType(enum.Enum):
    """重复类型枚举"""
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class PostSchedule(Base):
    """定时发帖表"""
    __tablename__ = "post_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    instagram_account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, comment="Instagram账号ID")
    title = Column(String(200), nullable=False, comment="帖子标题")
    content = Column(Text, nullable=False, comment="帖子内容")
    media_files = Column(JSON, nullable=True, comment="媒体文件JSON")
    scheduled_time = Column(DateTime(timezone=True), nullable=False, comment="计划发帖时间")
    status = Column(Enum(PostStatus), default=PostStatus.PENDING, nullable=False, comment="发帖状态")
    posted_at = Column(DateTime(timezone=True), nullable=True, comment="实际发帖时间")
    error_message = Column(Text, nullable=True, comment="错误信息")
    repeat_type = Column(Enum(RepeatType), default=RepeatType.ONCE, nullable=False, comment="重复类型")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="post_schedules")
    instagram_account = relationship("InstagramAccount", back_populates="post_schedules")

    def __repr__(self):
        return f"<PostSchedule(id={self.id}, title='{self.title}', status='{self.status.value}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "instagram_account_id": self.instagram_account_id,
            "title": self.title,
            "content": self.content,
            "media_files": self.media_files,
            "scheduled_time": self.scheduled_time.isoformat() if self.scheduled_time else None,
            "status": self.status.value,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
            "error_message": self.error_message,
            "repeat_type": self.repeat_type.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def is_ready_to_post(self):
        """检查是否到了发帖时间"""
        if self.status != PostStatus.PENDING:
            return False
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        return now >= self.scheduled_time

    def calculate_next_post_time(self):
        """计算下次发帖时间"""
        if self.repeat_type == RepeatType.ONCE:
            return None
        elif self.repeat_type == RepeatType.DAILY:
            return self.scheduled_time.replace(day=self.scheduled_time.day + 1)
        elif self.repeat_type == RepeatType.WEEKLY:
            return self.scheduled_time.replace(day=self.scheduled_time.day + 7)
        elif self.repeat_type == RepeatType.MONTHLY:
            return self.scheduled_time.replace(month=self.scheduled_time.month + 1)
        return None
