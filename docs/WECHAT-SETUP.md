# 微信公众号配置（最终版）

## 配置信息

**节点ID：** `wechat-mp-wxd213e22f3178383b`

**微信后台填写：**
```
URL:   http://192.163.174.25/clawnet/node/wechat-mp-wxd213e22f3178383b/message
Token: clawnet
```

**说明：**
- GET 请求 → 验证
- POST 请求 → 消息接收

---

## 完整配置

| 项目 | 值 |
|------|---|
| **URL** | `http://192.163.174.25/clawnet/node/wechat-mp-wxd213e22f3178383b/message` |
| **Token** | `clawnet` |
| **EncodingAESKey** | `xHzdvi3xjZLXUetUadtlyFM1h9epCkGJswIUbdd8Z0k` |
| **IP白名单** | `192.163.174.25` |

---

## 启动命令

```bash
# 方式1：直接启动
PORT=80 \
WECHAT_TOKEN="clawnet" \
WECHAT_APPID="wxd213e22f3178383b" \
WECHAT_APPSECRET="5664bceb1f6db3ed3609813e304d1bcd" \
sudo -E node dist/server.js

# 方式2：使用脚本
./scripts/config.sh wechat
sudo -E npm start
```

---

**旧接口已移除，只保留新路由！** 🐱

