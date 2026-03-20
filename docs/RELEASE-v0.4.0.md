# ClawNet v0.4.0 - 关系宪章实现

## 发布日期
2026-03-17 09:15 CST

## 核心特性

### 🛡️ 关系宪章六大原则实现

| 原则 | 状态 | 实现方式 |
|------|------|----------|
| ⚖️ **平等原则** | ✅ | 所有节点平等，无中心权威 |
| 🤝 **自愿原则** | ✅ | 关系请求需要目标节点确认 |
| 🔐 **最小权限原则** | ✅ | 授予权限可少于请求权限 |
| ↩️ **可撤销原则** | ✅ | 关系可随时撤销并通知对方 |
| 📋 **透明原则** | ✅ | 完整的审计日志系统 |
| 🛡️ **隐私原则** | ⚠️ | 部分实现（关系详情保护） |

---

## 新增功能

### 1. 关系请求系统

**API 端点：**

```
POST   /relations/request              发起关系请求
GET    /relations/pending/:nodeId      获取待处理请求
GET    /relations/sent/:nodeId         获取发出的请求
POST   /relations/request/:id/accept   接受请求
POST   /relations/request/:id/reject   拒绝请求
POST   /relations/request/:id/cancel   取消请求
POST   /relations/:id/revoke           撤销关系
GET    /relations/stats                获取请求统计
GET    /audit-logs                     获取审计日志
```

**使用示例：**

```bash
# 1. Alice 请求观察 Bob
curl -X POST http://localhost:3000/relations/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "from": "alice",
    "to": "bob",
    "type": "observe",
    "permissions": ["read", "write"],
    "message": "我是你的妈妈，想要观察你的状态"
  }'

# 2. Bob 查看待处理请求
curl http://localhost:3000/relations/pending/bob \
  -H "Authorization: Bearer $TOKEN"

# 3. Bob 接受请求（只授予 read 权限）
curl -X POST http://localhost:3000/relations/request/req-xxx/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "grantedPermissions": ["read"],
    "response": "好的，妈妈，我同意你观察我"
  }'

# 4. Bob 拒绝请求
curl -X POST http://localhost:3000/relations/request/req-xxx/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "需要管理员批准"}'

# 5. Alice 取消请求
curl -X POST http://localhost:3000/relations/request/req-xxx/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "不需要了"}'

# 6. Alice 撤销关系
curl -X POST http://localhost:3000/relations/rel-xxx/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "不再需要观察"}'
```

### 2. 审计日志系统

**审计日志格式：**

```json
{
  "id": "audit-1773710113213-abc123",
  "timestamp": 1773710113213,
  "action": "relation_create",
  "actor": "bob",
  "target": "alice",
  "relationId": "rel-xxx",
  "requestId": "req-xxx",
  "details": {
    "relationType": "observe",
    "permissions": ["read"],
    "message": "好的，妈妈，我同意你观察我"
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "ClawNet/0.4.0"
  }
}
```

**审计动作类型：**

- `relation_request` - 发起关系请求
- `relation_accept` - 接受关系请求
- `relation_reject` - 拒绝关系请求
- `relation_cancel` - 取消关系请求
- `relation_create` - 创建关系
- `relation_revoke` - 撤销关系
- `relation_update` - 更新关系

**查询审计日志：**

```bash
# 获取所有审计日志
curl http://localhost:3000/audit-logs \
  -H "Authorization: Bearer $TOKEN"

# 过滤查询
curl "http://localhost:3000/audit-logs?actor=alice&action=relation_create&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 代码统计

| 模块 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 关系请求 | relation-request.ts | 400+ | 请求管理、审计日志 |
| 核心 | index.ts | 240+ | 集成关系请求 API |
| 服务器 | server.ts | 150+ | 新增 API 端点 |
| 测试 | test-relation-request.ts | 200+ | 功能测试 |
| **总计** | - | **~990** | 新增代码 |

---

## 测试结果

```
🧪 关系请求功能测试

✅ 关系请求创建
✅ 关系请求接受
✅ 关系请求拒绝
✅ 关系请求取消
✅ 关系撤销
✅ 审计日志记录
✅ 权限检查
✅ 请求统计

🛡️ 关系宪章实现验证:
   ✅ 自愿原则 - 关系需要双方同意
   ✅ 最小权限原则 - 授予权限可少于请求权限
   ✅ 可撤销原则 - 关系可随时撤销
   ✅ 透明原则 - 所有操作记录审计日志
```

---

## 架构设计

### 关系请求流程

```
发起方                ClawNet                目标方
  │                     │                      │
  ├──── 请求 ──────────→│                      │
  │                     ├──── 通知 ───────────→│
  │                     │                      │
  │                     │←─── 接受/拒绝 ───────┤
  │                     │                      │
  │←─── 结果通知 ───────┤                      │
  │                     │                      │
  │                     │ [记录审计日志]       │
```

### 数据模型

```typescript
// 关系请求
interface RelationRequest {
  id: string;
  from: string;
  to: string;
  type: RelationType;
  requestedPermissions: Permission[];
  grantedPermissions?: Permission[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  message?: string;
  response?: string;
  createdAt: number;
  expiresAt?: number;
  respondedAt?: number;
}

// 审计日志
interface AuditLog {
  id: string;
  timestamp: number;
  action: AuditAction;
  actor: string;
  target?: string;
  relationId?: string;
  requestId?: string;
  details: Record<string, any>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}
```

---

## 下一步计划 (v0.5.0)

### 1. 关系推荐算法
- 分析节点交互模式
- 自动发现潜在关系
- 智能推荐关系类型

### 2. 临时关系
- 支持关系有效期 (TTL)
- 自动过期清理
- 临时授权

### 3. 关系继承
- 支持组织层级
- 权限继承规则
- 动态权限计算

### 4. Web 管理界面
- 可视化关系图谱
- 请求审批界面
- 审计日志查看

---

## 升级说明

### 从 v0.3.x 升级

1. **拉取最新代码**
   ```bash
   cd /root/.openclaw/workspace/clawnet-mvp
   git pull
   ```

2. **重新编译**
   ```bash
   npm run build
   ```

3. **重启服务**
   ```bash
   npm start
   ```

4. **验证新功能**
   ```bash
   node dist/test-relation-request.js
   ```

### 兼容性

- ✅ 完全向后兼容 v0.3.x
- ✅ 旧的 `addRelation` API 仍然可用
- ✅ 新的请求 API 是可选的增强功能

---

## 贡献者

- 设计: XD Q
- 开发: ClawNet Team
- 审核: 关系宪章委员会

---

## 许可证

MIT License

---

**ClawNet v0.4.0 - 让关系建立在安全平等的基础之上** 🛡️
