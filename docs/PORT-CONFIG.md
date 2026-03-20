# ClawNet 端口配置指南

## 🎯 快速配置

### 方法1：环境变量（推荐）

```bash
# 开发环境（默认3000）
export PORT=3000
npm start

# 生产环境（80端口）
export PORT=80
sudo -E npm start

# 自定义端口
export PORT=8080
npm start
```

---

### 方法2：配置脚本

```bash
# 开发环境
./scripts/config.sh dev
npm start

# 生产环境
./scripts/config.sh prod
sudo -E npm start

# 微信配置（80端口+微信凭证）
./scripts/config.sh wechat
sudo -E npm start

# 自定义端口
./scripts/config.sh custom 9000
npm start

# 查看当前配置
./scripts/config.sh show
```

---

### 方法3：配置文件

**创建 .env 文件：**
```bash
# 复制模板
cp .env.example .env

# 编辑配置
nano .env
```

**配置内容：**
```bash
# 服务器配置
PORT=80                    # 端口号
HOST=0.0.0.0              # 监听地址

# 微信配置
WECHAT_APPID=wxd213e22f3178383b
WECHAT_APPSECRET=5664bceb1f6db3ed3609813e304d1bcd
WECHAT_TOKEN=clawnet
```

**启动：**
```bash
# 加载.env文件
source .env
sudo -E npm start
```

---

## 📋 端口说明

### 端口 3000（默认）
- **用途：** 开发环境
- **权限：** 普通用户
- **微信：** ❌ 不支持（需要80/443）
- **命令：** `npm start`

### 端口 80（生产）
- **用途：** 生产环境、微信公众号
- **权限：** 需要root
- **微信：** ✅ 支持
- **命令：** `sudo -E npm start`

### 端口 443（HTTPS）
- **用途：** 生产环境、HTTPS
- **权限：** 需要root + 证书
- **微信：** ✅ 支持
- **命令：** 需要配置SSL证书

---

## 🚀 微信公众号配置

### 一键启动（推荐）

```bash
# 方法1：使用配置脚本
./scripts/config.sh wechat
sudo -E npm start

# 方法2：直接设置
export PORT=80
export WECHAT_TOKEN="clawnet"
export WECHAT_APPID="wxd213e22f3178383b"
export WECHAT_APPSECRET="5664bceb1f6db3ed3609813e304d1bcd"
sudo -E npm start
```

### 微信后台配置

```
URL:   http://192.163.174.25/wechat/mp/message
Token: clawnet
```

---

## 🔧 高级配置

### 使用 systemd 服务

**创建服务文件：**
```bash
sudo tee /etc/systemd/system/clawnet.service << 'EOF'
[Unit]
Description=ClawNet API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/workspace/clawnet-mvp
Environment="PORT=80"
Environment="WECHAT_TOKEN=clawnet"
Environment="WECHAT_APPID=wxd213e22f3178383b"
Environment="WECHAT_APPSECRET=5664bceb1f6db3ed3609813e304d1bcd"
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

**启动服务：**
```bash
sudo systemctl daemon-reload
sudo systemctl start clawnet
sudo systemctl enable clawnet  # 开机自启
```

---

### 使用 PM2（推荐生产环境）

**安装PM2：**
```bash
npm install -g pm2
```

**启动（80端口）：**
```bash
PORT=80 WECHAT_TOKEN="clawnet" pm2 start dist/server.js --name clawnet
```

**管理命令：**
```bash
pm2 status          # 查看状态
pm2 logs clawnet    # 查看日志
pm2 restart clawnet # 重启
pm2 stop clawnet    # 停止
```

---

## 🧪 测试配置

### 检查端口监听
```bash
# 检查3000端口
lsof -i :3000

# 检查80端口
sudo lsof -i :80
```

### 测试接口
```bash
# 健康检查
curl http://localhost:80/health

# 微信接口
curl "http://localhost:80/wechat/mp/message?signature=test&timestamp=123&nonce=456&echostr=hello"
```

---

## 📊 配置对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **环境变量** | 简单快速 | 临时生效 | 开发测试 |
| **配置脚本** | 一键配置 | 需要脚本 | 频繁切换 |
| **配置文件** | 持久化 | 需要编辑 | 生产环境 |
| **systemd** | 自动重启 | 需要配置 | 服务器部署 |
| **PM2** | 功能强大 | 需要安装 | 生产推荐 |

---

## ✅ 推荐配置

**开发环境：**
```bash
./scripts/config.sh dev
npm start
```

**微信公众号：**
```bash
./scripts/config.sh wechat
sudo -E npm start
```

**生产部署：**
```bash
# 使用PM2
PORT=80 pm2 start dist/server.js --name clawnet
pm2 save
pm2 startup
```

---

**现在可以灵活配置端口了！** 🐱✨
