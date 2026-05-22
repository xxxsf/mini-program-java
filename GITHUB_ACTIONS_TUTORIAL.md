# GitHub Actions 配置教程

这是一个手把手的教程，教您如何配置和使用 GitHub Actions 进行微信小程序部署。

## 📋 前置条件

- ✅ 已有 GitHub 账户
- ✅ 项目代码已推送到 GitHub
- ✅ 已安装微信开发者工具

## 🚀 第 1 步：访问 GitHub 仓库

1. 打开浏览器，访问您的 GitHub 仓库
2. 确认您在 main 分支上
3. 检查是否有 Actions 标签页（顶部导航栏）

## 🔐 第 2 步：配置 GitHub Secrets

### 2.1 进入设置页面

1. 在仓库页面顶部，点击 **Settings** (设置)
2. 在左侧菜单中，找到 **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 按钮

### 2.2 添加必需的 Secrets

根据您的需求，添加以下 Secrets：

#### A. Docker 相关 (如果使用 Docker 部署)

**Secret 1: DOCKER_USERNAME**
```
Name: DOCKER_USERNAME
Value: your_dockerhub_username
```
- 在 Docker Hub (https://hub.docker.com/) 注册的用户名
- 如果没有 Docker Hub 账户，可以先跳过这个

**Secret 2: DOCKER_PASSWORD**
```
Name: DOCKER_PASSWORD
Value: your_docker_access_token
```
- 不是登录密码，而是访问令牌
- 获取方式：
  1. 登录 Docker Hub
  2. 点击右上角头像 → Account Settings
  3. 左侧 Security → New Access Token
  4. 输入描述，点击 Generate
  5. 复制生成的令牌

#### B. 数据库相关 (如果需要部署后端)

**Secret 3: DATABASE_URL**
```
Name: DATABASE_URL
Value: jdbc:mysql://localhost:3306/invoicetool?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
```
- 根据您的实际数据库地址修改
- 本地开发：localhost
- 云数据库：相应的云数据库地址

**Secret 4: DATABASE_USERNAME**
```
Name: DATABASE_USERNAME
Value: root
```
- 您的数据库用户名

**Secret 5: DATABASE_PASSWORD**
```
Name: DATABASE_PASSWORD
Value: your_database_password
```
- 您的数据库密码

#### C. 服务器相关 (如果部署到云服务器)

**Secret 6: SERVER_HOST**
```
Name: SERVER_HOST
Value: your_server_ip_address
```

**Secret 7: SERVER_USER**
```
Name: SERVER_USER
Value: your_ssh_username
```

**Secret 8: SERVER_SSH_KEY**
```
Name: SERVER_SSH_KEY
Value: -----BEGIN RSA PRIVATE KEY-----
your_private_key_content
-----END RSA PRIVATE KEY-----
```
- 您的 SSH 私钥完整内容

### 2.3 最小配置 (仅测试构建)

如果您只是想测试 GitHub Actions 是否工作，可以只配置：

```
DATABASE_URL=jdbc:mysql://localhost:3306/invoicetool?useSSL=false&serverTimezone=UTC
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
```

其他 Secrets 可以暂时跳过，相应的工作流步骤会跳过。

## ▶️ 第 3 步：触发 GitHub Actions

### 3.1 自动触发

配置完 Secrets 后，每次推送代码都会自动触发构建：

```bash
# 做一个小的修改来触发构建
echo "# Test" >> README.md
git add README.md
git commit -m "Test GitHub Actions"
git push origin main
```

### 3.2 手动触发

1. 访问仓库的 **Actions** 标签页
2. 选择一个工作流（如 "WeChat Mini Program CI"）
3. 点击右侧的 **Run workflow** 按钮
4. 选择分支（通常是 main）
5. 点击绿色的 **Run workflow** 按钮

## 👀 第 4 步：查看构建过程

### 4.1 访问 Actions 页面

1. 点击仓库顶部的 **Actions** 标签
2. 您会看到所有的工作流运行记录
3. 最新的运行会在顶部

### 4.2 查看具体步骤

1. 点击某个工作流运行记录
2. 您会看到各个步骤的执行情况：
   - ✅ 绿色勾：成功
   - ❌ 红色叉：失败
   - 🔄 蓝色圆圈：进行中

3. 点击每个步骤可以查看详细日志

### 4.3 常见步骤说明

**validate-miniprogram** 步骤：
- 检查项目结构是否正确
- 验证 JSON 文件语法
- 检查代码质量问题

**build-backend** 步骤：
- 设置 Java 环境
- 使用 Maven 构建项目
- 运行测试

**package-miniprogram** 步骤：
- 创建小程序部署包
- 生成构建信息

## 📦 第 5 步：下载构建产物

### 5.1 找到构建产物

1. 在工作流运行页面底部
2. 找到 **Artifacts** 部分
3. 您会看到可下载的产物：
   - `miniprogram-deploy`: 小程序部署包
   - `backend-jar`: 后端 JAR 文件
   - `test-results`: 测试结果

### 5.2 下载部署包

1. 点击 `miniprogram-deploy` 旁边的下载按钮
2. 等待下载完成
3. 解压下载的 zip 文件

### 5.3 验证部署包

解压后，您应该看到：
```
miniprogram-deploy/
├── app.js
├── app.json
├── app.wxss
├── pages/
├── utils/
└── build-info.json
```

## 📱 第 6 步：上传到微信小程序

### 6.1 打开微信开发者工具

1. 启动微信开发者工具
2. 确保已登录微信账号

### 6.2 导入项目

1. 点击 **+** 号或 **导入项目**
2. 选择刚才解压的目录
3. 填写项目信息：
   - 项目名称：InvoiceTool
   - AppID：填入您的小程序 AppID（或使用测试号）
4. 点击 **导入**

### 6.3 检查项目

1. 查看项目是否正常加载
2. 检查控制台是否有错误
3. 测试基本功能是否正常

### 6.4 上传代码

1. 点击右上角的 **上传** 按钮
2. 填写版本号：如 `1.0.0`
3. 填写项目备注：如 `GitHub Actions 自动构建`
4. 点击 **上传**
5. 等待上传完成

### 6.5 微信小程序后台操作

1. 登录微信小程序后台 (https://mp.weixin.qq.com/)
2. 进入 **版本管理**
3. 在 **开发版本** 中找到刚上传的版本
4. 点击 **预览** 生成二维码，用手机扫码测试
5. 确认无误后，点击 **提交审核**

## 🔧 第 7 步：故障排除

### 问题 1：工作流失败

**症状**：某个步骤显示红色叉

**解决方法**：
1. 点击失败的步骤查看详细日志
2. 根据错误信息定位问题
3. 常见错误：
   - Java 版本不对：确保使用 Java 17
   - 依赖下载失败：检查网络连接
   - 测试失败：检查测试代码

### 问题 2：无法下载构建产物

**症状**：Artifacts 部分没有下载按钮

**解决方法**：
1. 确保工作流已成功完成
2. 检查是否有权限访问
3. 尝试重新运行工作流

### 问题 3：微信开发者工具导入失败

**症状**：项目导入时报错

**解决方法**：
1. 检查 app.json 文件格式是否正确
2. 确认所有必需文件都存在
3. 检查 AppID 是否正确

## 🎯 第 8 步：设置自动触发（可选）

### 8.1 修改工作流触发条件

编辑 `.github/workflows/wechat-miniprogram.yml`：

```yaml
on:
  push:
    branches: [ main, develop ]    # 推送到这些分支时触发
    paths:                         # 只有这些文件变化时才触发
      - 'invoiceTool_miniProgram/**'
  pull_request:
    branches: [ main ]             # PR 到 main 分支时触发
  workflow_dispatch:              # 允许手动触发
```

### 8.2 设置分支保护

1. 进入仓库 **Settings**
2. 左侧 **Branches**
3. 点击 **Add rule**
4. 选择 main 分支
5. 启用 **Require status checks to pass before merging**
6. 选择需要的工作流检查

## 📊 第 9 步：优化和定制

### 9.1 添加通知

在工作流中添加 Slack 或邮件通知：

```yaml
- name: Send notification
  if: always()
  run: |
    echo "Deployment status: ${{ job.status }}"
```

### 9.2 添加环境变量

在工作流中添加自定义环境变量：

```yaml
env:
  CUSTOM_VAR: value
```

### 9.3 优化构建速度

使用缓存来加速构建：

```yaml
- name: Cache Maven packages
  uses: actions/cache@v3
  with:
    path: ~/.m2/repository
    key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
```

## 🎓 下一步学习

- 学习更复杂的工作流配置
- 设置多环境部署（开发、测试、生产）
- 集成自动化测试
- 配置自动化部署到服务器

## 🆘 获取帮助

- GitHub Actions 官方文档：https://docs.github.com/en/actions
- 微信小程序开发文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 本项目指南：[.github/GITHUB_ACTIONS_GUIDE.md](.github/GITHUB_ACTIONS_GUIDE.md)

---

*按照这个教程，您应该能够成功配置和使用 GitHub Actions 进行微信小程序的自动化构建和部署。*