#!/bin/bash
# ============================================
# InvoiceTool 部署/更新脚本
# 使用方法: bash deploy.sh [命令]
#   deploy.sh          - 首次部署或更新
#   deploy.sh stop     - 停止服务
#   deploy.sh restart  - 重启服务
#   deploy.sh logs     - 查看日志
#   deploy.sh status   - 查看状态
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 .env 文件
check_env() {
    if [ ! -f .env ]; then
        log_error ".env 文件不存在!"
        log_info "请先复制并编辑环境变量配置："
        echo "  cp .env.example .env"
        echo "  vim .env"
        exit 1
    fi
}

# 选择 docker compose 命令
COMPOSE_CMD=""
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    log_error "Docker Compose 未安装，请先运行 setup-server.sh"
    exit 1
fi

case "${1:-deploy}" in
    deploy|up)
        check_env
        log_info "开始构建和部署..."

        # 拉取最新代码（如果是 Git 仓库）
        if [ -d "../.git" ]; then
            log_info "拉取最新代码..."
            cd ..
            git pull origin main || log_warn "Git pull 失败，使用当前代码继续"
            cd "$SCRIPT_DIR"
        fi

        # 构建并启动
        log_info "构建 Docker 镜像..."
        $COMPOSE_CMD build --no-cache app

        log_info "启动服务..."
        $COMPOSE_CMD up -d

        log_info "等待服务启动..."
        sleep 10

        # 检查服务状态
        if $COMPOSE_CMD ps | grep -q "Up"; then
            log_info "部署成功!"
            $COMPOSE_CMD ps
        else
            log_error "部署可能失败，请检查日志："
            echo "  $COMPOSE_CMD logs"
        fi
        ;;

    stop|down)
        log_info "停止所有服务..."
        $COMPOSE_CMD down
        log_info "服务已停止"
        ;;

    restart)
        check_env
        log_info "重启服务..."
        $COMPOSE_CMD restart
        log_info "服务已重启"
        ;;

    logs)
        SERVICE="${2:-}"
        if [ -n "$SERVICE" ]; then
            $COMPOSE_CMD logs -f --tail=100 "$SERVICE"
        else
            $COMPOSE_CMD logs -f --tail=100
        fi
        ;;

    status)
        $COMPOSE_CMD ps
        echo ""
        log_info "磁盘使用:"
        docker system df
        ;;

    rebuild)
        check_env
        log_info "完全重新构建..."
        $COMPOSE_CMD down
        $COMPOSE_CMD build --no-cache
        $COMPOSE_CMD up -d
        log_info "重新构建完成"
        ;;

    *)
        echo "用法: bash deploy.sh [命令]"
        echo ""
        echo "命令:"
        echo "  deploy   - 首次部署或更新 (默认)"
        echo "  stop     - 停止所有服务"
        echo "  restart  - 重启所有服务"
        echo "  logs     - 查看日志 (可指定服务: logs app/mysql/nginx)"
        echo "  status   - 查看服务状态"
        echo "  rebuild  - 完全重新构建"
        ;;
esac
