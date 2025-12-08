from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class AutoReplyRule(Base):
    """自动回复规则表"""
    __tablename__ = "auto_reply_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    instagram_account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, comment="Instagram账号ID")
    rule_name = Column(String(100), nullable=False, comment="规则名称")
    keywords = Column(JSON, nullable=False, comment="关键词列表JSON")
    reply_message = Column(Text, nullable=False, comment="回复消息")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    priority = Column(Integer, default=0, nullable=False, comment="优先级（数字越大优先级越高）")
    match_type = Column(String(20), default="contains", nullable=False, comment="匹配类型：exact/contains/regex")
    delay_seconds = Column(Integer, default=0, nullable=False, comment="回复延迟秒数")
    max_replies_per_day = Column(Integer, nullable=True, comment="每日最大回复数")
    reply_count_today = Column(Integer, default=0, nullable=False, comment="今日已回复数")
    last_reply_date = Column(DateTime(timezone=True), nullable=True, comment="最后回复日期")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="auto_reply_rules")
    instagram_account = relationship("InstagramAccount", back_populates="auto_reply_rules")

    def __repr__(self):
        return f"<AutoReplyRule(id={self.id}, name='{self.rule_name}', active={self.is_active})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "instagram_account_id": self.instagram_account_id,
            "rule_name": self.rule_name,
            "keywords": self.keywords,
            "reply_message": self.reply_message,
            "is_active": self.is_active,
            "priority": self.priority,
            "match_type": self.match_type,
            "delay_seconds": self.delay_seconds,
            "max_replies_per_day": self.max_replies_per_day,
            "reply_count_today": self.reply_count_today,
            "last_reply_date": self.last_reply_date.isoformat() if self.last_reply_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def matches_message(self, message_content: str):
        """检查消息是否匹配规则"""
        import re
        from datetime import datetime
        
        if not self.is_active:
            return False
        
        # 检查每日回复限制
        if self.max_replies_per_day:
            today = datetime.now().date()
            if self.last_reply_date and self.last_reply_date.date() == today:
                if self.reply_count_today >= self.max_replies_per_day:
                    return False
        
        # 检查关键词匹配
        message_lower = message_content.lower()
        
        for keyword in self.keywords:
            keyword_lower = keyword.lower()
            
            if self.match_type == "exact":
                if message_lower.strip() == keyword_lower.strip():
                    return True
            elif self.match_type == "contains":
                if keyword_lower in message_lower:
                    return True
            elif self.match_type == "regex":
                try:
                    if re.search(keyword, message_content, re.IGNORECASE):
                        return True
                except re.error:
                    # 正则表达式错误，跳过
                    continue
        
        return False

    def can_reply_today(self):
        """检查今天是否可以回复"""
        if not self.max_replies_per_day:
            return True
        
        from datetime import datetime, date
        today = date.today()
        
        if self.last_reply_date and self.last_reply_date.date() == today:
            return self.reply_count_today < self.max_replies_per_day
        
        return True

    def increment_reply_count(self):
        """增加今日回复计数"""
        from datetime import datetime, date
        today = date.today()
        
        if self.last_reply_date and self.last_reply_date.date() == today:
            self.reply_count_today += 1
        else:
            self.reply_count_today = 1
            self.last_reply_date = datetime.now()

    def reset_daily_counter(self):
        """重置每日计数器"""
        self.reply_count_today = 0
        self.last_reply_date = None

    @classmethod
    def get_matching_rules(cls, db_session, account_id: int, message_content: str):
        """获取匹配的规则（按优先级排序）"""
        rules = db_session.query(cls).filter(
            cls.instagram_account_id == account_id,
            cls.is_active == True
        ).all()
        
        matching_rules = []
        for rule in rules:
            if rule.matches_message(message_content):
                matching_rules.append(rule)
        
        # 按优先级排序（高优先级在前）
        matching_rules.sort(key=lambda x: x.priority, reverse=True)
        return matching_rules

    @classmethod
    def get_rules_by_priority(cls, db_session, account_id: int):
        """按优先级获取规则"""
        return db_session.query(cls).filter(
            cls.instagram_account_id == account_id,
            cls.is_active == True
        ).order_by(cls.priority.desc()).all()
