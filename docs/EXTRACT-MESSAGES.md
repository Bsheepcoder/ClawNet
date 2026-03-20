# 提取微信消息内容

## 方法1：查看 ClawNet 日志

```bash
# 查看最近的微信消息
journalctl -u clawnet --since "5 minutes ago" -n 100

# 或直接查看进程输出
ps aux | grep "node.*server"
```

---

## 方法2：添加消息记录功能

### 1. 修改 wechat-adapter.ts

在 `handleMessage` 方法中添加：

```typescript
// 记录完整消息
console.log('=== 收到微信消息 ===');
console.log('用户:', platformMsg.fromUserId);
console.log('类型:', platformMsg.type);
console.log('内容:', platformMsg.content);
console.log('时间:', new Date(platformMsg.timestamp).toLocaleString());
console.log('==================');
```

---

## 方法3：创建消息记录API

```bash
# 查看最近的用户节点
curl http://localhost:80/nodes | jq '.data[] | select(.id | contains("wechat"))'

# 查看用户节点的元数据（包含消息历史）
curl http://localhost:80/nodes/wechat-o4smp3F8I46aF-y1jsHuCcyKXB7s
```

---

## 当前收到的消息（从日志提取）

**用户：** o4smp3F8I46aF-y1jsHuCcyKXB7s
**时间：** 
- 2026-03-16 02:41:22 (1773600082)
- 2026-03-16 02:41:57 (1773600117)
- 2026-03-16 02:42:07 (1773600127)
- 2026-03-16 02:43:20 (1773600200)

**公众号：** gh_dc46038d7a40

**回复内容：**
- "我们的课程价格：基础班XXX元"
- "感谢您的关注！我们已收到您的消息。"

---

**注意：** 日志中的XML数据被截断了，只显示前200字符。
**要看到完整消息内容，需要修改日志输出或添加消息记录功能。
