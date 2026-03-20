# 微信公众号回复规则配置示例

## 快速开始

### 1. 简单文本回复

```bash
# 设置默认回复
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

---

## 📋 回复规则示例

### 1. 关键词回复

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "收到您的消息，我们会尽快回复。",
        "keywords": {
          "价格": "我们的课程价格如下：\n\n基础班：XXX元\n进阶班：XXX元\nVIP班：XXX元",
          "地址": "我们的地址：XX省XX市XX区XX路XX号",
          "电话": "联系电话：\n客服：400-XXX-XXXX\n手机：138-XXXX-XXXX",
          "时间": "营业时间：周一至周日 9:00-18:00",
          "课程": "我们提供以下课程：\n1. 康复训练\n2. 语言治疗\n3. 感统训练\n\n详细内容请回复'详情'"
        }
      }
    }
  }
}
```

---

### 2. 图文消息

```json
{
  "wechat": {
    "reply": {
      "defaultType": "news",
      "news": {
        "articles": [
          {
            "title": "欢迎关注我们的公众号",
            "description": "点击了解更多关于我们的信息",
            "picUrl": "https://example.com/welcome.jpg",
            "url": "https://example.com/about"
          },
          {
            "title": "最新活动",
            "description": "限时优惠活动进行中",
            "picUrl": "https://example.com/activity.jpg",
            "url": "https://example.com/activity"
          }
        ]
      }
    }
  }
}
```

---

### 3. 不回复（留空）

```json
{
  "wechat": {
    "reply": {
      "defaultType": "none"
    }
  }
}
```

---

### 4. 转接AI

```json
{
  "wechat": {
    "reply": {
      "defaultType": "ai",
      "ai": {
        "enabled": true
      }
    }
  }
}
```

---

## 📝 变量支持

回复内容支持以下变量：

```json
{
  "content": "您好！\n\n您的OpenID：{{openid}}\n当前时间：{{time}}\n当前日期：{{date}}"
}
```

**可用变量：**
- `{{openid}}` - 用户OpenID
- `{{time}}` - 当前时间（HH:MM:SS）
- `{{date}}` - 当前日期（YYYY-MM-DD）
- `{{datetime}}` - 完整日期时间

---

## 🚀 使用场景

### 康复中心示例

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "感谢关注XX康复中心！\n\n请问有什么可以帮您？",
        "keywords": {
          "预约": "预约流程：\n1. 电话预约：400-XXX-XXXX\n2. 微信预约：回复'姓名+电话+预约时间'\n3. 现场预约：XX区XX路XX号",
          "康复": "我们提供：\n• 自闭症康复\n• 语言治疗\n• 感统训练\n• 认知训练\n\n回复具体项目了解更多",
          "费用": "费用说明：\n• 评估费：XXX元\n• 单次课程：XXX元\n• 课程包：XXX元/10次\n\n回复'优惠'了解最新活动",
          "地址": "地址：XX省XX市XX区XX路XX号\n\n交通：\n• 地铁：X号线XX站\n• 公交：XX路、XX路\n• 停车：楼下有停车场"
        }
      }
    }
  }
}
```

---

## 🔧 配置命令

### 查看配置

```bash
# 查看节点配置
curl http://localhost:80/nodes/wechat-mp-wxd213e22f3178383b \
  -H "Authorization: Bearer clawnet-secret-token"
```

### 更新配置

```bash
# 更新整个配置
curl -X PUT http://localhost:80/nodes/wechat-mp-wxd213e22f3178383b/config \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d @config.json

# 更新部分配置
curl -X PATCH http://localhost:80/nodes/wechat-mp-wxd213e22f3178383b/config \
  -H "Authorization: Bearer clawnet-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "wechat": {
      "reply": {
        "text": {
          "content": "新的回复内容"
        }
      }
    }
  }'
```

---

## 📋 配置模板

**适合康复中心的模板：**

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "感谢关注！我们会尽快回复您的消息。",
        "keywords": {
          "预约": "【预约方式】\n电话：400-XXX-XXXX\n微信：回复'姓名+电话+时间'\n现场：XX地址",
          "价格": "【收费标准】\n评估：XXX元\n课程：XXX元/次\n套餐：XXX元/10次",
          "地址": "【中心地址】\nXX省XX市XX区XX路XX号\n\n交通：地铁X号线XX站",
          "时间": "【营业时间】\n周一至周五：9:00-18:00\n周六日：9:00-17:00",
          "联系": "【联系方式】\n电话：400-XXX-XXXX\n微信：本公众号\n邮箱：xxx@example.com"
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

**配置灵活，按需定制！** 🐱
