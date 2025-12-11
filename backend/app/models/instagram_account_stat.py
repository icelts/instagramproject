from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base


class InstagramAccountStat(Base):
    """账号每日统计：粉丝数、帖子数"""
    __tablename__ = "instagram_account_stats"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, index=True)
    stat_date = Column(Date, nullable=False, index=True)
    followers_count = Column(Integer, nullable=False, default=0)
    posts_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("InstagramAccount", back_populates="stats")

