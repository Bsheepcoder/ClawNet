# ❌ 问题：认证中间件拦截了微信请求

## 问题确认

**返回：**
```json
{
  "success": false,
  "error": "Token required. Use Authorization: Bearer <token> or ?token=<token>"
}
```

**原因：** 微信请求被认证中间件拦截了！

---

## 🔍 位置问题

**当前server.ts结构：**
```
1. 微信路由（应该在认证之前）
2. 认证中间件（拦截了微信路由）
3. 其他路由
```

**应该是：**
```
1. 微信路由（认证之前）
2. 认证中间件
3. 其他路由
```

---

## 🔧 修复方案

### 方案1：微信路由使用完整路径（不经过认证）

**检查路由定义：**
```typescript
// 微信消息接口
app.post(`/clawnet/node/${WECHAT_NODE_ID}/message`, ...)
```

**检查认证中间件：**
```typescript
app.use(authMiddleware);
```

**确保微信路由在app.use(authMiddleware)之前！**

---

### 方案2：微信路由绕过认证

**在authMiddleware中添加：**
```typescript
if (req.path.includes('/wechat-mp-')) {
  return next();  // 跳过认证
}
```

---

## 📋 快速测试

```bash
# 添加token参数绕过认证
curl -X POST "http://localhost:80/clawnet/node/.../message?token=clawnet-secret-token" \
  -H "Content-Type: text/xml" \
  -d '<xml>...</xml>'
```

---

**问题确认：微信请求被认证中间件拦截！需要调整路由顺序！** 🐱
