# 微信公众号消息处理完整流程

## 📊 架构图

```
微信用户
   ↓
微信公众号平台
   ↓ POST XML
ClawNet服务器 (80端口)
   ↓
server.ts (路由)
   ↓
wechat-adapter.ts (处理)
   ↓
┌─────────────────────┐
│ 1. 接收XML          │
│ 2. 解析XML          │
│ 3. 消息去重         │
│ 4. 创建用户节点     │
│ 5. 检查配置         │
│ 6. 生成回复         │
│ 7. 格式化XML        │
│ 8. 返回响应         │
└─────────────────────┘
   ↓ XML响应
微信公众号平台
   ↓
微信用户
```

---

## 🔄 详细流程

### 第一步：接收消息（server.ts）

**位置：** `POST /clawnet/node/wechat-mp-wxd213e22f3178383b/message`

**代码：**
```typescript
app.post(`/clawnet/node/${WECHAT_NODE_ID}/message`, async (req, res) => {
  // 1. 获取原始XML
  const xmlData = typeof req.body === 'string'
    ? req.body
    : (req as any).rawBody || JSON.stringify(req.body);

  // 2. 调用wechat-adapter处理
  const reply = await wechatAdapter.handleMessage(xmlData);

  // 3. 返回XML响应
  res.set('Content-Type', 'application/xml');
  res.status(200).send(reply);
});
```

**接收的XML示例：**
```xml
<xml>
  <ToUserName><![CDATA[gh_dc46038d7a40]]></ToUserName>
  <FromUserName><![CDATA[o4smp3F8I46aF-y1jsHuCcyKXB7s]]></FromUserName>
  <CreateTime>1773602464</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[你好]]></Content>
  <MsgId>25391885127365207</MsgId>
</xml>
```

---

### 第二步：解析XML（wechat-adapter.ts）

**位置：** `parseXML()` 方法

**代码：**
```typescript
private parseXML(xmlString: string): WeChatMessage {
  // 1. 处理JSON.stringify导致的转义
  let cleanXML = xmlString;
  if (cleanXML.startsWith('"') && cleanXML.endsWith('"')) {
    cleanXML = JSON.parse(cleanXML);
  }

  // 2. 提取字段
  const extract = (tag: string): string => {
    const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's');
    const match = cleanXML.match(regex);
    if (match) return match[1];

    // 尝试非CDATA格式
    const regex2 = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const match2 = cleanXML.match(regex2);
    return match2 ? match2[1] : '';
  };

  // 3. 返回结构化数据
  return {
    ToUserName: extract('ToUserName'),      // 公众号原始ID
    FromUserName: extract('FromUserName'),  // 用户OpenID
    CreateTime: parseInt(extract('CreateTime')),
    MsgType: 'text',
    Content: extract('Content'),            // 消息内容
    MsgId: parseInt(extract('MsgId'))
  };
}
```

**解析结果：**
```json
{
  "ToUserName": "gh_dc46038d7a40",
  "FromUserName": "o4smp3F8I46aF-y1jsHuCcyKXB7s",
  "CreateTime": 1773602464,
  "MsgType": "text",
  "Content": "你好",
  "MsgId": 25391885127365207
}
```

---

### 第三步：消息去重

**位置：** `handleMessage()` 方法

**代码：**
```typescript
// 1. 提取MsgId
const msgId = (message as any).MsgId?.toString()?.trim() || '';
const createTime = platformMsg.timestamp || Date.now();

// 2. 检查是否重复
if (this.messageManager.isDuplicate(msgId, platformMsg.fromUserId, createTime)) {
  console.log('⚠️  重复消息，跳过处理');
  return 'success';  // 返回success，避免微信重试
}

// 3. 标记为已处理
this.messageManager.markProcessed(msgId, platformMsg.fromUserId, createTime);
```

**去重机制：**
- 使用MsgId作为唯一标识
- 如果MsgId为空，使用 `FromUserName + CreateTime`
- 5分钟TTL自动清理

---

### 第四步：创建/更新节点

**代码：**
```typescript
// 1. 创建用户节点
const userId = `wechat-${platformMsg.fromUserId}`;

try {
  this.clawnet.addNode({
    id: userId,
    type: 'human',
    name: `微信用户-${platformMsg.fromUserId.slice(-8)}`
  });
} catch (error) {
  // 节点可能已存在，忽略
}

// 2. 获取公众号节点配置
const mpNodeId = `wechat-mp-${this.appId}`;
const mpNode = this.clawnet.getNode(mpNodeId);
const config = mpNode?.config?.wechat?.reply;
```

**节点关系：**
```
wechat-mp-wxd213e22f3178383b (公众号)
         ↓ delegate
    server-bot-001 (Bot)
         ↓
wechat-o4smp3F8I46aF-y1jsHuCcyKXB7s (用户)
```

---

### 第五步：检查配置并生成回复

**代码：**
```typescript
// 1. 检查是否使用Bot回复
const configAny = config as any;
if (configAny?.defaultType === 'bot' && configAny?.bot?.nodeId) {
  reply = await this.generateBotReply(platformMsg, configAny.bot.nodeId);
} else {
  // 2. 普通文本回复
  reply = await this.generateReply(platformMsg, config);
}
```

**generateReply逻辑：**
```typescript
private generateReply(message: PlatformMessage, config?: WeChatReplyConfig): PlatformReply {
  // 1. 检查关键词匹配
  if (config?.text?.keywords) {
    const content = message.content.toLowerCase();
    for (const [keyword, reply] of Object.entries(config.text.keywords)) {
      if (content.includes(keyword)) {
        return {
          type: 'text',
          content: this.replaceVariables(reply, message)
        };
      }
    }
  }

  // 2. 返回默认回复
  return {
    type: 'text',
    content: config?.text?.content || '收到消息'
  };
}
```

**配置示例：**
```json
{
  "wechat": {
    "reply": {
      "text": {
        "content": "【Bot】收到您的消息...",
        "keywords": {
          "你好": "【Bot】你好！我是ClawNet Bot！",
          "帮助": "【Bot】我可以回复你的消息"
        }
      }
    }
  }
}
```

---

### 第六步：格式化XML响应

**位置：** `formatReply()` 方法

**代码：**
```typescript
private formatReply(toUser: string, reply: PlatformReply): string {
  const timestamp = Math.floor(Date.now() / 1000);

  // ⚠️ 关键：FromUserName必须是公众号原始ID（gh_开头）
  const ghId = 'gh_dc46038d7a40';

  const xml = `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${ghId}]]></FromUserName>
  <CreateTime>${timestamp}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${reply.content}]]></Content>
</xml>`;

  return xml;
}
```

**⚠️ 关键修复：**
- ❌ 错误：`<FromUserName><![CDATA[wxd213e22f3178383b]]></FromUserName>` (AppID)
- ✅ 正确：`<FromUserName><![CDATA[gh_dc46038d7a40]]></FromUserName>` (公众号原始ID)

**返回的XML示例：**
```xml
<xml>
  <ToUserName><![CDATA[o4smp3F8I46aF-y1jsHuCcyKXB7s]]></ToUserName>
  <FromUserName><![CDATA[gh_dc46038d7a40]]></FromUserName>
  <CreateTime>1773602600</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[【Bot】你好！我是ClawNet Bot！]]></Content>
</xml>
```

---

### 第七步：返回响应

**位置：** server.ts

**代码：**
```typescript
// 1. 设置Content-Type
res.set('Content-Type', 'application/xml');

// 2. 返回200状态码
res.status(200).send(reply);
```

**重要：**
- 必须在5秒内返回
- Content-Type必须是 `application/xml`
- 状态码必须是 200

---

## 📊 完整数据流

```
【输入】
用户发送："你好"
  ↓
POST /clawnet/node/wechat-mp-xxx/message
Content-Type: text/xml

<xml>
  <ToUserName><![CDATA[gh_dc46038d7a40]]></ToUserName>
  <FromUserName><![CDATA[o4smp3F8I46aF-y1jsHuCcyKXB7s]]></FromUserName>
  <Content><![CDATA[你好]]></Content>
  <MsgId>25391885127365207</MsgId>
</xml>

【处理】
1. 解析XML
   - ToUserName: gh_dc46038d7a40
   - FromUserName: o4smp3F8I46aF-y1jsHuCcyKXB7s
   - Content: "你好"
   - MsgId: 25391885127365207

2. 消息去重
   - 检查MsgId是否已处理
   - 标记为已处理

3. 创建用户节点
   - ID: wechat-o4smp3F8I46aF-y1jsHuCcyKXB7s
   - Type: human

4. 检查配置
   - 关键词匹配："你好" → "【Bot】你好！我是ClawNet Bot！"

5. 生成回复
   - Content: "【Bot】你好！我是ClawNet Bot！"

6. 格式化XML
   - ToUserName: o4smp3F8I46aF-y1jsHuCcyKXB7s (用户)
   - FromUserName: gh_dc46038d7a40 (公众号)
   - ⚠️ 注意：FromUserName不能用AppID！

【输出】
HTTP/1.1 200 OK
Content-Type: application/xml

<xml>
  <ToUserName><![CDATA[o4smp3F8I46aF-y1jsHuCcyKXB7s]]></ToUserName>
  <FromUserName><![CDATA[gh_dc46038d7a40]]></FromUserName>
  <CreateTime>1773602600</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[【Bot】你好！我是ClawNet Bot！]]></Content>
</xml>

【结果】
用户收到："【Bot】你好！我是ClawNet Bot！"
```

---

## 🔧 关键配置

### 节点配置

```json
{
  "id": "wechat-mp-wxd213e22f3178383b",
  "type": "org",
  "name": "微信公众号",
  "config": {
    "wechat": {
      "reply": {
        "text": {
          "content": "【Bot】收到您的消息...",
          "keywords": {
            "你好": "【Bot】你好！我是ClawNet Bot！",
            "帮助": "【Bot】我可以回复你的消息"
          }
        }
      }
    }
  }
}
```

### 委托关系

```json
{
  "from": "wechat-mp-wxd213e22f3178383b",
  "to": "server-bot-001",
  "type": "delegate",
  "permissions": ["read", "write"]
}
```

---

## 📋 总结

### 关键点

1. **FromUserName必须是公众号原始ID（gh_开头）** ⚠️
2. **5秒内必须返回响应**
3. **Content-Type必须是application/xml**
4. **MsgId去重避免重复处理**
5. **ToUserName和FromUserName互换**

### 文件位置

- **路由处理：** `src/server.ts`
- **微信适配器：** `src/adapters/wechat-adapter.ts`
- **消息管理：** `src/adapters/wechat-message-manager.ts`
- **类型定义：** `src/types.ts`
- **消息存储：** `wechat-messages.json`

---

**这就是完整的消息处理流程！** 🐱✨

⏰ 2026-03-16 03:35 CST
