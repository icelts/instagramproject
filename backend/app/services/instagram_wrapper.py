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

from app.models.instagram_account import InstagramAccount, LoginStatus
from app.models.instagram_account_stat import InstagramAccountStat
from app.models.proxy import ProxyConfig
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class InstagramAccountManager:
    """Instagram账号管理器"""
    
    def __init__(self):
        self.active_clients: Dict[int, Client] = {}
        self.login_status_cache: Dict[int, Dict] = {}

    def _generate_totp(self, secret: Optional[str]) -> Optional[str]:
        """根据 TOTP 秘钥生成验证码"""
        if not secret:
            return None
        import base64
        import hmac
        import hashlib
        import struct
        secret_clean = secret.replace(" ", "").upper()
        try:
            key = base64.b32decode(secret_clean + "=" * ((8 - len(secret_clean) % 8) % 8))
            counter = int(datetime.utcnow().timestamp() // 30)
            msg = struct.pack(">Q", counter)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            o = h[-1] & 0x0F
            code = (struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % (10 ** 6)
            return str(code).zfill(6)
        except Exception as exc:
            logger.warning(f"TOTP 生成失败: {exc}")
            return None
        
    async def add_account(self, account: InstagramAccount, proxy: Optional[ProxyConfig] = None, totp_code: Optional[str] = None) -> Client:
        """??Instagram??????"""
        try:
            client = Client()

            # ????
            if proxy:
                proxy_url = proxy.get_proxy_url_with_auth(proxy.password_decrypted) if proxy.password_decrypted else proxy.get_proxy_url()
                client.set_proxy(proxy_url)
                logger.info(f"??? {account.username} ????: {proxy_url}")

            # ????????? session/cookie ????????????? two_factor_secret ??? totp_code ????
            stored_secret: Optional[str] = None
            if account.session_data:
                try:
                    settings = json.loads(account.session_data)
                    if isinstance(settings, dict):
                        stored_secret = settings.get("two_factor_secret")
                        has_session = any(k in settings for k in ("session_id", "sessionid", "authorization_data", "cookies"))
                        if has_session:
                            client.set_settings(settings)
                            session_id = settings.get("session_id") or settings.get("sessionid")
                            if session_id:
                                client.login_by_sessionid(session_id)
                                logger.info(f"?? {account.username} ??????")
                            else:
                                await self._login_account(client, account, two_factor_secret=stored_secret, totp_code=totp_code)
                        else:
                            await self._login_account(client, account, two_factor_secret=stored_secret, totp_code=totp_code)
                    else:
                        await self._login_account(client, account, two_factor_secret=stored_secret, totp_code=totp_code)
                except Exception as e:
                    logger.warning(f"????????????: {e}")
                    await self._login_account(client, account, two_factor_secret=stored_secret, totp_code=totp_code)
            else:
                await self._login_account(client, account, two_factor_secret=None, totp_code=totp_code)

            # ?????
            self.active_clients[account.id] = client

            # ??????
            await self._update_login_status(account.id, True, None)

            return client

        except Exception as e:
            logger.error(f"登录 {account.username} 失败: {e}")
            await self._update_login_status(account.id, False, str(e))
            raise

    async def _login_account(self, client: Client, account: InstagramAccount, two_factor_secret: Optional[str] = None, totp_code: Optional[str] = None) -> bool:
        """??Instagram??"""
        try:
            # ?????????? totp_code????????? two_factor_secret ??
            secret_source = two_factor_secret
            verification_code = totp_code
            if verification_code is None:
                if account.session_data and secret_source is None:
                    try:
                        data = json.loads(account.session_data)
                        if isinstance(data, dict):
                            secret_source = data.get("two_factor_secret")
                    except Exception:
                        secret_source = None
                verification_code = self._generate_totp(secret_source)

            # ????
            client.login(
                username=account.username,
                password=account.password_decrypted,
                verification_code=verification_code
            )

            # ??????
            session_data = client.get_settings()
            if secret_source:
                session_data["two_factor_secret"] = secret_source

            # ???????????
            db = next(get_db())
            try:
                account.session_data = json.dumps(session_data)
                account.last_login = datetime.utcnow()
                db.commit()
                logger.info(f"?? {account.username} ??????????")
            finally:
                db.close()

            return True

        except ChallengeRequired as e:
            logger.error(f"登录 {account.username} 时触发验证: {e}")
            await self._update_login_status(account.id, False, str(e), LoginStatus.CHALLENGE_REQUIRED.value)
            raise
        except Exception as e:
            logger.error(f"登录 {account.username} 失败: {e}")
            raise

    async def check_login_status(self, account_id: int) -> Dict:
        """????????"""
        if account_id in self.login_status_cache:
            cache_time = self.login_status_cache[account_id].get('timestamp')
            if cache_time and (datetime.utcnow() - cache_time).seconds < 300:  # 5????
                return self.login_status_cache[account_id]
        
        client = self.active_clients.get(account_id)
        if not client:
            return {
                'logged_in': False,
                'status': 'logged_out',
                'message': '???????'
            }
        
        try:
            # ??????????????????????????
            if hasattr(client, "user_info_by_username"):
                user_info = client.user_info_by_username(client.username)
            else:
                user_info = client.user_info_from_username(client.username)
            status = {
                'logged_in': True,
                'status': 'logged_in',
                'username': user_info.username,
                'full_name': user_info.full_name,
                'followers': user_info.follower_count,
                'following': user_info.following_count,
                'posts': getattr(user_info, "media_count", None),
                'timestamp': datetime.utcnow()
            }
            try:
                await self._record_stats(account_id, user_info.follower_count, getattr(user_info, "media_count", 0))
            except Exception as stat_exc:
                logger.warning(f"??????: {stat_exc}")
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
    
    async def _update_login_status(self, account_id: int, is_logged_in: bool, error_message: str = None, login_status_value: Optional[str] = None):
        """更新登录状态到数据库"""
        db = next(get_db())
        try:
            account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
            if account:
                if is_logged_in:
                    account.login_status = login_status_value or LoginStatus.LOGGED_IN.value
                    account.last_login = datetime.utcnow()
                else:
                    account.login_status = login_status_value or LoginStatus.LOGGED_OUT.value
                db.commit()
        finally:
            db.close()


    async def _record_stats(self, account_id: int, followers: int, posts: int):
        """?????????????"""
        db = next(get_db())
        try:
            today = datetime.utcnow().date()
            stat = (
                db.query(InstagramAccountStat)
                .filter(InstagramAccountStat.account_id == account_id, InstagramAccountStat.stat_date == today)
                .first()
            )
            if stat:
                stat.followers_count = followers
                stat.posts_count = posts
            else:
                stat = InstagramAccountStat(
                    account_id=account_id,
                    stat_date=today,
                    followers_count=followers,
                    posts_count=posts,
                )
                db.add(stat)
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
        except ChallengeRequired as e:
            await self.account_manager._update_login_status(account_id, False, str(e), LoginStatus.CHALLENGE_REQUIRED.value)
            return {'success': False, 'challenge_required': True, 'error': '需要人工验证/挑战'}
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
            # 部分版本方法名不同，逐个尝试
            if hasattr(client, "user_info_by_username"):
                user = client.user_info_by_username(username)
            elif hasattr(client, "user_info_from_username"):
                user = client.user_info_from_username(username)
            else:
                user_id = client.user_id_from_username(username)
                user = client.user_info(user_id)
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
        except ChallengeRequired as e:
            await self.account_manager._update_login_status(account_id, False, str(e), LoginStatus.CHALLENGE_REQUIRED.value)
            return {'success': False, 'challenge_required': True, 'error': '需要人工验证/挑战'}
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
        except ChallengeRequired as e:
            await self.account_manager._update_login_status(account_id, False, str(e), LoginStatus.CHALLENGE_REQUIRED.value)
            return {'success': False, 'challenge_required': True, 'error': '需要人工验证/挑战'}
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

    async def send_direct_message(self, account_id: int, usernames: List[str], text: str) -> Dict:
        """发送私信/Direct Message"""
        client = await self.account_manager.get_client(account_id)
        if not client:
            raise ValueError(f"账号 {account_id} 的客户端未初始化")
        if not usernames:
            return {'success': False, 'error': '收件人列表不能为空'}
        try:
            user_ids = [client.user_id_from_username(u) for u in usernames]
            dm = client.direct_send(text=text, user_ids=user_ids)
            return {
                'success': True,
                'thread_id': getattr(dm, "thread_id", None) or getattr(dm, "id", None),
                'message_id': getattr(dm, "id", None) or getattr(dm, "pk", None),
                'recipients': usernames,
            }
        except ChallengeRequired as e:
            await self.account_manager._update_login_status(account_id, False, str(e), LoginStatus.CHALLENGE_REQUIRED.value)
            return {'success': False, 'challenge_required': True, 'error': '需要人工验证挑战'}
        except UserNotFound as e:
            return {'success': False, 'error': f"收件人不存在: {e}"}
        except Exception as e:
            logger.error(f"发送私信失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# 全局实例
instagram_account_manager = InstagramAccountManager()
instagram_operations = InstagramOperations(instagram_account_manager)
