# 微信消息处理规范配置

## 官方要求

### 1. 5秒响应
- 微信服务器等待5秒
- 超时断开连接
- 重试3次

### 2. 消息去重
- msgid排重（文本消息）
- FromUserName + CreateTime排重（事件消息）

### 3. 支持回复类型
- 文本
- 图片
- 图文
- 语音
- 视频
- 音乐

---

## 配置设计

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "timeout": 4500,
      "text": {
        "content": "感谢您的关注！",
        "keywords": {
          "你好": "你好！很高兴见到你！"
        }
      },
      "news": {
        "articles": [...]
      }
    },
    "message": {
      "deduplication": true,
      "deduplicationTTL": 300,
      "saveHistory": true,
      "historyLimit": 100
    }
  }
}
```

---

## 功能清单

### ✅ 已实现
- 文本回复
- 关键词匹配
- 变量替换

### 🚧 需要新增
- 消息去重
- 超时保护
- 消息历史
- 图片回复
- 图文回复
- 语音回复
- 视频回复
- 音乐回复

---

## 实现计划

1. 添加消息去重中间件
2. 添加5秒超时保护
3. 支持多种回复类型
4. 消息历史存储
5. 错误重试处理

---

**开始实现！** 🐱
