from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class SearchType(enum.Enum):
    """搜索类型枚举"""
    HASHTAG = "hashtag"
    LOCATION = "location"
    USERNAME = "username"
    KEYWORD = "keyword"


class TaskStatus(enum.Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SearchTask(Base):
    """搜索任务表"""
    __tablename__ = "search_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    instagram_account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, comment="Instagram账号ID")
    task_name = Column(String(100), nullable=False, comment="任务名称")
    search_type = Column(Enum(SearchType), nullable=False, comment="搜索类型")
    search_query = Column(String(255), nullable=False, comment="搜索查询")
    search_params = Column(JSON, nullable=True, comment="搜索参数JSON")
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False, comment="任务状态")
    results = Column(JSON, nullable=True, comment="搜索结果JSON")
    started_at = Column(DateTime(timezone=True), nullable=True, comment="开始时间")
    completed_at = Column(DateTime(timezone=True), nullable=True, comment="完成时间")
    error_message = Column(Text, nullable=True, comment="错误信息")
    progress_percentage = Column(Integer, default=0, nullable=False, comment="进度百分比")
    total_items = Column(Integer, default=0, nullable=False, comment="总项目数")
    processed_items = Column(Integer, default=0, nullable=False, comment="已处理项目数")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="search_tasks")
    instagram_account = relationship("InstagramAccount", back_populates="search_tasks")
    collected_data = relationship("CollectedUserData", back_populates="search_task")

    def __repr__(self):
        return f"<SearchTask(id={self.id}, name='{self.task_name}', status='{self.status.value}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "instagram_account_id": self.instagram_account_id,
            "task_name": self.task_name,
            "search_type": self.search_type.value,
            "search_query": self.search_query,
            "search_params": self.search_params,
            "status": self.status.value,
            "results": self.results,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "progress_percentage": self.progress_percentage,
            "total_items": self.total_items,
            "processed_items": self.processed_items,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def start_task(self):
        """开始任务"""
        from datetime import datetime, timezone
        self.status = TaskStatus.RUNNING
        self.started_at = datetime.now(timezone.utc)
        self.progress_percentage = 0

    def complete_task(self, results=None):
        """完成任务"""
        from datetime import datetime, timezone
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        self.progress_percentage = 100
        if results is not None:
            self.results = results

    def fail_task(self, error_message):
        """任务失败"""
        from datetime import datetime, timezone
        self.status = TaskStatus.FAILED
        self.completed_at = datetime.now(timezone.utc)
        self.error_message = error_message

    def cancel_task(self):
        """取消任务"""
        from datetime import datetime, timezone
        self.status = TaskStatus.CANCELLED
        self.completed_at = datetime.now(timezone.utc)

    def update_progress(self, processed_items: int, total_items: int = None):
        """更新任务进度"""
        self.processed_items = processed_items
        if total_items is not None:
            self.total_items = total_items
        
        if self.total_items > 0:
            self.progress_percentage = int((self.processed_items / self.total_items) * 100)
        else:
            self.progress_percentage = 0

    def get_duration(self):
        """获取任务执行时长（秒）"""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        elif self.started_at:
            from datetime import datetime, timezone
            return (datetime.now(timezone.utc) - self.started_at).total_seconds()
        return 0

    def is_running(self):
        """检查任务是否正在运行"""
        return self.status == TaskStatus.RUNNING

    def is_completed(self):
        """检查任务是否已完成"""
        return self.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]

    @classmethod
    def get_active_tasks(cls, db_session, user_id: int = None):
        """获取活跃任务"""
        query = db_session.query(cls).filter(cls.status == TaskStatus.RUNNING)
        if user_id:
            query = query.filter(cls.user_id == user_id)
        return query.all()

    @classmethod
    def get_completed_tasks(cls, db_session, user_id: int = None, limit: int = 50):
        """获取已完成的任务"""
        query = db_session.query(cls).filter(cls.status == TaskStatus.COMPLETED)
        if user_id:
            query = query.filter(cls.user_id == user_id)
        return query.order_by(cls.completed_at.desc()).limit(limit).all()

    @classmethod
    def get_task_stats(cls, db_session, user_id: int = None):
        """获取任务统计"""
        query = db_session.query(cls)
        if user_id:
            query = query.filter(cls.user_id == user_id)
        
        tasks = query.all()
        
        stats = {
            "total_tasks": len(tasks),
            "completed_tasks": len([t for t in tasks if t.status == TaskStatus.COMPLETED]),
            "failed_tasks": len([t for t in tasks if t.status == TaskStatus.FAILED]),
            "running_tasks": len([t for t in tasks if t.status == TaskStatus.RUNNING]),
            "pending_tasks": len([t for t in tasks if t.status == TaskStatus.PENDING]),
            "cancelled_tasks": len([t for t in tasks if t.status == TaskStatus.CANCELLED])
        }
        
        if stats["total_tasks"] > 0:
            stats["success_rate"] = round((stats["completed_tasks"] / stats["total_tasks"]) * 100, 2)
        else:
            stats["success_rate"] = 0
        
        return stats
