from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base


class InstagramAccountStats(Base):
    """账号每日统计：粉丝、关注、帖子数量"""
    __tablename__ = "instagram_account_stats"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    followers = Column(Integer, default=0, nullable=False)
    following = Column(Integer, default=0, nullable=False)
    posts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationship
    account = relationship("InstagramAccount", back_populates="stats")
