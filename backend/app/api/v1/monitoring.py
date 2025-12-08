from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import asyncio

from ...core.database import get_db

# 创建路由器
router = APIRouter()


# Pydantic模型
class MessageLog(BaseModel):
    id: int
    thread_id: str
    sender_username: str
    message_content: str
    message_type: str
    is_incoming: bool
    is_auto_reply: bool
    created_at: str


class AutoReplyLog(BaseModel):
    id: int
    rule_name: str
    trigger_keyword: str
    reply_message: str
    thread_id: str
    sender_username: str
    created_at: str


class AccountStatus(BaseModel):
    account_id: int
    username: str
    login_status: str
    last_activity: Optional[str]
    is_online: bool
    error_count: int


class SystemStatus(BaseModel):
    service_name: str
    status: str
    last_check: str
    error_message: Optional[str] = None


# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict = {}  # user_id -> WebSocket

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # 移除断开的连接
                if connection in self.active_connections:
                    self.active_connections.remove(connection)


manager = ConnectionManager()


# 获取消息日志
@router.get("/messages", response_model=List[MessageLog])
async def get_message_logs(
    account_id: Optional[int] = None,
    thread_id: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """获取消息日志"""
    # 这里应该从数据库获取消息日志
    return [
        MessageLog(
            id=1,
            thread_id="thread123",
            sender_username="user1",
            message_content="你好",
            message_type="text",
            is_incoming=True,
            is_auto_reply=False,
            created_at="2025-12-09T00:00:00Z"
        )
    ]


@router.get("/messages/{message_id}")
async def get_message_detail(message_id: int):
    """获取消息详情"""
    # 这里应该从数据库获取消息详情
    return MessageLog(
        id=message_id,
        thread_id="thread123",
        sender_username="user1",
        message_content="你好",
        message_type="text",
        is_incoming=True,
        is_auto_reply=False,
        created_at="2025-12-09T00:00:00Z"
    )


# 获取自动回复日志
@router.get("/auto-reply-logs", response_model=List[AutoReplyLog])
async def get_auto_reply_logs(
    account_id: Optional[int] = None,
    limit: int = 100,
    skip: int = 0
):
    """获取自动回复日志"""
    # 这里应该从数据库获取自动回复日志
    return [
        AutoReplyLog(
            id=1,
            rule_name="默认回复",
            trigger_keyword="你好",
            reply_message="您好！很高兴为您服务",
            thread_id="thread123",
            sender_username="user1",
            created_at="2025-12-09T00:00:00Z"
        )
    ]


# 获取账号状态
@router.get("/account-status", response_model=List[AccountStatus])
async def get_account_status():
    """获取Instagram账号状态"""
    # 这里应该从数据库获取账号状态
    return [
        AccountStatus(
            account_id=1,
            username="example_user",
            login_status="logged_in",
            last_activity="2025-12-09T00:00:00Z",
            is_online=True,
            error_count=0
        )
    ]


@router.get("/account-status/{account_id}", response_model=AccountStatus)
async def get_single_account_status(account_id: int):
    """获取特定账号状态"""
    # 这里应该从数据库获取特定账号状态
    return AccountStatus(
        account_id=account_id,
        username="example_user",
        login_status="logged_in",
        last_activity="2025-12-09T00:00:00Z",
        is_online=True,
        error_count=0
    )


# 获取系统状态
@router.get("/system-status", response_model=List[SystemStatus])
async def get_system_status():
    """获取系统服务状态"""
    # 这里应该检查各个服务的状态
    return [
        SystemStatus(
            service_name="数据库",
            status="healthy",
            last_check="2025-12-09T00:00:00Z"
        ),
        SystemStatus(
            service_name="Redis缓存",
            status="healthy",
            last_check="2025-12-09T00:00:00Z"
        ),
        SystemStatus(
            service_name="Instagram API",
            status="healthy",
            last_check="2025-12-09T00:00:00Z"
        ),
        SystemStatus(
            service_name="MQTT客户端",
            status="healthy",
            last_check="2025-12-09T00:00:00Z"
        )
    ]


# 获取实时统计
@router.get("/realtime-stats")
async def get_realtime_stats():
    """获取实时统计信息"""
    # 这里应该从缓存或数据库获取实时统计
    return {
        "active_accounts": 5,
        "online_accounts": 4,
        "pending_messages": 12,
        "auto_replies_today": 25,
        "failed_logins_today": 1,
        "total_messages_today": 156
    }


# 获取错误日志
@router.get("/error-logs")
async def get_error_logs(
    service: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """获取错误日志"""
    # 这里应该从日志系统获取错误日志
    return [
        {
            "id": 1,
            "timestamp": "2025-12-09T00:00:00Z",
            "service": "Instagram API",
            "level": "ERROR",
            "message": "登录失败：账号被暂时限制",
            "details": {"account_id": 1, "error_code": "rate_limited"}
        },
        {
            "id": 2,
            "timestamp": "2025-12-09T00:05:00Z",
            "service": "MQTT客户端",
            "level": "WARNING",
            "message": "连接超时，正在重连",
            "details": {"attempt": 3, "max_attempts": 5}
        }
    ]


# WebSocket端点 - 实时监控
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket实时监控端点"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 处理不同类型的消息
            if message_data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.utcnow().isoformat()}))
            elif message_data.get("type") == "subscribe":
                # 订阅特定类型的通知
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "channel": message_data.get("channel"),
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# 发送实时通知
@router.post("/notify")
async def send_notification(
    user_id: str,
    message_type: str,
    message: str,
    data: Optional[dict] = None
):
    """发送实时通知给指定用户"""
    notification = {
        "type": "notification",
        "message_type": message_type,
        "message": message,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await manager.send_personal_message(json.dumps(notification), user_id)
    return {"message": "通知已发送"}


# 广播系统消息
@router.post("/broadcast")
async def broadcast_system_message(
    message_type: str,
    message: str,
    data: Optional[dict] = None
):
    """广播系统消息给所有连接的用户"""
    system_message = {
        "type": "system_message",
        "message_type": message_type,
        "message": message,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await manager.broadcast(json.dumps(system_message))
    return {"message": "系统消息已广播", "recipients": len(manager.active_connections)}


# 获取性能指标
@router.get("/performance-metrics")
async def get_performance_metrics():
    """获取系统性能指标"""
    # 这里应该从监控系统获取性能数据
    return {
        "cpu_usage": 45.2,
        "memory_usage": 62.8,
        "disk_usage": 35.1,
        "network_io": {
            "bytes_sent": 1024000,
            "bytes_received": 2048000
        },
        "response_times": {
            "api_avg": 120.5,
            "db_avg": 45.2,
            "cache_avg": 8.1
        },
        "active_connections": len(manager.active_connections),
        "last_updated": datetime.utcnow().isoformat()
    }


# 清理日志
@router.post("/cleanup-logs")
async def cleanup_logs(
    log_type: str,
    days_to_keep: int = 30
):
    """清理指定类型的旧日志"""
    # 这里应该清理数据库中的旧日志
    return {
        "message": f"{log_type}日志清理完成",
        "deleted_count": 1250,
        "days_kept": days_to_keep
    }
