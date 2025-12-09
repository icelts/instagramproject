#!/bin/bash

# Instagram项目管理器部署脚本
# 使用方法: ./deploy.sh [development|production]

set -e

# 配置变量
ENVIRONMENT=${1:-development}
PROJECT_NAME="instagramproject"
DOCKER_REGISTRY="your-registry.com"  # 如果使用私有仓库

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_info "依赖检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p nginx/ssl
    mkdir -p logs/nginx
    mkdir -p data/mysql
    mkdir -p data/redis
    mkdir -p backups
    
    log_info "目录创建完成"
}

# 生成SSL证书（自签名，生产环境请使用Let's Encrypt）
generate_ssl() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warn "生产环境请使用有效的SSL证书"
        return
    fi
    
    log_info "生成自签名SSL证书..."
    
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
            -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
        log_info "SSL证书生成完成"
    else
        log_info "SSL证书已存在，跳过生成"
    fi
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # 生产环境配置
        cp .env.production .env
        log_warn "请确保修改.env文件中的生产环境配置"
    else
        # 开发环境配置
        cp .env.development .env
        log_info "使用开发环境配置"
    fi
}

# 构建和启动服务
start_services() {
    log_info "构建和启动服务..."
    
    # 拉取最新镜像
    docker-compose pull
    
    # 构建本地镜像
    docker-compose build --no-cache
    
    # 启动服务
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose up -d
    else
        docker-compose up -d
    fi
    
    log_info "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待数据库
    log_info "等待MySQL数据库..."
    until docker-compose exec mysql mysqladmin ping -h"localhost" --silent; do
        sleep 2
    done
    log_info "MySQL数据库已就绪"
    
    # 等待Redis
    log_info "等待Redis..."
    until docker-compose exec redis redis-cli ping; do
        sleep 2
    done
    log_info "Redis已就绪"
    
    # 运行数据库迁移
    log_info "运行数据库迁移..."
    docker-compose exec backend alembic upgrade head
    
    # 等待后端服务
    log_info "等待后端服务..."
    until curl -f http://localhost:8000/health; do
        sleep 5
    done
    log_info "后端服务已就绪"
    
    # 等待前端服务
    log_info "等待前端服务..."
    until curl -f http://localhost:3000; do
        sleep 5
    done
    log_info "前端服务已就绪"
}

# 运行健康检查
health_check() {
    log_info "运行健康检查..."
    
    # 检查容器状态
    docker-compose ps
    
    # 检查服务健康状态
    log_info "检查服务健康状态..."
    curl -f http://localhost:8000/health || log_error "后端服务健康检查失败"
    curl -f http://localhost:3000 || log_error "前端服务健康检查失败"
    curl -f http://localhost/ || log_error "Nginx代理健康检查失败"
}

# 显示部署信息
show_deployment_info() {
    log_info "部署完成！"
    echo ""
    echo "==================================="
    echo "服务访问地址："
    echo "前端应用: http://localhost"
    echo "后端API: http://localhost/api"
    echo "健康检查: http://localhost/health"
    echo ""
    echo "数据库连接："
    echo "MySQL: localhost:3306"
    echo "Redis: localhost:6379"
    echo ""
    echo "管理命令："
    echo "查看日志: docker-compose logs -f [service]"
    echo "重启服务: docker-compose restart [service]"
    echo "停止服务: docker-compose down"
    echo "==================================="
}

# 备份数据库
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "备份数据库..."
        BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose exec mysql mysqldump -u root -p instagramproject > "$BACKUP_FILE"
        log_info "数据库备份完成: $BACKUP_FILE"
    fi
}

# 主函数
main() {
    log_info "开始部署 $PROJECT_NAME ($ENVIRONMENT 环境)..."
    
    check_dependencies
    create_directories
    setup_environment
    generate_ssl
    backup_database
    start_services
    wait_for_services
    health_check
    show_deployment_info
    
    log_info "部署完成！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
