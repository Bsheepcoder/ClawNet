# ClawNet MVP

<div align="center">

**🤖 关系驱动的多节点智能协作网络**

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

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **Language:** TypeScript
- **Protocol:** WebSocket, HTTP

## 📦 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/Bsheepcoder/clawnet.git
cd clawnet

# 安装依赖
npm install

# 编译项目
npm run build
```

### 配置

项目不包含任何配置文件，你需要根据实际需求创建配置：

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

# 启动
npm start
```

### 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 📁 项目结构

```
clawnet/
├── src/              # 源代码
│   ├── adapters/     # 平台适配器
│   ├── index.ts      # 入口文件
│   ├── server.ts     # HTTP服务器
│   ├── websocket.ts  # WebSocket服务
│   ├── graph.ts      # 关系图
│   ├── permission.ts # 权限管理
│   └── ...
├── bin/              # 可执行文件
├── cli/              # CLI工具
├── skill/            # 技能模块（OpenClaw插件）
├── scripts/          # 工具脚本
└── dist/             # 编译输出
```

## 🔧 使用示例

### 基础用法

```typescript
import { Graph, Node } from 'clawnet-mvp';

// 创建关系图
const graph = new Graph();

// 添加节点
const alice = graph.addNode('alice', { name: 'Alice', role: 'admin' });
const bob = graph.addNode('bob', { name: 'Bob', role: 'user' });

// 建立关系
graph.addRelation(alice, bob, 'friend');

// 发送消息
graph.sendMessage(alice, bob, 'Hello, Bob!');
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
  console.log('Received:', event.data);
};

// 发送消息
ws.send(JSON.stringify({
  type: 'message',
  from: 'alice',
  to: 'bob',
  content: 'Hello!'
}));
```

## 🔒 安全性

**重要提示：**
- 本项目**不包含任何配置文件或密钥**
- 所有敏感信息需要用户自行配置
- 请勿将 `.env` 文件提交到版本控制
- 生产环境请使用环境变量或密钥管理服务

## 🧪 测试

```bash
# 运行测试
npm test
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📮 联系方式

- GitHub: [@Bsheepcoder](https://github.com/Bsheepcoder)
- Project Link: [https://github.com/Bsheepcoder/clawnet](https://github.com/Bsheepcoder/clawnet)

## 🙏 致谢

- OpenClaw - AI Agent Framework
- Express.js - Web Framework
- Better-SQLite3 - SQLite Database

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

</div>
