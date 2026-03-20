# 🔍 配置加载问题排查

## ❌ 问题

**症状：**
- 收到消息："你好"
- 回复："收到消息"（不是关键词回复）
- 没有关键词匹配日志

---

## 🔍 可能原因

### 1. 配置未保存到节点

**检查：**
```bash
curl "http://localhost:80/nodes/wechat-mp-.../config" | jq '.'
```

**期望：** config.wechat.reply存在且包含keywords

---

### 2. 配置读取逻辑错误

**可能问题：**
- `mpNode?.config` 为空
- 配置路径错误（config.wechat.reply vs config.reply）
- 节点ID不匹配

---

### 3. 配置未持久化

**可能问题：**
- 配置只在内存中
- 服务重启后丢失
- storage.saveNode未调用

---

## 🔧 调试方法

**添加详细日志：**
```typescript
console.log('📋 节点config:', JSON.stringify(mpNode?.config));
console.log('📋 reply配置:', JSON.stringify(config));
```

**检查：**
1. 节点是否存在
2. config字段是否存在
3. config.wechat是否存在
4. config.wechat.reply是否存在
5. keywords是否存在

---

## 📋 预期输出

```
📋 公众节点ID: wechat-mp-wxd213e22f3178383b
📋 节点存在: true
📋 节点config: {"wechat":{"reply":{"text":{"keywords":{"你好":"..."}}}}}
📋 reply配置: {"text":{"keywords":{"你好":"..."}}}
```

---

**添加调试日志，找出配置未加载的原因！** 🐱
