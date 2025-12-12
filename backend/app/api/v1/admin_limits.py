from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from ...utils.decorators import get_current_user
from ...models.user import User
from ...utils.limits import (
    get_user_limits,
    set_user_limits,
    get_usage_today,
    enforce_api_quota,
    DEFAULT_MAX_ACCOUNTS,
    DEFAULT_MAX_COLLECT_PER_DAY,
    DEFAULT_MAX_API_CALLS_PER_DAY,
)


class LimitUpdate(BaseModel):
    max_accounts: Optional[int] = None
    max_collect_per_day: Optional[int] = None
    max_api_calls_per_day: Optional[int] = None


def _ensure_admin(current_user: User):
    admin_usernames = ['admin', 'administrator', 'root']
    if current_user.username not in admin_usernames:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")


router = APIRouter(
    dependencies=[Depends(enforce_api_quota)],
)


@router.get("/limits/{user_id}")
async def get_limits(user_id: int, current_user: User = Depends(get_current_user)):
    _ensure_admin(current_user)
    limits = get_user_limits(user_id)
    return limits


@router.put("/limits/{user_id}")
async def update_limits(
    user_id: int,
    payload: LimitUpdate,
    current_user: User = Depends(get_current_user)
):
    _ensure_admin(current_user)
    update_data = get_user_limits(user_id)
    if payload.max_accounts is not None:
        if payload.max_accounts <= 0:
            raise HTTPException(status_code=400, detail="max_accounts 必须为正整数")
        update_data["max_accounts"] = payload.max_accounts
    if payload.max_collect_per_day is not None:
        if payload.max_collect_per_day < 0:
            raise HTTPException(status_code=400, detail="max_collect_per_day 必须为非负整数")
        update_data["max_collect_per_day"] = payload.max_collect_per_day
    if payload.max_api_calls_per_day is not None:
        if payload.max_api_calls_per_day <= 0:
            raise HTTPException(status_code=400, detail="max_api_calls_per_day 必须为正整数")
        update_data["max_api_calls_per_day"] = payload.max_api_calls_per_day
    set_user_limits(user_id, update_data)
    return update_data


@router.get("/limits/{user_id}/usage")
async def get_limits_usage(user_id: int, current_user: User = Depends(get_current_user)):
    _ensure_admin(current_user)
    usage = get_usage_today(user_id)
    return usage
