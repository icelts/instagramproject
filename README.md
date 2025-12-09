# Instagram项目管理器

一个功能完整的Instagram自动化管理平台，提供用户管理、消息自动化、数据收集、任务调度等功能。

## 🚀 功能特性

### 核心功能
- **用户认证与授权** - JWT令牌认证，多用户支持
- **Instagram账户管理** - 多账户管理，会话保持，代理支持
- **智能消息系统** - 自动回复，批量发送，实时监控
- **任务调度器** - 定时任务，CRON表达式，任务管理
- **数据收集与分析** - 用户数据收集，搜索功能，数据导出
- **实时通信** - WebSocket支持，实时消息推送

### 技术特性
- **现代化架构** - 微服务架构，前后端分离
- **容器化部署** - Docker支持，一键部署
- **高性能** - Redis缓存，连接池，异步处理
- **安全可靠** - 数据加密，限流保护，健康检查
- **可扩展** - 模块化设计，插件架构

## 🏗️ 技术栈

### 后端
- **FastAPI** - 高性能异步Web框架
- **SQLAlchemy** - ORM数据库操作
- **MySQL** - 主数据库
- **Redis** - 缓存和会话存储
- **Alembic** - 数据库迁移
- **WebSocket** - 实时通信

### 前端
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全
- **Redux Toolkit** - 状态管理
- **Tailwind CSS** - 样式框架
- **Material-UI** - UI组件库
- **Recharts** - 数据可视化

### 基础设施
- **Docker** - 容器化
- **Docker Compose** - 服务编排
- **Nginx** - 反向代理
- **GitHub Actions** - CI/CD

## 📋 系统要求

### 开发环境
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Docker & Docker Compose

### 生产环境
- 2GB+ RAM
- 20GB+ 磁盘空间
- Docker运行环境

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/instagramproject.git
cd instagramproject
```

### 2. 环境配置
```bash
# 复制环境配置
cp .env.development .env

# 修改配置文件中的数据库连接等信息
nano .env
```

### 3. 一键部署
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 部署开发环境
./deploy.sh development

# 或者部署生产环境
./deploy.sh production
```

### 4. 访问应用
- 前端应用: http://localhost
- 后端API: http://localhost/api
- API文档: http://localhost/docs

## 📁 项目结构

```
instagramproject/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── alembic/            # 数据库迁移
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # Redux状态
│   │   └── services/       # API服务
│   ├── public/
│   └── Dockerfile
├── nginx/                  # Nginx配置
├── docker-compose.yml       # 服务编排
├── deploy.sh              # 部署脚本
└── README.md
```

## 🔧 开发指南

### 后端开发
```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
python run.py

# 数据库迁移
alembic revision --autogenerate -m "描述"
alembic upgrade head
```

### 前端开发
```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm start

# 构建生产版本
npm run build
```

### 数据库管理
```bash
# 连接数据库
docker-compose exec mysql mysql -u root -p

# 备份数据库
docker-compose exec mysql mysqldump -u root -p instagramproject > backup.sql

# 恢复数据库
docker-compose exec mysql mysql -u root -p instagramproject < backup.sql
```

## 🔐 安全配置

### 生产环境安全清单
- [ ] 修改默认密码和密钥
- [ ] 配置HTTPS证书
- [ ] 设置防火墙规则
- [ ] 启用数据库访问控制
- [ ] 配置日志监控
- [ ] 设置备份策略

### 环境变量安全
```bash
# 生成强密钥
openssl rand -hex 32

# 设置JWT密钥
SECRET_KEY=your-generated-secret-key-here
```

## 📊 监控与日志

### 健康检查
- 应用健康: http://localhost/health
- 数据库状态: http://localhost/api/health
- 系统指标: http://localhost/api/monitoring

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 🚀 部署指南

### 开发环境部署
```bash
./deploy.sh development
```

### 生产环境部署
```bash
# 1. 配置生产环境变量
cp .env.production .env

# 2. 修改域名和SSL证书路径
nano nginx/nginx.conf

# 3. 部署
./deploy.sh production
```

### Docker手动部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

## 🔄 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/refresh` - 刷新令牌

### Instagram管理
- `GET /api/instagram/accounts` - 获取账户列表
- `POST /api/instagram/accounts` - 添加账户
- `PUT /api/instagram/accounts/{id}` - 更新账户
- `DELETE /api/instagram/accounts/{id}` - 删除账户

### 消息管理
- `GET /api/messages` - 获取消息列表
- `POST /api/messages/send` - 发送消息
- `GET /api/messages/threads` - 获取对话列表

### 任务调度
- `GET /api/scheduler/tasks` - 获取任务列表
- `POST /api/scheduler/tasks` - 创建任务
- `PUT /api/scheduler/tasks/{id}` - 更新任务
- `DELETE /api/scheduler/tasks/{id}` - 删除任务

详细API文档请访问: http://localhost/docs

## 🧪 测试

### 后端测试
```bash
cd backend

# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_auth.py

# 生成覆盖率报告
pytest --cov=app tests/
```

### 前端测试
```bash
cd frontend

# 运行单元测试
npm test

# 运行集成测试
npm run test:e2e
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📝 更新日志

### v1.0.0 (2024-12-09)
- ✨ 初始版本发布
- ✨ 完整的Instagram管理功能
- ✨ 实时通信支持
- ✨ 容器化部署
- ✨ 完整的文档

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或有疑问：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](https://github.com/yourusername/instagramproject/issues)
3. 创建新的Issue
4. 联系维护者

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**⚠️ 免责声明**: 本项目仅供学习和研究目的。使用Instagram API时请遵守Instagram的服务条款和API使用政策。
