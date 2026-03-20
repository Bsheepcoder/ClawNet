#!/bin/bash
# ClawNet 快速配置脚本

echo "🔧 ClawNet 配置向导"
echo ""

# 检查是否已有配置
if [ -f .env ]; then
    echo "⚠️  .env 文件已存在"
    read -p "是否覆盖？(y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "已取消"
        exit 0
    fi
fi

# 基础配置
echo "请输入服务器配置："
read -p "端口 (默认 3000): " PORT
read -p "主机 (默认 0.0.0.0): " HOST

PORT=${PORT:-3000}
HOST=${HOST:-0.0.0.0}

# 可选：微信配置
echo ""
read -p "是否配置微信公众号？(y/N): " setup_wechat

WECHAT_CONFIG=""
if [ "$setup_wechat" = "y" ] || [ "$setup_wechat" = "Y" ]; then
    echo ""
    echo "请输入微信配置（可在微信公众号后台获取）："
    read -p "WECHAT_APPID: " WECHAT_APPID
    read -p "WECHAT_APPSECRET: " WECHAT_APPSECRET
    read -p "WECHAT_TOKEN (默认: clawnet): " WECHAT_TOKEN
    WECHAT_TOKEN=${WECHAT_TOKEN:-clawnet}
    
    WECHAT_CONFIG="
# 微信公众号配置
WECHAT_APPID=$WECHAT_APPID
WECHAT_APPSECRET=$WECHAT_APPSECRET
WECHAT_TOKEN=$WECHAT_TOKEN"
fi

# 写入 .env 文件
cat > .env << EOF
# 服务器配置
PORT=$PORT
HOST=$HOST$WECHAT_CONFIG
EOF

echo ""
echo "✅ 配置已保存到 .env"
echo ""
echo "下一步："
echo "  1. 安装依赖: npm install"
echo "  2. 编译项目: npm run build"
echo "  3. 启动服务: ./start.sh"
echo ""
