"""
Instagram服务包装器
基于instagrapi库实现Instagram操作封装
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from instagrapi import Client
from instagrapi.exceptions import (
    LoginRequired,
    ChallengeRequired,
    RecaptchaChallengeForm,
    FeedbackRequired,
    PleaseWaitFewMinutes,
    PrivateError,
    MediaNotFound,
    UserNotFound
)

from app.models.instagram_account import InstagramAccount
from app.models.proxy import ProxyConfig
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class InstagramAccountManager:
    """Instagram账号管理器"""
    
    def __init__(self):
        self.active_clients: Dict[int, Client] = {}
        self.login_status_cache: Dict[int, Dict] = {}
        
    async def add_account(self, account: InstagramAccount, proxy: Optional[ProxyConfig] = None) -> Client:
        """添加Instagram账号到管理器"""
        try:
            client = Client()
            
            # 设置代理
            if proxy:
                proxy_settings = {
                    "host": proxy.host,
                    "port": proxy.port,
                    "username": proxy.username,
                    "password": proxy.password_decrypted,
                    "proxy_type": proxy.proxy_type
                }
                client.set_proxy(proxy_settings)
                logger.info(f"为账号 {account.username} 设置代理: {proxy.host}:{proxy.port}")
            
            # 加载会话数据
            if account.session_data:
                try:
                    client.set_settings(json.loads(account.session_data))
                    client.login_by_sessionid(account.session_data.get('session_id'))
                    logger.info(f"账号 {account.username} 会话恢复成功")
                except Exception as e:
                    logger.warning(f"会话恢复失败，将重新登录: {e}")
                    await self._login_account(client, account)
            else:
                await self._login_account(client, account)
            
            # 存储客户端
            self.active_clients[account.id] = client
            
            # 更新登录状态
            await self._update_login_status(account.id, True, None)
            
            return client
            
        except Exception as e:
            logger.error(f"添加账号 {account.username} 失败: {e}")
            await self._update_login_status(account.id, False, str(e))
            raise
    
    async def _login_account(self, client: Client, account: InstagramAccount) -> bool:
        """登录Instagram账号"""
        try:
            # 尝试登录
            client.login(
                username=account.username,
                password=account.password_decrypted
            )
            
            # 保存会话数据
            session_data = client.get_settings()
            
            # 更新数据库中的会话数据
            db = next(get_db())
            try:
                account.session_data = json.dumps(session_data)
                account.last_login = datetime.utcnow()
                db.commit()
                logger.info(f"账号 {account.username} 登录成功，会话已保存")
            finally:
                db.close()
                
            return True
            
        except ChallengeRequired as e:
            logger.error(f"账号 {account.username} 需要验证挑战: {e}")
            raise
        except AccountSuspended as e:
            logger.error(f"账号 {account.username} 已被暂停: {e}")
            raise
        except Exception as e:
            logger.error(f"账号 {account.username} 登录失败: {e}")
            raise
    
    async def check_login_status(self, account_id: int) -> Dict:
        """检查账号登录状态"""
        if account_id in self.login_status_cache:
            cache_time = self.login_status_cache[account_id].get('timestamp')
            if cache_time and (datetime.utcnow() - cache_time).seconds < 300:  # 5分钟缓存
                return self.login_status_cache[account_id]
        
        client = self.active_clients.get(account_id)
        if not client:
            return {
                'logged_in': False,
                'status': 'logged_out',
                'message': '客户端未初始化'
            }
        
        try:
            # 尝试获取用户信息来验证登录状态
            user_info = client.user_info_from_username(client.username)
            status = {
                'logged_in': True,
                'status': 'logged_in',
                'username': user_info.username,
                'full_name': user_info.full_name,
                'followers': user_info.follower_count,
                'following': user_info.following_count,
                'timestamp': datetime.utcnow()
            }
        except Exception as e:
            status = {
                'logged_in': False,
                'status': 'logged_out',
                'message': str(e),
                'timestamp': datetime.utcnow()
            }
        
        self.login_status_cache[account_id] = status
        return status
    
    async def get_client(self, account_id: int) -> Optional[Client]:
        """获取Instagram客户端"""
        return self.active_clients.get(account_id)
    
    async def remove_account(self, account_id: int):
        """移除账号"""
        if account_id in self.active_clients:
            client = self.active_clients[account_id]
            try:
                client.logout()
            except:
                pass
            del self.active_clients[account_id]
        
        if account_id in self.login_status_cache:
            del self.login_status_cache[account_id]
    
    async def _update_login_status(self, account_id: int, is_logged_in: bool, error_message: str = None):
        """更新登录状态到数据库"""
        db = next(get_db())
        try:
            account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
            if account:
                if is_logged_in:
                    account.login_status = 'logged_in'
                    account.last_login = datetime.utcnow()
                    account.error_message = None
                else:
                    account.login_status = 'logged_out'
                    account.error_message = error_message
                db.commit()
        finally:
            db.close()


class InstagramOperations:
    """Instagram操作服务"""
    
    def __init__(self, account_manager: InstagramAccountManager):
        self.account_manager = account_manager
    
    async def post_photo(self, account_id: int, photo_path: str, caption: str) -> Dict:
        """发布照片"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            media = client.photo_upload(photo_path, caption)
            return {
                'success': True,
                'media_id': media.id,
                'media_url': media.thumbnail_url,
                'caption': caption
            }
        except Exception as e:
            logger.error(f"发布照片失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def post_video(self, account_id: int, video_path: str, caption: str) -> Dict:
        """发布视频"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            media = client.video_upload(video_path, caption)
            return {
                'success': True,
                'media_id': media.id,
                'media_url': media.video_url,
                'caption': caption
            }
        except Exception as e:
            logger.error(f"发布视频失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_user_info(self, account_id: int, username: str) -> Dict:
        """获取用户信息"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            user = client.user_info_from_username(username)
            return {
                'success': True,
                'user': {
                    'id': user.pk,
                    'username': user.username,
                    'full_name': user.full_name,
                    'biography': user.biography,
                    'follower_count': user.follower_count,
                    'following_count': user.following_count,
                    'posts_count': user.media_count,
                    'is_verified': user.is_verified,
                    'is_private': user.is_private,
                    'profile_pic_url': user.profile_pic_url
                }
            }
        except UserNotFound:
            return {
                'success': False,
                'error': f"用户 {username} 不存在"
            }
        except Exception as e:
            logger.error(f"获取用户信息失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def search_hashtag_posts(self, account_id: int, hashtag: str, amount: int = 20) -> Dict:
        """搜索标签帖子"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            medias = client.hashtag_medias_recent(hashtag, amount=amount)
            posts = []
            
            for media in medias:
                post_data = {
                    'id': media.id,
                    'code': media.code,
                    'caption': media.caption_text,
                    'like_count': media.like_count,
                    'comment_count': media.comment_count,
                    'user': {
                        'username': media.user.username,
                        'full_name': media.user.full_name,
                        'profile_pic_url': media.user.profile_pic_url
                    },
                    'media_url': media.thumbnail_url if media.media_type == 1 else media.video_url,
                    'media_type': 'photo' if media.media_type == 1 else 'video',
                    'taken_at': media.taken_at.isoformat() if media.taken_at else None
                }
                posts.append(post_data)
            
            return {
                'success': True,
                'posts': posts,
                'total': len(posts)
            }
            
        except Exception as e:
            logger.error(f"搜索标签帖子失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_user_medias(self, account_id: int, username: str, amount: int = 20) -> Dict:
        """获取用户媒体"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            user_id = client.user_id_from_username(username)
            medias = client.user_medias(user_id, amount=amount)
            
            posts = []
            for media in medias:
                post_data = {
                    'id': media.id,
                    'code': media.code,
                    'caption': media.caption_text,
                    'like_count': media.like_count,
                    'comment_count': media.comment_count,
                    'media_url': media.thumbnail_url if media.media_type == 1 else media.video_url,
                    'media_type': 'photo' if media.media_type == 1 else 'video',
                    'taken_at': media.taken_at.isoformat() if media.taken_at else None
                }
                posts.append(post_data)
            
            return {
                'success': True,
                'posts': posts,
                'total': len(posts)
            }
            
        except UserNotFound:
            return {
                'success': False,
                'error': f"用户 {username} 不存在"
            }
        except PrivateError:
            return {
                'success': False,
                'error': f"用户 {username} 的账号是私密的"
            }
        except Exception as e:
            logger.error(f"获取用户媒体失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def follow_user(self, account_id: int, username: str) -> Dict:
        """关注用户"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            user_id = client.user_id_from_username(username)
            client.user_follow(user_id)
            return {
                'success': True,
                'message': f"成功关注用户 {username}"
            }
        except UserNotFound:
            return {
                'success': False,
                'error': f"用户 {username} 不存在"
            }
        except Exception as e:
            logger.error(f"关注用户失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def unfollow_user(self, account_id: int, username: str) -> Dict:
        """取消关注用户"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        
        try:
            user_id = client.user_id_from_username(username)
            client.user_unfollow(user_id)
            return {
                'success': True,
                'message': f"成功取消关注用户 {username}"
            }
        except UserNotFound:
            return {
                'success': False,
                'error': f"用户 {username} 不存在"
            }
        except Exception as e:
            logger.error(f"取消关注用户失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# 全局实例
instagram_account_manager = InstagramAccountManager()
instagram_operations = InstagramOperations(instagram_account_manager)
