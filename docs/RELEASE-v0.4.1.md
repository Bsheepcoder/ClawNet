# ClawNet v0.4.1 - 临时关系 (TTL)

## 发布日期
2026-03-17 10:21 CST

## 核心特性

### ⏰ 临时关系支持

**支持场景：**
- 授权保姆临时观察孩子（按天/周）
- 授权访客临时访问设备（按小时）
- 授权 AI 临时执行任务（按分钟）
- 一次性授权码（按秒）

**核心功能：**
1. ✅ 创建临时关系（带 TTL）
2. ✅ 创建永久关系
3. ✅ 权限检查（自动排除过期关系）
4. ✅ 获取即将过期的关系
5. ✅ 延长关系有效期
6. ✅ 自动清理过期关系
7. ✅ 获取有效关系列表

---

## 新增 API

### 1. 创建临时关系

```bash
# 方式1：使用 ttl 参数（毫秒）
POST /relations
{
  "from": "mom",
  "to": "ai-bot",
  "type": "delegate",
  "permissions": ["read", "write"],
  "ttl": 3600000  // 1小时
}

# 方式2：使用 expiresAt 参数（时间戳）
POST /relations
{
  "from": "mom",
  "to": "ai-bot",
  "type": "delegate",
  "permissions": ["read", "write"],
  "expiresAt": 1773717660918
}
```

### 2. 清理过期关系

```bash
POST /relations/cleanup

# 返回
{
  "success": true,
  "data": {
    "cleaned": 2,
    "expiredRelations": [...]
  }
}
```

### 3. 获取即将过期的关系

```bash
# 获取1小时内即将过期的关系
GET /relations/expiring?within=3600000

# 返回
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "from": "babysitter",
      "to": "child",
      "expiresAt": 1773717660918
    }
  ]
}
```

### 4. 延长关系有效期

```bash
POST /relations/:relationId/extend
{
  "ttl": 3600000  // 延长1小时
}

# 返回
{
  "success": true,
  "data": {
    "id": "xxx",
    "expiresAt": 1773721260918  // 新的过期时间
  }
}
```

### 5. 检查关系是否有效

```bash
GET /relations/:relationId/valid

# 返回
{
  "success": true,
  "data": {
    "relationId": "xxx",
    "isValid": true
  }
}
```

---

## 代码统计

| 模块 | 新增/修改 | 说明 |
|------|----------|------|
| types.ts | +4 行 | 关系类型增加过期字段 |
| graph.ts | +80 行 | 临时关系管理方法 |
| permission.ts | 修改 | 权限检查排除过期关系 |
| index.ts | +30 行 | 集成临时关系 API |
| server.ts | +50 行 | 新增 5 个 API 端点 |
| test-ttl.ts | +150 行 | 功能测试 |
| **总计** | **~314 行** | |

---

## 测试结果

```
✅ 创建临时关系（TTL）
✅ 创建永久关系
✅ 权限检查（自动排除过期关系）
✅ 获取即将过期的关系
✅ 延长关系有效期
✅ 自动清理过期关系
✅ 获取有效关系列表
```

---

## 使用示例

### 场景1：授权保姆临时观察孩子

```javascript
// 妈妈授权保姆观察孩子1周
const relation = clawnet.addRelation(
  'mom',           // 发起者（妈妈）
  'babysitter',    // 目标（保姆）
  'observe',       // 关系类型
  ['read'],        // 只读权限
  { ttl: 7 * 24 * 60 * 60 * 1000 }  // 7天
);

// 1周后关系自动过期
// 保姆自动失去观察权限
```

### 场景2：授权访客临时访问设备

```javascript
// 授权访客访问智能家居2小时
const relation = clawnet.addRelation(
  'homeowner',     // 房主
  'guest',         // 访客
  'manage',        // 管理关系
  ['read', 'write'],
  { ttl: 2 * 60 * 60 * 1000 }  // 2小时
);

// 如果访客需要多留一会儿
clawnet.extendRelation(relation.id, 60 * 60 * 1000);  // 延长1小时
```

### 场景3：授权 AI 临时执行任务

```javascript
// 授权 AI 临时管理设备30分钟
const relation = clawnet.addRelation(
  'user',
  'ai-bot',
  'delegate',
  ['read', 'write', 'admin'],
  { ttl: 30 * 60 * 1000 }  // 30分钟
);

// 30分钟后自动过期
// AI 自动失去管理权限
```

---

## 下一步

- [ ] 关系推荐算法
- [ ] 智能路由增强
- [ ] 关系继承
- [ ] Web 管理界面

---

## 版本历史

**v0.4.1** (2026-03-17)
- ⏰ 临时关系支持（TTL）
- ✨ 自动过期清理
- ✨ 延长有效期
- ✨ 即将过期提醒

**v0.4.0** (2026-03-17)
- 🛡️ 关系宪章实现
- ✨ 关系请求系统
- ✨ 审计日志系统
