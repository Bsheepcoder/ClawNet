#!/bin/bash

# 微信环境变量快速配置脚本

echo "🔧 配置微信环境变量"
echo ""

# 设置环境变量
export WECHAT_APPID="wxd213e22f3178383b"
export WECHAT_APPSECRET="5664bceb1f6db3ed3609813e304d1bcd"
export WECHAT_TOKEN="clawnet"
export WECHAT_ENCODING_AES_KEY="xHzdvi3xjZLXUetUadtlyFM1h9epCkGJswIUbdd8Z0k"

echo "✅ 环境变量已设置："
echo ""
echo "   WECHAT_APPID:             $WECHAT_APPID"
echo "   WECHAT_APPSECRET:         ${WECHAT_APPSECRET:0:8}..."
echo "   WECHAT_TOKEN:             $WECHAT_TOKEN"
echo "   WECHAT_ENCODING_AES_KEY:  ${WECHAT_ENCODING_AES_KEY:0:8}..."
echo ""

# 写入 .env 文件
cat > .env << EOF
WECHAT_APPID=$WECHAT_APPID
WECHAT_APPSECRET=$WECHAT_APPSECRET
WECHAT_TOKEN=$WECHAT_TOKEN
WECHAT_ENCODING_AES_KEY=$WECHAT_ENCODING_AES_KEY
EOF

echo "✅ 已保存到 .env 文件"
echo ""
echo "📝 下一步："
echo "   1. 重启 ClawNet: npm start"
echo "   2. 配置微信公众号后台"
echo "   3. 测试消息收发"
