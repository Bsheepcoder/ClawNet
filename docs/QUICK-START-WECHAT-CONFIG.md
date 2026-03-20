# 微信公众号快速配置指南

## 🚀 快速开始

### 1. 创建公众号节点（如果不存在）

```bash
curl -X POST http://localhost:80/nodes \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "wechat-mp-wxd213e22f3178383b",
    "type": "org",
    "name": "微信公众号"
  }'
```

---

### 2. 配置回复规则

**简单文本回复：**
```bash
curl -X PUT http://localhost:80/nodes/wechat-mp-wxd213e22f3178383b/config \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "wechat": {
      "reply": {
        "defaultType": "text",
        "text": {
          "content": "感谢您的关注！我们已收到您的消息。"
        }
      }
    }
  }'
```

**关键词回复：**
```bash
curl -X PUT http://localhost:80/nodes/wechat-mp-wxd213e22f3178383b/config \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "wechat": {
      "reply": {
        "defaultType": "text",
        "text": {
          "content": "收到您的消息，我们会尽快回复。",
          "keywords": {
            "价格": "我们的课程价格如下：\n基础班：XXX元\n进阶班：XXX元",
            "地址": "我们的地址：XX省XX市XX区",
            "电话": "联系电话：400-XXX-XXXX"
          }
        }
      }
    }
  }'
```

---

### 3. 查看配置

```bash
curl http://localhost:80/nodes/wechat-mp-wxd213e22f3178383b/config \
  -H "Authorization: Bearer clawnet-secret-token"
```

---

### 4. 测试配置

**关注公众号并发送消息：**
- 发送"价格" → 收到价格信息
- 发送"地址" → 收到地址信息
- 发送其他内容 → 收到默认回复

---

## 📝 完整配置示例

### 康复中心配置

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "感谢关注XX康复中心！\n\n我们会尽快回复您的消息。",
        "keywords": {
          "预约": "【预约方式】\n电话：400-XXX-XXXX\n微信：回复'姓名+电话+时间'\n地址：XX市XX区XX路",
          "价格": "【收费标准】\n评估：XXX元\n单次：XXX元\n套餐：XXX元/10次",
          "地址": "【中心地址】\nXX省XX市XX区XX路XX号\n\n交通：\n地铁X号线XX站\n公交：XX路、XX路",
          "时间": "【营业时间】\n周一至周五：9:00-18:00\n周六日：9:00-17:00",
          "联系": "【联系方式】\n电话：400-XXX-XXXX\n微信：本公众号\n邮箱：xxx@example.com",
          "课程": "【课程介绍】\n1. 自闭症康复\n2. 语言治疗\n3. 感统训练\n4. 认知训练\n\n回复具体课程名称了解详情"
        }
      }
    },
    "message": {
      "autoCreateUser": true,
      "saveHistory": true
    }
  }
}
```

---

## ✅ 配置已生效

**现在微信公众号会根据配置自动回复！**

**测试：**
1. 关注公众号
2. 发送"价格"
3. 收到价格信息

---

**配置完成！** 🐱✨
