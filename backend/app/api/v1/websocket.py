"""
WebSocket API端点
处理实时通信连接
"""

import uuid
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional

from app.core.security import get_current_user_websocket
from app.models.user import User
from app.services.websocket_service import websocket_service, manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user_websocket)
):
    """WebSocket连接端点"""
    # 验证用户身份
    if not current_user or current_user.id != user_id:
        await websocket.close(code=4001, reason="身份验证失败")
        return
    
    # 生成唯一的WebSocket连接ID
    websocket_id = str(uuid.uuid4())
    
    try:
        # 建立连接
        await manager.connect(websocket, user_id, websocket_id)
        
        # 发送欢迎消息和用户信息
        await websocket_service.send_personal_message({
            "type": "welcome",
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email
            },
            "online_users": manager.get_connected_users(),
            "timestamp": "now"
        }, user_id, websocket_id)
        
        # 监听消息
        while True:
            try:
                # 接收客户端消息
                message = await websocket.receive_text()
                await websocket_service.handle_message(websocket, user_id, websocket_id, message)
                
            except WebSocketDisconnect:
                logger.info(f"用户 {user_id} 主动断开WebSocket连接")
                break
            except Exception as e:
                logger.error(f"处理WebSocket消息时出错: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"用户 {user_id} WebSocket连接断开")
    except Exception as e:
        logger.error(f"WebSocket连接错误: {e}")
    finally:
        # 清理连接
        manager.disconnect(user_id, websocket_id)

@router.get("/ws/status")
async def get_websocket_status():
    """获取WebSocket服务状态"""
    return {
        "status": "running",
        "connected_users": len(manager.get_connected_users()),
        "total_connections": sum(
            manager.get_user_connections(user_id) 
            for user_id in manager.get_connected_users()
        ),
        "online_users": manager.get_connected_users()
    }

@router.post("/ws/broadcast")
async def broadcast_message(
    message: dict,
    user_ids: Optional[list] = None,
    current_user: User = Depends(get_current_user_websocket)
):
    """广播消息到指定用户"""
    try:
        if user_ids:
            await websocket_service.broadcast_message(message, user_ids)
        else:
            await websocket_service.broadcast_message(message)
        
        return {
            "status": "success",
            "message": "消息已广播",
            "recipients": user_ids or "all"
        }
    except Exception as e:
        logger.error(f"广播消息失败: {e}")
        return {
            "status": "error",
            "message": "广播消息失败"
        }

@router.post("/ws/notify/{user_id}")
async def notify_user(
    user_id: int,
    message: dict,
    current_user: User = Depends(get_current_user_websocket)
):
    """向特定用户发送通知"""
    try:
        await websocket_service.send_personal_message(message, user_id)
        return {
            "status": "success",
            "message": f"通知已发送给用户 {user_id}"
        }
    except Exception as e:
        logger.error(f"发送用户通知失败: {e}")
        return {
            "status": "error",
            "message": "发送通知失败"
        }

@router.get("/ws/users/online")
async def get_online_users(current_user: User = Depends(get_current_user_websocket)):
    """获取在线用户列表"""
    return {
        "online_users": manager.get_connected_users(),
        "total_online": len(manager.get_connected_users())
    }

@router.get("/ws/users/{user_id}/status")
async def get_user_online_status(
    user_id: int,
    current_user: User = Depends(get_current_user_websocket)
):
    """检查用户在线状态"""
    is_online = websocket_service.is_user_online(user_id)
    connections_count = manager.get_user_connections(user_id)
    
    return {
        "user_id": user_id,
        "is_online": is_online,
        "connections_count": connections_count
    }
