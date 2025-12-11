#!/usr/bin/env python3
"""
简化的后端启动脚本 - 端口8001
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 设置环境变量
os.environ.setdefault('DATABASE_URL', 'mysql+pymysql://instagramproject:SWaexZfEtwSTAfHp@125.212.244.39:3306/instagramproject')
os.environ.setdefault('SECRET_KEY', 'your-secret-key-change-this-in-production-123456789')

# 创建FastAPI应用
app = FastAPI(
    title="Instagram Automation Platform",
    description="Instagram自动化管理平台API",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "服务运行正常"}

@app.get("/")
async def root():
    return {"message": "Instagram Automation Platform API"}

# 简单的认证端点
@app.post("/api/v1/auth/login")
async def login(username: str, password: str):
    if username == "admin" and password == "admin123":
        return {
            "access_token": "mock_token",
            "token_type": "bearer",
            "expires_in": 1800,
            "user": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "管理员",
                "is_active": True,
                "created_at": "2025-12-10T00:00:00"
            }
        }
    else:
        return {"error": "用户名或密码错误"}

if __name__ == "__main__":
    import uvicorn
    print("启动简化版Instagram后端服务...")
    print("服务地址: http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
