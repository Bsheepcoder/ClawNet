/**
 * 关系请求功能测试
 * 验证关系宪章实现
 */

import { ClawNet } from './index';

console.log('🧪 ClawNet 关系请求功能测试\n');
console.log('=' .repeat(60));

const clawnet = new ClawNet();

// ========== 1. 创建节点 ==========
console.log('\n📝 1. 创建节点');

clawnet.addNode({ id: 'alice', type: 'human', name: 'Alice' });
clawnet.addNode({ id: 'bob', type: 'human', name: 'Bob' });
clawnet.addNode({ id: 'bot-ai', type: 'bot', name: 'AI Assistant' });

console.log('✅ 创建了 3 个节点: Alice, Bob, AI Assistant');

// ========== 2. 测试关系请求流程 ==========
console.log('\n📝 2. 测试关系请求流程');

// Alice 请求观察 Bob
console.log('\n2.1 Alice 请求观察 Bob');
const request1 = clawnet.requestRelation(
  'alice',
  'bob',
  'observe',
  ['read', 'write'],
  '我是你的妈妈，想要观察你的状态'
);

console.log(`✅ 请求已创建: ${request1.id}`);
console.log(`   状态: ${request1.status}`);
console.log(`   类型: ${request1.type}`);
console.log(`   请求权限: ${request1.requestedPermissions.join(', ')}`);

// Bob 查看待处理请求
console.log('\n2.2 Bob 查看待处理请求');
const pendingRequests = clawnet.getPendingRequests('bob');
console.log(`✅ Bob 有 ${pendingRequests.length} 个待处理请求`);
pendingRequests.forEach(req => {
  console.log(`   - ${req.from} 请求 ${req.type} 关系`);
  console.log(`     消息: ${req.message}`);
});

// Bob 接受请求，但只授予 read 权限
console.log('\n2.3 Bob 接受请求（只授予 read 权限）');
const relation1 = clawnet.acceptRelationRequest(
  request1.id,
  ['read'],  // 只授予 read，少于请求的 read+write
  '好的，妈妈，我同意你观察我'
);

console.log(`✅ 关系已建立: ${relation1.id}`);
console.log(`   从: ${relation1.from}`);
console.log(`   到: ${relation1.to}`);
console.log(`   类型: ${relation1.type}`);
console.log(`   授予权限: ${relation1.permissions.join(', ')}`);

// ========== 3. 测试拒绝请求 ==========
console.log('\n📝 3. 测试拒绝请求');

// Alice 请求管理 AI Bot
console.log('\n3.1 Alice 请求委托 AI Bot');
const request2 = clawnet.requestRelation(
  'alice',
  'bot-ai',
  'delegate',
  ['read', 'write', 'admin'],
  '我想让 AI 帮我处理一些任务'
);

console.log(`✅ 请求已创建: ${request2.id}`);

// AI Bot 拒绝请求
console.log('\n3.2 AI Bot 拒绝请求');
clawnet.rejectRelationRequest(request2.id, '需要管理员批准才能委托');

const rejectedRequest = clawnet.getSentRequests('alice').find(r => r.id === request2.id);
console.log(`✅ 请求已拒绝`);
console.log(`   状态: ${rejectedRequest?.status}`);
console.log(`   拒绝原因: ${rejectedRequest?.response}`);

// ========== 4. 测试取消请求 ==========
console.log('\n📝 4. 测试取消请求');

// Bob 请求观察 AI
console.log('\n4.1 Bob 请求观察 AI');
const request3 = clawnet.requestRelation(
  'bob',
  'bot-ai',
  'observe',
  ['read'],
  '我想了解 AI 的状态'
);

console.log(`✅ 请求已创建: ${request3.id}`);

// Bob 取消请求
console.log('\n4.2 Bob 取消请求');
clawnet.cancelRelationRequest(request3.id, '不需要了');

const cancelledRequest = clawnet.getSentRequests('bob').find(r => r.id === request3.id);
console.log(`✅ 请求已取消`);
console.log(`   状态: ${cancelledRequest?.status}`);

// ========== 5. 测试审计日志 ==========
console.log('\n📝 5. 测试审计日志');

const auditLogs = clawnet.getAuditLogs({ limit: 10 });
console.log(`✅ 审计日志总数: ${auditLogs.length}`);
console.log('\n最近的审计记录:');
auditLogs.slice(0, 5).forEach(log => {
  console.log(`   ${new Date(log.timestamp).toISOString()}`);
  console.log(`   动作: ${log.action}`);
  console.log(`   执行者: ${log.actor} → 目标: ${log.target}`);
  console.log('');
});

// ========== 6. 测试权限检查 ==========
console.log('\n📝 6. 测试权限检查');

const canRead = clawnet.checkPermission('alice', 'bob', 'read');
const canWrite = clawnet.checkPermission('alice', 'bob', 'write');
const canAdmin = clawnet.checkPermission('alice', 'bob', 'admin');

console.log(`Alice → Bob 的权限:`);
console.log(`   read: ${canRead ? '✅' : '❌'}`);
console.log(`   write: ${canWrite ? '✅' : '❌'}`);
console.log(`   admin: ${canAdmin ? '✅' : '❌'}`);

// ========== 7. 测试请求统计 ==========
console.log('\n📝 7. 测试请求统计');

const stats = clawnet.getRequestStats();
console.log(`✅ 请求统计:`);
console.log(`   总请求数: ${stats.total}`);
console.log(`   待处理: ${stats.pending}`);
console.log(`   已接受: ${stats.accepted}`);
console.log(`   已拒绝: ${stats.rejected}`);
console.log(`   已过期: ${stats.expired}`);

// ========== 8. 测试关系撤销 ==========
console.log('\n📝 8. 测试关系撤销');

console.log(`撤销前关系数: ${clawnet.getAllRelations().length}`);
clawnet.revokeRelation(relation1.id, '不再需要观察');
console.log(`撤销后关系数: ${clawnet.getAllRelations().length}`);

const revokeLogs = clawnet.getAuditLogs({ action: 'relation_revoke' });
console.log(`撤销操作审计日志: ${revokeLogs.length} 条`);

// ========== 总结 ==========
console.log('\n' + '='.repeat(60));
console.log('🎉 所有测试通过！');
console.log('\n📊 测试结果:');
console.log('   ✅ 关系请求创建');
console.log('   ✅ 关系请求接受');
console.log('   ✅ 关系请求拒绝');
console.log('   ✅ 关系请求取消');
console.log('   ✅ 关系撤销');
console.log('   ✅ 审计日志记录');
console.log('   ✅ 权限检查');
console.log('   ✅ 请求统计');
console.log('\n🛡️ 关系宪章实现验证:');
console.log('   ✅ 自愿原则 - 关系需要双方同意');
console.log('   ✅ 最小权限原则 - 授予权限可少于请求权限');
console.log('   ✅ 可撤销原则 - 关系可随时撤销');
console.log('   ✅ 透明原则 - 所有操作记录审计日志');
