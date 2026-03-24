# 微信消息桥接到 ClawNet

## 当前状态

✅ **已修复**：
1. ClawNet 消息路由正常工作
2. WebSocket 连接正常
3. 节点在线
4. 消息历史记录正常

⚠️ **待解决**：
微信消息需要手动转发到 ClawNet

## 使用方法

### 方式1：手动测试（推荐）

发送微信消息后，手动调用 API 测试：

```bash
curl -X POST http://localhost:3000/route \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "openclaw-qxd",
    "type": "wechat-message",
    "payload": {
      "text": "你的消息内容",
      "fromUser": "微信用户ID"
    }
  }'
```

### 方式2：前端消息监控

访问 http://192.163.174.25:5173/messages

- 刷新消息列表
- 查看历史消息
- 发送测试消息

## 端到端测试

1. **发送消息（qxd → derder）**：
```bash
curl -X POST http://localhost:3000/route \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"from":"openclaw-qxd","type":"test","payload":{"text":"测试"}}'
```

2. **查看消息历史**：
```bash
curl http://localhost:3000/messages \
  -H "Authorization: Bearer clawnet-secret-token" | jq '.data'
```

3. **检查节点状态**：
```bash
curl http://localhost:3000/nodes \
  -H "Authorization: Bearer clawnet-secret-token" | jq '.data'
```

## 下一步

需要实现：
1. OpenClaw 微信消息自动转发到 ClawNet
2. 或者创建 OpenClaw skill 来桥接消息
