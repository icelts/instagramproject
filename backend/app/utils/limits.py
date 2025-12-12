import json
from datetime import datetime
from typing import Dict, Optional

import redis
from fastapi import Depends, HTTPException, status

from ..core.config import settings
from ..models.user import User
from .decorators import get_current_user

# 默认配额
DEFAULT_MAX_ACCOUNTS = 1
DEFAULT_MAX_COLLECT_PER_DAY = 100
DEFAULT_MAX_API_CALLS_PER_DAY = 1000


def _get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


def _today_key_suffix() -> str:
    return datetime.utcnow().strftime("%Y%m%d")


def get_user_limits(user_id: int) -> Dict[str, int]:
    """
    从 Redis 获取用户配额，若无配置则返回默认值。
    """
    r = _get_redis_client()
    raw = r.hgetall(f"user:limits:{user_id}")
    limits = {
        "max_accounts": DEFAULT_MAX_ACCOUNTS,
        "max_collect_per_day": DEFAULT_MAX_COLLECT_PER_DAY,
        "max_api_calls_per_day": DEFAULT_MAX_API_CALLS_PER_DAY,
    }
    for key in limits.keys():
        if key in raw:
            try:
                limits[key] = int(raw[key])
            except Exception:
                continue
    return limits


def set_user_limits(user_id: int, limits: Dict[str, int]) -> None:
    """
    存储用户配额到 Redis。
    """
    r = _get_redis_client()
    payload = {k: str(v) for k, v in limits.items() if v is not None}
    if payload:
        r.hset(f"user:limits:{user_id}", mapping=payload)


def enforce_api_quota(current_user: User = Depends(get_current_user)) -> None:
    """
    每个受保护接口的依赖：检查每日 API 调用上限。
    """
    user_id = current_user.id
    limits = get_user_limits(user_id)
    date_suffix = _today_key_suffix()
    key = f"user:{user_id}:api_calls:{date_suffix}"
    r = _get_redis_client()
    new_val = r.incr(key, 1)
    # 当天计数，过期时间设为 2 天，防止跨天遗留
    r.expire(key, 172800)
    if new_val > limits["max_api_calls_per_day"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="今日 API 调用已超出限制"
        )


def ensure_account_quota(user_id: int, current_count: int) -> None:
    limits = get_user_limits(user_id)
    if current_count >= limits["max_accounts"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"账号数量已达上限（{limits['max_accounts']}）"
        )


def add_collect_count(user_id: int, amount: int) -> None:
    """
    采集计数：如果超出上限则拒绝本次采集。
    """
    limits = get_user_limits(user_id)
    date_suffix = _today_key_suffix()
    key = f"user:{user_id}:collect:{date_suffix}"
    r = _get_redis_client()
    pipe = r.pipeline()
    pipe.incr(key, amount)
    pipe.expire(key, 172800)
    new_val, _ = pipe.execute()
    if new_val > limits["max_collect_per_day"]:
        # 回滚本次增加
        r.decr(key, amount)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="今日采集数量已超出限制"
        )


def get_usage_today(user_id: int) -> Dict[str, int]:
    """
    获取当天的 API 调用次数和采集数量（从 Redis 计数）。
    """
    r = _get_redis_client()
    suffix = _today_key_suffix()
    api_key = f"user:{user_id}:api_calls:{suffix}"
    collect_key = f"user:{user_id}:collect:{suffix}"
    api_calls = int(r.get(api_key) or 0)
    collects = int(r.get(collect_key) or 0)
    return {
        "api_calls_today": api_calls,
        "collect_today": collects,
    }
