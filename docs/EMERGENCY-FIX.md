# 🚨 紧急：外网无法访问80端口

## 问题确认

**本地测试：** 正常
**外网访问：** 失败

---

## 最可能的原因

### 云服务商安全组未开放80端口

**这是最常见的问题！**

---

## 解决步骤

### 阿里云

1. 登录 https://ecs.console.aliyun.com
2. 实例 → 安全组
3. 配置规则 → 添加规则
   - 端口范围：80/80
   - 授权对象：0.0.0.0/0
   - 协议：TCP

### 腾讯云

1. 登录 https://console.cloud.tencent.com/cvm
2. 安全组 → 添加规则
3. 入站规则：
   - 端口：80
   - 来源：0.0.0.0/0
   - 协议：TCP

### AWS

1. EC2 → Security Groups
2. Inbound Rules → Edit
3. Add Rule:
   - Port: 80
   - Source: 0.0.0.0/0

### 其他云服务商

- 查找"安全组"、"防火墙"设置
- 开放80端口（TCP）

---

## 临时解决方案

### 使用3000端口 + Nginx

如果80端口被封锁，可以：

```bash
# 1. 修改为3000端口
export PORT=3000
node dist/server.js

# 2. 测试3000端口
curl http://192.163.174.25:3000/health

# 3. 微信后台修改URL为3000端口
http://192.163.174.25:3000/clawnet/node/.../message
```

---

## 测试方法

```bash
# 从外部测试（用手机4G网络）
curl http://192.163.174.25/health

# 或用在线工具
# https://tools.keycdn.com/curl
```

---

**请检查云服务商安全组！** 🐱
