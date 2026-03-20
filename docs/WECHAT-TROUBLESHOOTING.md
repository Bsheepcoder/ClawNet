# 微信消息接收问题排查

## 问题：发了消息但没收到

---

## 快速诊断

### 1. 检查URL配置

**微信后台应该配置：**
```
http://192.163.174.25/clawnet/node/wechat-mp-wxd213e22f3178383b/message
```

**注意：**
- ✅ 必须是 `/clawnet/node/wechat-mp-.../message`
- ✅ 不是 `/wechat/mp/message`

---

### 2. 测试本地接口

```bash
# 测试接口是否正常
curl -X POST "http://localhost:80/clawnet/node/wechat-mp-wxd213e22f3178383b/message" \
  -H "Content-Type: text/xml" \
  -d '<xml>
    <ToUserName><![CDATA[gh_dc46038d7a40]]></ToUserName>
    <FromUserName><![CDATA[test123]]></FromUserName>
    <CreateTime>123456</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[测试]]></Content>
  </xml>'
```

**期望：** 返回XML回复

---

### 3. 测试外网访问

```bash
# 从外网测试
curl "http://192.163.174.25/health"
```

**期望：** `{"success":true,...}`

---

### 4. 查看实时日志

```bash
# 监控消息
journalctl -u clawnet -f
```

**或直接查看进程输出**

---

## 常见问题

### 问题1：URL错误

**症状：** 微信提示"请求失败"

**解决：**
- 检查微信后台配置
- 确认URL是新格式

---

### 问题2：防火墙

**症状：** 本地正常，外网访问不了

**解决：**
```bash
# 开放80端口
sudo ufw allow 80
```

---

### 问题3：服务未运行

**检查：**
```bash
curl http://localhost:80/health
```

---

## 排查步骤

1. **检查微信后台URL**
2. **测试本地接口**
3. **测试外网访问**
4. **查看日志**

---

**如果本地正常但收不到微信消息，99%是URL配置问题！** 🐱
