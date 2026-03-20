# 微信公众号消息接收排查

## 问题：给公众号发消息没有回复

---

## 📋 排查步骤

### 1. 检查微信后台配置

**确认URL配置正确：**
```
URL: http://192.163.174.25/clawnet/node/wechat-mp-wxd213e22f3178383b/message
Token: clawnet
```

**检查要点：**
- ✅ URL是否以 `/message` 结尾
- ✅ Token是否一致
- ✅ 是否已提交并验证成功

---

### 2. 检查 ClawNet 日志

**查看是否收到微信推送：**
```bash
# 查看最近的微信消息
journalctl -u clawnet --since "10 minutes ago" | grep "收到微信消息"

# 或查看控制台输出
```

**正常日志应该包含：**
```
📩 收到微信消息
📝 XML数据类型: string
📋 公众节点ID: wechat-mp-wxd213e22f3178383b
📋 节点存在: true
📋 配置: {...}
📤 回复类型: text
📤 回复内容: ...
```

---

### 3. 常见问题

#### 问题1：URL 配置错误

**症状：** 微信后台提示"请求失败"

**原因：** URL 不正确或端口不对

**解决：**
```
确认URL: http://192.163.174.25/clawnet/node/wechat-mp-wxd213e22f3178383b/message
确认端口: 80
```

---

#### 问题2：5秒超时

**症状：** 收到消息但没有回复

**原因：** 处理时间超过5秒

**解决：**
- 简化回复逻辑
- 使用异步处理

---

#### 问题3：签名验证失败

**症状：** 返回 "验证失败"

**原因：** Token 不一致

**解决：**
```bash
# 检查环境变量
echo $WECHAT_TOKEN

# 应该输出: clawnet
```

---

#### 问题4：回复格式错误

**症状：** 微信收到异常提示

**原因：** XML 格式不正确

**解决：**
- 检查 `formatReply` 方法
- 确保 XML 格式正确

---

## 🔧 快速诊断

**1. 测试本地接口：**
```bash
curl -X POST "http://localhost:80/clawnet/node/wechat-mp-wxd213e22f3178383b/message" \
  -H "Content-Type: text/xml" \
  -d '<xml>
    <ToUserName><![CDATA[gh_123]]></ToUserName>
    <FromUserName><![CDATA[oTest]]></FromUserName>
    <CreateTime>123456</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[测试]]></Content>
  </xml>'
```

**期望结果：**
```xml
<xml>
  <ToUserName><![CDATA[oTest]]></ToUserName>
  <FromUserName><![CDATA[wxd213e22f3178383b]]></FromUserName>
  <CreateTime>...</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[...]]></Content>
</xml>
```

---

**2. 检查微信后台：**
- 登录 https://mp.weixin.qq.com
- 基本配置 → 服务器配置
- 确认URL和Token

---

**3. 查看日志：**
- ClawNet控制台输出
- 系统日志

---

**如果本地测试正常但微信收不到回复，说明微信后台配置有问题！** 🐱
