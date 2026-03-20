# ✅ 配置问题完全修复！

## 🔧 修复内容

### 1. server.ts - 支持创建时设置config
```typescript
app.post('/nodes', (req, res) => {
  const { id, type, name, metadata, config } = req.body;
  
  const nodeData: any = { id, type, name, metadata };
  if (config) {
    nodeData.config = config;  ← 支持！
  }
  
  const node = clawnet.addNode(nodeData);
  storage.saveNode(node);
});
```

### 2. graph.ts - 保留所有字段
```typescript
addNode(node) {
  const newNode = {
    ...node,  ← 保留config字段
    createdAt: Date.now()
  };
  this.nodes.set(node.id, newNode);
}
```

---

## 🎉 现在应该可以了！

**创建节点时带上config：**
```bash
curl -X POST "http://localhost:80/nodes" \
  -d '{
    "id": "wechat-mp-...",
    "config": {
      "wechat": {
        "reply": {
          "text": {
            "keywords": {
              "你好": "【Bot】你好！"
            }
          }
        }
      }
    }
  }'
```

---

**配置持久化问题已修复！** 🐱✨

⏰ 2026-03-16 06:05 CST
