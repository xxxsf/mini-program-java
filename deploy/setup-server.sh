#!/bin/bash
# ============================================
# 腾讯云服务器初始化脚本
# 在全新服务器上运行此脚本安装必要软件
# 使用方法: sudo bash setup-server.sh
# ============================================

set -e

echo "=========================================="
echo "  InvoiceTool 服务器环境初始化"
echo "=========================================="

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "无法检测操作系统"
    exit 1
fi

echo "检测到操作系统: $OS"

# 更新系统
echo "[1/5] 更新系统包..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update && apt-get upgrade -y
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "tencentos" ]; then
    yum update -y
fi

# 安装 Docker
echo "[2/5] 安装 Docker..."
if command -v docker &> /dev/null; then
    echo "Docker 已安装: $(docker --version)"
else
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "tencentos" ]; then
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
    fi
    systemctl start docker
    systemctl enable docker
    echo "Docker 安装完成: $(docker --version)"
fi

# 安装 Docker Compose
echo "[3/5] 安装 Docker Compose..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo "Docker Compose 已安装"
else
    COMPOSE_VERSION="v2.27.0"
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成: $(docker-compose --version)"
fi

# 安装 Git
echo "[4/5] 安装 Git..."
if command -v git &> /dev/null; then
    echo "Git 已安装: $(git --version)"
else
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y git
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "tencentos" ]; then
        yum install -y git
    fi
fi

# 配置防火墙
echo "[5/5] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable 2>/dev/null || true
    echo "UFW 防火墙已配置"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    echo "Firewalld 防火墙已配置"
else
    echo "请手动在腾讯云安全组中开放 80 和 443 端口"
fi

echo ""
echo "=========================================="
echo "  服务器环境初始化完成!"
echo "=========================================="
echo ""
echo "重要提醒："
echo "1. 请确保腾讯云安全组已开放 80、443 端口"
echo "2. 下一步请执行部署脚本: bash deploy.sh"
