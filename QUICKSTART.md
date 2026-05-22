# 🚀 GitHub Actions 5分钟快速开始

## 📝 超简单 3 步骤

### 第 1 步：配置 GitHub Secrets (2 分钟)

1. 打开您的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加：

```
Name: DATABASE_URL
Value: jdbc:mysql://localhost:3306/invoicetool?useSSL=false&serverTimezone=UTC
```

```
Name: DATABASE_USERNAME  
Value: root
```

```
Name: DATABASE_PASSWORD
Value: your_password
```

### 第 2 步：触发构建 (1 分钟)

```bash
# 在项目目录执行
echo "test" >> test.txt
git add test.txt
git commit -m "Test GitHub Actions"
git push origin main
```

### 第 3 步：查看结果 (2 分钟)

1. 访问 GitHub 仓库的 **Actions** 标签页
2. 查看工作流是否正在运行
3. 等待构建完成（大约 3-5 分钟）

## 📦 下载部署包

构建完成后：

1. 在 Actions 页面点击最新的工作流运行
2. 滚动到底部的 **Artifacts** 部分
3. 下载 `miniprogram-deploy`
4. 解压 zip 文件

## 📱 上传到微信

1. 打开微信开发者工具
2. 导入解压的文件夹
3. 点击右上角 **上传** 按钮
4. 填写版本号和备注
5. 完成！

## ✅ 完成！

现在您的微信小程序已经通过 GitHub Actions 自动构建完成了！

## 🎯 下次使用

以后每次推送代码到 main 分支，GitHub Actions 都会自动构建。您只需要：

1. 等待构建完成
2. 下载部署包
3. 用微信开发者工具上传

就这么简单！

---

*需要详细教程？查看 [GITHUB_ACTIONS_TUTORIAL.md](GITHUB_ACTIONS_TUTORIAL.md)*