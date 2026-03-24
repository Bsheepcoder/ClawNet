#!/bin/bash
# ClawNet 启动脚本
# 注意：敏感配置已移至 .env 文件

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "错误：.env 文件不存在"
    echo "请复制 .env.example 并填入你的配置："
    echo "  cp .env.example .env"
    exit 1
fi

# 加载环境变量
export $(cat .env | grep -v '^#' | xargs)

# 自动发现主 OpenClaw Gateway
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/scripts/auto-discover-main.js" ]; then
    echo "🔍 自动发现主 OpenClaw..."
    node "$SCRIPT_DIR/scripts/auto-discover-main.js" 2>/dev/null
fi

# 启动服务
echo "正在启动 ClawNet..."
echo "端口: $PORT"
echo "主机: $HOST"
node dist/server.js
