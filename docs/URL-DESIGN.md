# ClawNet URL 路由设计规范

## 🎯 核心规则

**所有节点统一 URL 格式：**
```
/clawnet/node/{nodeId}/{功能}/{扩展}
```

---

## 📋 URL 规则

### 1. 节点基础路径
```
/clawnet/node/{nodeId}
```

**示例：**
- `/clawnet/node/wechat-mp-{appid}` - 微信公众号节点
- `/clawnet/node/telegram-bot-{token}` - Telegram Bot节点
- `/clawnet/node/user-{id}` - 用户节点

---

### 2. 功能路径
```
/clawnet/node/{nodeId}/{功能}
```

**通用功能：**
- `/clawnet/node/{nodeId}/info` - 节点信息
- `/clawnet/node/{nodeId}/health` - 健康检查
- `/clawnet/node/{nodeId}/message` - 消息接口

**平台特定功能：**
- `/clawnet/node/wechat-mp-{appid}/verify` - 微信验证
- `/clawnet/node/telegram-bot-{token}/webhook` - Telegram Webhook

---

### 3. 扩展路径
```
/clawnet/node/{nodeId}/{功能}/{扩展}
```

**示例：**
- `/clawnet/node/wechat-mp-{appid}/message/text` - 文本消息
- `/clawnet/node/wechat-mp-{appid}/message/image` - 图片消息
- `/clawnet/node/{nodeId}/action/{action}` - 动作接口

---

## 🎨 微信公众号节点

**节点ID格式：** `wechat-mp-{appid}`

**URL 规则：**
```
验证接口：/clawnet/node/wechat-mp-{appid}/verify
消息接口：/clawnet/node/wechat-mp-{appid}/message
菜单接口：/clawnet/node/wechat-mp-{appid}/menu
```

**兼容旧路径：**
```
旧：/wechat/mp/message
新：/clawnet/node/wechat-mp-{appid}/message
```

---

## 📊 URL 对比

### 旧设计（混乱）
```
/wechat/mp/message        - 微信接口
/telegram/webhook         - Telegram接口
/nodes                    - 节点列表
/health                   - 健康检查
```

### 新设计（统一）
```
/clawnet/node/wechat-mp-{appid}/verify    - 微信验证
/clawnet/node/wechat-mp-{appid}/message   - 微信消息
/clawnet/node/telegram-{token}/webhook    - Telegram Webhook
/clawnet/nodes                            - 节点列表
/clawnet/health                           - 健康检查
```

---

## 🔧 实现示例

### 微信节点
```typescript
// 节点ID
const nodeId = `wechat-mp-${appid}`;

// 验证接口
app.get(`/clawnet/node/${nodeId}/verify`, ...);

// 消息接口
app.post(`/clawnet/node/${nodeId}/message`, ...);

// 动态路由
app.get('/clawnet/node/:nodeId/verify', (req, res) => {
  const { nodeId } = req.params;
  // 验证节点是否存在
  const node = clawnet.getNode(nodeId);
  if (!node) {
    return res.status(404).send('Node not found');
  }
  // 处理验证
  ...
});
```

---

## ✅ 优势

1. **统一规范** - 所有节点遵循相同规则
2. **易于扩展** - 新增平台只需添加节点
3. **清晰明确** - URL即节点ID，一目了然
4. **便于管理** - 节点路径集中管理

---

## 📝 迁移计划

### 第一阶段：兼容期
- ✅ 保留旧路径
- ✅ 新增新路径
- ✅ 两套路径并存

### 第二阶段：过渡期
- ⏸️ 旧路径标记废弃
- ⏸️ 文档推荐新路径

### 第三阶段：清理期
- ⏸️ 移除旧路径
- ⏸️ 只保留新路径

---

**采用新规则，统一规范！** 🐱
