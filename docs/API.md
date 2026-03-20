# ClawNet REST API 文档

## 启动服务
```bash
cd /root/.openclaw/workspace/clawnet-mvp
npm run build
npm start
```

服务地址：http://localhost:3000

## API 接口

### 节点管理

**创建节点**
```bash
POST /nodes
{
  "id": "user-001",
  "type": "human",
  "name": "用户",
  "metadata": {}
}
```

**获取节点**
```bash
GET /nodes/:id
GET /nodes  # 获取所有
```

**删除节点**
```bash
DELETE /nodes/:id
```

---

### 关系管理

**创建关系**
```bash
POST /relations
{
  "from": "user-001",
  "to": "bot-001",
  "type": "observe",
  "permissions": ["read", "write"]
}
```

**获取关系**
```bash
GET /relations/node/:nodeId  # 获取节点的关系
GET /relations  # 获取所有
```

**删除关系**
```bash
DELETE /relations/:id
```

---

### 权限检查

**检查权限**
```bash
GET /permissions/check?node=user-001&target=bot-001&action=read
```

返回：
```json
{
  "success": true,
  "data": {
    "node": "user-001",
    "target": "bot-001",
    "action": "read",
    "allowed": true
  }
}
```

---

### 事件路由

**路由事件**
```bash
POST /route
{
  "from": "user-001",
  "type": "observation",
  "payload": {
    "message": "今天情绪稳定"
  }
}
```

**注册处理器**
```bash
POST /handlers/:nodeId
{
  "webhook": "http://your-server.com/webhook"
}
```

---

### 健康检查

```bash
GET /health
```

---

## 测试示例

```bash
# 1. 创建节点
curl -X POST http://localhost:3000/nodes \
  -H "Content-Type: application/json" \
  -d '{"id":"mom-001","type":"human","name":"妈妈"}'

curl -X POST http://localhost:3000/nodes \
  -H "Content-Type: application/json" \
  -d '{"id":"child-001","type":"human","name":"孩子"}'

# 2. 创建关系
curl -X POST http://localhost:3000/relations \
  -H "Content-Type: application/json" \
  -d '{"from":"mom-001","to":"child-001","type":"observe","permissions":["read","write","admin"]}'

# 3. 检查权限
curl "http://localhost:3000/permissions/check?node=mom-001&target=child-001&action=read"

# 4. 查看所有节点
curl http://localhost:3000/nodes

# 5. 查看所有关系
curl http://localhost:3000/relations
```
