#!/usr/bin/env python3
"""
Instagram 自动化平台后端启动脚本
"""

import os
import sys
import uvicorn

# 将项目根目录加入 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app  # noqa: E402
from app.core.config import settings  # noqa: E402


def main():
    """启动 FastAPI 应用"""
    # 启动信息（使用 ASCII 避免控制台编码问题）
    print("Instagram backend service starting...")
    print("=" * 50)
    print(f"项目名称: {settings.PROJECT_NAME}")
    print(f"版本: {settings.VERSION}")
    print(f"数据库: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    print(f"Redis: {settings.REDIS_URL}")
    print("=" * 50)

    # 启动服务
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
