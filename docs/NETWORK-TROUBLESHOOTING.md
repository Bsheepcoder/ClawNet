# 外网访问问题排查

## ❌ 问题：外网无法访问80端口

---

## 检查清单

### 1. 服务监听检查

```bash
# 查看监听状态
ss -tlnp | grep :80

# 应该看到：
# LISTEN  0  128  0.0.0.0:80  0.0.0.0:*  users:(("node",...))
```

**注意：** 必须是 `0.0.0.0:80`，不能是 `127.0.0.1:80`

---

### 2. 本地测试

```bash
# 测试localhost
curl http://localhost:80/health

# 测试127.0.0.1
curl http://127.0.0.1:80/health

# 测试外网IP（从服务器内部）
curl http://192.163.174.25/health
```

---

### 3. 云服务商安全组

**最可能的问题！**

**检查：**
- 阿里云：安全组规则
- 腾讯云：安全组
- AWS：Security Groups
- 其他：防火墙规则

**需要开放：**
- 端口：80
- 协议：TCP
- 来源：0.0.0.0/0（所有IP）

---

### 4. 系统防火墙

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 80/tcp

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=80/tcp --permanent
sudo firewall-cmd --reload
```

---

### 5. 网络配置

```bash
# 查看IP
ip addr show

# 查看路由
ip route show

# 测试网络
ping 8.8.8.8
```

---

## 解决方案

### 方案1：开放云服务商安全组（最可能）

**阿里云：**
1. 登录阿里云控制台
2. ECS → 安全组
3. 添加规则：80端口，TCP，0.0.0.0/0

**腾讯云：**
1. 登录腾讯云控制台
2. CVM → 安全组
3. 添加规则：80端口

---

### 方案2：使用Nginx反向代理

```bash
# 安装Nginx
sudo apt-get install -y nginx

# 配置反向代理
sudo tee /etc/nginx/sites-available/clawnet << 'EOF'
server {
    listen 80;
    server_name 192.163.174.25;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

# 启用
sudo ln -sf /etc/nginx/sites-available/clawnet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 方案3：使用域名+443端口

如果80端口被拦截，可以：
1. 使用域名
2. 配置HTTPS（443端口）
3. 微信支持443端口

---

## 诊断命令

```bash
# 查看端口监听
ss -tlnp | grep -E ':(80|443|3000)'

# 查看进程
ps aux | grep node

# 查看日志
tail -100 /tmp/clawnet.log

# 测试端口
nc -zv 192.163.174.25 80
```

---

**90%是云服务商安全组没开放80端口！** 🐱
