# InvoiceTool 腾讯云部署指南

## 部署架构

```
用户请求 -> Nginx(443/HTTPS) -> Spring Boot(8080) -> MySQL(3306)
```

三个服务全部用 Docker Compose 编排，运行在同一台服务器上。

## 文件结构

```
deploy/
├── docker-compose.yml              # 编排 MySQL + App + Nginx
├── .env.example                     # 环境变量模板
├── deploy.sh                        # 部署/管理脚本
├── setup-server.sh                  # 服务器初始化脚本
├── setup-ssl.sh                     # SSL 证书配置脚本
├── mysql/init/01-init.sql           # 数据库初始化
└── nginx/
    ├── conf.d/default.conf          # HTTPS 反向代理配置
    ├── conf.d/default-http-only.conf.bak  # HTTP 测试配置(备用)
    └── ssl/                         # SSL 证书存放目录
```

---

## 部署步骤（按顺序执行）

### 第 1 步：域名解析

在你的域名 DNS 管理后台，添加 **A 记录**指向腾讯云服务器的公网 IP。

> 解析生效通常需要几分钟到几小时不等，可用 `ping 你的域名` 验证是否生效。

### 第 2 步：腾讯云安全组

登录腾讯云控制台 -> 云服务器 -> 安全组，确保开放以下端口：

| 端口 | 协议 | 用途 |
|------|------|------|
| 22   | TCP  | SSH 远程登录 |
| 80   | TCP  | HTTP |
| 443  | TCP  | HTTPS |

### 第 3 步：上传代码到服务器

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 方式一：Git 克隆（推荐）
git clone 你的仓库地址 /opt/mini-program-java
cd /opt/mini-program-java/deploy

# 方式二：从本地上传（在本地终端执行）
scp -r ./deploy root@你的服务器IP:/opt/mini-program-java/deploy
```

### 第 4 步：初始化服务器环境

```bash
cd /opt/mini-program-java/deploy
sudo bash setup-server.sh
```

该脚本会自动完成：
- 系统更新
- 安装 Docker
- 安装 Docker Compose
- 安装 Git
- 配置防火墙（开放 80/443 端口）

### 第 5 步：配置环境变量

```bash
cp .env.example .env
vim .env
```

**必须修改以下配置项：**

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | 自定义强密码 |
| `WECHAT_APPID` | 微信小程序 AppID | 微信公众平台 -> 开发管理 |
| `WECHAT_APPSECRET` | 微信小程序 AppSecret | 微信公众平台 -> 开发管理 |
| `MAIL_USERNAME` | QQ 邮箱地址 | 你的 QQ 邮箱 |
| `MAIL_PASSWORD` | SMTP 授权码 | QQ 邮箱 -> 设置 -> 账户 -> 生成授权码 |
| `TENCENT_SECRET_ID` | 腾讯云 API 密钥 ID | https://console.cloud.tencent.com/cam/capi |
| `TENCENT_SECRET_KEY` | 腾讯云 API 密钥 Key | 同上 |

### 第 6 步：修改 Nginx 域名配置

```bash
# 将配置中的域名占位符替换为你的实际域名
sed -i 's/YOUR_DOMAIN/你的域名/g' nginx/conf.d/default.conf
sed -i 's/YOUR_DOMAIN/你的域名/g' nginx/conf.d/default-http-only.conf.bak
```

### 第 7 步：先用 HTTP 模式测试部署

> SSL 证书还没配置，先用 HTTP 模式跑通确认服务正常。

```bash
# 切换到 HTTP 模式配置
cp nginx/conf.d/default-http-only.conf.bak nginx/conf.d/default.conf
sed -i 's/YOUR_DOMAIN/你的域名/g' nginx/conf.d/default.conf

# 启动所有服务
bash deploy.sh
```

等待约 1-2 分钟后，访问 `http://你的域名` 确认服务正常运行。

验证方式：
```bash
# 查看服务状态
bash deploy.sh status

# 查看应用日志
bash deploy.sh logs app

# 测试接口
curl http://localhost:8080/actuator/health
```

### 第 8 步：配置 HTTPS（SSL 证书）

```bash
bash setup-ssl.sh
```

脚本支持两种方式：

**方式一：腾讯云免费 SSL 证书（推荐）**

1. 登录 https://console.cloud.tencent.com/ssl
2. 点击「申请免费证书」
3. 填写域名信息，选择 DNS 验证
4. 按提示在域名解析中添加 TXT 记录
5. 证书签发后，下载「Nginx」格式
6. 将证书文件上传到服务器：
   ```bash
   # 上传证书（在本地执行）
   scp xxx.pem root@服务器IP:/opt/mini-program-java/deploy/nginx/ssl/fullchain.pem
   scp xxx.key root@服务器IP:/opt/mini-program-java/deploy/nginx/ssl/privkey.pem
   ```
7. 恢复 HTTPS 配置并重启：
   ```bash
   # 在服务器上执行
   cp nginx/conf.d/default.conf nginx/conf.d/default.conf.http.bak
   # 编辑 default.conf 恢复为 HTTPS 版本（或从 Git 恢复）
   git checkout -- nginx/conf.d/default.conf
   sed -i 's/YOUR_DOMAIN/你的域名/g' nginx/conf.d/default.conf
   docker compose restart nginx
   ```

**方式二：Let's Encrypt 自动证书**

脚本会自动申请并配置，需要域名已正确解析到服务器 IP。

### 第 9 步：配置微信小程序合法域名

1. 登录微信公众平台: https://mp.weixin.qq.com
2. 进入「开发管理」->「开发设置」->「服务器域名」
3. 添加 `https://你的域名` 为 **request 合法域名**
4. 在小程序前端代码中，将后端 API 地址改为 `https://你的域名`

---

## 日常运维命令

```bash
cd /opt/mini-program-java/deploy

# 查看服务状态
bash deploy.sh status

# 查看所有日志
bash deploy.sh logs

# 查看指定服务日志
bash deploy.sh logs app      # Java 应用日志
bash deploy.sh logs mysql    # 数据库日志
bash deploy.sh logs nginx    # Nginx 日志

# 重启服务
bash deploy.sh restart

# 代码更新后重新构建部署
bash deploy.sh rebuild

# 停止所有服务
bash deploy.sh stop
```

---

## 数据备份

```bash
# 手动备份数据库
docker exec invoicetool-mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" invoicetool > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i invoicetool-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" invoicetool < backup_20240101.sql
```

建议设置定时备份（crontab）：
```bash
# 每天凌晨 2 点自动备份
0 2 * * * cd /opt/mini-program-java/deploy && docker exec invoicetool-mysql mysqldump -u root -p"$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2)" invoicetool > /opt/backups/invoicetool_$(date +\%Y\%m\%d).sql
```

---

## 故障排查

### 应用启动失败

```bash
# 查看详细日志
bash deploy.sh logs app

# 常见原因：
# 1. MySQL 还没启动完成 -> 等待后重启 app
docker compose restart app

# 2. 环境变量配置错误 -> 检查 .env 文件
cat .env
```

### 无法访问网站

```bash
# 1. 检查服务是否运行
bash deploy.sh status

# 2. 检查端口监听
netstat -tlnp | grep -E '80|443|8080'

# 3. 检查安全组是否开放端口（腾讯云控制台）

# 4. 检查域名解析
ping 你的域名
```

### MySQL 连接失败

```bash
# 检查 MySQL 容器状态
docker logs invoicetool-mysql

# 手动连接测试
docker exec -it invoicetool-mysql mysql -u root -p
```

---

## 注意事项

1. **安全**: 生产环境务必修改默认密码，不要将 `.env` 文件提交到 Git
2. **内存**: 4G 服务器建议 JVM 堆内存不超过 512MB（已在 docker-compose.yml 中配置）
3. **JPA ddl-auto**: 当前为 `update` 模式（自动建表），生产稳定后建议改为 `validate`
4. **日志**: Nginx 日志存储在 Docker volume 中，注意定期清理避免磁盘占满
