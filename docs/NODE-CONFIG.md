# 节点配置系统设计

## 🎯 目标

为ClawNet节点添加自定义配置能力，支持：
- 微信回复规则
- 自动回复配置
- 消息处理规则

---

## 📋 节点配置结构

### 基础配置

```typescript
interface NodeConfig {
  // 微信配置
  wechat?: {
    // 回复规则
    reply?: {
      // 默认回复类型：text, image, news, ai, none
      defaultType: 'text' | 'image' | 'news' | 'ai' | 'none';
      
      // 文本回复
      text?: {
        // 自动回复内容（支持变量）
        content: string;
        // 关键词回复
        keywords?: {
          [keyword: string]: string;
        };
      };
      
      // 图文回复
      news?: {
        articles: {
          title: string;
          description: string;
          picUrl: string;
          url: string;
        }[];
      };
      
      // 转接AI
      ai?: {
        enabled: boolean;
      };
    };
    
    // 消息处理
    message?: {
      // 是否自动创建用户节点
      autoCreateUser: boolean;
      // 是否记录消息历史
      saveHistory: boolean;
    };
  };
}
```

---

## 🔧 微信回复规则示例

### 1. 简单文本回复

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "感谢您的关注！我们已收到您的消息。"
      }
    }
  }
}
```

### 2. 关键词回复

```json
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "收到您的消息，我们会尽快回复。",
        "keywords": {
          "价格": "我们的课程价格是...",
          "地址": "我们的地址是...",
          "电话": "联系电话：XXX-XXXX-XXXX"
        }
      }
    }
  }
}
```

### 3. 图文消息

```json
{
  "wechat": {
    "reply": {
      "defaultType": "news",
      "news": {
        "articles": [
          {
            "title": "欢迎关注",
            "description": "点击了解更多",
            "picUrl": "https://example.com/image.jpg",
            "url": "https://example.com"
          }
        ]
      }
    }
  }
}
```

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

## 🚀 使用方法

### CLI命令

```bash
# 查看节点配置
clawnet config get wechat-mp-{appid}

# 设置配置
clawnet config set wechat-mp-{appid} wechat.reply.text.content "你好"

# 批量设置
clawnet config import wechat-mp-{appid} config.json

# 导出配置
clawnet config export wechat-mp-{appid} > config.json
```

### REST API

```bash
# 获取配置
GET /nodes/{nodeId}/config

# 更新配置
PUT /nodes/{nodeId}/config
{
  "wechat": {
    "reply": {
      "defaultType": "text",
      "text": {
        "content": "新回复内容"
      }
    }
  }
}
```

---

## 📝 变量支持

回复内容支持变量替换：

- `{{openid}}` - 用户OpenID
- `{{nickname}}` - 用户昵称
- `{{time}}` - 当前时间
- `{{date}}` - 当前日期

示例：
```json
{
  "content": "您好 {{nickname}}，收到您的消息！"
}
```

---

**节点配置系统让ClawNet更灵活！** 🐱
