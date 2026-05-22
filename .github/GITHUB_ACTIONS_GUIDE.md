# GitHub Actions + 微信小程序云部署指南

本指南专门针对使用 GitHub Actions 进行微信小程序云部署的场景。

## 🎯 部署架构

```
GitHub 仓库 → GitHub Actions → 构建产物 → 微信开发者工具 → 微信小程序云
     ↓              ↓                ↓                 ↓
  代码提交      自动构建测试      部署包打包        手动/自动上传
```

## 📁 文件结构

```
.github/
└── workflows/
    ├── ci-cd.yml                 # 完整的 CI/CD 流程
    └── wechat-miniprogram.yml    # 专门的小程序构建流程

invoiceTool_Java/                 # Java 后端
├── src/
└── pom.xml

invoiceTool_miniProgram/          # 微信小程序前端
├── app.js
├── app.json
├── app.wxss
└── pages/

wechat-deploy.sh                  # 微信部署辅助脚本
```

## 🚀 快速开始

### 1. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

**路径**: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

#### 必需的 Secrets

```bash
# Docker 相关 (如果使用 Docker 部署)
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_token

# 服务器相关 (如果部署到云服务器)
SERVER_HOST=your_server_ip
SERVER_USER=your_ssh_user
SERVER_SSH_KEY=your_private_ssh_key

# 数据库相关
DATABASE_URL=jdbc:mysql://your_db_host:3306/invoicetool
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
```

### 2. 推送代码触发构建

```bash
git add .
git commit -m "Add GitHub Actions configuration"
git push origin main
```

### 3. 查看构建状态

访问 GitHub 仓库的 `Actions` 标签页查看构建进度。

## 🔧 工作流说明

### ci-cd.yml - 完整 CI/CD 流程

这个工作流包含：

1. **Java 后端构建**
   - JDK 17 环境设置
   - Maven 构建和测试
   - Docker 镜像构建和推送
   - 服务器部署

2. **微信小程序构建**
   - 代码结构验证
   - JSON 语法检查
   - 代码质量检查
   - 部署包打包

3. **部署阶段**
   - 后端服务部署
   - 小程序上传准备

### wechat-miniprogram.yml - 小程序专用流程

专注于微信小程序的构建和验证：

1. **代码验证**
   - 项目结构检查
   - JSON 语法验证
   - 代码质量检查

2. **构建准备**
   - 创建构建信息
   - 打包部署文件

3. **部署辅助**
   - 生成部署说明
   - 提供手动操作指南

## 📱 微信小程序部署方式

### 方式 1: 使用微信开发者工具 CLI (推荐)

**前提条件**:
- 已安装微信开发者工具
- 已登录微信账号
- 项目已配置正确的 AppID

**步骤**:
```bash
# macOS
/Applications/wechatwebdevtools.app/Contents/MacOS/cli upload \
  --project /path/to/project \
  --version 1.0.0 \
  -- desc "描述信息"

# Windows
cli upload --project /path/to/project --version 1.0.0 --desc "描述信息"
```

### 方式 2: 手动上传 (最常用)

由于微信的限制，手动上传仍然是最可靠的方式：

1. **下载构建产物**
   - 在 GitHub Actions 页面下载 `miniprogram-deploy` artifact
   - 解压到本地目录

2. **使用微信开发者工具**
   - 打开微信开发者工具
   - 导入项目（选择解压的目录）
   - 检查项目配置和 AppID
   - 点击"上传"按钮
   - 填写版本号和描述

3. **微信小程序后台操作**
   - 登录微信小程序后台
   - 进入"版本管理"
   - 找到刚上传的版本
   - 点击"预览"测试
   - 确认无误后"提交审核"

### 方式 3: 使用辅助脚本

我们提供了 `wechat-deploy.sh` 脚本来简化流程：

```bash
# 运行部署脚本
./wechat-deploy.sh
```

脚本功能：
- ✅ 自动验证项目结构
- ✅ 创建构建信息
- ✅ 准备部署包
- ✅ 提供上传指导
- ✅ 可选的自动上传（如果支持）

## 🔍 构建产物说明

GitHub Actions 会生成以下构建产物：

1. **test-results**: 测试报告
2. **backend-jar**: Java 后端 JAR 文件
3. **miniprogram-deploy**: 微信小程序部署包
4. **miniprogram-package**: 小程序源码包

### 下载构建产物

1. 进入 GitHub 仓库的 Actions 页面
2. 选择一个完成的工作流运行
3. 滚动到页面底部的 "Artifacts" 部分
4. 点击下载所需的产物

## 🛠️ 本地测试

### 测试 Java 后端构建

```bash
cd invoiceTool_Java
chmod +x mvnw
./mvnw clean package
```

### 测试小程序构建

```bash
# 验证项目结构
cd invoiceTool_miniProgram
ls -la

# 检查 JSON 语法
cat app.json | jq .
```

### 测试完整部署流程

```bash
# 运行微信部署脚本
./wechat-deploy.sh

# 运行 Docker 构建
./docker-build.sh
```

## 📊 监控和日志

### 查看工作流日志

1. 访问 GitHub 仓库的 Actions 页面
2. 点击具体的工作流运行
3. 点击各个步骤查看详细日志
4. 失败的步骤会显示错误信息

### 常见问题排查

**问题 1: Maven 构建失败**
```
解决方案:
- 检查 Java 版本 (需要 Java 17)
- 验证 pom.xml 配置
- 检查网络连接和依赖下载
```

**问题 2: Docker 推送失败**
```
解决方案:
- 验证 Docker Hub 凭证
- 检查镜像名称格式
- 确认网络连接
```

**问题 3: 小程序验证失败**
```
解决方案:
- 检查必需文件是否存在
- 验证 JSON 语法
- 确认项目结构符合微信规范
```

**问题 4: SSH 部署失败**
```
解决方案:
- 验证服务器连接
- 检查 SSH 密钥配置
- 确认服务器权限
```

## 🔄 自动化触发

### 推送触发

```yaml
on:
  push:
    branches: [ main, develop ]
```

### Pull Request 触发

```yaml
on:
  pull_request:
    branches: [ main ]
```

### 定时触发

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 每天午夜运行
```

### 手动触发

在工作流文件中添加：

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: '部署环境'
        required: true
        default: 'production'
        type: choice
        options:
          - development
          - staging
          - production
```

## 🎨 自定义配置

### 修改 Java 版本

```yaml
- name: Set up JDK
  uses: actions/setup-java@v3
  with:
    java-version: '17'  # 修改为需要的版本
    distribution: 'temurin'
```

### 修改 Docker 镜像

```yaml
- name: Build Docker image
  run: |
    docker build -t my-custom-image:${{ github.sha }} .
```

### 添加自定义步骤

```yaml
- name: Custom step
  run: |
    echo "执行自定义操作"
    # 添加您的命令
```

## 🔐 安全最佳实践

1. **使用 GitHub Secrets**
   - 永远不要在代码中硬编码敏感信息
   - 所有密钥都应存储在 Secrets 中

2. **权限控制**
   - 为 GitHub Actions 配置最小必要权限
   - 定期轮换密钥

3. **依赖安全**
   - 定期更新依赖版本
   - 使用安全扫描工具

4. **分支保护**
   - 为 main 分支启用保护规则
   - 要求 PR 审查

## 📈 性能优化

### 缓存依赖

```yaml
- name: Cache Maven packages
  uses: actions/cache@v3
  with:
    path: ~/.m2/repository
    key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
```

### 并行执行

```yaml
jobs:
  job1:
    # ...
  job2:
    # ... (与 job1 并行执行)
```

### 矩阵构建

```yaml
strategy:
  matrix:
    java: [11, 17, 21]
    os: [ubuntu-latest, windows-latest]
```

## 🆘 故障排除

### 启用调试日志

在仓库 Secrets 中添加：

```
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

### 常用调试命令

```bash
# 本地测试 GitHub Actions
# 使用 act 工具
brew install act
act push

# 查看 GitHub Actions 日志
# 在网页上查看具体步骤的日志
```

## 📚 相关资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [Docker 官方文档](https://docs.docker.com/)

## 🎯 下一步

1. ✅ 配置 GitHub Secrets
2. ✅ 测试工作流运行
3. ✅ 验证构建产物
4. ✅ 设置手动上传流程
5. ✅ 配置通知和监控
6. ✅ 优化构建性能

---

*本指南会根据实际使用情况持续更新。如有问题，请查看 GitHub Actions 日志或参考官方文档。*