#!/bin/bash
# ============================================
# SSL 证书配置脚本
# 支持两种方式：
#   1. 腾讯云免费 SSL 证书（推荐）
#   2. Let's Encrypt 自动申请
# 使用方法: bash setup-ssl.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "=========================================="
echo "  SSL 证书配置"
echo "=========================================="
echo ""
echo "请选择 SSL 证书获取方式："
echo "  1) 腾讯云免费 SSL 证书（推荐，有效期1年）"
echo "  2) Let's Encrypt 自动申请（免费，每3个月自动续期）"
echo ""
read -p "请选择 (1/2): " CHOICE

case $CHOICE in
    1)
        echo ""
        log_info "腾讯云 SSL 证书配置步骤："
        echo ""
        echo "1. 登录腾讯云控制台: https://console.cloud.tencent.com/ssl"
        echo "2. 点击「申请免费证书」"
        echo "3. 填写域名信息，选择 DNS 验证"
        echo "4. 按提示在域名解析中添加 TXT 记录验证"
        echo "5. 证书签发后，下载「Nginx」格式的证书文件"
        echo "6. 将下载的文件解压，得到两个文件："
        echo "   - xxx.pem (证书文件)"
        echo "   - xxx.key (私钥文件)"
        echo ""
        echo "7. 将文件复制到服务器："
        echo "   cp xxx.pem ${SCRIPT_DIR}/nginx/ssl/fullchain.pem"
        echo "   cp xxx.key ${SCRIPT_DIR}/nginx/ssl/privkey.pem"
        echo ""
        read -p "证书文件是否已放置到 nginx/ssl/ 目录? (y/n): " READY
        if [ "$READY" = "y" ] || [ "$READY" = "Y" ]; then
            if [ -f nginx/ssl/fullchain.pem ] && [ -f nginx/ssl/privkey.pem ]; then
                log_info "证书文件已就位，正在重启 Nginx..."
                docker compose restart nginx 2>/dev/null || docker-compose restart nginx
                log_info "HTTPS 配置完成!"
            else
                log_warn "证书文件不存在，请检查路径"
            fi
        fi
        ;;

    2)
        read -p "请输入你的域名 (如 api.example.com): " DOMAIN
        read -p "请输入你的邮箱 (用于 Let's Encrypt 通知): " EMAIL

        if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
            echo "域名和邮箱不能为空"
            exit 1
        fi

        log_info "使用 Let's Encrypt 申请证书..."

        # 先确保 HTTP 模式的 Nginx 在运行
        log_info "临时切换到 HTTP 模式..."
        cp nginx/conf.d/default-http-only.conf.bak nginx/conf.d/default.conf
        sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx/conf.d/default.conf

        # 创建 certbot 验证目录
        mkdir -p certbot/www certbot/conf

        # 启动 Nginx
        docker compose up -d nginx 2>/dev/null || docker-compose up -d nginx

        # 使用 certbot 申请证书
        docker run --rm \
            -v "${SCRIPT_DIR}/certbot/www:/var/www/certbot" \
            -v "${SCRIPT_DIR}/certbot/conf:/etc/letsencrypt" \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN"

        if [ $? -eq 0 ]; then
            # 复制证书到 Nginx SSL 目录
            cp "certbot/conf/live/$DOMAIN/fullchain.pem" nginx/ssl/fullchain.pem
            cp "certbot/conf/live/$DOMAIN/privkey.pem" nginx/ssl/privkey.pem

            # 恢复 HTTPS 配置
            log_info "切换到 HTTPS 模式..."
            cat > nginx/conf.d/default.conf << NGINX_CONF
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
}
server {
    listen 443 ssl;
    server_name ${DOMAIN};
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    client_max_body_size 25M;
    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_CONF

            docker compose restart nginx 2>/dev/null || docker-compose restart nginx
            log_info "HTTPS 配置完成!"

            # 设置自动续期 crontab
            RENEW_CMD="0 3 * * 1 cd ${SCRIPT_DIR} && docker run --rm -v ${SCRIPT_DIR}/certbot/www:/var/www/certbot -v ${SCRIPT_DIR}/certbot/conf:/etc/letsencrypt certbot/certbot renew && cp certbot/conf/live/${DOMAIN}/fullchain.pem nginx/ssl/fullchain.pem && cp certbot/conf/live/${DOMAIN}/privkey.pem nginx/ssl/privkey.pem && docker compose restart nginx"
            (crontab -l 2>/dev/null; echo "$RENEW_CMD") | crontab -
            log_info "已设置自动续期（每周一凌晨3点检查）"
        else
            log_warn "证书申请失败，请检查域名解析是否生效"
        fi
        ;;

    *)
        echo "无效选择"
        exit 1
        ;;
esac
