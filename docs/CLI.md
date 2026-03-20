# ClawNet CLI - 命令行配置工具

友好的命令行界面，快速配置 ClawNet。

## 安装

```bash
cd /root/.openclaw/workspace/clawnet-mvp
npm link
```

或直接使用：
```bash
node cli/clawnet.js <command>
```

## 配置

```bash
export CLAWNET_URL="http://localhost:3000"
export CLAWNET_TOKEN="your-token"
```

## 命令

### 节点管理

```bash
# 创建节点
clawnet create-node bot-mom --name "妈妈Bot" --type bot

# 列出所有节点
clawnet list-nodes

# 查看节点详情
clawnet get-node bot-mom

# 删除节点
clawnet delete-node bot-mom
```

### 关系管理

```bash
# 创建关系
clawnet add-relation bot-mom child-001 \
  --type observe \
  --perms "read,write"

# 列出所有关系
clawnet list-relations

# 删除关系
clawnet delete-relation <relation-id>
```

### 权限检查

```bash
# 检查权限
clawnet check-perm bot-mom child-001 read
clawnet check-perm bot-mom child-001 write
clawnet check-perm bot-mom child-001 admin
```

### 事件路由

```bash
# 路由事件
clawnet route bot-mom observation '{"message":"测试消息"}'
```

### WebSocket

```bash
# 查看在线节点
clawnet list-online
```

### 其他

```bash
# 健康检查
clawnet health

# 生成 Token
clawnet token

# 帮助
clawnet help
```

## 选项

```bash
--json      输出 JSON 格式
--name      节点名称
--type      节点类型（默认：bot）
--perms     权限列表（逗号分隔）
```

## 示例

```bash
# 创建完整的多节点网络
clawnet create-node bot-mom --name "妈妈Bot"
clawnet create-node bot-teacher --name "老师Bot"
clawnet create-node child-001 --name "孩子" --type human

# 建立关系
clawnet add-relation bot-mom child-001 --type observe --perms "read,write"
clawnet add-relation bot-teacher child-001 --type observe --perms "read"
clawnet add-relation bot-mom bot-teacher --type collaborate --perms "read,write"

# 检查权限
clawnet check-perm bot-mom child-001 read      # ✅ 允许
clawnet check-perm bot-teacher child-001 write  # ❌ 拒绝

# 查看状态
clawnet health
clawnet list-nodes
clawnet list-relations
```

## 输出格式

默认友好输出，加 `--json` 输出 JSON：

```bash
clawnet list-nodes --json
```
