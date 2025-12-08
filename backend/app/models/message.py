from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class MessageType(enum.Enum):
    """消息类型枚举"""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    LINK = "link"


class MessageLog(Base):
    """消息记录表"""
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    instagram_account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, comment="Instagram账号ID")
    thread_id = Column(String(100), nullable=False, index=True, comment="会话ID")
    sender_username = Column(String(100), nullable=False, comment="发送者用户名")
    message_content = Column(Text, nullable=False, comment="消息内容")
    message_type = Column(Enum(MessageType), default=MessageType.TEXT, nullable=False, comment="消息类型")
    is_incoming = Column(Boolean, default=True, nullable=False, comment="是否为接收消息")
    is_auto_reply = Column(Boolean, default=False, nullable=False, comment="是否为自动回复")
    media_url = Column(Text, nullable=True, comment="媒体文件URL")
    reply_to_message_id = Column(Integer, nullable=True, comment="回复的消息ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    user = relationship("User", back_populates="message_logs")
    instagram_account = relationship("InstagramAccount", back_populates="message_logs")
    
    # 自引用关系（回复链）
    replies = relationship("MessageLog", 
                        foreign_keys=[reply_to_message_id],
                        remote_side=[id],
                        backref="replied_to")

    def __repr__(self):
        return f"<MessageLog(id={self.id}, thread='{self.thread_id}', type='{self.message_type.value}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "instagram_account_id": self.instagram_account_id,
            "thread_id": self.thread_id,
            "sender_username": self.sender_username,
            "message_content": self.message_content,
            "message_type": self.message_type.value,
            "is_incoming": self.is_incoming,
            "is_auto_reply": self.is_auto_reply,
            "media_url": self.media_url,
            "reply_to_message_id": self.reply_to_message_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def is_recent(self, minutes: int = 30):
        """检查是否为最近的消息"""
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        return self.created_at >= now - timedelta(minutes=minutes)

    def get_thread_conversation(self, db_session, limit: int = 50):
        """获取会话对话历史"""
        return db_session.query(MessageLog).filter(
            MessageLog.thread_id == self.thread_id
        ).order_by(MessageLog.created_at.desc()).limit(limit).all()

    @classmethod
    def get_unread_messages(cls, db_session, account_id: int, minutes: int = 30):
        """获取未读消息"""
        from datetime import datetime, timezone, timedelta
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        
        return db_session.query(cls).filter(
            cls.instagram_account_id == account_id,
            cls.is_incoming == True,
            cls.is_auto_reply == False,
            cls.created_at >= cutoff_time
        ).order_by(cls.created_at.desc()).all()

    @classmethod
    def get_message_stats(cls, db_session, user_id: int, days: int = 7):
        """获取消息统计"""
        from datetime import datetime, timezone, timedelta
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=days)
        
        messages = db_session.query(cls).filter(
            cls.user_id == user_id,
            cls.created_at >= cutoff_time
        ).all()
        
        stats = {
            "total_messages": len(messages),
            "incoming_messages": len([m for m in messages if m.is_incoming]),
            "outgoing_messages": len([m for m in messages if not m.is_incoming]),
            "auto_replies": len([m for m in messages if m.is_auto_reply]),
            "message_types": {}
        }
        
        for message_type in MessageType:
            count = len([m for m in messages if m.message_type == message_type])
            stats["message_types"][message_type.value] = count
        
        return stats
