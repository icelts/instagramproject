# Instagram自动化平台开发计划

## 📋 项目概述

基于现有的 `instagrapi` Python库和 `nodejs-insta-private-api` Node.js实现，构建一个完整的Instagram自动化管理平台，支持多账号管理、定时发帖、实时消息监控、数据采集和自动回复等功能。

## 🏗️ 系统架构

### 技术栈选择
- **后端**: FastAPI + SQLAlchemy + MySQL + Redis + Celery
- **前端**: React.js + TypeScript + Socket.io + MQTT.js
- **数据库**: MySQL 8.0
- **容器化**: Docker + docker-compose

### 项目结构
```
instagramproject/
├── backend/                    # FastAPI后端服务
│   ├── app/
│   │   ├── api/               # API路由
│   │   │   ├── auth.py       # 用户认证
│   │   │   ├── instagram.py  # Instagram操作
│   │   │   ├── scheduler.py  # 定时任务
│   │   │   └── monitoring.py # 实时监控
│   │   ├── core/             # 核心配置
│   │   │   ├── config.py     # 应用配置
│   │   │   ├── security.py   # 安全认证
│   │   │   └── database.py   # 数据库配置
│   │   ├── models/           # 数据模型
│   │   │   ├── user.py       # 用户模型
│   │   │   ├── instagram_account.py  # Instagram账号
│   │   │   ├── proxy.py      # 代理配置
│   │   │   ├── schedule.py    # 定时任务
│   │   │   └── message.py    # 消息记录
│   │   ├── services/         # 业务逻辑
│   │   │   ├── instagram_wrapper.py  # Instagrapi封装
│   │   │   ├── scheduler_service.py  # 任务调度
│   │   │   └── data_collector.py     # 数据采集
│   │   └── utils/            # 工具函数
│   ├── requirements.txt      # Python依赖
│   └── Dockerfile           # 后端容器
├── frontend/                # Node.js前端应用
│   ├── src/
│   │   ├── components/       # React组件
│   │   │   ├── Auth/        # 认证组件
│   │   │   ├── Dashboard/   # 控制面板
│   │   │   ├── Instagram/   # Instagram操作
│   │   │   └── Monitoring/  # 实时监控
│   │   ├── mqtt-client/     # MQTT客户端
│   │   │   ├── MessageHandler.js    # 消息处理
│   │   │   ├── AutoReply.js        # 自动回复
│   │   │   └── SessionManager.js   # 会话管理
│   │   ├── services/         # API调用服务
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── Dockerfile
├── shared/                  # 共享类型和工具
│   └── types/              # TypeScript类型定义
├── docker-compose.yml       # 容器编排
└── README.md               # 项目说明
```

## 🗄️ 数据库配置

### 连接信息
- **数据库类型**: MySQL 8.0
- **数据库名**: instagramproject
- **用户名**: instagramproject
- **密码**: SWaexZfEtwSTAfHp
- **地址**: 125.212.244.39:3306

### 数据库模型设计

#### 用户表 (users)
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Instagram账号表 (instagram_accounts)
```sql
CREATE TABLE instagram_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    session_data JSON,
    proxy_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    login_status ENUM('logged_out', 'logged_in', 'challenge_required', 'banned') DEFAULT 'logged_out',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 代理配置表 (proxy_configs)
```sql
CREATE TABLE proxy_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    username VARCHAR(100) NULL,
    password_encrypted VARCHAR(255) NULL,
    proxy_type ENUM('http', 'https', 'socks4', 'socks5') DEFAULT 'http',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 定时发帖表 (post_schedules)
```sql
CREATE TABLE post_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    media_files JSON,
    scheduled_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'posted', 'failed', 'cancelled') DEFAULT 'pending',
    posted_at TIMESTAMP NULL,
    error_message TEXT NULL,
    repeat_type ENUM('once', 'daily', 'weekly', 'monthly') DEFAULT 'once',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
);
```

#### 消息记录表 (message_logs)
```sql
CREATE TABLE message_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    thread_id VARCHAR(100) NOT NULL,
    sender_username VARCHAR(100) NOT NULL,
    message_content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'video', 'link') DEFAULT 'text',
    is_incoming BOOLEAN DEFAULT TRUE,
    is_auto_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
);
```

#### 自动回复规则表 (auto_reply_rules)
```sql
CREATE TABLE auto_reply_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    keywords JSON NOT NULL,
    reply_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
);
```

#### 搜索任务表 (search_tasks)
```sql
CREATE TABLE search_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    search_type ENUM('hashtag', 'location', 'username', 'keyword') NOT NULL,
    search_query VARCHAR(255) NOT NULL,
    search_params JSON,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    results JSON NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE
);
```

#### 用户数据采集表 (collected_user_data)
```sql
CREATE TABLE collected_user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    search_task_id INT NOT NULL,
    instagram_username VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NULL,
    biography TEXT NULL,
    follower_count INT NULL,
    following_count INT NULL,
    posts_count INT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    email VARCHAR(100) NULL,
    phone VARCHAR(50) NULL,
    profile_pic_url TEXT NULL,
    external_url TEXT NULL,
    collected_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (search_task_id) REFERENCES search_tasks(id) ON DELETE CASCADE
);
```

## 🚀 详细实施计划

### 阶段1：后端框架搭建 (预计3-4天)

#### 1.1 FastAPI基础架构
**任务清单:**
- [ ] 创建FastAPI项目结构
- [ ] 配置数据库连接 (MySQL)
- [ ] 设置SQLAlchemy ORM
- [ ] 配置Redis连接
- [ ] 实现JWT认证中间件
- [ ] 设置CORS和安全中间件
- [ ] 创建基础API路由结构

**文件结构:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI应用入口
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # 依赖注入
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── instagram.py
│   │       └── scheduler.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   └── utils/
│       └── __init__.py
├── requirements.txt
└── .env
```

**环境配置 (.env):**
```env
DATABASE_URL=mysql+pymysql://instagramproject:SWaexZfEtwSTAfHp@125.212.244.39:3306/instagramproject
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
```

#### 1.2 数据库模型实现
**任务清单:**
- [ ] 创建SQLAlchemy模型文件
- [ ] 实现用户表模型
- [ ] 实现Instagram账号表模型
- [ ] 实现代理配置表模型
- [ ] 实现定时发帖表模型
- [ ] 实现消息记录表模型
- [ ] 实现自动回复规则表模型
- [ ] 实现搜索任务表模型
- [ ] 实现用户数据采集表模型
- [ ] 创建数据库迁移脚本

#### 1.3 用户认证系统
**任务清单:**
- [ ] 实现用户注册API
- [ ] 实现用户登录API
- [ ] 实现JWT Token生成和验证
- [ ] 实现密码哈希和验证
- [ ] 实现用户信息管理API
- [ ] 实现权限控制装饰器

### 阶段2：Instagram API集成 (预计4-5天)

#### 2.1 Instagrapi封装服务
**任务清单:**
- [ ] 创建Instagram服务包装器
- [ ] 实现多账号管理
- [ ] 实现登录状态持久化
- [ ] 集成代理支持
- [ ] 实现错误处理和重试机制
- [ ] 实现账号健康检查

**核心服务类设计:**
```python
# services/instagram_wrapper.py
class InstagramAccountManager:
    def __init__(self):
        self.accounts = {}  # 存储活跃的Instagram客户端
        
    async def add_account(self, account_config: InstagramAccount) -> Client:
        """添加Instagram账号"""
        pass
        
    async def login_account(self, account_id: int) -> bool:
        """登录指定账号"""
        pass
        
    async def check_login_status(self, account_id: int) -> dict:
        """检查登录状态"""
        pass
        
    async def get_client(self, account_id: int) -> Client:
        """获取Instagram客户端"""
        pass
```

#### 2.2 Instagram操作API
**任务清单:**
- [ ] 实现账号管理API (增删改查)
- [ ] 实现登录状态检查API
- [ ] 实现代理管理API
- [ ] 实现基础Instagram操作API (用户信息、发帖、评论等)

### 阶段3：自动化功能实现 (预计5-6天)

#### 3.1 定时发帖系统
**任务清单:**
- [ ] 安装和配置Celery
- [ ] 实现定时任务调度器
- [ ] 实现媒体文件上传服务
- [ ] 实现文案管理
- [ ] 实现发帖结果追踪
- [ ] 创建发帖任务管理API

#### 3.2 搜索和数据采集
**任务清单:**
- [ ] 实现关键词搜索API
- [ ] 实现用户搜索API
- [ ] 实现地理位置搜索API
- [ ] 实现标签搜索API
- [ ] 实现数据采集引擎
- [ ] 实现邮箱提取功能
- [ ] 实现图片下载功能
- [ ] 创建搜索任务管理API

#### 3.3 实时消息处理
**任务清单:**
- [ ] 集成Node.js MQTT客户端
- [ ] 实现WebSocket服务
- [ ] 实现消息队列处理
- [ ] 实现自动回复引擎
- [ ] 实现会话持久化
- [ ] 创建消息监控API

### 阶段4：前端开发 (预计6-7天)

#### 4.1 React应用框架
**任务清单:**
- [ ] 创建React项目结构
- [ ] 配置TypeScript
- [ ] 设置路由 (React Router)
- [ ] 配置状态管理 (Redux Toolkit)
- [ ] 集成UI组件库 (Material-UI)
- [ ] 配置API客户端 (Axios)

#### 4.2 核心组件开发
**任务清单:**
- [ ] 登录/注册组件
- [ ] 用户仪表板
- [ ] Instagram账号管理界面
- [ ] 代理配置界面
- [ ] 定时发帖配置界面
- [ ] 搜索任务配置界面
- [ ] 消息监控界面
- [ ] 数据统计界面

#### 4.3 MQTT客户端集成
**任务清单:**
- [ ] 封装现有的Node.js MQTT代码
- [ ] 实现实时消息显示组件
- [ ] 实现自动回复配置界面
- [ ] 实现会话管理界面
- [ ] 实现消息通知系统

### 阶段5：部署和优化 (预计2-3天)

#### 5.1 容器化部署
**任务清单:**
- [ ] 编写Dockerfile (后端)
- [ ] 编写Dockerfile (前端)
- [ ] 配置docker-compose.yml
- [ ] 设置环境变量管理
- [ ] 配置数据库迁移
- [ ] 设置健康检查

#### 5.2 性能优化
**任务清单:**
- [ ] 实现Redis缓存策略
- [ ] 优化数据库查询
- [ ] 实现API限流
- [ ] 添加监控和日志
- [ ] 性能测试和调优

## 🛠️ 技术栈详细说明

### 后端依赖 (requirements.txt)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pymysql==1.1.0
redis==5.0.1
celery==5.3.4
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
alembic==1.13.1
httpx==0.25.2
websockets==12.0
instagrapi==2.0.0
requests==2.31.0
PySocks==1.7.1
pycryptodomex==3.20.0
```

### 前端依赖 (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.0.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "mqtt": "^5.3.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

## 📋 开发时间线

| 阶段 | 预计时间 | 主要任务 |
|------|----------|----------|
| 阶段1 | 3-4天 | 后端框架搭建、数据库设计、用户认证 |
| 阶段2 | 4-5天 | Instagram API集成、账号管理 |
| 阶段3 | 5-6天 | 自动化功能实现 |
| 阶段4 | 6-7天 | 前端开发、用户界面 |
| 阶段5 | 2-3天 | 部署优化、测试 |
| **总计** | **20-25天** | **完整平台开发** |

## 🔧 开发环境要求

### 开发工具
- Python 3.9+
- Node.js 18+
- MySQL 8.0
- Redis 6.0+
- Docker & docker-compose

### IDE推荐
- VS Code + Python/React扩展
- 或 PyCharm Professional

## 📝 注意事项

1. **安全性**: 所有敏感信息 (密码、Token) 必须加密存储
2. **合规性**: 遵守Instagram API使用条款和限制
3. **性能**: 实现适当的缓存和限流机制
4. **监控**: 添加日志记录和错误监控
5. **测试**: 编写单元测试和集成测试

## 📚 相关文档

- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [React官方文档](https://react.dev/)
- [Instagrapi GitHub](https://github.com/adw0rd/instagrapi)
- [Node.js Instagram Private API](https://github.com/dilame/instagram-private-api)

---

**文档创建时间**: 2025-12-08  
**最后更新**: 2025-12-08  
**版本**: v1.0
