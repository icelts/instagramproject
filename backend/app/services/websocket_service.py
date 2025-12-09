"""
WebSocket服务模块
处理实时消息推送和客户端连接管理
"""

import json
import asyncio
import logging
from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        # 存储活跃连接 {user_id: {websocket_id: websocket}}
        self.active_connections: Dict[int, Dict[str, WebSocket]] = {}
        # 存储用户ID到WebSocket ID的映射
        self.user_to_sockets: Dict[int, Set[str]] = {}
        # 存储WebSocket ID到用户ID的映射
        self.socket_to_user: Dict[str, int] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int, websocket_id: str):
        """建立WebSocket连接"""
        await websocket.accept()
        
        # 添加到活跃连接
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
            self.user_to_sockets[user_id] = set()
        
        self.active_connections[user_id][websocket_id] = websocket
        self.user_to_sockets[user_id].add(websocket_id)
        self.socket_to_user[websocket_id] = user_id
        
        logger.info(f"用户 {user_id} WebSocket连接已建立 (ID: {websocket_id})")
        
        # 发送连接成功消息
        await self.send_personal_message({
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.now().isoformat(),
            "websocket_id": websocket_id
        }, user_id, websocket_id)
    
    def disconnect(self, user_id: int, websocket_id: str):
        """断开WebSocket连接"""
        try:
            if user_id in self.active_connections:
                if websocket_id in self.active_connections[user_id]:
                    del self.active_connections[user_id][websocket_id]
                
                if websocket_id in self.user_to_sockets[user_id]:
                    self.user_to_sockets[user_id].remove(websocket_id)
                
                # 如果用户没有其他连接，清理用户记录
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    del self.user_to_sockets[user_id]
            
            if websocket_id in self.socket_to_user:
                del self.socket_to_user[websocket_id]
                
            logger.info(f"用户 {user_id} WebSocket连接已断开 (ID: {websocket_id})")
            
        except Exception as e:
            logger.error(f"断开WebSocket连接时出错: {e}")
    
    async def send_personal_message(self, message: dict, user_id: int, websocket_id: Optional[str] = None):
        """发送个人消息"""
        try:
            message_str = json.dumps(message, ensure_ascii=False, default=str)
            
            if websocket_id and user_id in self.active_connections:
                # 发送到指定WebSocket
                if websocket_id in self.active_connections[user_id]:
                    await self.active_connections[user_id][websocket_id].send_text(message_str)
            else:
                # 发送到用户的所有WebSocket连接
                if user_id in self.active_connections:
                    disconnected = []
                    for ws_id, websocket in self.active_connections[user_id].items():
                        try:
                            await websocket.send_text(message_str)
                        except:
                            disconnected.append(ws_id)
                    
                    # 清理断开的连接
                    for ws_id in disconnected:
                        self.disconnect(user_id, ws_id)
                        
        except Exception as e:
            logger.error(f"发送个人消息失败: {e}")
    
    async def broadcast_to_users(self, message: dict, user_ids: List[int]):
        """广播消息到指定用户列表"""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    async def broadcast_to_all(self, message: dict):
        """广播消息到所有连接的用户"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)
    
    def get_connected_users(self) -> List[int]:
        """获取所有连接的用户ID"""
        return list(self.active_connections.keys())
    
    def get_user_connections(self, user_id: int) -> int:
        """获取用户的连接数量"""
        return len(self.active_connections.get(user_id, {}))
    
    def is_user_connected(self, user_id: int) -> bool:
        """检查用户是否在线"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

# 全局连接管理器实例
manager = ConnectionManager()

class WebSocketService:
    """WebSocket服务类"""
    
    def __init__(self):
        self.manager = manager
    
    async def handle_message(self, websocket: WebSocket, user_id: int, websocket_id: str, message: str):
        """处理接收到的WebSocket消息"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            if message_type == "ping":
                # 心跳响应
                await self.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }, user_id, websocket_id)
                
            elif message_type == "subscribe":
                # 订阅特定频道
                channel = data.get("channel")
                await self.handle_subscribe(user_id, websocket_id, channel)
                
            elif message_type == "unsubscribe":
                # 取消订阅
                channel = data.get("channel")
                await self.handle_unsubscribe(user_id, websocket_id, channel)
                
            else:
                logger.warning(f"未知消息类型: {message_type}")
                
        except json.JSONDecodeError:
            logger.error(f"无效的JSON消息: {message}")
        except Exception as e:
            logger.error(f"处理WebSocket消息时出错: {e}")
    
    async def handle_subscribe(self, user_id: int, websocket_id: str, channel: str):
        """处理订阅请求"""
        # 这里可以实现订阅逻辑，比如存储用户的订阅信息
        await self.send_personal_message({
            "type": "subscribed",
            "channel": channel,
            "timestamp": datetime.now().isoformat()
        }, user_id, websocket_id)
    
    async def handle_unsubscribe(self, user_id: int, websocket_id: str, channel: str):
        """处理取消订阅请求"""
        await self.send_personal_message({
            "type": "unsubscribed",
            "channel": channel,
            "timestamp": datetime.now().isoformat()
        }, user_id, websocket_id)
    
    async def send_personal_message(self, message: dict, user_id: int, websocket_id: Optional[str] = None):
        """发送个人消息的包装方法"""
        await self.manager.send_personal_message(message, user_id, websocket_id)
    
    async def broadcast_message(self, message: dict, user_ids: List[int] = None):
        """广播消息"""
        if user_ids:
            await self.manager.broadcast_to_users(message, user_ids)
        else:
            await self.manager.broadcast_to_all(message)
    
    async def send_new_message_notification(self, message_data: dict, user_ids: List[int]):
        """发送新消息通知"""
        notification = {
            "type": "new_message",
            "data": message_data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_message(notification, user_ids)
    
    async def send_auto_reply_notification(self, reply_data: dict, user_ids: List[int]):
        """发送自动回复通知"""
        notification = {
            "type": "auto_reply",
            "data": reply_data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_message(notification, user_ids)
    
    async def send_task_status_update(self, task_data: dict, user_ids: List[int]):
        """发送任务状态更新通知"""
        notification = {
            "type": "task_update",
            "data": task_data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_message(notification, user_ids)
    
    async def send_account_status_update(self, account_data: dict, user_ids: List[int]):
        """发送账号状态更新通知"""
        notification = {
            "type": "account_update",
            "data": account_data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast_message(notification, user_ids)
    
    def is_user_online(self, user_id: int) -> bool:
        """检查用户是否在线"""
        return self.manager.is_user_connected(user_id)
    
    def get_online_users(self) -> List[int]:
        """获取在线用户列表"""
        return self.manager.get_connected_users()

# 全局WebSocket服务实例
websocket_service = WebSocketService()
