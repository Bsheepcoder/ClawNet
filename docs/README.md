# ClawNet MVP

🤖 **智能微信客服系统** - AI-powered WeChat customer service platform

## 📖 项目简介

ClawNet 是一个基于 OpenAI GPT 模型的智能微信客服系统，支持：
- 自动回复微信消息
- 多账号管理
- 智能对话生成
- 消息存储与分析

## 🚀 核心功能

- ✅ 微信消息自动回复
- ✅ OpenAI GPT 集成
- ✅ 多微信账号支持
- ✅ 消息持久化存储
- ✅ 自定义回复策略
- ✅ Webhook 支持

## 🛠️ 技术栈

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **AI:** OpenAI API
- **WeChat SDK:** wechat4u3
- **Language:** TypeScript

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/Bsheepcoder/clawnet.git
cd clawnet

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 运行
npm run dev
```

## ⚙️ 配置

### 环境变量

在 `.env` 文件中配置：

```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# 微信配置
WECHAT_AUTO_LOGIN=true
WECHAT_HEADLESS=true

# 服务器配置
PORT=3000
NODE_ENV=development
```

## 📁 项目结构

```
clawnet-mvp/
├── src/              # 源代码
│   ├── index.ts      # 入口文件
│   ├── wechat/       # 微信相关
│   └── api/          # API 路由
├── skill/            # 技能模块
├── scripts/          # 脚本文件
├── bin/              # 可执行文件
├── dist/             # 编译输出
└── docs/             # 文档
```

## 📚 文档

- [API 文档](./API.md)
- [微信配置指南](./WECHAT-SETUP.md)
- [故障排查](./WECHAT-TROUBLESHOOTING.md)
- [消息存储](./WECHAT-MESSAGE-STORAGE.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👤 作者

Bsheepcoder

---

**注意：** 这是一个 MVP (最小可行产品) 版本，用于演示和测试目的。
