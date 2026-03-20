# Windows 安装指南

## 🪟 完整安装教程

---

## ⚡ 方法1：使用轻量版（强烈推荐）

**适合：** 不想安装编译工具的 Windows 用户

### 安装命令

```bash
npm install -g @husile/clawnet-lite
```

### 验证安装

```bash
# 检查版本
clawnet --version

# 查看帮助
clawnet --help

# 使用交互式 CLI
clawnet-interactive
```

### 特点
- ✅ **无需编译工具**
- ✅ **安装快速**（30秒）
- ✅ **命令行可用**
- ✅ **功能完整**（除 SQLite 外）

### 数据存储
默认使用**内存模式**，重启后数据会丢失。

---

## 🔧 方法2：完整版（需要编译工具）

**适合：** 需要数据持久化的用户

### 步骤 1：安装编译工具

#### 选项 A：Visual Studio Build Tools（推荐）

1. **下载**
   - 访问：https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 点击"下载 Build Tools"

2. **安装**
   ```
   ✅ Desktop development with C++
   ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
   ✅ Windows 10 SDK 或 Windows 11 SDK
   ```

3. **重启电脑**

#### 选项 B：使用 Chocolatey（命令行安装）

```powershell
# 以管理员身份运行 PowerShell

# 安装 Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装编译工具
choco install visualstudio2022-workload-vctools -y

# 重启电脑
```

### 步骤 2：安装 ClawNet

```bash
# 全局安装
npm install -g @husile/clawnet

# 验证
clawnet --version
```

---

## 🚀 方法3：跳过编译（临时方案）

**注意：** 此方法会导致 SQLite 功能不可用

```bash
# 安装但跳过编译
npm install -g @husile/clawnet --ignore-scripts
```

**使用限制：**
- ❌ SQLite 功能不可用
- ✅ 内存模式可用
- ✅ WebSocket 可用
- ✅ 微信集成可用

---

## 📋 完整安装流程（推荐）

### 新手推荐

```bash
# 1. 安装轻量版
npm install -g @husile/clawnet-lite

# 2. 测试
clawnet --version
clawnet health

# 3. 使用
clawnet-interactive
```

### 进阶用户

```bash
# 1. 安装编译工具（参考方法2）

# 2. 安装完整版
npm install -g @husile/clawnet

# 3. 测试
clawnet --version
clawnet health
```

---

## 🎯 验证安装

### 检查命令

```bash
# 查看版本
clawnet --version

# 查看帮助
clawnet --help

# 健康检查
clawnet health

# 交互式 CLI
clawnet-interactive
```

### 测试功能

```bash
# 创建测试目录
mkdir clawnet-test
cd clawnet-test

# 初始化项目
npm init -y

# 安装 ClawNet
npm install @husile/clawnet-lite

# 创建测试文件
cat > test.js << 'EOF'
const { ClawNet } = require('@husile/clawnet-lite');

const clawnet = new ClawNet();

// 创建节点
clawnet.addNode({
  id: 'test-bot',
  type: 'bot',
  name: '测试机器人'
});

// 查看节点
console.log('节点列表:', clawnet.getNodes());

// 启动服务
clawnet.start(3000);
console.log('✅ ClawNet 运行在 http://localhost:3000');
EOF

# 运行测试
node test.js
```

**预期输出：**
```
节点列表: [ { id: 'test-bot', type: 'bot', name: '测试机器人', ... } ]
✅ ClawNet 运行在 http://localhost:3000
```

---

## 🛠️ 常见问题

### 问题1：'clawnet' 不是内部或外部命令

**原因：** npm 全局路径未添加到 PATH

**解决方案：**

```powershell
# 检查 npm 全局路径
npm config get prefix

# 添加到 PATH（PowerShell 管理员）
$env:Path += ";C:\Users\你的用户名\AppData\Roaming\npm"

# 或手动添加：
# 1. 右键"此电脑" → 属性 → 高级系统设置
# 2. 环境变量 → 用户变量 → Path → 编辑
# 3. 添加：C:\Users\你的用户名\AppData\Roaming\npm
```

---

### 问题2：npm install 失败

**错误：** `gyp ERR! find VS`

**解决方案：**
```bash
# 使用轻量版
npm install -g @husile/clawnet-lite
```

---

### 问题3：权限错误

**错误：** `Error: EACCES: permission denied`

**解决方案：**

```bash
# 方案1：使用管理员权限
# 右键 PowerShell → 以管理员身份运行

# 方案2：修改 npm 全局路径
npm config set prefix "%USERPROFILE%\AppData\Roaming\npm"
```

---

### 问题4：better-sqlite3 编译失败

**错误：** `prebuild-install warn install No prebuilt binaries found`

**解决方案：**
```bash
# 使用轻量版（推荐）
npm install -g @husile/clawnet-lite

# 或安装编译工具后重试
npm install -g @husile/clawnet
```

---

## 📊 版本对比

| 版本 | 命令 | SQLite | 内存模式 | 编译工具 | 推荐度 |
|------|------|--------|---------|---------|--------|
| **轻量版** | `@husile/clawnet-lite` | ❌ | ✅ | 不需要 | ⭐⭐⭐⭐⭐ |
| 完整版 | `@husile/clawnet` | ✅ | ✅ | 需要 | ⭐⭐⭐ |

---

## 🎨 使用示例

### 基础使用

```javascript
const { ClawNet } = require('@husile/clawnet-lite');

// 创建实例
const clawnet = new ClawNet();

// 添加节点
clawnet.addNode({
  id: 'bot-001',
  type: 'bot',
  name: '客服机器人'
});

// 添加关系
clawnet.addRelation('user-001', 'bot-001', 'observe', ['read']);

// 检查权限
const hasPermission = clawnet.checkPermission('user-001', 'bot-001', 'read');
console.log(hasPermission); // true
```

### CLI 使用

```bash
# 交互式操作
clawnet-interactive

# 命令行操作
clawnet create-node bot-001 --name "客服机器人" --type bot
clawnet list-nodes
clawnet add-relation user-001 bot-001 --type observe --perms "read"
clawnet check-perm user-001 bot-001 read
```

---

## 🔗 快速链接

| 项目 | 链接 |
|------|------|
| **轻量版 npm** | https://www.npmjs.com/package/@husile/clawnet-lite |
| **完整版 npm** | https://www.npmjs.com/package/@husile/clawnet |
| **GitHub** | https://github.com/Bsheepcoder/ClawNet |
| **文档** | https://github.com/Bsheepcoder/ClawNet#readme |
| **CLI 指南** | https://github.com/Bsheepcoder/ClawNet/blob/main/CLI-GUIDE.md |

---

## 📞 需要帮助？

如果遇到问题：

1. **查看文档：** https://github.com/Bsheepcoder/ClawNet
2. **提交 Issue：** https://github.com/Bsheepcoder/ClawNet/issues
3. **检查 Node.js 版本：** `node -v`（需要 >= 20.0.0）
4. **检查 npm 版本：** `npm -v`

---

## ✅ 推荐安装命令

**Windows 用户推荐：**

```bash
npm install -g @husile/clawnet-lite
```

**一键安装 + 测试：**

```bash
# 安装
npm install -g @husile/clawnet-lite

# 验证
clawnet --version

# 使用
clawnet-interactive
```

---

**选择适合你的方式，开始使用 ClawNet！** 🚀
