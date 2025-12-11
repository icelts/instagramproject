from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from enum import Enum
import json
from datetime import datetime
import uuid

# 关闭内存模式，使用数据库持久化
USE_MEMORY = False
MEM_SCHEDULES = []
MEM_SEARCH_TASKS = []
SCHEDULE_ID_SEQ = 0
SEARCH_ID_SEQ = 0

from ...core.database import get_db
from ...services.scheduler_service import task_scheduler
from ...services.data_collector import data_collector, data_analyzer
from ...models.schedule import PostSchedule, PostStatus, RepeatType as ModelRepeatType
from ...models.search_task import SearchTask, TaskStatus as ModelTaskStatus
from ...models.instagram_account import InstagramAccount
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
    account_ids: List[int]
    task_name: str
    search_type: SearchType
    search_queries: List[str]
    limit_per_query: int = 20
    download_media: bool = False
    keep_hours: int = 24
    search_params: Optional[dict] = None


class SearchTaskResponse(BaseModel):
    id: int
    task_name: str
    search_type: SearchType
    search_queries: List[str]
    account_ids: List[int]
    limit_per_query: Optional[int] = None
    download_media: Optional[bool] = None
    keep_hours: Optional[int] = None
    status: TaskStatus
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    results: Optional[dict] = None


def _safe_json(raw):
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return {}


def _extract_queries(task: SearchTask) -> List[str]:
    params = _safe_json(task.search_params)
    if params.get("assigned_queries"):
        return params.get("assigned_queries") or []
    if params.get("search_queries"):
        return params.get("search_queries") or []
    if getattr(task, "search_query", None):
        return [task.search_query]
    return []


def _extract_account_ids(task: SearchTask) -> List[int]:
    params = _safe_json(task.search_params)
    if params.get("account_ids"):
        return params.get("account_ids") or []
    if getattr(task, "instagram_account_id", None):
        return [task.instagram_account_id]
    return []


def _extract_param(task: SearchTask, key: str):
    params = _safe_json(task.search_params)
    return params.get(key)


def _extract_results(task: SearchTask):
    if task.results is None:
        return None
    if isinstance(task.results, dict):
        return task.results
    try:
        return json.loads(task.results)
    except Exception:
        return task.results


# 发帖计划相关API
@router.get("/schedules", response_model=List[ScheduleResponse])
async def get_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取定时发帖计划列表"""
    if USE_MEMORY:
        return MEM_SCHEDULES
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
    if USE_MEMORY:
        global SCHEDULE_ID_SEQ
        SCHEDULE_ID_SEQ += 1
        new_item = {
            "id": SCHEDULE_ID_SEQ,
            "title": schedule_data.title,
            "content": schedule_data.content,
            "scheduled_time": schedule_data.scheduled_time.isoformat(),
            "repeat_type": schedule_data.repeat_type,
            "status": TaskStatus.PENDING,
            "posted_at": None,
            "created_at": datetime.utcnow().isoformat(),
        }
        MEM_SCHEDULES.append(new_item)
        return new_item
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
    if USE_MEMORY:
        schedule = next((s for s in MEM_SCHEDULES if s["id"] == schedule_id), None)
        if not schedule:
            raise HTTPException(status_code=404, detail="计划不存在")
        return schedule
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
    if USE_MEMORY:
        global MEM_SCHEDULES
        before = len(MEM_SCHEDULES)
        MEM_SCHEDULES = [s for s in MEM_SCHEDULES if s["id"] != schedule_id]
        if len(MEM_SCHEDULES) == before:
            raise HTTPException(status_code=404, detail="计划不存在")
        return {"message": "计划已删除"}
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
    if USE_MEMORY:
        return MEM_SEARCH_TASKS
    try:
        tasks = db.query(SearchTask).filter(
        SearchTask.user_id == current_user.id
        ).all()
        
        return [
            SearchTaskResponse(
                id=task.id,
                task_name=task.task_name,
                search_type=task.search_type,
                search_queries=_extract_queries(task),
                account_ids=_extract_account_ids(task),
                limit_per_query=_extract_param(task, "limit_per_query"),
                download_media=_extract_param(task, "download_media"),
                keep_hours=_extract_param(task, "keep_hours"),
                status=task.status,
                created_at=task.created_at.isoformat() if task.created_at else None,
                started_at=task.started_at.isoformat() if task.started_at else None,
                completed_at=task.completed_at.isoformat() if task.completed_at else None,
                results=_extract_results(task)
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
    if USE_MEMORY:
        global SEARCH_ID_SEQ
        SEARCH_ID_SEQ += 1
        mock_results = {
            "users": [
                {
                    "username": f"{q}_user1",
                    "full_name": "示例用户1",
                    "followers": 1200,
                    "following": 150,
                    "posts": 45,
                    "avatar": "https://picsum.photos/seed/ig1/200/200",
                }
                for q in task_data.search_queries
            ],
            "media": [
                {
                    "id": str(uuid.uuid4()),
                    "caption": f"{q} 样例贴文",
                    "image_url": "https://picsum.photos/seed/igpost/600/600",
                    "likes": 320,
                    "comments": 18,
                }
                for q in task_data.search_queries
            ],
        }
        new_task = {
            "id": SEARCH_ID_SEQ,
            "task_name": task_data.task_name,
            "search_type": task_data.search_type,
            "search_queries": task_data.search_queries,
            "account_ids": task_data.account_ids,
            "status": TaskStatus.COMPLETED,
            "created_at": datetime.utcnow().isoformat(),
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": datetime.utcnow().isoformat(),
            "results": mock_results,
        }
        MEM_SEARCH_TASKS.append(new_task)
        return new_task
    try:
        created_tasks = []
        extra_params = task_data.search_params or {}

        # 清洗输入
        cleaned_queries = [q.strip() for q in task_data.search_queries if q.strip()]
        if not cleaned_queries:
            raise HTTPException(status_code=400, detail="search_queries 不能为空")
        if not task_data.account_ids:
            raise HTTPException(status_code=400, detail="account_ids 不能为空")

        # 校验账号及代理绑定
        accounts = db.query(InstagramAccount).filter(
            InstagramAccount.user_id == current_user.id,
            InstagramAccount.id.in_(task_data.account_ids)
        ).all()
        if len(accounts) != len(task_data.account_ids):
            raise HTTPException(status_code=404, detail="存在无效的账号ID")
        for acc in accounts:
            if acc.proxy_id is None:
                raise HTTPException(status_code=400, detail=f"账号 {acc.username} 未绑定代理，无法并行采集")

        # 轮询分配搜索词到账号
        assignments = {acc.id: [] for acc in accounts}
        for idx, query in enumerate(cleaned_queries):
            target_acc = accounts[idx % len(accounts)]
            assignments[target_acc.id].append(query)

        for acc in accounts:
            assigned_queries = assignments.get(acc.id, [])
            if not assigned_queries:
                continue

            params_payload = {
                **extra_params,
                "account_ids": task_data.account_ids,
                "assigned_account_id": acc.id,
                "assigned_queries": assigned_queries,
                "search_queries": cleaned_queries,
                "limit_per_query": task_data.limit_per_query,
                "download_media": task_data.download_media,
                "keep_hours": task_data.keep_hours,
            }

            search_task = SearchTask(
                user_id=current_user.id,
                instagram_account_id=acc.id,
                task_name=task_data.task_name,
                search_type=task_data.search_type,
                search_query=";".join(assigned_queries),
                search_params=json.dumps(params_payload),
                status=ModelTaskStatus.PENDING,
                total_items=len(assigned_queries) * (task_data.limit_per_query or 0)
            )
            db.add(search_task)
            db.flush()
            created_tasks.append(search_task)
            background_tasks.add_task(
                data_collector.collect_user_data,
                search_task.id
            )
        db.commit()
        if not created_tasks:
            raise HTTPException(status_code=400, detail="没有可创建的任务，检查搜索词与账号分配")
        first = created_tasks[0]
        return SearchTaskResponse(
            id=first.id,
            task_name=first.task_name,
            search_type=first.search_type,
            search_queries=_extract_queries(first),
            account_ids=_extract_account_ids(first),
            limit_per_query=_extract_param(first, "limit_per_query"),
            download_media=_extract_param(first, "download_media"),
            keep_hours=_extract_param(first, "keep_hours"),
            status=first.status,
            created_at=first.created_at.isoformat() if first.created_at else None,
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
        search_queries=_extract_queries(task),
        account_ids=_extract_account_ids(task),
        limit_per_query=_extract_param(task, "limit_per_query"),
        download_media=_extract_param(task, "download_media"),
        keep_hours=_extract_param(task, "keep_hours"),
        status=task.status,
        created_at=task.created_at.isoformat() if task.created_at else None,
        started_at=task.started_at.isoformat() if task.started_at else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        results=_extract_results(task)
    )


@router.post("/search-tasks/{task_id}/export")
async def export_search_data(
    task_id: int,
    format_type: str = "json",
    current_user: User = Depends(get_current_user)
):
    """导出搜索结果数据"""
    if USE_MEMORY:
        task = next((t for t in MEM_SEARCH_TASKS if t["id"] == task_id), None)
        if not task:
            raise HTTPException(status_code=404, detail="搜索任务不存在")
        return {"success": True, "format": format_type, "data": task.get("results", {}), "task": task}
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
    if USE_MEMORY:
        task = next((t for t in MEM_SEARCH_TASKS if t["id"] == task_id), None)
        if not task:
            raise HTTPException(status_code=404, detail="搜索任务不存在")
        results = task.get("results", {})
        users = results.get("users", [])
        total_followers = sum(u.get("followers", 0) for u in users)
        return {
            "success": True,
            "users": len(users),
            "media": len(results.get("media", [])),
            "total_followers": total_followers,
        }
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
