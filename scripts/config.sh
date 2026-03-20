#!/bin/bash

# ClawNet 配置管理脚本

echo "🔧 ClawNet 配置管理"
echo ""

# 显示当前配置
show_config() {
  echo "📋 当前配置："
  echo ""
  echo "  PORT:     ${PORT:-3000}"
  echo "  HOST:     ${HOST:-0.0.0.0}"
  echo "  TOKEN:    ${CLAWNET_TOKEN:-未设置}"
  echo ""
  echo "  微信配置："
  echo "  WECHAT_APPID:     ${WECHAT_APPID:-未设置}"
  echo "  WECHAT_TOKEN:     ${WECHAT_TOKEN:-未设置}"
  echo ""
}

# 加载配置文件
load_config() {
  if [ -f ".env" ]; then
    echo "✅ 加载配置文件: .env"
    export $(cat .env | grep -v '^#' | xargs)
  elif [ -f ".env.production" ]; then
    echo "✅ 加载配置文件: .env.production"
    export $(cat .env.production | grep -v '^#' | xargs)
  else
    echo "⚠️  未找到配置文件，使用默认配置"
  fi
}

# 主菜单
case "$1" in
  show)
    load_config
    show_config
    ;;
  
  dev)
    echo "🛠️  开发环境配置"
    export PORT=3000
    export HOST=0.0.0.0
    show_config
    echo ""
    echo "启动命令: npm start"
    ;;
  
  prod)
    echo "🚀 生产环境配置（80端口）"
    export PORT=80
    export HOST=0.0.0.0
    show_config
    echo ""
    echo "启动命令: sudo -E npm start"
    ;;
  
  wechat)
    echo "💬 微信公众号配置（80端口）"
    export PORT=80
    export HOST=0.0.0.0
    export WECHAT_APPID="wxd213e22f3178383b"
    export WECHAT_APPSECRET="5664bceb1f6db3ed3609813e304d1bcd"
    export WECHAT_TOKEN="clawnet"
    export WECHAT_ENCODING_AES_KEY="xHzdvi3xjZLXUetUadtlyFM1h9epCkGJswIUbdd8Z0k"
    show_config
    echo ""
    echo "启动命令: sudo -E npm start"
    echo "微信URL: http://192.163.174.25/wechat/mp/message"
    echo "微信Token: clawnet"
    ;;
  
  custom)
    if [ -z "$2" ]; then
      echo "用法: $0 custom <端口号>"
      exit 1
    fi
    echo "⚙️  自定义端口配置: $2"
    export PORT=$2
    export HOST=0.0.0.0
    show_config
    echo ""
    echo "启动命令: npm start"
    ;;
  
  *)
    echo "用法: $0 {show|dev|prod|wechat|custom <port>}"
    echo ""
    echo "命令说明："
    echo "  show           - 显示当前配置"
    echo "  dev            - 开发环境（3000端口）"
    echo "  prod           - 生产环境（80端口）"
    echo "  wechat         - 微信配置（80端口+微信凭证）"
    echo "  custom <port>  - 自定义端口"
    echo ""
    echo "示例："
    echo "  $0 wechat      # 配置并准备启动（微信）"
    echo "  $0 custom 8080 # 使用8080端口"
    ;;
esac
