#!/bin/bash
# ClawNet 自动发现主 OpenClaw Gateway
# 在 ClawNet 启动时运行

CLAWNET_DIR="/root/.openclaw/workspace/clawnet-mvp"
DB_PATH="$CLAWNET_DIR/clawnet.db"
IDENTITY_FILE="/root/.openclaw/workspace/IDENTITY.md"

echo "🔍 正在扫描主 OpenClaw Gateway..."

# 检查主 Gateway 是否运行
GATEWAY_PID=$(pgrep -f "openclaw-gateway" | head -1)

if [ -z "$GATEWAY_PID" ]; then
  echo "⚠️  主 OpenClaw Gateway 未运行"
  exit 0
fi

echo "✅ 发现主 Gateway (PID: $GATEWAY_PID)"

# 获取实例名（从 IDENTITY.md 或默认 "main"）
INSTANCE_NAME="main"
if [ -f "$IDENTITY_FILE" ]; then
  # 匹配 "- **Name:** xxx" 或 "- **name:** xxx"
  NAME_LINE=$(grep -iE "^- \*\*[Nn]ame:\*\*" "$IDENTITY_FILE" | head -1)
  if [ -n "$NAME_LINE" ]; then
    # 提取名称部分
    INSTANCE_NAME=$(echo "$NAME_LINE" | sed 's/.*\*\*:[[:space:]]*//; s/^[[:space:]]*//; s/[[:space:]]*$//')
    # 转为小写
    INSTANCE_NAME=$(echo "$INSTANCE_NAME" | tr '[:upper:]' '[:lower:]')
    echo "📝 从 IDENTITY.md 获取名称: $INSTANCE_NAME"
  fi
fi

NODE_ID="openclaw-${INSTANCE_NAME}"
GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT:-18789}

# 检查节点是否已存在，不存在则创建
node -e "
const Database = require('better-sqlite3');
const db = new Database('$DB_PATH');

const existingNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get('$NODE_ID');

if (existingNode) {
  console.log('✅ 节点 $NODE_ID 已存在，跳过创建');
  process.exit(0);
}

// 创建新节点
const now = Date.now();
const metadata = JSON.stringify({
  port: $GATEWAY_PORT,
  source: 'openclaw-gateway',
  type: 'main',
  autoDiscovered: true
});

db.prepare('INSERT INTO nodes (id, type, name, metadata, createdAt) VALUES (?, ?, ?, ?, ?)').run(
  '$NODE_ID',
  'gateway',
  '$INSTANCE_NAME'.charAt(0).toUpperCase() + '$INSTANCE_NAME'.slice(1),
  metadata,
  now
);

console.log('✅ 自动创建节点: $NODE_ID');
db.close();
"

echo "🎉 主 OpenClaw 已注册到 ClawNet"
