"""
使用 FastAPI 接口测试：搜索用户、关注、发图。
运行：cd backend; python test_instagram_actions_api.py
"""
import requests
import time

BASE_URL = "http://localhost:8800/api/v1"

SYSTEM_USERNAME = "admin"
SYSTEM_PASSWORD = "admin123"

ACCOUNT_USERNAME = "ruth87283"
TARGET_USERNAME = "jjlin"
IMAGE_PATH = r"C:\Users\a2720\Desktop\20251128140554_1110_122.jpg"
CAPTION = "接口自动发图测试"
TAGS = ["music", "instagood", "daily"]


def api_post(path, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = requests.post(f"{BASE_URL}{path}", json=payload or {}, headers=headers, timeout=30)
    return resp


def api_get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=30)
    return resp


def main():
    print("1) 系统登录")
    resp = api_post("/auth/login", {"username": SYSTEM_USERNAME, "password": SYSTEM_PASSWORD})
    resp.raise_for_status()
    token = resp.json()["access_token"]
    print("   登录成功")

    print("2) 获取账号列表并找到指定账号")
    resp = api_get("/instagram/accounts", token)
    resp.raise_for_status()
    accounts = resp.json()
    acc = next((a for a in accounts if a["username"] == ACCOUNT_USERNAME), None)
    if not acc:
        raise SystemExit("未找到账号，请先在后台添加。")
    account_id = acc["id"]
    print(f"   已找到账号 {ACCOUNT_USERNAME} id={account_id}")

    print("3) 搜索目标用户信息")
    resp = api_get(f"/instagram/accounts/{account_id}/users/{TARGET_USERNAME}", token)
    resp.raise_for_status()
    user = resp.json()
    print(f"   {TARGET_USERNAME} info: followers={user.get('follower_count')} posts={user.get('posts_count')}")

    print("4) 尝试关注目标用户（与发图分开执行以降低风控几率）")
    resp = api_post(f"/instagram/accounts/{account_id}/follow", {"username": TARGET_USERNAME}, token)
    if resp.status_code >= 300:
        print("   关注失败:", resp.text)
    else:
        print("   关注结果:", resp.json())

    print("   等待 60 秒再尝试发图...")
    time.sleep(60)

    print("5) 调用发图接口")
    payload = {
        "image_path": IMAGE_PATH,
        "caption": CAPTION,
        "tags": TAGS,
    }
    resp = api_post(f"/instagram/accounts/{account_id}/post-photo", payload, token)
    if resp.status_code >= 300:
        print("   发图失败:", resp.status_code, resp.text)
    else:
        print("   发图成功:", resp.json())


if __name__ == "__main__":
    main()
