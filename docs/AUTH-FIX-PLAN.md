# 🚨 微信路由认证问题解决方案

## ❌ 问题确认

**返回错误：**
```json
{
  "success": false,
  "error": "Token required"
}
```

**原因：** 微信POST请求被认证中间件拦截

---

## 🔍 根本原因

虽然微信路由定义在`app.use(authMiddleware)`之前，但是：
1. Express的路由匹配是基于路径的
2. 认证中间件可能匹配了所有路由

---

## 🔧 解决方案

### 方案1：在认证中间件中跳过微信路由

**修改authMiddleware：**
```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 跳过微信路由
  if (req.path.includes('/wechat-mp-')) {
    return next();
  }

  // 其他路由检查token
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!token || token !== SECRET_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Token required. Use Authorization: Bearer <token> or ?token=<token>'
    });
  }

  next();
};
```

### 方案2：使用特定的路径前缀

**修改微信路由：**
```typescript
// 使用 /wechat 前缀
app.post('/wechat/message', ...)
```

然后在认证中间件中：
```typescript
if (req.path.startsWith('/wechat')) {
  return next();
}
```

---

## 📋 快速修复

**找到authMiddleware的定义，添加跳过逻辑：**
```typescript
if (req.path.includes('wechat-mp')) {
  return next();
}
```

---

**需要修改认证中间件，跳过微信路由！** 🐱
