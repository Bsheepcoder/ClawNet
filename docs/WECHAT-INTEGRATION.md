# 微信公众号集成指南

## 快速开始

### 1. 配置环境变量

创建 `.env` 文件或在环境中设置：

```bash
export WECHAT_APPID="你的AppID"
export WECHAT_APPSECRET="你的AppSecret"
export WECHAT_TOKEN="你的Token"
```

### 2. 微信公众号后台配置

**服务器配置：**
- URL: `http://你的域名/wechat/mp/message`
- Token: 你设置的 Token
- EncodingAESKey: 随机生成
- 消息加解密方式: 明文模式（测试）/ 安全模式（生产）

**IP 白名单：**
- 添加服务器 IP: `192.163.174.25`

### 3. 启动 ClawNet

```bash
cd /root/.openclaw/workspace/clawnet-mvp
npm start
```

### 4. 测试

**验证接口：**
```bash
curl "http://localhost:3000/wechat/mp/message?signature=xxx&timestamp=xxx&nonce=xxx&echostr=test"
```

**发送消息：**
```bash
curl -X POST http://localhost:3000/wechat/mp/message \
  -H "Content-Type: application/xml" \
  -d '<xml>
    <ToUserName><![CDATA[公众号ID]]></ToUserName>
    <FromUserName><![CDATA[用户OpenID]]></FromUserName>
    <CreateTime>1234567890</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[你好]]></Content>
    <MsgId>1234567890123456</MsgId>
  </xml>'
```

## 架构

```
微信用户 → 微信服务器 → ClawNet 微信适配器 → ClawNet 核心 → AI Bot
```

## 功能

### 已实现

- ✅ 接收文本消息
- ✅ 接收事件消息（关注/取消关注）
- ✅ 自动创建用户节点
- ✅ 自动建立关注关系
- ✅ 消息路由到 Bot
- ✅ 回复文本消息

### 待实现

- ⏸️ 图片消息
- ⏸️ 语音消息
- ⏸️ 视频消息
- ⏸️ 菜单事件
- ⏸️ 客服消息（48小时内）

## 数据映射

**微信用户 → ClawNet 节点：**
```typescript
{
  id: "wechat-OPENID123",
  type: "human",
  name: "微信用户-OPENID123",
  metadata: {
    platform: "wechat",
    openid: "OPENID123"
  }
}
```

**微信公众号 → ClawNet 节点：**
```typescript
{
  id: "wechat-mp-APPID",
  type: "org",
  name: "微信公众号"
}
```

**关注关系：**
```typescript
{
  from: "wechat-OPENID123",
  to: "wechat-mp-APPID",
  type: "follow",
  permissions: ["read", "write"]
}
```

## 使用示例

### 1. 查询用户节点

```bash
clawnet get-node wechat-OPENID123
```

### 2. 查看关系

```bash
clawnet list-relations
```

### 3. 检查权限

```bash
clawnet check-perm wechat-OPENID123 wechat-mp-APPID read
```

## 故障排查

### 问题1: 验证失败

**检查：**
- Token 是否正确
- URL 是否可访问
- IP 是否在白名单

### 问题2: 收不到消息

**检查：**
- 服务器配置是否正确
- 日志是否有错误
- ClawNet 是否运行

### 问题3: 回复失败

**检查：**
- AppID/AppSecret 是否正确
- access_token 是否有效
- 网络是否正常

## 安全建议

1. ✅ 使用环境变量存储密钥
2. ✅ 验证消息签名
3. ✅ 限制消息处理频率
4. ✅ 过滤敏感内容
5. ✅ 记录操作日志

## 监控

**查看日志：**
```bash
tail -f /var/log/clawnet.log
```

**检查状态：**
```bash
clawnet health
```

## 扩展

### 添加自定义 Bot

```bash
# 创建 Bot 节点
clawnet create-node my-bot --name "智能客服" --type bot

# 建立关系
clawnet add-relation my-bot wechat-mp-APPID --type serve --perms "read,write"
```

### 配置消息处理

在 ClawNet 中注册处理器：

```typescript
clawnet.registerHandler('wechat-handler', async (event) => {
  if (event.type === 'chat') {
    // 处理聊天消息
    return { message: '收到你的消息：' + event.data.content };
  }
});
```

## 注意事项

1. 微信要求 5 秒内回复，超时会重试 3 次
2. 客服消息需 48 小时内发送
3. 每月有消息配额限制
4. 需要通过微信认证才能使用高级功能

## 下一步

- [ ] 添加图片/语音处理
- [ ] 实现客服消息
- [ ] 集成 AI 对话
- [ ] 添加菜单管理
- [ ] 数据统计

---

**有问题？查看日志或联系支持！** 🐱
