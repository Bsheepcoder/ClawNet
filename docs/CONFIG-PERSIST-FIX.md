# 🔧 配置持久化问题修复

## ❌ 问题

**配置保存了，但内存中的节点没有更新！**

```
API返回：config存在 ✅
内存节点：config = undefined ❌
```

---

## 🔍 原因

**PUT /nodes/:id/config 只更新了存储，没有更新内存中的节点！**

---

## 🔧 解决方案

**重新创建节点，带上config：**
```bash
curl -X POST "http://localhost:80/nodes" \
  -d '{
    "id": "wechat-mp-...",
    "config": { "wechat": {...} }
  }'
```

---

## 📋 验证步骤

1. 创建节点并设置配置
2. 验证配置已更新
3. 测试关键词匹配

---

**正在修复配置持久化问题！** 🐱
