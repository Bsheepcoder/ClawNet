# 快速查看微信消息

## 📋 查看命令

**发送消息后，执行以下命令查看：**

```bash
# 方式1：直接查看文件
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json

# 方式2：格式化查看
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.'

# 方式3：只看最后一条
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.messages[-1]'

# 方式4：通过API
curl http://localhost:80/wechat/messages/log \
  -H "Authorization: Bearer clawnet-secret-token"
```

---

## 📊 判断是否收到

**文件有内容：**
```json
{
  "messages": [
    {
      "timestamp": "2026-03-16T03:09:00.000Z",
      "rawXML": "<xml>...</xml>",
      "processed": true,
      "response": "..."
    }
  ]
}
```
→ ✅ 说明收到了微信推送

**文件为空：**
```json
{
  "messages": [],
  "lastUpdated": null
}
```
→ ❌ 说明微信没有推送消息

---

**现在请给公众号发送消息，然后查看文件！** 🐱
