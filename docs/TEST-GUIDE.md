# 微信消息存储测试指南

## 📋 现在可以测试了

### 步骤1：给公众号发送消息

在微信中给你的公众号发送消息，例如：
- "你好"
- "测试"
- 任意内容

---

### 步骤2：查看是否收到消息

**方式1：查看文件**
```bash
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.'
```

**方式2：调用API**
```bash
curl http://localhost:80/wechat/messages/log \
  -H "Authorization: Bearer clawnet-secret-token"
```

**方式3：直接读取**
```bash
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json
```

---

## 📊 预期结果

**如果收到了微信推送，文件内容类似：**
```json
{
  "messages": [
    {
      "timestamp": "2026-03-16T03:08:00.000Z",
      "rawXML": "<xml><ToUserName>...</ToUserName>...</xml>",
      "processed": true,
      "response": "你好！很高兴见到你！"
    }
  ],
  "lastUpdated": "2026-03-16T03:08:00.000Z"
}
```

**如果文件为空或messages数组为空：**
说明微信服务器没有推送消息到你的服务器

---

## 🔍 排查步骤

### 1. 检查文件是否有内容

```bash
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json
```

**有内容：** ✅ 说明收到了
**无内容：** ❌ 说明没收到

---

### 2. 检查服务状态

```bash
curl http://localhost:80/health
```

**期望：** `"wechat": true`

---

### 3. 检查日志

```bash
tail -50 /tmp/clawnet-storage.log
```

**查找：** "收到微信消息"

---

### 4. 检查微信后台配置

**确认URL：**
```
http://192.163.174.25/clawnet/node/wechat-mp-wxd213e22f3178383b/message
```

**确认Token：**
```
clawnet
```

---

## 🧪 本地测试

```bash
# 模拟微信消息
curl -X POST "http://localhost:80/clawnet/node/wechat-mp-wxd213e22f3178383b/message" \
  -H "Content-Type: text/xml" \
  -d '<xml>
    <ToUserName><![CDATA[gh_test]]></ToUserName>
    <FromUserName><![CDATA[test_openid]]></FromUserName>
    <CreateTime>1773602000</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[测试]]></Content>
  </xml>'

# 查看存储
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.messages[-1]'
```

---

**现在请给公众号发送消息，然后查看存储文件！** 🐱✨
