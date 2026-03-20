# Windows 安装指南

## 🪟 快速安装（3种方法）

---

## ⚡ 方法1：安装 Visual Studio Build Tools（推荐）

### 步骤

1. **下载 Build Tools**
   - 访问：https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 点击 "下载 Build Tools"

2. **安装（约 5GB）**
   ```
   必须选择：
   ✅ Desktop development with C++
   ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
   ✅ Windows 10/11 SDK
   ```

3. **重启电脑**

4. **重新安装**
   ```bash
   npm install @husile/clawnet
   ```

---

## 🚀 方法2：使用预编译包（最快）

### 安装预编译版本

```bash
# 下载预编译包
npm install @husile/clawnet --ignore-scripts

# 手动安装预编译的 better-sqlite3
npm install better-sqlite3 --build-from-source=false
```

---

## 💡 方法3：使用轻量版（无编译）

### 安装无数据库版本

```bash
# 使用内存存储模式（无需安装数据库）
npm install @husile/clawnet

# 在代码中设置
const clawnet = new ClawNet({
  storage: 'memory'  // 使用内存存储，无需 better-sqlite3
});
```

---

## 🔧 常见问题解决

### 问题1：Python 找不到

**错误：**
```
gyp ERR! find Python
```

**解决方案：**
```bash
# 安装 Python（如果没有）
# 访问：https://www.python.org/downloads/

# 或使用 chocolatey
choco install python

# 配置 npm 使用 Python
npm config set python "C:\Python312\python.exe"
```

---

### 问题2：缺少 Visual Studio

**错误：**
```
gyp ERR! find VS not looking for VS2017
```

**解决方案：**
```bash
# 选项A：安装完整的 Visual Studio
# https://visualstudio.microsoft.com/

# 选项B：只安装 Build Tools（更轻量）
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# 选项C：使用 chocolatey
choco install visualstudio2022-workload-vctools
```

---

### 问题3：权限问题

**错误：**
```
Error: EACCES: permission denied
```

**解决方案：**
```bash
# 使用管理员模式运行 PowerShell
# 右键 PowerShell → 以管理员身份运行

# 或修改 npm 全局路径
mkdir %USERPROFILE%\AppData\Roaming\npm
npm config set prefix %USERPROFILE%\AppData\Roaming\npm
```

---

## 📝 完整安装步骤（Windows）

### 步骤1：准备环境

```powershell
# 1. 检查 Node.js 版本
node -v
# 需要 >= 20.0.0

# 2. 检查 npm 版本
npm -v

# 3. 更新 npm（可选）
npm install -g npm@latest
```

### 步骤2：安装编译工具

**选项A：完整版（推荐）**
```powershell
# 下载并运行 Visual Studio Build Tools 安装程序
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

**选项B：命令行安装（快速）**
```powershell
# 使用 chocolatey
choco install visualstudio2022-workload-vctools -y

# 或使用 npm 全局安装（已弃用，不推荐）
# npm install -g windows-build-tools
```

### 步骤3：安装 ClawNet

```powershell
# 创建项目目录
mkdir clawnet-demo
cd clawnet-demo

# 初始化
npm init -y

# 安装 ClawNet
npm install @husile/clawnet

# 验证安装
node -e "console.log(require('@husile/clawnet'))"
```

---

## 🎯 零编译安装（推荐给不想安装编译工具的用户）

### 使用内存模式

```javascript
// 创建 test.js
const { ClawNet } = require('@husile/clawnet');

// 使用内存存储（无需安装 better-sqlite3）
const clawnet = new ClawNet({
  storage: 'memory'
});

console.log('✅ ClawNet 运行成功（内存模式）');
clawnet.start(3000);
```

### 运行

```bash
# 安装（跳过原生依赖）
npm install @husile/clawnet --ignore-scripts

# 运行
node test.js
```

---

## 🔍 验证安装

### 测试脚本

```javascript
// test-install.js
const pkg = require('@husile/clawnet');

console.log('✅ ClawNet 安装成功！');
console.log('导出内容:', Object.keys(pkg));

// 测试基本功能
const { ClawNet } = pkg;
const clawnet = new ClawNet({ storage: 'memory' });

console.log('✅ 基本功能正常！');
```

### 运行测试

```bash
node test-install.js
```

**预期输出：**
```
✅ ClawNet 安装成功！
导出内容: [
  'ClawNet',
  'RelationGraph',
  'PermissionSystem',
  'Router',
  'RelationRequestManager'
]
✅ 基本功能正常！
```

---

## 🌐 下载源

如果 npm 官方源速度慢，可以使用国内镜像：

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install @husile/clawnet
```

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. Node.js 版本：`node -v`
2. npm 版本：`npm -v`
3. 完整错误日志
4. 操作系统版本

---

## ✅ 安装成功标志

如果看到以下输出，说明安装成功：

```
✅ ClawNet 安装成功！
导出内容: [ 'ClawNet', 'RelationGraph', 'PermissionSystem', 'Router', 'RelationRequestManager' ]
```

---

**选择最适合你的方法，开始使用 ClawNet！** 🚀
