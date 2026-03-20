# 微信公众号 Token 配置

## ✅ 推荐使用简单Token

**Token：** `clawnet`

---

## 配置步骤

### 1. 微信公众号后台

**服务器配置：**
- URL: `http://192.163.174.25/wechat/mp/message`
- **Token: `clawnet`** ← 就用这个简单的
- EncodingAESKey: `xHzdvi3xjZLXUetUadtlyFM1h9epCkGJswIUbdd8Z0k`
- 消息加解密：明文模式

### 2. ClawNet 配置

```bash
export WECHAT_TOKEN="clawnet"
export WECHAT_APPID="wxd213e22f3178383b"
export WECHAT_APPSECRET="5664bceb1f6db3ed3609813e304d1bcd"
```

### 3. 重启 ClawNet

```bash
cd /root/.openclaw/workspace/clawnet-mvp
npm start
```

---

## ⚠️ Token 规则

**微信要求：**
- ✅ 长度：3-32字符
- ✅ 只能包含：字母、数字
- ❌ 不能有特殊字符
- ❌ 不能有空格

**正确的Token：**
- ✅ `clawnet`
- ✅ `mytoken123`
- ✅ `wechat2026`

**错误的Token：**
- ❌ `clawnet-mp-verify-202603160152`（有横线）
- ❌ `clawnet_token`（有下划线）
- ❌ `my token`（有空格）

---

## 🎯 立即配置

**微信后台填写：**
```
Token: clawnet
```

**服务器设置：**
```bash
export WECHAT_TOKEN="clawnet"
```

---

**就这么简单！Token用 `clawnet` 即可！** 🐱
