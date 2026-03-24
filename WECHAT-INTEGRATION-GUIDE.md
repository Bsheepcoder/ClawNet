# ClawNet 微信消息自动集成

## 🎯 功能

当实例连接微信后，ClawNet 自动监听该实例的微信消息，并根据关系路由到目标节点。

## 📋 集成方案

### 方案1：HTTP Webhook（推荐）

ClawNet 提供一个 HTTP 端点，OpenClaw 在收到微信消息时 POST 到这个端点。

**启动监听器**：
```bash
cd /root/.openclaw/workspace/clawnet-mvp
node scripts/wechat-listener-simple.js
```

**OpenClaw 配置**（修改微信插件）：
```javascript
// 当收到微信消息时
fetch('http://localhost:19100/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: message.text,
    from: message.from
  })
});
```

### 方案2：ClawNet 扩展（完整集成）

将微信监听集成到 ClawNet 核心系统。

**修改 ClawNet 配置**：
```yaml
# /root/.openclaw/workspace/clawnet-mvp/extensions.yml
wechat-listener:
  enabled: true
  mode: auto
  instances:
    - id: qxd
      nodeId: openclaw-qxd
```

**ClawNet 自动**：
1. 检测哪些实例连接了微信
2. 监听这些实例的微信消息
3. 根据关系路由到目标节点

## 🚀 快速测试

### 1. 启动监听器

```bash
cd /root/.openclaw/workspace/clawnet-mvp
node scripts/wechat-listener-simple.js
```

### 2. 测试消息路由

```bash
# 发送测试消息
curl http://localhost:19100/test

# 查看状态
curl http://localhost:19100/status
```

### 3. 检查消息历史

访问：http://192.163.174.25:5173/messages

或 API：
```bash
curl http://localhost:3000/messages \
  -H "Authorization: Bearer clawnet-secret-token"
```

## 📊 架构

```
┌─────────────┐
│   微信消息   │
└──────┬──────┘
       ↓
┌──────────────┐
│ OpenClaw     │
│ 微信插件     │
└──────┬───────┘
       │ POST /message
       ↓
┌──────────────┐
│ ClawNet      │
│ 微信监听器   │ (端口 19100)
└──────┬───────┘
       │ POST /route
       ↓
┌──────────────┐
│ ClawNet      │
│ 路由系统     │ (端口 3000)
└──────┬───────┘
       │ WebSocket
       ↓
┌──────────────┐
│ 目标节点     │
│ (derder)     │
└──────────────┘
```

## 🔧 配置关系

确保 ClawNet 中有正确的关系：

```bash
# qxd → derder 的协作关系
curl -X POST http://localhost:3000/relations \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "openclaw-qxd",
    "to": "openclaw-derder",
    "type": "collaborate",
    "permissions": ["read", "write"]
  }'
```

## 📝 下一步

### OpenClaw 集成（自动模式）

要实现完全自动，需要修改 OpenClaw 微信插件：

```javascript
// /root/.openclaw-qxd/extensions/openclaw-weixin/src/index.ts

// 收到微信消息时
this.on('message', (message) => {
  // 转发到 ClawNet
  fetch('http://localhost:19100/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message.text,
      from: message.from,
      to: message.to,
      timestamp: message.timestamp
    })
  }).catch(err => console.error('转发失败:', err));
});
```

### 或者使用 OpenClaw Skills

创建一个 OpenClaw Skill 监听微信消息并转发：

```markdown
# /root/.openclaw/skills/wechat-forward/SKILL.md

触发词：wechat.message, 微信消息

收到微信消息后，自动转发到 ClawNet。
```

## ✅ 验证

1. **启动监听器**：`node scripts/wechat-listener-simple.js`
2. **发送微信消息**：通过微信发送消息给 bot
3. **查看日志**：`tail -f /tmp/clawnet-server.log`
4. **检查历史**：访问消息监控页面

---

需要帮助实现 OpenClaw 插件集成吗？
