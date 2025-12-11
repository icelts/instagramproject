"""
端口 8000 FastAPI 接口冒烟脚本：
1) 用系统账号登录拿到 token
2) 创建/复用代理
3) 创建/复用 Instagram 账号（绑定代理、带 2FA 秘钥）
4) 调用登录账号接口（会使用绑定代理）
5) 查询账号状态

运行：
  cd backend
  ..\\venv\\Scripts\\python.exe test_fastapi_flow.py
"""
import base64
import hashlib
import hmac
import struct
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests

BASE_URL = "http://localhost:8000/api/v1"

# 系统登录账号
SYSTEM_USERNAME = "admin"
SYSTEM_PASSWORD = "admin123"

# 代理信息
PROXY_PAYLOAD = {
    "name": "auto-test-proxy-local",
    "host": "127.0.0.1",
    "port": 10808,
    "username": "",
    "password": "",
    "proxy_type": "http",
}

# Instagram 账号信息
IG_PAYLOAD = {
    "username": "ruth87283",
    "password": "r?Vcc7#NH1",
    "two_factor_secret": "SGPOGESJNAA6TV4PEQGVJCAN6KTPJ24R",
}


def totp(secret: str, interval: int = 30, digits: int = 6) -> str:
    """生成 TOTP 动态码（base32 secret）。"""
    secret = secret.replace(" ", "").upper()
    key = base64.b32decode(secret + "=" * ((8 - len(secret) % 8) % 8))
    counter = int(time.time() // interval)
    msg = struct.pack(">Q", counter)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    o = h[-1] & 0x0F
    code = (struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % (10**digits)
    return str(code).zfill(digits)


@dataclass
class ApiResult:
    ok: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


def api_post(path: str, payload: Dict[str, Any], token: Optional[str] = None) -> ApiResult:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        resp = requests.post(f"{BASE_URL}{path}", json=payload, headers=headers, timeout=20)
        if resp.status_code >= 300:
            return ApiResult(False, error=f"{resp.status_code} {resp.text}")
        return ApiResult(True, data=resp.json())
    except Exception as exc:  # pragma: no cover
        return ApiResult(False, error=str(exc))


def api_get(path: str, token: str) -> ApiResult:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=20)
        if resp.status_code >= 300:
            return ApiResult(False, error=f"{resp.status_code} {resp.text}")
        return ApiResult(True, data=resp.json())
    except Exception as exc:  # pragma: no cover
        return ApiResult(False, error=str(exc))


def main():
    print("1) 登录系统...")
    login_res = api_post("/auth/login", {"username": SYSTEM_USERNAME, "password": SYSTEM_PASSWORD})
    if not login_res.ok:
        print("   登录失败:", login_res.error)
        return
    token = login_res.data["access_token"]
    print("   登录成功，拿到 token")

    print("2) 创建/复用代理...")
    proxy_res = api_post("/instagram/proxies", PROXY_PAYLOAD, token)
    if not proxy_res.ok:
        # 可能是重复，尝试获取列表选第一个同 host/port
        proxies = api_get("/instagram/proxies", token)
        if not proxies.ok:
            print("   代理创建和读取都失败:", proxy_res.error, proxies.error)
            return
        matched = next(
            (p for p in proxies.data if p["host"] == PROXY_PAYLOAD["host"] and p["port"] == PROXY_PAYLOAD["port"]),
            None,
        )
        if not matched:
            print("   创建代理失败:", proxy_res.error)
            return
        proxy_id = matched["id"]
        print(f"   复用已有代理 ID={proxy_id}")
    else:
        proxy_id = proxy_res.data["id"]
        print(f"   代理创建成功，ID={proxy_id}")

    print("3) 创建/复用 Instagram 账号并绑定代理...")
    ig_payload = {
        "username": IG_PAYLOAD["username"],
        "password": IG_PAYLOAD["password"],
        "two_factor_secret": IG_PAYLOAD["two_factor_secret"],
        "proxy_id": proxy_id,
    }
    acc_res = api_post("/instagram/accounts", ig_payload, token)
    if not acc_res.ok:
        # 如果已存在或其他错误，尝试读取列表
        accounts = api_get("/instagram/accounts", token)
        if not accounts.ok:
            print("   创建账号失败且读取列表失败:", acc_res.error, accounts.error)
            return
        matched = next((a for a in accounts.data if a["username"] == IG_PAYLOAD["username"]), None)
        if not matched:
            print("   创建账号失败:", acc_res.error)
            return
        account_id = matched["id"]
        print(f"   复用已有账号 ID={account_id}")
    else:
        account_id = acc_res.data["id"]
        print(f"   账号创建成功，ID={account_id}")

    print("4) 调用登录 Instagram 账号（会用绑定的代理）...")
    # 后端目前未要求 totp_code，如有需要保留; 否则传空主体也可
    login_req = {"totp_code": totp(IG_PAYLOAD["two_factor_secret"])}
    login_res2 = api_post(f"/instagram/accounts/{account_id}/login", login_req, token)
    if not login_res2.ok:
        print("   登录 Instagram 失败:", login_res2.error)
        return
    print("   登录接口返回:", login_res2.data)

    print("5) 查询账号状态...")
    status_res = api_get(f"/instagram/accounts/{account_id}/status", token)
    if not status_res.ok:
        print("   查询状态失败:", status_res.error)
        return
    print("   当前状态:", status_res.data)

    print("\n脚本完成。如需重复测试，建议先删除已有代理/账号避免重复。")


if __name__ == "__main__":
    main()
