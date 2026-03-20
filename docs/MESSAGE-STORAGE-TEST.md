## ✅ 微信消息存储功能已启用

### 📂 存储位置

**文件：** `/root/.openclaw/workspace/clawnet-mvp/wechat-messages.json`

**API：** `GET /wechat/messages/log`

---

### 🧪 测试步骤

**1. 给公众号发送消息**
- 例如："你好"

**2. 查看存储**

```bash
# 方式1：查看文件
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json

# 方式2：调用API
curl http://localhost:80/wechat/messages/log \
  -H "Authorization: Bearer clawnet-secret-token"
```

**3. 检查结果**

- ✅ 如果文件有内容 → 说明收到了微信推送
- ❌ 如果文件为空 → 说明微信没有推送消息

---

### 📋 存储格式

```json
{
  "messages": [
    {
      "timestamp": "2026-03-16T03:09:00.000Z",
      "rawXML": "<xml>完整XML...</xml>",
      "processed": true,
      "response": "你好！很高兴见到你！"
    }
  ],
  "lastUpdated": "2026-03-16T03:09:00.000Z"
}
```

---

### 🔍 如果没有收到消息

**可能原因：**
1. 微信后台URL配置错误
2. 服务器外网访问失败
3. 认证中间件拦截

**检查方法：**
```bash
# 1. 检查服务状态
curl http://localhost:80/health

# 2. 查看日志
tail -50 /tmp/clawnet-new.log

# 3. 测试本地接口
curl -X POST "http://localhost:80/clawnet/node/wechat-mp-.../message" \
  -H "Content-Type: text/xml" \
  -d '<xml>...</xml>'
```

---

**现在请给公众号发送消息，然后查看 wechat-messages.json 文件！** 🐱
