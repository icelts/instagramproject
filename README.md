# Instagram 自动化平台

一个功能完整的Instagram自动化管理平台，支持多账号管理、定时发帖、数据采集、消息监控等功能。

## 🚀 项目特性

### 核心功能
- **多账号管理**: 支持管理多个Instagram账号，独立登录状态维护
- **定时发帖**: 灵活的发帖计划，支持重复设置
- **数据采集**: 智能采集用户数据，支持多种搜索方式
- **消息监控**: 实时监控私信，支持自动回复
- **代理支持**: 完整的代理配置和管理
- **权限控制**: 基于JWT的用户认证和权限管理

### 技术栈

#### 后端 (FastAPI)
- **框架**: FastAPI + SQLAlchemy
- **数据库**: MySQL + Redis (缓存)
- **任务调度**: Celery + Redis
- **认证**: JWT Token认证
- **API文档**: 自动生成的Swagger文档

#### 前端 (React + TypeScript)
- **框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit
- **UI组件**: Material-UI (MUI)
- **路由**: React Router DOM
- **样式**: Emotion + MUI主题系统

#### Instagram集成
- **Python库**: instagrapi (功能强大的Instagram API库)
- **Node.js库**: nodejs-insta-private-api (备用方案)
- **功能**: 登录、发帖、搜索、消息等完整功能

## 📁 项目结构

```
instagramproject/
├── backend/                    # FastAPI后端
│   ├── app/
│   │   ├── api/v1/           # API路由
│   │   ├── core/              # 核心配置
│   │   ├── models/            # SQLAlchemy模型
│   │   ├── services/          # 业务逻辑服务
│   │   └── utils/             # 工具函数
│   ├── alembic/               # 数据库迁移
│   ├── requirements.txt         # Python依赖
│   └── run.py               # 启动文件
├── frontend/                  # React前端
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── store/            # Redux状态管理
│   │   └── components/       # 可复用组件
│   ├── package.json          # Node.js依赖
│   └── public/             # 静态资源
├── instagrapi/               # Instagram Python库
└── nodejs-insta-private-api/ # Instagram Node.js库
```

## 🛠️ 安装和运行

### 环境要求
- Python 3.8+
- Node.js 14+
- MySQL 5.7+
- Redis 6.0+

### 后端设置

1. 创建虚拟环境
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库等信息
```

4. 数据库迁移
```bash
alembic upgrade head
```

5. 启动后端
```bash
python run.py
```

后端将在 `http://localhost:8000` 启动

### 前端设置

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm start
```

前端将在 `http://localhost:3000` 启动

### 任务队列启动

启动Celery任务队列 (新终端):
```bash
cd backend
celery -A app.services.scheduler_service.celery_app worker --loglevel=info
```

启动Celery调度器 (新终端):
```bash
cd backend
celery -A app.services.scheduler_service.celery_app beat --loglevel=info
```

## 📖 API文档

启动后端后，访问 `http://localhost:8000/docs` 查看自动生成的API文档。

### 主要API端点

#### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `GET /api/v1/users/me` - 获取当前用户信息

#### Instagram管理
- `GET /api/v1/instagram/accounts` - 获取账号列表
- `POST /api/v1/instagram/accounts` - 添加账号
- `POST /api/v1/instagram/accounts/{id}/login` - 登录账号
- `GET /api/v1/instagram/accounts/{id}/status` - 检查账号状态

#### 定时任务
- `GET /api/v1/scheduler/schedules` - 获取发帖计划
- `POST /api/v1/scheduler/schedules` - 创建发帖计划
- `GET /api/v1/scheduler/search-tasks` - 获取搜索任务
- `POST /api/v1/scheduler/search-tasks` - 创建搜索任务

## 🎯 核心功能详解

### 1. Instagram账号管理
- 支持添加多个Instagram账号
- 自动维护登录状态
- 支持代理配置
- 账号健康检查

### 2. 定时发帖系统
- 灵活的时间调度
- 支持重复设置 (一次性、每日、每周、每月)
- 媒体文件上传 (图片、视频)
- 发帖结果追踪

### 3. 数据采集功能
- 多种搜索方式:
  - 标签搜索 (hashtag)
  - 用户搜索 (username)
  - 地理位置搜索 (location)
  - 关键词搜索 (keyword)
- 智能信息提取:
  - 邮箱地址提取
  - 电话号码提取
  - 用户资料分析
- 数据导出 (JSON、CSV格式)

### 4. 消息监控系统
- 实时消息接收
- 自动回复规则配置
- 关键词匹配
- 回复优先级设置

### 5. 代理管理系统
- 支持多种代理类型 (HTTP、HTTPS、SOCKS4、SOCKS5)
- 代理账号密码加密存储
- 代理状态检测
- 负载均衡支持

## 🔧 配置说明

### 后端配置 (.env)
```env
# 数据库配置
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/instagram_db

# Redis配置
REDIS_URL=redis://localhost:6379/0

# JWT配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 应用配置
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]
```

### 前端配置
- API基础URL在 `src/store/slices/*.ts` 中配置
- 主题配置在 `src/App.tsx` 中自定义

## 🚀 部署指南

### Docker部署 (推荐)
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 传统部署
1. 部署后端到服务器
2. 配置Nginx反向代理
3. 构建前端静态文件
4. 配置SSL证书

## 🔒 安全考虑

- JWT Token认证
- 密码哈希存储 (bcrypt)
- 敏感信息加密 (代理密码)
- CORS配置
- SQL注入防护
- XSS防护

## 📊 性能优化

- Redis缓存机制
- 数据库索引优化
- 异步任务处理
- 前端代码分割
- 图片压缩优化

## 🧪 测试

### 后端测试
```bash
cd backend
pytest tests/
```

### 前端测试
```bash
cd frontend
npm test
```

## 📝 开发指南

### 添加新的API端点
1. 在 `backend/app/api/v1/` 中创建路由
2. 在 `backend/app/services/` 中实现业务逻辑
3. 在 `backend/app/models/` 中定义数据模型
4. 在 `frontend/src/store/slices/` 中添加Redux状态

### 添加新的页面
1. 在 `frontend/src/pages/` 中创建组件
2. 在 `frontend/src/App.tsx` 中添加路由
3. 添加相应的Redux状态管理

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如有问题或建议，请：
1. 查看API文档
2. 搜索已有Issues
3. 创建新的Issue

## 🔄 更新日志

### v1.0.0 (2025-12-09)
- ✅ 完成基础架构搭建
- ✅ 实现用户认证系统
- ✅ 完成Instagram账号管理
- ✅ 实现定时发帖功能
- ✅ 完成数据采集系统
- ✅ 实现消息监控
- ✅ 完成前端基础界面
- ✅ 集成代理支持
- ✅ 添加API文档

---

⭐ 如果这个项目对你有帮助，请给个Star！
