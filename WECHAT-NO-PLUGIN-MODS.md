# 微信消息自动转发方案对比

## 不修改插件的方案

### 方案1：OpenClaw Skill（推荐）

**原理**：使用 OpenClaw 的消息 hook 机制

```markdown
# /root/.openclaw/skills/wechat-forward/SKILL.md

触发词：所有微信消息

当收到微信消息时，通过 HTTP POST 转发到 ClawNet 监听器。
```

**优点**：
- 不需要修改插件源码
- 使用 OpenClaw 内置机制
- 配置简单

**实现方式**：
1. 创建一个 OpenClaw skill
2. 在 skill 中监听微信消息
3. POST 到 http://localhost:19100/message

---

### 方案2：修改 instances.json（最简单）

**原理**：在实例配置中添加 ClawNet 集成

```json
{
  "qxd": {
    "clawnet": {
      "connected": true,
      "nodeId": "openclaw-qxd",
      "forwardMessages": true,
      "endpoint": "http://localhost:19100/message"
    }
  }
}
```

**前提**：OpenClaw 支持这个配置项

---

### 方案3：使用 OpenClaw Agent

**原理**：创建一个 OpenClaw agent 来监听和转发消息

```bash
openclaw agent --to clawnet --message "转发微信消息"
```

---

### 方案4：直接集成到 ClawNet

**原理**：让 ClawNet 直接连接到微信实例

**当前实现**：
- ClawNet 监听器在 19100 端口等待消息
- 提供 POST /message 端点

**需要**：OpenClaw 发送消息到这个端点

---

## 推荐方案

**最简单**：创建一个 OpenClaw skill

这个 skill 会：
1. 监听所有微信消息
2. 自动转发到 ClawNet

**不需要修改任何插件源码**

需要我创建这个 skill 吗？
