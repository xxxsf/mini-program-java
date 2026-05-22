#!/bin/bash

# 微信小程序云部署脚本
# 用于辅助部署到微信小程序云开发环境

set -e

echo "🚀 微信小程序云部署脚本"
echo "================================"

# 配置变量
MINIPROGRAM_DIR="invoiceTool_miniProgram"
DEPLOY_DIR="deploy-package"
BUILD_INFO_FILE="build-info.json"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查微信开发者工具是否安装
check_wechat_devtools() {
    echo "🔍 检查微信开发者工具..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "/Applications/wechatwebdevtools.app" ]; then
            echo -e "${GREEN}✅${NC} 微信开发者工具已安装"
            WECHAT_CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
        else
            echo -e "${YELLOW}⚠️${NC} 未找到微信开发者工具"
            echo "请从 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html 下载"
            return 1
        fi
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v cli &> /dev/null; then
            echo -e "${GREEN}✅${NC} 微信开发者工具 CLI 已安装"
            WECHAT_CLI="cli"
        else
            echo -e "${YELLOW}⚠️${NC} 未找到微信开发者工具 CLI"
            return 1
        fi
    # Windows
    else
        echo -e "${YELLOW}⚠️${NC} Windows 系统请手动操作"
        return 1
    fi
    
    return 0
}

# 验证小程序项目结构
validate_project() {
    echo "🔍 验证小程序项目结构..."
    
    cd "$MINIPROGRAM_DIR"
    
    # 检查必需文件
    required_files=("app.js" "app.json" "app.wxss")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌${NC} 必需文件 $file 不存在"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅${NC} 项目结构验证通过"
    cd ..
}

# 创建构建信息
create_build_info() {
    echo "📝 创建构建信息..."
    
    cat > "$BUILD_INFO_FILE" << EOF
{
  "version": "$(git rev-parse --short HEAD)",
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$(git branch --show-current)",
  "commitMessage": "$(git log -1 --pretty=%B)",
  "buildUser": "$(whoami)",
  "environment": "production"
}
EOF

    echo -e "${GREEN}✅${NC} 构建信息已创建"
}

# 准备部署包
prepare_package() {
    echo "📦 准备部署包..."
    
    # 清理旧的部署包
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    
    # 复制小程序代码
    cp -r "$MINIPROGRAM_DIR"/* "$DEPLOY_DIR/"
    
    # 复制构建信息
    cp "$BUILD_INFO_FILE" "$DEPLOY_DIR/"
    
    # 清理不需要的文件
    cd "$DEPLOY_DIR"
    rm -rf .DS_Store .git node_modules/.cache *.log
    
    echo -e "${GREEN}✅${NC} 部署包准备完成"
    cd ..
}

# 使用微信开发者工具上传
upload_with_cli() {
    echo "📤 使用微信开发者工具上传..."
    
    if [ ! -f "$WECHAT_CLI" ]; then
        echo -e "${RED}❌${NC} 微信开发者工具 CLI 不存在"
        return 1
    fi
    
    # 检查是否已登录
    echo "检查登录状态..."
    "$WECHAT_CLI" is-login || {
        echo -e "${YELLOW}⚠️${NC} 需要先登录微信开发者工具"
        echo "请手动打开微信开发者工具并扫码登录"
        read -p "登录完成后按回车继续..."
    }
    
    # 上传代码
    echo "开始上传代码..."
    "$WECHAT_CLI" upload \
        --project "$DEPLOY_DIR" \
        --version "$(git rev-parse --short HEAD)" \
        --desc "Automated build: $(git log -1 --pretty=%B)" || {
        echo -e "${RED}❌${NC} 上传失败"
        return 1
    }
    
    echo -e "${GREEN}✅${NC} 上传成功"
}

# 手动部署指导
manual_deploy_guide() {
    echo "📋 手动部署指南"
    echo "================================"
    echo ""
    echo "由于微信小程序的限制，建议手动完成以下步骤："
    echo ""
    echo "1. 📱 打开微信开发者工具"
    echo "2. 📂 导入项目: $DEPLOY_DIR"
    echo "3. 🔧 检查项目配置"
    echo "4. 📤 点击 '上传' 按钮"
    echo "5. 📝 填写版本号: $(git rev-parse --short HEAD)"
    echo "6. 💬 填写备注: $(git log -1 --pretty=%B)"
    echo "7. ✅ 等待上传完成"
    echo ""
    echo "8. 🌐 登录微信小程序后台"
    echo "9. 📋 在 '版本管理' 中找到刚上传的版本"
    echo "10. 👀 点击 '预览' 测试"
    echo "11. 🚀 确认无误后 '提交审核'"
    echo ""
}

# 部署后端服务
deploy_backend() {
    echo "🔧 部署后端服务..."
    
    read -p "是否需要部署后端服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "请选择后端部署方式:"
        echo "1. Docker 部署"
        echo "2. 直接运行 JAR"
        echo "3. 跳过后端部署"
        
        read -p "请选择 (1-3): " choice
        
        case $choice in
            1)
                echo "使用 Docker 部署..."
                if [ -f "docker-build.sh" ]; then
                    ./docker-build.sh
                else
                    echo "Docker 构建脚本不存在"
                fi
                ;;
            2)
                echo "运行 JAR 文件..."
                cd invoiceTool_Java
                if [ -f "target/*.jar" ]; then
                    java -jar target/*.jar
                else
                    echo "JAR 文件不存在，请先构建项目"
                fi
                ;;
            3)
                echo "跳过后端部署"
                ;;
        esac
    fi
}

# 主函数
main() {
    echo "开始部署流程..."
    echo ""
    
    # 验证项目
    validate_project
    
    # 创建构建信息
    create_build_info
    
    # 准备部署包
    prepare_package
    
    # 检查微信开发者工具
    if check_wechat_devtools; then
        read -p "是否使用 CLI 自动上传? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            upload_with_cli
        else
            manual_deploy_guide
        fi
    else
        manual_deploy_guide
    fi
    
    # 询问是否部署后端
    deploy_backend
    
    echo ""
    echo -e "${GREEN}🎉 部署准备完成！${NC}"
    echo "部署包位置: $DEPLOY_DIR"
}

# 运行主函数
main