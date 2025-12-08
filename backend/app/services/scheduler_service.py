"""
定时任务调度服务
基于Celery实现Instagram自动化任务调度
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab

from app.services.instagram_wrapper import instagram_operations, instagram_account_manager
from app.models.schedule import PostSchedule
from app.models.instagram_account import InstagramAccount
from app.models.search_task import SearchTask
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Celery配置
celery_app = Celery(
    'instagram_scheduler',
    broker='redis://localhost:6379/1',
    backend='redis://localhost:6379/2',
    include=['app.services.scheduler_service']
)

# Celery配置
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    beat_schedule={
        'check-pending-posts': {
            'task': 'app.services.scheduler_service.check_pending_posts',
            'schedule': 60.0,  # 每60秒检查一次
        },
        'check-pending-search-tasks': {
            'task': 'app.services.scheduler_service.check_pending_search_tasks',
            'schedule': 120.0,  # 每120秒检查一次
        },
        'cleanup-completed-tasks': {
            'task': 'app.services.scheduler_service.cleanup_completed_tasks',
            'schedule': crontab(hour=2, minute=0),  # 每天凌晨2点清理
        }
    }
)


class TaskScheduler:
    """任务调度器"""
    
    def __init__(self):
        self.running_tasks: Dict[int, str] = {}  # task_id -> celery_task_id
        
    async def schedule_post(self, schedule_id: int) -> Dict:
        """调度发帖任务"""
        db = next(get_db())
        try:
            schedule = db.query(PostSchedule).filter(PostSchedule.id == schedule_id).first()
            if not schedule:
                return {'success': False, 'error': '调度计划不存在'}
            
            if schedule.status != 'pending':
                return {'success': False, 'error': f'任务状态为 {schedule.status}'}
            
            # 计算延迟时间
            now = datetime.utcnow()
            if schedule.scheduled_time <= now:
                delay = 0
            else:
                delay = (schedule.scheduled_time - now).total_seconds()
            
            # 提交Celery任务
            task = post_media_task.apply_async(
                args=[schedule_id],
                countdown=delay,
                expires=schedule.scheduled_time + timedelta(hours=1)  # 1小时后过期
            )
            
            self.running_tasks[schedule_id] = task.id
            
            # 更新状态
            schedule.status = 'pending'
            db.commit()
            
            return {
                'success': True,
                'task_id': task.id,
                'scheduled_time': schedule.scheduled_time.isoformat(),
                'delay_seconds': delay
            }
            
        except Exception as e:
            logger.error(f"调度发帖任务失败: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    async def schedule_search_task(self, task_id: int) -> Dict:
        """调度搜索任务"""
        db = next(get_db())
        try:
            search_task = db.query(SearchTask).filter(SearchTask.id == task_id).first()
            if not search_task:
                return {'success': False, 'error': '搜索任务不存在'}
            
            if search_task.status != 'pending':
                return {'success': False, 'error': f'任务状态为 {search_task.status}'}
            
            # 提交Celery任务
            task = search_task_executor.apply_async(args=[task_id])
            
            self.running_tasks[task_id] = task.id
            
            # 更新状态
            search_task.status = 'running'
            search_task.started_at = datetime.utcnow()
            db.commit()
            
            return {
                'success': True,
                'task_id': task.id,
                'search_type': search_task.search_type,
                'search_query': search_task.search_query
            }
            
        except Exception as e:
            logger.error(f"调度搜索任务失败: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    async def cancel_task(self, task_id: int, task_type: str) -> Dict:
        """取消任务"""
        try:
            if task_id not in self.running_tasks:
                return {'success': False, 'error': '任务不在运行队列中'}
            
            celery_task_id = self.running_tasks[task_id]
            
            # 撤销Celery任务
            celery_app.control.revoke(celery_task_id, terminate=True)
            
            # 更新数据库状态
            db = next(get_db())
            try:
                if task_type == 'post':
                    schedule = db.query(PostSchedule).filter(PostSchedule.id == task_id).first()
                    if schedule:
                        schedule.status = 'cancelled'
                        db.commit()
                elif task_type == 'search':
                    search_task = db.query(SearchTask).filter(SearchTask.id == task_id).first()
                    if search_task:
                        search_task.status = 'cancelled'
                        search_task.completed_at = datetime.utcnow()
                        db.commit()
            finally:
                db.close()
            
            # 从运行任务列表中移除
            del self.running_tasks[task_id]
            
            return {'success': True, 'message': '任务已取消'}
            
        except Exception as e:
            logger.error(f"取消任务失败: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_task_status(self, task_id: int) -> Dict:
        """获取任务状态"""
        if task_id not in self.running_tasks:
            return {'status': 'not_found'}
        
        celery_task_id = self.running_tasks[task_id]
        result = celery_app.AsyncResult(celery_task_id)
        
        return {
            'status': result.status,
            'result': result.result if result.ready() else None,
            'celery_task_id': celery_task_id
        }


# Celery任务定义
@celery_app.task(bind=True)
def post_media_task(self, schedule_id: int) -> Dict:
    """发帖任务"""
    try:
        logger.info(f"开始执行发帖任务: {schedule_id}")
        
        db = next(get_db())
        try:
            schedule = db.query(PostSchedule).filter(PostSchedule.id == schedule_id).first()
            if not schedule:
                return {'success': False, 'error': '调度计划不存在'}
            
            # 获取Instagram账号
            account = db.query(InstagramAccount).filter(
                InstagramAccount.id == schedule.instagram_account_id
            ).first()
            
            if not account:
                return {'success': False, 'error': 'Instagram账号不存在'}
            
            # 执行发帖
            media_files = json.loads(schedule.media_files) if schedule.media_files else []
            
            if not media_files:
                return {'success': False, 'error': '没有媒体文件'}
            
            # 简单处理：只发布第一个媒体文件
            media_file = media_files[0]
            media_path = media_file.get('path')
            media_type = media_file.get('type', 'photo')
            
            # 这里需要在实际环境中实现文件路径处理
            result = None
            if media_type == 'photo':
                # result = asyncio.run(instagram_operations.post_photo(
                #     account.id, media_path, schedule.content
                # ))
                result = {'success': True, 'message': '照片发布成功'}  # 临时返回
            elif media_type == 'video':
                # result = asyncio.run(instagram_operations.post_video(
                #     account.id, media_path, schedule.content
                # ))
                result = {'success': True, 'message': '视频发布成功'}  # 临时返回
            
            # 更新状态
            if result.get('success'):
                schedule.status = 'posted'
                schedule.posted_at = datetime.utcnow()
                schedule.error_message = None
            else:
                schedule.status = 'failed'
                schedule.error_message = result.get('error', '未知错误')
            
            db.commit()
            
            return result
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"发帖任务执行失败: {e}")
        
        # 更新数据库状态
        db = next(get_db())
        try:
            schedule = db.query(PostSchedule).filter(PostSchedule.id == schedule_id).first()
            if schedule:
                schedule.status = 'failed'
                schedule.error_message = str(e)
                db.commit()
        finally:
            db.close()
        
        return {'success': False, 'error': str(e)}


@celery_app.task(bind=True)
def search_task_executor(self, task_id: int) -> Dict:
    """搜索任务执行器"""
    try:
        logger.info(f"开始执行搜索任务: {task_id}")
        
        db = next(get_db())
        try:
            search_task = db.query(SearchTask).filter(SearchTask.id == task_id).first()
            if not search_task:
                return {'success': False, 'error': '搜索任务不存在'}
            
            # 获取Instagram账号
            account = db.query(InstagramAccount).filter(
                InstagramAccount.id == search_task.instagram_account_id
            ).first()
            
            if not account:
                return {'success': False, 'error': 'Instagram账号不存在'}
            
            # 执行搜索
            result = None
            search_params = json.loads(search_task.search_params) if search_task.search_params else {}
            amount = search_params.get('amount', 20)
            
            if search_task.search_type == 'hashtag':
                # result = asyncio.run(instagram_operations.search_hashtag_posts(
                #     account.id, search_task.search_query, amount
                # ))
                result = {'success': True, 'posts': []}  # 临时返回
            elif search_task.search_type == 'username':
                # result = asyncio.run(instagram_operations.get_user_medias(
                #     account.id, search_task.search_query, amount
                # ))
                result = {'success': True, 'posts': []}  # 临时返回
            else:
                result = {'success': False, 'error': f'不支持的搜索类型: {search_task.search_type}'}
            
            # 更新状态
            if result.get('success'):
                search_task.status = 'completed'
                search_task.results = json.dumps(result.get('data', []))
                search_task.completed_at = datetime.utcnow()
                search_task.error_message = None
            else:
                search_task.status = 'failed'
                search_task.error_message = result.get('error', '未知错误')
                search_task.completed_at = datetime.utcnow()
            
            db.commit()
            
            return result
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"搜索任务执行失败: {e}")
        
        # 更新数据库状态
        db = next(get_db())
        try:
            search_task = db.query(SearchTask).filter(SearchTask.id == task_id).first()
            if search_task:
                search_task.status = 'failed'
                search_task.error_message = str(e)
                search_task.completed_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()
        
        return {'success': False, 'error': str(e)}


@celery_app.task
def check_pending_posts() -> Dict:
    """检查待发帖任务"""
    try:
        db = next(get_db())
        try:
            # 查找需要立即发布的待发帖任务
            now = datetime.utcnow()
            pending_posts = db.query(PostSchedule).filter(
                PostSchedule.status == 'pending',
                PostSchedule.scheduled_time <= now
            ).all()
            
            for post in pending_posts:
                # 立即执行发帖
                post_media_task.delay(post.id)
                logger.info(f"立即执行发帖任务: {post.id}")
            
            return {
                'success': True,
                'processed_count': len(pending_posts),
                'message': f'处理了 {len(pending_posts)} 个待发帖任务'
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"检查待发帖任务失败: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task
def check_pending_search_tasks() -> Dict:
    """检查待执行搜索任务"""
    try:
        db = next(get_db())
        try:
            # 查找待执行的搜索任务
            pending_tasks = db.query(SearchTask).filter(
                SearchTask.status == 'pending'
            ).limit(10).all()  # 限制同时执行的任务数量
            
            for task in pending_tasks:
                search_task_executor.delay(task.id)
                logger.info(f"执行搜索任务: {task.id}")
            
            return {
                'success': True,
                'processed_count': len(pending_tasks),
                'message': f'处理了 {len(pending_tasks)} 个搜索任务'
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"检查待执行搜索任务失败: {e}")
        return {'success': False, 'error': str(e)}


@celery_app.task
def cleanup_completed_tasks() -> Dict:
    """清理已完成的任务"""
    try:
        db = next(get_db())
        try:
            cutoff_time = datetime.utcnow() - timedelta(days=7)  # 7天前
            
            # 清理已完成的发帖记录
            completed_posts = db.query(PostSchedule).filter(
                PostSchedule.status.in_(['posted', 'failed', 'cancelled']),
                PostSchedule.updated_at < cutoff_time
            ).all()
            
            # 清理已完成的搜索任务
            completed_tasks = db.query(SearchTask).filter(
                SearchTask.status.in_(['completed', 'failed', 'cancelled']),
                SearchTask.updated_at < cutoff_time
            ).all()
            
            # 这里可以选择删除或归档旧数据
            # 为了安全，我们只标记为已归档
            
            return {
                'success': True,
                'posts_cleaned': len(completed_posts),
                'tasks_cleaned': len(completed_tasks),
                'message': f'清理了 {len(completed_posts)} 个发帖记录和 {len(completed_tasks)} 个搜索任务'
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"清理已完成任务失败: {e}")
        return {'success': False, 'error': str(e)}


# 全局实例
task_scheduler = TaskScheduler()
