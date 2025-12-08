#!/usr/bin/env python3
"""
Instagram自动化平台后端启动脚本
"""

import uvicorn
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.config import settings

def main():
    """启动FastAPI应用"""
    
    # 启动信息
    print("🚀 Instagram自动化平台后端服务")
    print("=" * 50)
    print(f"项目名称: {settings.PROJECT_NAME}")
    print(f"版本: {settings.VERSION}")
    print(f"数据库: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    print(f"Redis: {settings.REDIS_URL}")
    print("=" * 50)
    
    # 启动服务器
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()
