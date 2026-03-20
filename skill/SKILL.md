---
name: clawnet
description: ClawNet 多节点关系网络集成。管理节点关系、检查权限、路由事件。使用前需启动 ClawNet 服务。
---

# ClawNet Skill

将 OpenClaw Bot 连接到 ClawNet 关系网络。

## 前置要求

1. ClawNet 服务运行中：
```bash
cd /path/to/clawnet-mvp
npm start
```

2. 获取 Token：
```bash
curl -X POST http://localhost:3000/tokens
```

## 配置

设置环境变量：
```bash
export CLAWNET_URL="http://localhost:3000"
export CLAWNET_TOKEN="your-token-here"
```

## 使用

### 在 OpenClaw 中使用

```bash
# 注册 Bot 到 ClawNet
node ${baseDir}/scripts/register-bot.js --id my-bot --name "My Bot"

# 创建关系
node ${baseDir}/scripts/add-relation.js \
  --from user-001 \
  --to my-bot \
  --type observe \
  --permissions "read,write"

# 路由事件
node ${baseDir}/scripts/route-event.js \
  --from user-001 \
  --type message \
  --payload '{"text":"Hello"}'
```

### WebSocket 连接

```javascript
const ws = new WebSocket('ws://localhost:3000?nodeId=my-bot&token=your-token');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## API 快速参考

| 操作 | 命令 |
|------|------|
| 注册 Bot | `register-bot.js --id <id> --name <name>` |
| 创建关系 | `add-relation.js --from <from> --to <to> --type <type> --permissions <perms>` |
| 检查权限 | `check-permission.js --node <node> --target <target> --action <action>` |
| 路由事件 | `route-event.js --from <from> --type <type> --payload <json>` |
| 在线节点 | `get-online.js` |
