# ClawNet Lite - 轻量版（无需编译）

**适用于：** Windows / 不想安装编译工具的用户

---

## 🚀 快速安装（30秒）

```bash
npm install @husile/clawnet-lite
```

**无需编译工具！** ✅

---

## 📦 与完整版的区别

| 功能 | 完整版 | 轻量版 |
|------|--------|--------|
| 节点管理 | ✅ | ✅ |
| 关系管理 | ✅ | ✅ |
| 权限系统 | ✅ | ✅ |
| WebSocket | ✅ | ✅ |
| CLI 工具 | ✅ | ✅ |
| 微信集成 | ✅ | ✅ |
| SQLite 存储 | ✅ | ❌ (可选) |
| 内存存储 | ✅ | ✅ |
| **编译依赖** | ❌ 需要 | ✅ **无需** |

---

## 💡 使用方法

### 默认：内存模式

```javascript
const { ClawNet } = require('@husile/clawnet-lite');

// 使用内存存储（默认）
const clawnet = new ClawNet();

// 或明确指定
const clawnet = new ClawNet({
  storage: 'memory'
});
```

### 可选：安装 SQLite 支持

如果你想要持久化存储：

```bash
# 安装 better-sqlite3（需要编译工具）
npm install better-sqlite3

# 然后使用
const clawnet = new ClawNet({
  storage: 'sqlite'
});
```

---

## 📋 快速开始

### 1. 安装

```bash
npm install @husile/clawnet-lite
```

### 2. 使用 CLI

```bash
# 交互式 CLI
npx clawnet-interactive

# 传统 CLI
npx clawnet --help
```

### 3. 代码示例

```javascript
const { ClawNet } = require('@husile/clawnet-lite');

// 创建实例
const clawnet = new ClawNet();

// 创建节点
clawnet.addNode({
  id: 'bot-001',
  type: 'bot',
  name: '客服机器人'
});

// 创建关系
clawnet.addRelation('user-001', 'bot-001', 'observe', ['read']);

// 检查权限
const hasPermission = clawnet.checkPermission('user-001', 'bot-001', 'read');
console.log(hasPermission); // true
```

---

## ⚠️ 注意事项

### 内存模式限制

- ⚠️ 重启后数据会丢失
- ⚠️ 不适合大量数据存储

### 何时需要完整版？

如果你需要：
- ✅ 数据持久化
- ✅ 大量数据存储
- ✅ 历史记录查询

请使用完整版并安装编译工具。

---

## 🔧 完整版安装（可选）

如果以后需要 SQLite 支持：

### Windows

1. 安装 Visual Studio Build Tools
   - https://visualstudio.microsoft.com/visual-cpp-build-tools/

2. 安装完整版
   ```bash
   npm install @husile/clawnet
   ```

### macOS / Linux

```bash
# 通常无需额外工具
npm install @husile/clawnet
```

---

## 📊 性能对比

| 模式 | 启动速度 | 内存占用 | 数据持久化 |
|------|---------|---------|-----------|
| **内存模式** | ⚡ 快 | 📊 低 | ❌ 无 |
| **SQLite 模式** | ⏳ 中 | 📊 中 | ✅ 有 |

---

## 💡 推荐使用场景

### 适合轻量版：
- ✅ 开发测试
- ✅ 临时项目
- ✅ 快速原型
- ✅ Windows 用户（不想装编译工具）

### 适合完整版：
- ✅ 生产环境
- ✅ 数据持久化需求
- ✅ 大量数据存储
- ✅ 长期运行服务

---

## 🔗 相关链接

- **npm:** https://www.npmjs.com/package/@husile/clawnet-lite
- **GitHub:** https://github.com/Bsheepcoder/ClawNet
- **文档:** https://github.com/Bsheepcoder/ClawNet#readme

---

**选择轻量版，快速开始！** 🚀
