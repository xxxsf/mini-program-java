# CI/CD 配置总览

本项目已配置多种 CI/CD 方案，您可以根据需求选择最适合的方案。

## 🎯 可用的 CI/CD 方案

### 1. GitHub Actions (推荐) ⭐
- ✅ 免费（公开仓库）
- ✅ 与 GitHub 深度集成
- ✅ 配置简单，易于上手
- ✅ 适合微信小程序项目
- 📁 配置文件：`.github/workflows/`

### 2. Harness CI/CD
- ✅ 功能强大，企业级
- ✅ 可视化界面
- ✅ 支持复杂的部署策略
- ⚠️ 需要额外账户配置
- 📁 配置文件：`.harness/`

### 3. 手动部署
- ✅ 完全控制
- ✅ 适合简单项目
- ❌ 无自动化
- 🔧 使用脚本：`docker-build.sh`, `wechat-deploy.sh`

## 🚀 快速选择指南

### 如果您选择 GitHub Actions (推荐)

1. **配置 Secrets**
   ```bash
   # 在 GitHub 仓库设置中添加以下 Secrets
   DOCKER_USERNAME=your_dockerhub_username
   DOCKER_PASSWORD=your_dockerhub_token
   DATABASE_URL=your_database_url
   DATABASE_USERNAME=your_db_username
   DATABASE_PASSWORD=your_db_password
   ```

2. **推送代码触发构建**
   ```bash
   git add .
   git commit -m "Enable GitHub Actions"
   git push origin main
   ```

3. **查看构建状态**
   - 访问仓库的 `Actions` 标签页
   - 查看工作流执行情况

4. **下载构建产物**
   - 在 Actions 页面下载 `miniprogram-deploy`
   - 使用微信开发者工具上传

📖 **详细指南**: <ref_file file="/Users/allan/mini-program-java/.github/GITHUB_ACTIONS_GUIDE.md" />

### 如果您选择 Harness

1. **注册 Harness 账户**
   - 访问 https://app.harness.io/
   - 创建项目

2. **配置连接器**
   - GitHub 连接器
   - Docker Registry 连接器
   - Kubernetes 连接器

3. **导入配置**
   - 导入 `.harness/pipeline.yaml`
   - 更新连接器引用

4. **运行管道**
   - 点击 Run 执行部署

📖 **详细指南**: <ref_file file="/Users/allan/mini-program-java/.harness/使用指南.md" />

### 如果您选择手动部署

```bash
# 1. 构建 Docker 镜像
./docker-build.sh

# 2. 部署微信小程序
./wechat-deploy.sh

# 3. 或手动使用微信开发者工具上传
```

## 📁 文件结构

```
mini-program-java/
├── .github/
│   ├── workflows/
│   │   ├── ci-cd.yml                    # GitHub Actions 完整流程
│   │   └── wechat-miniprogram.yml       # 小程序专用流程
│   └── GITHUB_ACTIONS_GUIDE.md          # GitHub Actions 详细指南
│
├── .harness/
│   ├── harness.yaml                     # Harness 完整配置
│   ├── pipeline.yaml                    # Harness 简化配置
│   ├── ci.yaml                          # Harness CI 配置
│   ├── 使用指南.md                       # Harness 中文指南
│   ├── 快速开始.md                       # Harness 快速开始
│   ├── 检查清单.md                       # 配置检查清单
│   ├── config-example.yaml              # 配置示例
│   └── k8s/                             # Kubernetes 部署文件
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       ├── secret.yaml
│       └── hpa.yaml
│
├── Dockerfile                           # Docker 镜像构建文件
├── .dockerignore                        # Docker 忽略文件
├── docker-build.sh                      # Docker 构建脚本
├── wechat-deploy.sh                     # 微信小程序部署脚本
├── k8s-deploy.sh                        # Kubernetes 部署脚本
└── .env.example                         # 环境变量示例
```

## 🔧 比较不同方案

| 特性 | GitHub Actions | Harness | 手动部署 |
|------|---------------|---------|----------|
| **成本** | 免费（公开仓库） | 有免费额度 | 免费 |
| **设置难度** | 简单 | 中等 | 最简单 |
| **功能** | 丰富 | 非常丰富 | 基础 |
| **微信小程序支持** | 需要手动上传 | 需要手动上传 | 手动上传 |
| **可视化** | 基础 | 强大 | 无 |
| **集成度** | GitHub 原生 | 需要配置 | 无 |
| **推荐场景** | 小型项目、开源项目 | 企业项目 | 简单部署 |

## 💡 推荐使用场景

### GitHub Actions 最适合：
- ✅ 代码托管在 GitHub
- ✅ 小型团队或个人项目
- ✅ 需要免费的 CI/CD 方案
- ✅ 微信小程序项目
- ✅ 开源项目

### Harness 最适合：
- ✅ 企业级应用
- ✅ 复杂的部署策略
- ✅ 需要可视化界面
- ✅ 多环境管理
- ✅ 需要高级功能

### 手动部署最适合：
- ✅ 学习和测试
- ✅ 简单项目
- ✅ 不需要自动化
- ✅ 完全控制部署过程

## 🎯 针对微信小程序的特殊说明

由于微信小程序的限制，完全自动化的上传到微信平台仍然有挑战。建议采用以下策略：

### 推荐流程 (GitHub Actions + 手动上传)

1. **自动构建和测试** (GitHub Actions)
   - 代码提交触发构建
   - 自动运行测试
   - 生成部署包

2. **手动上传到微信** (微信开发者工具)
   - 下载构建产物
   - 使用微信开发者工具上传
   - 在微信后台提交审核

### 为什么需要手动上传？

- 🔐 微信 API 限制
- 📱 需要微信登录验证
- 🛡️ 安全考虑
- 📋 审核流程要求

## 🚀 立即开始

### 选择 GitHub Actions (推荐)

```bash
# 1. 查看配置文件
cat .github/workflows/wechat-miniprogram.yml

# 2. 配置 GitHub Secrets
# 在 GitHub 仓库设置中添加必要的 Secrets

# 3. 推送代码
git add .github/
git commit -m "Add GitHub Actions configuration"
git push origin main

# 4. 查看构建状态
# 访问 GitHub 仓库的 Actions 页面
```

### 选择 Harness

```bash
# 1. 阅读快速开始指南
cat .harness/快速开始.md

# 2. 注册 Harness 账户
# 访问 https://app.harness.io/

# 3. 按照指南配置连接器
# 参考 .harness/使用指南.md

# 4. 导入并运行管道
```

### 选择手动部署

```bash
# 1. 构建 Docker 镜像
./docker-build.sh

# 2. 部署微信小程序
./wechat-deploy.sh

# 3. 或使用微信开发者工具手动上传
```

## 📚 相关文档

- **GitHub Actions 指南**: <ref_file file="/Users/allan/mini-program-java/.github/GITHUB_ACTIONS_GUIDE.md" />
- **Harness 使用指南**: <ref_file file="/Users/allan/mini-program-java/.harness/使用指南.md" />
- **Harness 快速开始**: <ref_file file="/Users/allan/mini-program-java/.harness/快速开始.md" />
- **项目说明**: <ref_file file="/Users/allan/mini-program-java/readme.dev.md" />

## 🆘 常见问题

### Q: 我应该选择哪种 CI/CD 方案？
**A**: 对于微信小程序项目，推荐使用 GitHub Actions，因为它免费、简单且与 GitHub 深度集成。

### Q: 微信小程序可以实现完全自动化部署吗？
**A**: 目前由于微信的限制，上传步骤仍需要手动操作，但构建和测试可以完全自动化。

### Q: 可以同时使用多种 CI/CD 方案吗？
**A**: 可以！您可以根据不同环境使用不同方案，比如开发环境用 GitHub Actions，生产环境用 Harness。

### Q: 如何回滚部署？
**A**: 
- GitHub Actions: 重新运行之前的工作流
- Harness: 使用内置的回滚功能
- 手动部署: 重新部署之前的版本

## 🎓 学习资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Harness 官方文档](https://docs.harness.io/)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Docker 官方文档](https://docs.docker.com/)

---

*选择最适合您项目的 CI/CD 方案，开始自动化部署之旅！*