"""
数据采集服务
实现Instagram用户数据采集和分析功能
"""

import asyncio
import json
import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
from urllib.parse import urlparse

from app.services.instagram_wrapper import instagram_operations
from app.models.search_task import SearchTask
from app.models.collected_user_data import CollectedUserData
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class DataCollector:
    """数据采集器"""
    
    def __init__(self):
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.phone_pattern = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    
    async def collect_user_data(self, search_task_id: int) -> Dict:
        """采集用户数据"""
        db = next(get_db())
        try:
            search_task = db.query(SearchTask).filter(SearchTask.id == search_task_id).first()
            if not search_task:
                return {'success': False, 'error': '搜索任务不存在'}
            
            # 获取Instagram账号
            account_id = search_task.instagram_account_id
            search_params = json.loads(search_task.search_params) if search_task.search_params else {}
            
            # 执行数据采集
            if search_task.search_type == 'hashtag':
                result = await self._collect_from_hashtag(account_id, search_task.search_query, search_params)
            elif search_task.search_type == 'location':
                result = await self._collect_from_location(account_id, search_task.search_query, search_params)
            elif search_task.search_type == 'username':
                result = await self._collect_from_username(account_id, search_task.search_query, search_params)
            elif search_task.search_type == 'keyword':
                result = await self._collect_by_keyword(account_id, search_task.search_query, search_params)
            else:
                result = {'success': False, 'error': f'不支持的搜索类型: {search_task.search_type}'}
            
            # 保存采集的数据
            if result.get('success') and result.get('users'):
                await self._save_collected_data(search_task_id, result['users'])
            
            # 更新任务状态
            if result.get('success'):
                search_task.status = 'completed'
                search_task.results = json.dumps(result.get('summary', {}))
                search_task.completed_at = datetime.utcnow()
            else:
                search_task.status = 'failed'
                search_task.error_message = result.get('error', '未知错误')
                search_task.completed_at = datetime.utcnow()
            
            db.commit()
            return result
            
        except Exception as e:
            logger.error(f"数据采集失败: {e}")
            
            # 更新任务状态
            if search_task:
                search_task.status = 'failed'
                search_task.error_message = str(e)
                search_task.completed_at = datetime.utcnow()
                db.commit()
            
            return {'success': False, 'error': str(e)}
        finally:
            db.close()
    
    async def _collect_from_hashtag(self, account_id: int, hashtag: str, params: Dict) -> Dict:
        """从标签采集数据"""
        try:
            amount = params.get('amount', 50)
            result = await instagram_operations.search_hashtag_posts(account_id, hashtag, amount)
            
            if not result.get('success'):
                return result
            
            posts = result.get('posts', [])
            users = []
            processed_usernames = set()
            
            for post in posts:
                username = post['user']['username']
                if username not in processed_usernames:
                    user_data = await self._extract_user_data(account_id, username, post)
                    if user_data:
                        users.append(user_data)
                        processed_usernames.add(username)
            
            return {
                'success': True,
                'users': users,
                'summary': {
                    'source_type': 'hashtag',
                    'source_query': hashtag,
                    'total_users': len(users),
                    'total_posts_analyzed': len(posts)
                }
            }
            
        except Exception as e:
            logger.error(f"从标签采集数据失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _collect_from_location(self, account_id: int, location: str, params: Dict) -> Dict:
        """从地理位置采集数据"""
        try:
            # 这里需要实现地理位置搜索
            # 暂时返回模拟数据
            return {
                'success': True,
                'users': [],
                'summary': {
                    'source_type': 'location',
                    'source_query': location,
                    'total_users': 0,
                    'message': '地理位置搜索功能待实现'
                }
            }
            
        except Exception as e:
            logger.error(f"从地理位置采集数据失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _collect_from_username(self, account_id: int, username: str, params: Dict) -> Dict:
        """从用户名采集数据"""
        try:
            # 获取用户信息
            user_info_result = await instagram_operations.get_user_info(account_id, username)
            if not user_info_result.get('success'):
                return user_info_result
            
            user_data = user_info_result.get('user')
            
            # 获取用户的帖子
            amount = params.get('amount', 20)
            medias_result = await instagram_operations.get_user_medias(account_id, username, amount)
            
            posts = medias_result.get('posts', []) if medias_result.get('success') else []
            
            # 提取联系信息
            contact_info = await self._extract_contact_info(user_data, posts)
            
            collected_user = {
                'instagram_username': username,
                'full_name': user_data.get('full_name'),
                'biography': user_data.get('biography'),
                'follower_count': user_data.get('follower_count'),
                'following_count': user_data.get('following_count'),
                'posts_count': user_data.get('posts_count'),
                'is_verified': user_data.get('is_verified'),
                'is_private': user_data.get('is_private'),
                'profile_pic_url': user_data.get('profile_pic_url'),
                'external_url': user_data.get('external_url'),
                'email': contact_info.get('email'),
                'phone': contact_info.get('phone'),
                'collected_data': {
                    'posts_analyzed': len(posts),
                    'contact_info': contact_info,
                    'analysis_time': datetime.utcnow().isoformat()
                }
            }
            
            return {
                'success': True,
                'users': [collected_user],
                'summary': {
                    'source_type': 'username',
                    'source_query': username,
                    'total_users': 1,
                    'posts_analyzed': len(posts)
                }
            }
            
        except Exception as e:
            logger.error(f"从用户名采集数据失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _collect_by_keyword(self, account_id: int, keyword: str, params: Dict) -> Dict:
        """通过关键词采集数据"""
        try:
            # 关键词搜索需要实现
            # 暂时返回模拟数据
            return {
                'success': True,
                'users': [],
                'summary': {
                    'source_type': 'keyword',
                    'source_query': keyword,
                    'total_users': 0,
                    'message': '关键词搜索功能待实现'
                }
            }
            
        except Exception as e:
            logger.error(f"通过关键词采集数据失败: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _extract_user_data(self, account_id: int, username: str, post_data: Dict) -> Optional[Dict]:
        """提取用户数据"""
        try:
            # 获取用户详细信息
            user_info_result = await instagram_operations.get_user_info(account_id, username)
            if not user_info_result.get('success'):
                return None
            
            user_data = user_info_result.get('user')
            
            # 从帖子中提取联系信息
            contact_info = await self._extract_contact_from_post(post_data)
            
            return {
                'instagram_username': username,
                'full_name': user_data.get('full_name'),
                'biography': user_data.get('biography'),
                'follower_count': user_data.get('follower_count'),
                'following_count': user_data.get('following_count'),
                'posts_count': user_data.get('posts_count'),
                'is_verified': user_data.get('is_verified'),
                'is_private': user_data.get('is_private'),
                'profile_pic_url': user_data.get('profile_pic_url'),
                'email': contact_info.get('email'),
                'phone': contact_info.get('phone'),
                'collected_data': {
                    'source_post': post_data.get('id'),
                    'contact_info': contact_info,
                    'analysis_time': datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"提取用户数据失败: {e}")
            return None
    
    async def _extract_contact_info(self, user_data: Dict, posts: List[Dict]) -> Dict:
        """提取联系信息"""
        emails = set()
        phones = set()
        
        # 从用户简介中提取
        biography = user_data.get('biography', '')
        bio_emails = self.email_pattern.findall(biography)
        bio_phones = self.phone_pattern.findall(biography)
        
        emails.update(bio_emails)
        phones.update(bio_phones)
        
        # 从外部URL中提取邮箱
        external_url = user_data.get('external_url', '')
        if external_url:
            url_emails = await self._extract_email_from_url(external_url)
            emails.update(url_emails)
        
        # 从帖子中提取
        for post in posts:
            caption = post.get('caption', '')
            post_emails = self.email_pattern.findall(caption)
            post_phones = self.phone_pattern.findall(caption)
            
            emails.update(post_emails)
            phones.update(post_phones)
        
        return {
            'email': list(emails) if emails else None,
            'phone': list(phones) if phones else None,
            'email_count': len(emails),
            'phone_count': len(phones)
        }
    
    async def _extract_contact_from_post(self, post_data: Dict) -> Dict:
        """从帖子中提取联系信息"""
        caption = post_data.get('caption', '')
        emails = self.email_pattern.findall(caption)
        phones = self.phone_pattern.findall(caption)
        
        return {
            'email': list(set(emails)) if emails else None,
            'phone': list(set(phones)) if phones else None,
            'email_count': len(set(emails)),
            'phone_count': len(set(phones))
        }
    
    async def _extract_email_from_url(self, url: str) -> List[str]:
        """从URL中提取邮箱"""
        try:
            # 这里可以实现网页抓取来提取邮箱
            # 暂时返回空列表
            return []
        except Exception as e:
            logger.error(f"从URL提取邮箱失败: {e}")
            return []
    
    async def _save_collected_data(self, search_task_id: int, users: List[Dict]):
        """保存采集的数据"""
        db = next(get_db())
        try:
            for user_data in users:
                collected_user = CollectedUserData(
                    search_task_id=search_task_id,
                    instagram_username=user_data.get('instagram_username'),
                    full_name=user_data.get('full_name'),
                    biography=user_data.get('biography'),
                    follower_count=user_data.get('follower_count'),
                    following_count=user_data.get('following_count'),
                    posts_count=user_data.get('posts_count'),
                    is_verified=user_data.get('is_verified', False),
                    is_private=user_data.get('is_private', False),
                    email=user_data.get('email'),
                    phone=user_data.get('phone'),
                    profile_pic_url=user_data.get('profile_pic_url'),
                    external_url=user_data.get('external_url'),
                    collected_data=json.dumps(user_data.get('collected_data', {}))
                )
                db.add(collected_user)
            
            db.commit()
            logger.info(f"保存了 {len(users)} 个用户的数据采集结果")
            
        except Exception as e:
            logger.error(f"保存采集数据失败: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def export_data(self, search_task_id: int, format_type: str = 'json') -> Dict:
        """导出采集的数据"""
        db = next(get_db())
        try:
            collected_data = db.query(CollectedUserData).filter(
                CollectedUserData.search_task_id == search_task_id
            ).all()
            
            if not collected_data:
                return {'success': False, 'error': '没有找到采集的数据'}
            
            if format_type.lower() == 'json':
                data = []
                for item in collected_data:
                    data.append({
                        'instagram_username': item.instagram_username,
                        'full_name': item.full_name,
                        'biography': item.biography,
                        'follower_count': item.follower_count,
                        'following_count': item.following_count,
                        'posts_count': item.posts_count,
                        'is_verified': item.is_verified,
                        'is_private': item.is_private,
                        'email': item.email,
                        'phone': item.phone,
                        'profile_pic_url': item.profile_pic_url,
                        'external_url': item.external_url,
                        'collected_data': json.loads(item.collected_data) if item.collected_data else {},
                        'created_at': item.created_at.isoformat() if item.created_at else None
                    })
                
                return {
                    'success': True,
                    'format': 'json',
                    'data': data,
                    'total_count': len(data)
                }
            
            elif format_type.lower() == 'csv':
                # CSV导出逻辑
                csv_data = "Instagram Username,Full Name,Biography,Followers,Following,Posts,Verified,Private,Email,Phone,Profile URL,External URL,Created At\n"
                
                for item in collected_data:
                    csv_data += f'"{item.instagram_username}","{item.full_name or ""}","{item.biography or ""}",{item.follower_count or 0},{item.following_count or 0},{item.posts_count or 0},{"Yes" if item.is_verified else "No"},{"Yes" if item.is_private else "No"},"{item.email or ""}","{item.phone or ""}","{item.profile_pic_url or ""}","{item.external_url or ""}","{item.created_at or ""}"\n'
                
                return {
                    'success': True,
                    'format': 'csv',
                    'data': csv_data,
                    'total_count': len(collected_data)
                }
            
            else:
                return {'success': False, 'error': f'不支持的导出格式: {format_type}'}
                
        except Exception as e:
            logger.error(f"导出数据失败: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()


class DataAnalyzer:
    """数据分析器"""
    
    async def analyze_collected_data(self, search_task_id: int) -> Dict:
        """分析采集的数据"""
        db = next(get_db())
        try:
            collected_data = db.query(CollectedUserData).filter(
                CollectedUserData.search_task_id == search_task_id
            ).all()
            
            if not collected_data:
                return {'success': False, 'error': '没有找到采集的数据'}
            
            total_users = len(collected_data)
            verified_users = sum(1 for u in collected_data if u.is_verified)
            private_users = sum(1 for u in collected_data if u.is_private)
            users_with_email = sum(1 for u in collected_data if u.email)
            users_with_phone = sum(1 for u in collected_data if u.phone)
            
            # 统计粉丝数分布
            follower_counts = [u.follower_count for u in collected_data if u.follower_count]
            avg_followers = sum(follower_counts) / len(follower_counts) if follower_counts else 0
            
            # 统计关注数分布
            following_counts = [u.following_count for u in collected_data if u.following_count]
            avg_following = sum(following_counts) / len(following_counts) if following_counts else 0
            
            # 统计发帖数分布
            post_counts = [u.posts_count for u in collected_data if u.posts_count]
            avg_posts = sum(post_counts) / len(post_counts) if post_counts else 0
            
            analysis = {
                'total_users': total_users,
                'verified_users': verified_users,
                'verified_percentage': (verified_users / total_users * 100) if total_users > 0 else 0,
                'private_users': private_users,
                'private_percentage': (private_users / total_users * 100) if total_users > 0 else 0,
                'users_with_contact_info': users_with_email + users_with_phone,
                'users_with_email': users_with_email,
                'users_with_phone': users_with_phone,
                'contact_percentage': ((users_with_email + users_with_phone) / total_users * 100) if total_users > 0 else 0,
                'follower_stats': {
                    'average': avg_followers,
                    'max': max(follower_counts) if follower_counts else 0,
                    'min': min(follower_counts) if follower_counts else 0
                },
                'following_stats': {
                    'average': avg_following,
                    'max': max(following_counts) if following_counts else 0,
                    'min': min(following_counts) if following_counts else 0
                },
                'post_stats': {
                    'average': avg_posts,
                    'max': max(post_counts) if post_counts else 0,
                    'min': min(post_counts) if post_counts else 0
                }
            }
            
            return {
                'success': True,
                'analysis': analysis,
                'search_task_id': search_task_id
            }
            
        except Exception as e:
            logger.error(f"分析采集数据失败: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            db.close()


# 全局实例
data_collector = DataCollector()
data_analyzer = DataAnalyzer()
