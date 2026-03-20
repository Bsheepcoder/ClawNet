# ClawNet

<div align="center">

**🤖 Relation-Driven Multi-Node Intelligent Collaboration Network**

**ClawNet** | **[中文版](README_CN.md)** | **[Windows 安装](INSTALL_WINDOWS.md)** | **[CLI 指南](CLI-GUIDE.md)**

[![npm version](https://badge.fury.io/js/@husile%2Fclawnet.svg)](https://www.npmjs.com/package/@husile/clawnet)
[![npm downloads](https://img.shields.io/npm/dm/@husile/clawnet.svg)](https://www.npmjs.com/package/@husile/clawnet)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)

</div>

---

## 📖 Overview

ClawNet is a multi-node intelligent collaboration system based on relation networks, featuring:
- Multi-platform message routing (WeChat, Telegram, etc.)
- Node relationship management and permission control
- Intelligent message distribution and processing
- Flexible plugin architecture

## 🚀 Key Features

- ✅ Multi-platform adapters (WeChat Official Account, Telegram Bot)
- ✅ Relation graph topology management
- ✅ Role-based permission control
- ✅ WebSocket real-time communication
- ✅ SQLite local storage
- ✅ Extensible plugin system

## 🛠️ Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **Language:** TypeScript
- **Protocol:** WebSocket, HTTP

## 📦 Installation

> **🪟 Windows Users:** See [Windows Installation Guide](INSTALL_WINDOWS.md) for detailed instructions.

```bash
# Using npm (recommended)
npm install @husile/clawnet

# If you encounter issues on Windows with better-sqlite3, use:
npm install @husile/clawnet --ignore-scripts

# Or use the memory mode (no database required):
const clawnet = new ClawNet({ storage: 'memory' });

# Using yarn
yarn add @husile/clawnet

# Using pnpm
pnpm add @husile/clawnet

# Or clone the repository
git clone https://github.com/Bsheepcoder/ClawNet.git
cd ClawNet
npm install
```

## ⚙️ Configuration

**Method 1: Environment Variables**
```bash
export PORT=3000
export HOST=0.0.0.0
npm start
```

**Method 2: .env File (Recommended)**
```bash
# Create .env file
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
EOF

# Start the server
npm start
```

## 📁 Project Structure

```
ClawNet/
├── dist/              # Compiled JavaScript
├── src/               # TypeScript source code
│   ├── adapters/      # Platform adapters
│   ├── index.ts       # Entry point
│   ├── server.ts      # HTTP server
│   ├── websocket.ts   # WebSocket server
│   ├── graph.ts       # Relation graph
│   ├── permission.ts  # Permission management
│   └── ...
├── bin/               # Executable files
├── cli/               # CLI tools
├── skill/             # OpenClaw skill integration
├── scripts/           # Utility scripts
└── package.json
```

## 🚀 Quick Start

### Build & Run

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Or use the start script
./start.sh
```

### Usage Example

```javascript
const { Graph, Node } = require('@husile/clawnet');

// Create a relation graph
const graph = new Graph();

// Add nodes
const alice = graph.addNode('alice', { name: 'Alice', role: 'admin' });
const bob = graph.addNode('bob', { name: 'Bob', role: 'user' });

// Establish relationship
graph.addRelation(alice, bob, 'friend');

// Send message
graph.sendMessage(alice, bob, 'Hello, Bob!');
```

### Integration with OpenClaw

See [skill/SKILL.md](skill/SKILL.md) for details.

## 🌐 API Documentation

### HTTP API

```
GET  /health          # Health check
POST /message         # Send message
GET  /nodes           # Get node list
GET  /relations       # Get relation list
```

### WebSocket API

```javascript
// Connect
const ws = new WebSocket('ws://localhost:3000/ws');

// Listen for messages
ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

// Send message
ws.send(JSON.stringify({
  type: 'message',
  from: 'alice',
  to: 'bob',
  content: 'Hello!'
}));
```

## 🔒 Security

**Important:**
- This project **does not include any configuration files or credentials**
- All sensitive information must be configured by the user
- Do **not** commit `.env` files to version control
- Use environment variables or secret management services in production

## 🧪 Testing

```bash
# Run tests
npm test
```

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📊 Project Status

- ✅ Version: 0.5.0
- ✅ Status: Active Development
- ✅ Node.js: >=20.0.0
- ✅ License: MIT

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## 📮 Contact & Support

- **GitHub:** [@Bsheepcoder](https://github.com/Bsheepcoder)
- **Project:** [https://github.com/Bsheepcoder/ClawNet](https://github.com/Bsheepcoder/ClawNet)
- **Issues:** [https://github.com/Bsheepcoder/ClawNet/issues](https://github.com/Bsheepcoder/ClawNet/issues)
- **npm:** [https://www.npmjs.com/package/@husile/clawnet](https://www.npmjs.com/package/@husile/clawnet)

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/openclaw) - AI Agent Framework
- [Express.js](https://expressjs.com/) - Web Framework
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) - SQLite Database

---

<div align="center">

**⭐ If this project helps you, please give it a star! ⭐**

**🤝 Contributions, issues, and feature requests are welcome!**

</div>

---

## 📋 Quick Reference

| Item | Value |
|------|-------|
| **Package Name** | @husile/clawnet |
| **Current Version** | 0.5.0 |
| **Node.js** | >= 20.0.0 |
| **License** | MIT |
| **Repository** | [GitHub](https://github.com/Bsheepcoder/ClawNet) |
| **npm** | [npmjs.com](https://www.npmjs.com/package/@husile/clawnet) |

---

<div align="center">

**Built with ❤️ by the ClawNet Team**

</div>
