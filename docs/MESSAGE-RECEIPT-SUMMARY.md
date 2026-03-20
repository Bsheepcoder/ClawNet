# 微信消息接收总结

## ✅ 已成功接收的消息

### 总览

**接收时间：** 2026-03-15 19:13 - 19:14
**消息总数：** 3条
**处理成功：** 1条
**未处理：** 2条（被误判为重复）

---

### 详细消息列表

#### 消息1：你好
```json
{
  "timestamp": "2026-03-15T19:13:38.530Z",
  "Content": "你好",
  "MsgId": "25391872942519109",
  "FromUser": "o4smp3F8I46aF-y1jsHuCcyKXB7s",
  "CreateTime": "1773602017",
  "processed": true,
  "response": "你好！很高兴见到你！"
}
```

#### 消息2：这是一个测试
```json
{
  "timestamp": "2026-03-15T19:14:09.639Z",
  "Content": "这是一个测试",
  "MsgId": "25391876699740955",
  "FromUser": "o4smp3F8I46aF-y1jsHuCcyKXB7s",
  "CreateTime": "1773602048",
  "processed": false,
  "response": null
}
```

---

## ❌ 未处理的原因

**问题：** MsgId解析错误（NaN）

**导致：** 所有消息使用错误的去重key，被误判为重复

**表现：**
- 第1条消息：正常处理 ✅
- 第2条消息：被判为重复 ❌
- 第3条消息：被判为重复 ❌

---

## 🔍 根本原因

### XML转义问题

**接收到的XML：**
```json
"rawXML": "\"<xml>...\\n<MsgId>25391876699740955</MsgId>...</xml>\""
```

**问题：**
1. 外层有引号：`"..."`  ❌
2. 换行被转义：`\\n` ❌
3. 导致MsgId无法正确提取 ❌

**需要：**
```xml
<xml>...
<MsgId>25391876699740955</MsgId>...
</xml>
```

---

## 📋 修复方案

### 1. XML预处理

```typescript
let cleanXML = xmlData
  .replace(/^"/, '')  // 移除开头的引号
  .replace(/"$/, '')  // 移除结尾的引号
  .replace(/\\n/g, '\n')  // 反转义换行
  .replace(/\\"/g, '"');  // 反转义引号
```

### 2. MsgId提取

```typescript
const msgId = cleanXML.match(/<MsgId>(.*?)<\/MsgId>/)?.[1] || '';
```

### 3. 去重优化

```typescript
// 使用MsgId作为唯一标识
// 如果MsgId为空，使用 FromUser + CreateTime
```

---

## 📊 查看消息命令

```bash
# 查看所有消息
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.'

# 查看最后一条
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.messages[-1]'

# 查看消息内容
cat /root/.openclaw/workspace/clawnet-mvp/wechat-messages.json | jq '.messages[].rawXML'
```

---

**结论：ClawNet已成功接收微信消息，需要修复XML解析问题！** 🐱✨
