# 微信消息存储功能

## ✅ 新增功能

### 1. 自动存储所有微信消息

**存储位置：** `/root/.openclaw/workspace/clawnet-mvp/wechat-messages.json`

**存储内容：**
```json
{
  "messages": [
    {
      "timestamp": "2026-03-16T03:06:00.000Z",
      "rawXML": "<xml>...</xml>",
      "processed": true,
      "response": "你好！很高兴见到你！"
    }
  ],
  "lastUpdated": "2026-03-16T03:06:00.000Z"
}
```

### 2. 查看消息的API

**方法1：查看内存中的消息历史**
```bash
GET /wechat/messages?limit=50
Authorization: Bearer clawnet-secret-token
```

**方法2：查看文件中的消息日志（推荐）**
```bash
GET /wechat/messages/log
Authorization: Bearer clawnet-secret-token
```

**响应：**
```json
{
  "success": true,
  "total": 10,
  "lastUpdated": "2026-03-16T03:06:00.000Z",
  "data": [
    {
      "timestamp": "...",
      "rawXML": "...",
      "processed": true,
      "response": "..."
    }
  ]
}
```

---

## 🔧 使用方法

### 1. 给公众号发送消息

### 2. 查看是否收到

**方式1：查看日志文件**
```bash
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.'
```

**方式2：调用API**
```bash
curl http://localhost:80/wechat/messages/log \
  -H "Authorization: Bearer clawnet-secret-token"
```

---

## 📊 测试步骤

1. **给公众号发送消息**
   - 例如："你好"

2. **查看消息是否存储**
   ```bash
   curl http://localhost:80/wechat/messages/log
   ```

3. **检查返回内容**
   - 如果 `messages` 数组有内容 → 说明收到了
   - 如果为空 → 说明微信没有推送消息到服务器

---

## 🔍 问题排查

### 如果messages为空：

**原因1：微信没有推送消息**
- 检查URL配置是否正确
- 检查服务器是否能从外网访问

**原因2：认证中间件拦截**
- 微信接口应该不需要认证
- 检查路由是否在认证中间件之前

**原因3：服务未启动**
- 检查服务状态：`curl http://localhost:80/health`

---

## 📝 查看具体消息内容

```bash
# 查看最后一条消息
cat wechat-messages.json | jq '.messages[-1]'

# 查看所有rawXML
cat wechat-messages.json | jq '.messages[].rawXML'
```

---

**现在所有微信消息都会被存储，方便排查问题！** 🐱✨
