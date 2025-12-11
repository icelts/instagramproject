"""
使用 instagrapi 直接测试账号搜索/关注/发帖。
依赖：pip install instagrapi
运行：cd backend; python test_instagram_actions.py
"""
import base64
import hashlib
import hmac
import os
import random
import struct
import time
from typing import List

from instagrapi import Client

# 账号与代理配置
IG_USERNAME = "ruth87283"
IG_PASSWORD = "r?Vcc7#NH1"
IG_TOTP_SECRET = "SGPOGESJNAA6TV4PEQGVJCAN6KTPJ24R"

PROXY_HOST = "127.0.0.1"
PROXY_PORT = 10808
PROXY_USERNAME = ""
PROXY_PASSWORD = ""
PROXY_SCHEME = "http"

# 测试动作
SEARCH_USERNAME = "jjlin"
IMAGE_PATH = r"C:\Users\a2720\Desktop\20251128140554_1110_122.jpg"


def totp(secret: str, interval: int = 30, digits: int = 6) -> str:
    secret = secret.replace(" ", "").upper()
    key = base64.b32decode(secret + "=" * ((8 - len(secret) % 8) % 8))
    counter = int(time.time() // interval)
    msg = struct.pack(">Q", counter)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    o = h[-1] & 0x0F
    code = (struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % (10**digits)
    return str(code).zfill(digits)


def build_caption() -> str:
    heads = [
        "分享一下今日随手拍",
        "记录此刻",
        "新的开始，新的心情",
        "旅途中的小惊喜",
    ]
    tags_pool = ["#instagram", "#daily", "#photo", "#life", "#travel", "#music", "#art", "#instagood"]
    random.shuffle(tags_pool)
    tags = " ".join(tags_pool[: random.randint(2, 5)])
    return f"{random.choice(heads)} {tags}"


def main():
    if not os.path.exists(IMAGE_PATH):
        print(f"图片不存在: {IMAGE_PATH}")
        return

    proxy_auth = f"{PROXY_USERNAME}:{PROXY_PASSWORD}@" if PROXY_USERNAME else ""
    proxy_url = f"{PROXY_SCHEME}://{proxy_auth}{PROXY_HOST}:{PROXY_PORT}"

    cl = Client()
    cl.set_proxy(proxy_url)
    cl.delay_range = [2, 4]

    print("1) 登录 Instagram 账号...")
    code = totp(IG_TOTP_SECRET)
    cl.login(IG_USERNAME, IG_PASSWORD, verification_code=code)
    print("   登录成功")

    print(f"2) 搜索用户 {SEARCH_USERNAME} ...")
    user = cl.user_info_by_username(SEARCH_USERNAME)
    print(f"   找到用户: {user.username}, pk={user.pk}")

    print("3) 尝试关注该用户 ...")
    follow_res = cl.user_follow(user.pk)
    print(f"   关注结果: {follow_res}")

    print("4) 发布图片...")
    caption = build_caption()
    media = cl.photo_upload(IMAGE_PATH, caption=caption)
    print(f"   发帖成功，media id: {media.pk}")
    print(f"   文案: {caption}")

    print("\n全部动作完成。")


if __name__ == "__main__":
    main()
