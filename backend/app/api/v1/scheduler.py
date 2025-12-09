from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from enum import Enum
from datetime import datetime

from ...core.database import get_db
from ...services.scheduler_service import task_scheduler
from ...services.data_collector import data_collector, data_analyzer
from ...models.schedule import PostSchedule, PostStatus, RepeatType as ModelRepeatType
from ...models.search_task import SearchTask, TaskStatus as ModelTaskStatus
from ...models.user import User
from ...utils.decorators import get_current_user

# 创建路由器
router = APIRouter()


# 枚举类型
class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RepeatType(str, Enum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class SearchType(str, Enum):
    HASHTAG = "hashtag"
    LOCATION = "location"
    USERNAME = "username"
    KEYWORD = "keyword"


# Pydantic模型
class TaskResponse(BaseModel):
    id: int
    task_name: str
    task_type: str
    status: TaskStatus
    created_at: str
    scheduled_time: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class ScheduleResponse(BaseModel):
    id: int
    title: str
    content: str
    scheduled_time: str
    repeat_type: RepeatType
    status: TaskStatus
    posted_at: Optional[str] = None
    created_at: str


class ScheduleCreate(BaseModel):
    instagram_account_id: int
    title: str
    content: str
    scheduled_time: datetime
    repeat_type: RepeatType = RepeatType.ONCE
    media_files: Optional[List[dict]] = None


class SearchTaskCreate(BaseModel):
    instagram_account_id: int
    task_name: str
    search_type: SearchType
    search_query: str
    search_params: Optional[dict] = None


class SearchTaskResponse(BaseModel):
    id: int
    task_name: str
    search_type: SearchType
    search_query: str
    status: TaskStatus
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    results: Optional[dict] = None


# 发帖计划相关API
@router.get("/schedules", response_model=List[ScheduleResponse])
async def get_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取定时发帖计划列表"""
    try:
        schedules = db.query(PostSchedule).filter(
            PostSchedule.user_id == current_user.id
        ).all()
        
        return [
            ScheduleResponse(
                id=schedule.id,
                title=schedule.title,
                content=schedule.content,
                scheduled_time=schedule.scheduled_time.isoformat() if schedule.scheduled_time else None,
                repeat_type=schedule.repeat_type,
                status=schedule.status,
                posted_at=schedule.posted_at.isoformat() if schedule.posted_at else None,
                created_at=schedule.created_at.isoformat() if schedule.created_at else None
            )
            for schedule in schedules
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedules", response_model=ScheduleResponse)
async def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建定时发帖计划"""
    try:
        # 创建发帖计划
        schedule = PostSchedule(
            user_id=current_user.id,
            instagram_account_id=schedule_data.instagram_account_id,
            title=schedule_data.title,
            content=schedule_data.content,
            scheduled_time=schedule_data.scheduled_time,
            repeat_type=schedule_data.repeat_type,
            media_files=schedule_data.media_files or [],
            status=PostStatus.PENDING
        )
        
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        # 调度任务
        await task_scheduler.schedule_post(schedule.id)
        
        return ScheduleResponse(
            id=schedule.id,
            title=schedule.title,
            content=schedule.content,
            scheduled_time=schedule.scheduled_time.isoformat(),
            repeat_type=schedule.repeat_type,
            status=schedule.status,
            posted_at=None,
            created_at=schedule.created_at.isoformat() if schedule.created_at else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedules/{schedule_id}")
async def get_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取特定发帖计划"""
    schedule = db.query(PostSchedule).filter(
        PostSchedule.id == schedule_id,
        PostSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="发帖计划不存在")
    
    return ScheduleResponse(
        id=schedule.id,
        title=schedule.title,
        content=schedule.content,
        scheduled_time=schedule.scheduled_time.isoformat() if schedule.scheduled_time else None,
        repeat_type=schedule.repeat_type,
        status=schedule.status,
        posted_at=schedule.posted_at.isoformat() if schedule.posted_at else None,
        created_at=schedule.created_at.isoformat() if schedule.created_at else None
    )


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除发帖计划"""
    schedule = db.query(PostSchedule).filter(
        PostSchedule.id == schedule_id,
        PostSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="发帖计划不存在")
    
    # 取消任务
    if schedule.status in [PostStatus.PENDING]:
        await task_scheduler.cancel_task(schedule_id, 'post')
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "发帖计划已删除"}


# 搜索任务相关API
@router.get("/search-tasks", response_model=List[SearchTaskResponse])
async def get_search_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取搜索任务列表"""
    try:
        tasks = db.query(SearchTask).filter(
        SearchTask.user_id == current_user.id
        ).all()
        
        return [
            SearchTaskResponse(
                id=task.id,
                task_name=task.task_name,
                search_type=task.search_type,
                search_query=task.search_query,
                status=task.status,
                created_at=task.created_at.isoformat() if task.created_at else None,
                started_at=task.started_at.isoformat() if task.started_at else None,
                completed_at=task.completed_at.isoformat() if task.completed_at else None,
                results=task.results
            )
            for task in tasks
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search-tasks", response_model=SearchTaskResponse)
async def create_search_task(
    task_data: SearchTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """创建搜索任务"""
    try:
        # 创建搜索任务
        search_task = SearchTask(
            user_id=current_user.id,
            instagram_account_id=task_data.instagram_account_id,
            task_name=task_data.task_name,
            search_type=task_data.search_type,
            search_query=task_data.search_query,
            search_params=task_data.search_params or {},
            status=ModelTaskStatus.PENDING
        )
        
        db.add(search_task)
        db.commit()
        db.refresh(search_task)
        
        # 后台启动数据采集
        background_tasks.add_task(
            data_collector.collect_user_data,
            search_task.id
        )
        
        return SearchTaskResponse(
            id=search_task.id,
            task_name=search_task.task_name,
            search_type=search_task.search_type,
            search_query=search_task.search_query,
            status=search_task.status,
            created_at=search_task.created_at.isoformat() if search_task.created_at else None,
            started_at=None,
            completed_at=None,
            results=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search-tasks/{task_id}")
async def get_search_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取特定搜索任务"""
    task = db.query(SearchTask).filter(
        SearchTask.id == task_id,
        SearchTask.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="搜索任务不存在")
    
    return SearchTaskResponse(
        id=task.id,
        task_name=task.task_name,
        search_type=task.search_type,
        search_query=task.search_query,
        status=task.status,
        created_at=task.created_at.isoformat() if task.created_at else None,
        started_at=task.started_at.isoformat() if task.started_at else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        results=task.results
    )


@router.post("/search-tasks/{task_id}/export")
async def export_search_data(
    task_id: int,
    format_type: str = "json",
    current_user: User = Depends(get_current_user)
):
    """导出搜索结果数据"""
    try:
        # 验证任务所有权
        db = next(get_db())
        task = db.query(SearchTask).filter(
            SearchTask.id == task_id,
            SearchTask.user_id == current_user.id
        ).first()
        db.close()
        
        if not task:
            raise HTTPException(status_code=404, detail="搜索任务不存在")
        
        # 导出数据
        result = await data_collector.export_data(task_id, format_type)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search-tasks/{task_id}/analysis")
async def get_search_analysis(
    task_id: int,
    current_user: User = Depends(get_current_user)
):
    """获取搜索数据分析"""
    try:
        # 验证任务所有权
        db = next(get_db())
        task = db.query(SearchTask).filter(
            SearchTask.id == task_id,
            SearchTask.user_id == current_user.id
        ).first()
        db.close()
        
        if not task:
            raise HTTPException(status_code=404, detail="搜索任务不存在")
        
        # 分析数据
        result = await data_analyzer.analyze_collected_data(task_id)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 任务管理API
@router.post("/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: int,
    task_type: str,
    current_user: User = Depends(get_current_user)
):
    """取消任务"""
    try:
        result = await task_scheduler.cancel_task(task_id, task_type)
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}/status")
async def get_task_status(task_id: int):
    """获取任务状态"""
    try:
        status = task_scheduler.get_task_status(task_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 统计API
@router.get("/stats")
async def get_scheduler_stats(current_user: User = Depends(get_current_user)):
    """获取调度器统计信息"""
    try:
        db = next(get_db())
        
        # 统计发帖计划
        total_schedules = db.query(PostSchedule).filter(
            PostSchedule.user_id == current_user.id
        ).count()
        
        pending_schedules = db.query(PostSchedule).filter(
            PostSchedule.user_id == current_user.id,
            PostSchedule.status == PostStatus.PENDING
        ).count()
        
        posted_schedules = db.query(PostSchedule).filter(
            PostSchedule.user_id == current_user.id,
            PostSchedule.status == PostStatus.POSTED
        ).count()
        
        # 统计搜索任务
        total_search_tasks = db.query(SearchTask).filter(
            SearchTask.user_id == current_user.id
        ).count()
        
        completed_search_tasks = db.query(SearchTask).filter(
            SearchTask.user_id == current_user.id,
            SearchTask.status == ModelTaskStatus.COMPLETED
        ).count()
        
        running_search_tasks = db.query(SearchTask).filter(
            SearchTask.user_id == current_user.id,
            SearchTask.status == ModelTaskStatus.RUNNING
        ).count()
        
        db.close()
        
        return {
            "schedules": {
                "total": total_schedules,
                "pending": pending_schedules,
                "posted": posted_schedules,
                "success_rate": (posted_schedules / total_schedules * 100) if total_schedules > 0 else 0
            },
            "search_tasks": {
                "total": total_search_tasks,
                "completed": completed_search_tasks,
                "running": running_search_tasks,
                "success_rate": (completed_search_tasks / total_search_tasks * 100) if total_search_tasks > 0 else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
