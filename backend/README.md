# Instagram自动化平台后端API

基于FastAPI的Instagram自动化管理平台后端服务。

## 功能特性

- ✅ 用户认证与授权 (JWT)
- ✅ Instagram账号管理
- ✅ 代理配置管理
- ✅ 定时发帖
- ✅ 自动回复规则
- ✅ 搜索任务管理
- ✅ 用户数据采集
- ✅ 实时监控与日志
- ✅ WebSocket实时通信
- ✅ 数据库迁移支持

## 技术栈

- **框架**: FastAPI
- **数据库**: MySQL (通过SQLAlchemy ORM)
- **缓存**: Redis
- **认证**: JWT Token
- **迁移**: Alembic
- **文档**: 自动生成的Swagger/OpenAPI

## 项目结构

```
backend/
├── app/
│   ├── api/v1/           # API路由
│   │   ├── auth.py      # 认证相关API
│   │   ├── users.py     # 用户管理API
│   │   ├── instagram.py # Instagram操作API
│   │   ├── scheduler.py # 定时任务API
│   │   └── monitoring.py# 监控API
│   ├── core/            # 核心配置
│   │   ├── config.py    # 应用配置
│   │   ├── security.py  # 安全相关
│   │   └── database.py # 数据库配置
│   ├── models/          # 数据模型
│   │   ├── user.py
│   │   ├── instagram_account.py
│   │   ├── proxy.py
│   │   ├── schedule.py
│   │   ├── message.py
│   │   ├── auto_reply.py
│   │   ├── search_task.py
│   │   └── collected_user_data.py
│   └── utils/          # 工具函数
│       └── decorators.py # 装饰器
├── alembic/            # 数据库迁移
├── requirements.txt     # 依赖包
├── .env               # 环境变量
└── run.py             # 启动脚本
```

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd instagramproject/backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库和Redis连接信息
```

### 2. 数据库设置

```bash
# 初始化数据库迁移
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

### 3. 启动服务

```bash
# 启动开发服务器
python run.py

# 或使用uvicorn直接启动
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 访问API文档

启动服务后，访问以下地址：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API端点

### 认证相关 (/api/v1/auth)

- `POST /login` - 用户登录
- `POST /register` - 用户注册
- `POST /verify-token` - 验证Token
- `POST /refresh` - 刷新Token
- `POST /logout` - 用户登出

### 用户管理 (/api/v1/users)

- `GET /me` - 获取当前用户信息
- `PUT /me` - 更新用户信息
- `POST /change-password` - 修改密码
- `GET /` - 获取用户列表 (管理员)

### Instagram管理 (/api/v1/instagram)

- `GET /accounts` - 获取Instagram账号列表
- `POST /accounts` - 添加Instagram账号
- `POST /accounts/{account_id}/login` - 登录账号
- `GET /accounts/{account_id}/status` - 检查账号状态
- `POST /proxies` - 添加代理配置
- `POST /schedules` - 创建定时发帖
- `POST /search-tasks` - 创建搜索任务

### 调度任务 (/api/v1/scheduler)

- `GET /tasks` - 获取任务列表
- `POST /tasks` - 创建任务
- `GET /tasks/{task_id}` - 获取任务详情
- `POST /tasks/{task_id}/start` - 启动任务
- `POST /tasks/{task_id}/stop` - 停止任务

### 监控相关 (/api/v1/monitoring)

- `GET /messages` - 获取消息日志
- `GET /auto-reply-logs` - 获取自动回复日志
- `GET /account-status` - 获取账号状态
- `GET /system-status` - 获取系统状态
- `WebSocket /ws/{user_id}` - 实时监控

## 数据库模型

### 核心表结构

- **users** - 用户表
- **instagram_accounts** - Instagram账号表
- **proxy_configs** - 代理配置表
- **post_schedules** - 定时发帖表
- **message_logs** - 消息记录表
- **auto_reply_rules** - 自动回复规则表
- **search_tasks** - 搜索任务表
- **collected_user_data** - 用户数据采集表

## 环境变量配置

```env
# 应用配置
PROJECT_NAME=Instagram Automation Platform
VERSION=1.0.0
DEBUG=True

# 数据库配置
DATABASE_URL=mysql+pymysql://username:password@host:port/database

# Redis配置
REDIS_URL=redis://localhost:6379/0

# JWT配置
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS配置
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:8080"]
```

## 安全特性

- JWT Token认证
- 密码哈希存储
- CORS跨域保护
- 请求参数验证
- SQL注入防护
- API限流支持

## 开发指南

### 添加新的API端点

1. 在相应的路由文件中添加端点
2. 使用Pydantic模型进行数据验证
3. 使用装饰器处理权限和异常
4. 更新API文档

### 数据库迁移

```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述信息"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### 运行测试

```bash
# 运行所有测试
python -m pytest

# 运行特定测试
python -m pytest tests/test_auth.py

# 生成覆盖率报告
pytest --cov=app tests/
```

## 部署

### Docker部署

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 生产环境配置

1. 设置环境变量 `DEBUG=False`
2. 使用生产数据库
3. 配置HTTPS
4. 设置反向代理 (Nginx)
5. 启用日志记录

## 监控和日志

- 应用日志: `/var/log/instagram-api/`
- 错误追踪: 集成Sentry
- 性能监控: 集成Prometheus
- 健康检查: `/health` 端点

## 常见问题

### Q: 如何重置数据库？
A: 删除所有表后重新运行迁移: `alembic upgrade head`

### Q: 如何添加新的数据库字段？
A: 1. 修改模型文件 2. 生成迁移文件 3. 应用迁移

### Q: 如何处理文件上传？
A: 使用FastAPI的`UploadFile`和`File`依赖

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License
