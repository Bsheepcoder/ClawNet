# ClawNet

<div align="center">

**🤖 关系驱动的多节点智能协作网络**

**中文版** | **[English](README.md)**

[![npm version](https://badge.fury.io/js/@husile%2Fclawnet.svg)](https://www.npmjs.com/package/@husile/clawnet)
[![npm downloads](https://img.shields.io/npm/dm/@husile/clawnet.svg)](https://www.npmjs.com/package/@husile/clawnet)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)

</div>

---

## 📖 项目简介

ClawNet 是一个基于关系网络的多节点智能协作系统，支持：
- 多平台消息路由（微信、Telegram等）
- 节点关系管理与权限控制
- 智能消息分发与处理
- 灵活的插件式架构

## 🚀 核心特性

- ✅ 多平台适配器（微信公众号、Telegram Bot）
- ✅ 关系网络拓扑管理
- ✅ 基于角色的权限控制
- ✅ WebSocket 实时通信
- ✅ SQLite 本地存储
- ✅ 可扩展的插件系统

## 🛠️ 技术栈

- **运行时：** Node.js 20+
- **框架：** Express.js
- **数据库：** SQLite (better-sqlite3)
- **语言：** TypeScript
- **协议：** WebSocket, HTTP

## 📦 安装

> **🪟 Windows 用户：** 详见 [Windows 安装指南](INSTALL_WINDOWS.md)

```bash
# 使用 npm 安装（推荐）
npm install @husile/clawnet

# 如果在 Windows 上遇到 better-sqlite3 编译问题，使用：
npm install @husile/clawnet --ignore-scripts

# 或使用内存模式（无需数据库）：
const clawnet = new ClawNet({ storage: 'memory' });

# 使用 yarn 安装
yarn add @husile/clawnet

# 使用 pnpm 安装
pnpm add @husile/clawnet

# 或克隆仓库
git clone https://github.com/Bsheepcoder/ClawNet.git
cd ClawNet
npm install
```

## ⚙️ 配置

**方式1：环境变量**
```bash
export PORT=3000
export HOST=0.0.0.0
npm start
```

**方式2：.env 文件（推荐）**
```bash
# 创建 .env 文件
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
EOF

# 启动服务
npm start
```

## 📁 项目结构

```
ClawNet/
├── dist/              # 编译后的 JavaScript
├── src/               # TypeScript 源代码
│   ├── adapters/      # 平台适配器
│   ├── index.ts       # 入口文件
│   ├── server.ts      # HTTP 服务器
│   ├── websocket.ts   # WebSocket 服务器
│   ├── graph.ts       # 关系图谱
│   ├── permission.ts  # 权限管理
│   └── ...
├── bin/               # 可执行文件
├── cli/               # CLI 工具
├── skill/             # OpenClaw 技能集成
├── scripts/           # 工具脚本
└── package.json
```

## 🚀 快速开始

### 构建与运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start

# 或使用启动脚本
./start.sh
```

### 使用示例

```javascript
const { Graph, Node } = require('@husile/clawnet');

// 创建关系图
const graph = new Graph();

// 添加节点
const alice = graph.addNode('alice', { name: 'Alice', role: 'admin' });
const bob = graph.addNode('bob', { name: 'Bob', role: 'user' });

// 建立关系
graph.addRelation(alice, bob, 'friend');

// 发送消息
graph.sendMessage(alice, bob, '你好，Bob！');
```

### 集成到 OpenClaw

详见 [skill/SKILL.md](skill/SKILL.md)

## 🌐 API 文档

### HTTP API

```
GET  /health          # 健康检查
POST /message         # 发送消息
GET  /nodes           # 获取节点列表
GET  /relations       # 获取关系列表
```

### WebSocket API

```javascript
// 连接
const ws = new WebSocket('ws://localhost:3000/ws');

// 监听消息
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 发送消息
ws.send(JSON.stringify({
  type: 'message',
  from: 'alice',
  to: 'bob',
  content: '你好！'
}));
```

## 🔒 安全性

**重要提示：**
- 本项目**不包含任何配置文件或凭证**
- 所有敏感信息必须由用户自行配置
- 请**勿**将 `.env` 文件提交到版本控制
- 生产环境请使用环境变量或密钥管理服务

## 🧪 测试

```bash
# 运行测试
npm test
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

### 开发环境设置

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '添加某个很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📊 项目状态

- ✅ 版本：0.5.0
- ✅ 状态：积极开发中
- ✅ Node.js：>=20.0.0
- ✅ 许可证：MIT

## 📝 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 📮 联系与支持

- **GitHub:** [@Bsheepcoder](https://github.com/Bsheepcoder)
- **项目地址：** [https://github.com/Bsheepcoder/ClawNet](https://github.com/Bsheepcoder/ClawNet)
- **问题反馈：** [https://github.com/Bsheepcoder/ClawNet/issues](https://github.com/Bsheepcoder/ClawNet/issues)
- **npm：** [https://www.npmjs.com/package/@husile/clawnet](https://www.npmjs.com/package/@husile/clawnet)

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw) - AI Agent 框架
- [Express.js](https://expressjs.com/) - Web 框架
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) - SQLite 数据库

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

**🤝 欢迎贡献、提出问题和功能请求！**

</div>

---

## 📋 快速参考

| 项目 | 值 |
|------|------|
| **包名** | @husile/clawnet |
| **当前版本** | 0.5.0 |
| **Node.js** | >= 20.0.0 |
| **许可证** | MIT |
| **仓库** | [GitHub](https://github.com/Bsheepcoder/ClawNet) |
| **npm** | [npmjs.com](https://www.npmjs.com/package/@husile/clawnet) |

---

<div align="center">

**用 ❤️ 构建 by ClawNet 团队**

</div>
