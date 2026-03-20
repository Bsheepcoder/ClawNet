# ClawNet MVP

最小可行产品 - 关系驱动的多节点智能协作网络

## 项目位置
```
/root/.openclaw/workspace/clawnet-mvp/
```

## 已完成
✅ 核心类型定义
✅ 关系图谱模块
✅ 权限系统模块
✅ 路由引擎模块
✅ 完整测试通过

## 代码统计
- 核心: ~500 行
- 总计: ~1500 行
- 零外部依赖（仅开发依赖 TypeScript）

## 快速使用
```bash
cd /root/.openclaw/workspace/clawnet-mvp
npm install
npm run build
npm test
```

## 核心 API
```typescript
import { ClawNet } from 'clawnet-mvp';

const clawnet = new ClawNet();

// 创建节点
clawnet.addNode({id: 'user-001', type: 'human', name: '用户'});

// 创建关系
clawnet.addRelation('user-001', 'bot-001', 'observe', ['read', 'write']);

// 检查权限
clawnet.checkPermission('user-001', 'bot-001', 'read'); // true

// 路由消息
await clawnet.route({from: 'user-001', type: 'event', payload: {}});
```

## 下一步
- [ ] 添加持久化存储（SQLite）
- [ ] 添加 REST API
- [ ] 添加 WebSocket 支持
- [ ] 集成 ClawNet Skill（P2P）
- [ ] 创建文档网站
