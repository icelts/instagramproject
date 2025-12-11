import json
from datetime import datetime
from typing import List, Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
import logging

from ...core.database import get_db
from ...models.instagram_account import InstagramAccount, LoginStatus
from ...models.instagram_account_stat import InstagramAccountStat
from ...models.proxy import ProxyConfig, ProxyType
from ...utils.decorators import get_current_user
from ...services.instagram_wrapper import instagram_account_manager, instagram_operations

router = APIRouter()
logger = logging.getLogger(__name__)


class InstagramAccountCreate(BaseModel):
    username: str
    password: str
    two_factor_secret: Optional[str] = None
    proxy_id: Optional[int] = None
    is_active: bool = True


class InstagramAccountResponse(BaseModel):
    id: int
    username: str
    login_status: LoginStatus
    last_login: Optional[str]
    is_active: bool
    created_at: str
    proxy_id: Optional[int] = None
    two_factor_secret: Optional[str] = None
    followers: Optional[int] = None
    posts: Optional[int] = None
    followers_change: Optional[int] = None


class AccountStatResponse(BaseModel):
    stat_date: str
    followers_count: int
    posts_count: int
    followers_change: Optional[int] = None


class ProxyConfigCreate(BaseModel):
    name: str
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    proxy_type: str = "http"
    is_active: bool = True


class ProxyConfigResponse(BaseModel):
    id: int
    name: str
    host: str
    port: int
    username: Optional[str]
    proxy_type: str
    is_active: bool
    created_at: Optional[str] = None


class ProxyTestRequest(BaseModel):
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    proxy_type: str = "http"
    test_url: str = "https://www.instagram.com"


class LoginRequest(BaseModel):
    """登录 Instagram 账号请求体"""
    totp_code: Optional[str] = None


class BulkDeleteRequest(BaseModel):
    ids: List[int]


class FollowRequest(BaseModel):
    username: str


class PostPhotoRequest(BaseModel):
    image_path: str
    caption: Optional[str] = None
    tags: List[str] = []


def _serialize_account(account: InstagramAccount) -> InstagramAccountResponse:
    two_factor_secret = None
    try:
        data = json.loads(account.session_data) if account.session_data else {}
        two_factor_secret = data.get("two_factor_secret")
    except Exception:
        two_factor_secret = None

    latest_stat = None
    prev_stat = None
    if account.stats:
        stats_sorted = sorted(account.stats, key=lambda s: s.stat_date, reverse=True)
        latest_stat = stats_sorted[0]
        if len(stats_sorted) > 1:
            prev_stat = stats_sorted[1]
    followers_change = None
    if latest_stat and prev_stat is not None:
        followers_change = latest_stat.followers_count - prev_stat.followers_count

    return InstagramAccountResponse(
        id=account.id,
        username=account.username,
        login_status=account.login_status,
        last_login=account.last_login.isoformat() if account.last_login else None,
        is_active=account.is_active,
        created_at=account.created_at.isoformat() if account.created_at else datetime.utcnow().isoformat(),
        proxy_id=account.proxy_id,
        two_factor_secret=two_factor_secret,
        followers=latest_stat.followers_count if latest_stat else None,
        posts=latest_stat.posts_count if latest_stat else None,
        followers_change=followers_change,
    )


def _serialize_proxy(proxy: ProxyConfig) -> ProxyConfigResponse:
    return ProxyConfigResponse(
        id=proxy.id,
        name=proxy.name,
        host=proxy.host,
        port=proxy.port,
        username=proxy.username,
        proxy_type=proxy.proxy_type.value if hasattr(proxy.proxy_type, "value") else proxy.proxy_type,
        is_active=proxy.is_active,
        created_at=proxy.created_at.isoformat() if proxy.created_at else None,
    )


# 账号管理
@router.get("/accounts", response_model=List[InstagramAccountResponse])
async def get_instagram_accounts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = db.query(InstagramAccount).filter(InstagramAccount.user_id == current_user.id).all()
    return [_serialize_account(acc) for acc in accounts]


@router.post("/accounts", response_model=InstagramAccountResponse)
async def add_instagram_account(
    account_data: InstagramAccountCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 防重复：同一用户下相同用户名不允许重复
    existed = db.query(InstagramAccount).filter(
        InstagramAccount.user_id == current_user.id,
        InstagramAccount.username == account_data.username,
    ).first()
    if existed:
        raise HTTPException(status_code=400, detail="账号已存在")

    # 校验代理归属
    if account_data.proxy_id:
        proxy = db.query(ProxyConfig).filter(
            ProxyConfig.id == account_data.proxy_id,
            ProxyConfig.user_id == current_user.id,
        ).first()
        if not proxy:
            raise HTTPException(status_code=404, detail="代理不存在或无权限")

    session_blob = json.dumps({"two_factor_secret": account_data.two_factor_secret}) if account_data.two_factor_secret else None

    account = InstagramAccount(
        user_id=current_user.id,
        username=account_data.username,
        password_encrypted=account_data.password,
        session_data=session_blob,
        proxy_id=account_data.proxy_id,
        is_active=account_data.is_active,
        login_status=LoginStatus.LOGGED_OUT.value,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _serialize_account(account)


@router.post("/accounts/{account_id}/login")
async def login_instagram_account(
    account_id: int,
    login_req: LoginRequest = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")

    proxy = None
    if account.proxy_id:
        proxy = db.query(ProxyConfig).filter(
            ProxyConfig.id == account.proxy_id,
            ProxyConfig.user_id == current_user.id,
        ).first()

    totp_code = login_req.totp_code if login_req else None

    try:
        await instagram_account_manager.add_account(account, proxy, totp_code=totp_code)
        db.commit()
        db.refresh(account)
        status = await instagram_account_manager.check_login_status(account.id)
    except Exception as exc:
        account.login_status = LoginStatus.LOGGED_OUT.value
        db.commit()
        logger.exception("登录 Instagram 失败")
        # 将底层错误直接抛给前端，便于排查代理/网络问题
        raise HTTPException(status_code=500, detail=f"登录失败: {exc}")

    return {"accountId": account_id, "status": status}


@router.get("/accounts/{account_id}/status")
async def check_account_status(
    account_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    status = await instagram_account_manager.check_login_status(account.id)
    return status


@router.get("/accounts/{account_id}/stats", response_model=List[AccountStatResponse])
async def get_account_stats(
    account_id: int,
    days: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取账号历史粉丝/帖子数据，默认近30天"""
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")

    stats = db.query(InstagramAccountStat)\
        .filter(InstagramAccountStat.account_id == account_id)\
        .order_by(InstagramAccountStat.stat_date.desc())\
        .limit(days)\
        .all()

    stats_sorted = sorted(stats, key=lambda s: s.stat_date)
    response: List[AccountStatResponse] = []
    prev_followers = None
    for stat in stats_sorted:
        change = None
        if prev_followers is not None:
            change = stat.followers_count - prev_followers
        response.append(AccountStatResponse(
            stat_date=stat.stat_date.isoformat(),
            followers_count=stat.followers_count,
            posts_count=stat.posts_count,
            followers_change=change,
        ))
        prev_followers = stat.followers_count
    return response


@router.delete("/accounts/{account_id}")
async def delete_instagram_account(
    account_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    await instagram_account_manager.remove_account(account.id)
    db.delete(account)
    db.commit()
    return {"message": f"账户 {account_id} 已删除"}


@router.post("/accounts/bulk-delete")
async def bulk_delete_accounts(
    payload: BulkDeleteRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.ids:
        return {"deleted": 0}
    accounts = db.query(InstagramAccount).filter(
        InstagramAccount.user_id == current_user.id,
        InstagramAccount.id.in_(payload.ids)
    ).all()
    count = 0
    for acc in accounts:
        await instagram_account_manager.remove_account(acc.id)
        db.delete(acc)
        count += 1
    db.commit()
    return {"deleted": count}


# ===== 业务：搜索 / 关注 / 发帖 =====
async def _ensure_client(account: InstagramAccount, db: Session):
    """
    确保 account 对应的 instagrapi client 已初始化，若未初始化则按绑定代理重新登录。
    """
    client = await instagram_account_manager.get_client(account.id)
    if client:
        return client
    proxy = None
    if account.proxy_id:
        proxy = db.query(ProxyConfig).filter(
            ProxyConfig.id == account.proxy_id,
            ProxyConfig.user_id == account.user_id,
        ).first()
    await instagram_account_manager.add_account(account, proxy)
    return await instagram_account_manager.get_client(account.id)


@router.get("/accounts/{account_id}/users/{username}")
async def search_user(
    account_id: int,
    username: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    await _ensure_client(account, db)
    result = await instagram_operations.get_user_info(account_id, username)
    if not result.get("success"):
        if result.get("challenge_required"):
            raise HTTPException(status_code=403, detail={"message": "账号需要人工验证，请完成验证后重试", "challenge_required": True})
        raise HTTPException(status_code=400, detail=result.get("error", "查询失败"))
    return result["user"]


@router.post("/accounts/{account_id}/follow")
async def follow_user(
    account_id: int,
    payload: FollowRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    await _ensure_client(account, db)
    result = await instagram_operations.follow_user(account_id, payload.username)
    if not result.get("success"):
        if result.get("challenge_required"):
            raise HTTPException(status_code=403, detail={"message": "账号需要人工验证，请完成验证后重试", "challenge_required": True})
        raise HTTPException(status_code=400, detail=result.get("error", "关注失败"))
    return result


@router.post("/accounts/{account_id}/post-photo")
async def post_photo(
    account_id: int,
    payload: PostPhotoRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    await _ensure_client(account, db)
    tags_text = " ".join(f"#{t.lstrip('#')}" for t in payload.tags) if payload.tags else ""
    caption = (payload.caption or "").strip()
    caption = f"{caption} {tags_text}".strip()
    result = await instagram_operations.post_photo(account_id, payload.image_path, caption)
    if not result.get("success"):
        if result.get("challenge_required"):
            raise HTTPException(status_code=403, detail={"message": "账号需要人工验证，请完成验证后重试", "challenge_required": True})
        raise HTTPException(status_code=400, detail=result.get("error", "发帖失败"))
    return result


@router.get("/accounts/{account_id}/ping")
async def ping_account(
    account_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    探活接口：确保客户端初始化并返回当前登录状态。
    如果触发挑战，会在数据库标记 challenge 状态，并把信息返回给前端。
    """
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="账户不存在")
    try:
        await _ensure_client(account, db)
    except Exception as exc:
        # 保持异常信息，便于前端提示
        raise HTTPException(status_code=400, detail=str(exc))
    status = await instagram_account_manager.check_login_status(account.id)
    # 同步状态到 login_status 字段
    try:
        await instagram_account_manager._update_login_status(
            account.id,
            status.get("logged_in", False),
            status.get("message"),
            LoginStatus.LOGGED_IN.value if status.get("logged_in") else status.get("status") or LoginStatus.LOGGED_OUT.value,
        )
    except Exception:
        pass
    return status


# 代理管理
@router.get("/proxies", response_model=List[ProxyConfigResponse])
async def get_proxy_configs(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proxies = db.query(ProxyConfig).filter(ProxyConfig.user_id == current_user.id).all()
    return [_serialize_proxy(p) for p in proxies]


@router.post("/proxies", response_model=ProxyConfigResponse)
async def add_proxy_config(
    proxy_data: ProxyConfigCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    duplicate = db.query(ProxyConfig).filter(
        ProxyConfig.user_id == current_user.id,
        ProxyConfig.host == proxy_data.host,
        ProxyConfig.port == proxy_data.port,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="代理已存在")

    proxy = ProxyConfig(
        user_id=current_user.id,
        name=proxy_data.name,
        host=proxy_data.host,
        port=proxy_data.port,
        username=proxy_data.username,
        password_encrypted=proxy_data.password,
        proxy_type=ProxyType(proxy_data.proxy_type),
        is_active=proxy_data.is_active,
    )
    db.add(proxy)
    db.commit()
    db.refresh(proxy)
    return _serialize_proxy(proxy)


@router.delete("/proxies/{proxy_id}")
async def delete_proxy(
    proxy_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proxy = db.query(ProxyConfig).filter(
        ProxyConfig.id == proxy_id,
        ProxyConfig.user_id == current_user.id,
    ).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="代理不存在")
    db.delete(proxy)
    db.commit()
    return {"message": f"代理 {proxy_id} 已删除"}


@router.post("/proxies/bulk-delete")
async def bulk_delete_proxies(
    payload: BulkDeleteRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.ids:
        return {"deleted": 0}
    proxies = db.query(ProxyConfig).filter(
        ProxyConfig.user_id == current_user.id,
        ProxyConfig.id.in_(payload.ids)
    ).all()
    count = 0
    for prox in proxies:
        db.delete(prox)
        count += 1
    db.commit()
    return {"deleted": count}


@router.post("/proxies/test")
async def test_proxy_config(proxy_data: ProxyTestRequest):
    proxy_auth = ""
    if proxy_data.username:
        proxy_auth = f"{proxy_data.username}:{proxy_data.password or ''}@"
    proxy_url = f"{proxy_data.proxy_type}://{proxy_auth}{proxy_data.host}:{proxy_data.port}"
    proxies = {"http": proxy_url, "https": proxy_url}
    try:
        resp = requests.get(proxy_data.test_url, proxies=proxies, timeout=8, verify=False)
        resp.raise_for_status()
        return {
            "success": True,
            "message": "代理测试成功",
            "host": proxy_data.host,
            "port": proxy_data.port,
            "proxy_type": proxy_data.proxy_type,
            "status_code": resp.status_code,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"代理测试失败: {exc}")


# 其余端点保留兼容，不实现业务细节
@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...), account_id: int = 1):
    return {
        "message": "文件上传成功",
        "filename": file.filename,
        "size": file.size,
        "content_type": file.content_type,
    }


@router.post("/post")
async def create_post(account_id: int, content: str, media_urls: List[str] = []):
    return {"message": "帖子发布成功", "post_id": "mock"}
