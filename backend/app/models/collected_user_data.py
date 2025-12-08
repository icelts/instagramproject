from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class CollectedUserData(Base):
    """用户数据采集表"""
    __tablename__ = "collected_user_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    search_task_id = Column(Integer, ForeignKey("search_tasks.id"), nullable=False, comment="搜索任务ID")
    instagram_username = Column(String(100), nullable=False, index=True, comment="Instagram用户名")
    full_name = Column(String(200), nullable=True, comment="全名")
    biography = Column(Text, nullable=True, comment="个人简介")
    follower_count = Column(Integer, nullable=True, comment="粉丝数")
    following_count = Column(Integer, nullable=True, comment="关注数")
    posts_count = Column(Integer, nullable=True, comment="帖子数")
    is_verified = Column(Boolean, default=False, nullable=False, comment="是否验证")
    is_private = Column(Boolean, default=False, nullable=False, comment="是否私人账户")
    email = Column(String(100), nullable=True, comment="邮箱")
    phone = Column(String(50), nullable=True, comment="电话")
    profile_pic_url = Column(Text, nullable=True, comment="头像URL")
    external_url = Column(Text, nullable=True, comment="外部链接URL")
    business_category = Column(String(100), nullable=True, comment="商业类别")
    contact_options = Column(JSON, nullable=True, comment="联系选项JSON")
    collected_data = Column(JSON, nullable=True, comment="额外采集数据JSON")
    data_quality_score = Column(Integer, default=0, nullable=False, comment="数据质量评分（0-100）")
    is_email_verified = Column(Boolean, default=False, nullable=False, comment="邮箱是否已验证")
    is_duplicate = Column(Boolean, default=False, nullable=False, comment="是否重复数据")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="collected_user_data")
    search_task = relationship("SearchTask", back_populates="collected_data")

    def __repr__(self):
        return f"<CollectedUserData(id={self.id}, username='{self.instagram_username}', quality={self.data_quality_score})>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "search_task_id": self.search_task_id,
            "instagram_username": self.instagram_username,
            "full_name": self.full_name,
            "biography": self.biography,
            "follower_count": self.follower_count,
            "following_count": self.following_count,
            "posts_count": self.posts_count,
            "is_verified": self.is_verified,
            "is_private": self.is_private,
            "email": self.email,
            "phone": self.phone,
            "profile_pic_url": self.profile_pic_url,
            "external_url": self.external_url,
            "business_category": self.business_category,
            "contact_options": self.contact_options,
            "collected_data": self.collected_data,
            "data_quality_score": self.data_quality_score,
            "is_email_verified": self.is_email_verified,
            "is_duplicate": self.is_duplicate,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def calculate_quality_score(self):
        """计算数据质量评分"""
        score = 0
        
        # 基础信息（40分）
        if self.instagram_username:
            score += 10
        if self.full_name:
            score += 10
        if self.biography and len(self.biography) > 10:
            score += 10
        if self.profile_pic_url:
            score += 10
        
        # 统计信息（20分）
        if self.follower_count and self.follower_count > 0:
            score += 5
        if self.following_count and self.following_count > 0:
            score += 5
        if self.posts_count and self.posts_count > 0:
            score += 5
        if self.is_verified:
            score += 5
        
        # 联系信息（30分）
        if self.email:
            score += 15
            if self.is_email_verified:
                score += 5
        if self.phone:
            score += 10
        if self.external_url:
            score += 5
        
        # 商业信息（10分）
        if self.business_category:
            score += 5
        if self.contact_options:
            score += 5
        
        self.data_quality_score = min(score, 100)
        return self.data_quality_score

    def has_contact_info(self):
        """检查是否有联系信息"""
        return bool(self.email or self.phone or self.external_url or self.contact_options)

    def is_business_account(self):
        """检查是否为商业账户"""
        return bool(self.business_category or self.contact_options)

    def get_engagement_rate(self):
        """计算互动率（如果有可能的话）"""
        if self.posts_count and self.posts_count > 0 and self.follower_count and self.follower_count > 0:
            # 这里需要额外的互动数据，暂时返回0
            return 0.0
        return 0.0

    def export_to_csv_format(self):
        """导出为CSV格式的字典"""
        return {
            "username": self.instagram_username,
            "full_name": self.full_name or "",
            "email": self.email or "",
            "phone": self.phone or "",
            "biography": (self.biography or "").replace("\n", " ").replace("\r", " "),
            "followers": self.follower_count or 0,
            "following": self.following_count or 0,
            "posts": self.posts_count or 0,
            "verified": "Yes" if self.is_verified else "No",
            "private": "Yes" if self.is_private else "No",
            "profile_pic_url": self.profile_pic_url or "",
            "external_url": self.external_url or "",
            "business_category": self.business_category or "",
            "data_quality_score": self.data_quality_score,
            "created_at": self.created_at.isoformat() if self.created_at else ""
        }

    @classmethod
    def find_duplicates(cls, db_session, user_id: int):
        """查找重复数据"""
        return db_session.query(cls).filter(
            cls.user_id == user_id,
            cls.is_duplicate == True
        ).all()

    @classmethod
    def get_high_quality_data(cls, db_session, user_id: int, min_score: int = 70):
        """获取高质量数据"""
        return db_session.query(cls).filter(
            cls.user_id == user_id,
            cls.data_quality_score >= min_score,
            cls.is_duplicate == False
        ).all()

    @classmethod
    def get_data_with_email(cls, db_session, user_id: int, verified_only: bool = False):
        """获取有邮箱的数据"""
        query = db_session.query(cls).filter(
            cls.user_id == user_id,
            cls.email.isnot(None)
        )
        
        if verified_only:
            query = query.filter(cls.is_email_verified == True)
        
        return query.all()

    @classmethod
    def get_collection_stats(cls, db_session, user_id: int = None):
        """获取采集统计"""
        query = db_session.query(cls)
        if user_id:
            query = query.filter(cls.user_id == user_id)
        
        all_data = query.all()
        
        stats = {
            "total_collected": len(all_data),
            "with_email": len([d for d in all_data if d.email]),
            "with_phone": len([d for d in all_data if d.phone]),
            "verified_accounts": len([d for d in all_data if d.is_verified]),
            "private_accounts": len([d for d in all_data if d.is_private]),
            "business_accounts": len([d for d in all_data if d.is_business_account()]),
            "duplicate_data": len([d for d in all_data if d.is_duplicate]),
            "average_quality_score": 0,
            "high_quality_count": 0
        }
        
        if stats["total_collected"] > 0:
            total_score = sum([d.data_quality_score for d in all_data])
            stats["average_quality_score"] = round(total_score / stats["total_collected"], 2)
            stats["high_quality_count"] = len([d for d in all_data if d.data_quality_score >= 70])
        
        return stats
