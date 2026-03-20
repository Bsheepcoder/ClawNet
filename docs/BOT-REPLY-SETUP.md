# 公众号通过Bot回复配置方案

## 📋 当前架构

```
微信用户 → 公众号节点 → Bot节点 → 处理消息 → 返回回复
```

---

## 🔧 配置步骤

### 1. 确认节点存在

**需要的节点：**
- ✅ 公众号节点：wechat-mp-wxd213e22f3178383b
- ❓ Bot节点：需要确认

**创建Bot节点（如果不存在）：**
```bash
curl -X POST "http://localhost:80/nodes" \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "bot-clawnet-001",
    "type": "bot",
    "name": "ClawNet AI Bot",
    "metadata": {
      "model": "zai/glm-5",
      "capabilities": ["chat", "reply"]
    }
  }'
```

---

### 2. 创建委托关系

**公众号 → Bot：**
```bash
curl -X POST "http://localhost:80/relations" \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "wechat-mp-wxd213e22f3178383b",
    "to": "bot-clawnet-001",
    "type": "delegate",
    "permissions": ["read", "write"]
  }'
```

---

### 3. 配置Bot回复模式

**更新公众号配置：**
```json
{
  "wechat": {
    "reply": {
      "defaultType": "bot",  ← 使用bot回复
      "bot": {
        "nodeId": "bot-clawnet-001",
        "mode": "ai"  // 或 "rule"
      }
    }
  }
}
```

---

### 4. 实现Bot消息处理

**在wechat-adapter.ts中：**

```typescript
// 生成回复时检查配置
if (config.defaultType === 'bot') {
  // 1. 获取bot节点
  const botNode = this.clawnet.getNode(config.bot.nodeId);
  
  // 2. 通过ClawNet路由消息到bot
  const result = await this.clawnet.route({
    from: mpNodeId,
    to: config.bot.nodeId,
    type: 'message',
    data: {
      content: message.content,
      from: message.fromUserId
    }
  });
  
  // 3. 返回bot的回复
  return {
    type: 'text',
    content: result.data.reply
  };
}
```

---

## 🎯 两种Bot模式

### 模式1：规则Bot（简单）
- 基于关键词
- 预设回复
- 快速响应

### 模式2：AI Bot（智能）
- 使用AI模型
- 理解上下文
- 智能回复

---

## 📊 消息流程

```
1. 微信用户发送消息
2. 公众号节点接收
3. 检查配置：defaultType = "bot"
4. 委托给Bot节点
5. Bot处理（AI/规则）
6. 返回回复
7. 公众号返回给微信
```

---

**开始配置！** 🐱✨
