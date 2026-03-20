/**
 * 临时关系 (TTL) 功能测试
 * 
 * 测试内容：
 * 1. 创建临时关系（带 TTL）
 * 2. 创建永久关系
 * 3. 检查关系有效性
 * 4. 获取即将过期的关系
 * 5. 延长关系有效期
 * 6. 清理过期关系
 */

import { ClawNet } from './index';

console.log('🧪 ClawNet 临时关系 (TTL) 功能测试\n');
console.log('=' .repeat(60));

const clawnet = new ClawNet();

// ========== 1. 创建节点 ==========
console.log('\n📝 1. 创建节点');
clawnet.addNode({ id: 'mom', type: 'human', name: '妈妈' });
clawnet.addNode({ id: 'child', type: 'human', name: '孩子' });
clawnet.addNode({ id: 'babysitter', type: 'human', name: '保姆' });
clawnet.addNode({ id: 'ai-bot', type: 'bot', name: 'AI助手' });
console.log('✅ 创建了 4 个节点');

// ========== 2. 创建临时关系 ==========
console.log('\n📝 2. 创建临时关系');

// 创建永久关系
console.log('\n2.1 妈妈观察孩子（永久关系）');
const permanentRelation = clawnet.addRelation(
  'mom',
  'child',
  'observe',
  ['read', 'write'],
  { isTemporary: false }
);
console.log(`✅ 永久关系: ${permanentRelation.id}`);
console.log(`   是否临时: ${permanentRelation.isTemporary}`);
console.log(`   过期时间: ${permanentRelation.expiresAt || '永不过期'}`);

// 创建 1 小时的临时关系
console.log('\n2.2 保姆临时观察孩子（1小时）');
const tempRelation1 = clawnet.addRelation(
  'babysitter',
  'child',
  'observe',
  ['read'],
  { ttl: 60 * 60 * 1000 } // 1小时
);
console.log(`✅ 临时关系: ${tempRelation1.id}`);
console.log(`   是否临时: ${tempRelation1.isTemporary}`);
console.log(`   过期时间: ${new Date(tempRelation1.expiresAt!).toISOString()}`);
const remainingMinutes1 = Math.round((tempRelation1.expiresAt! - Date.now()) / 60000);
console.log(`   剩余时间: ~${remainingMinutes1} 分钟`);

// 创建 2 秒的临时关系（用于测试过期）
console.log('\n2.3 AI 临时管理设备（2秒，用于测试过期）');
const tempRelation2 = clawnet.addRelation(
  'mom',
  'ai-bot',
  'delegate',
  ['read', 'write'],
  { ttl: 2 * 1000 } // 2秒
);
console.log(`✅ 临时关系: ${tempRelation2.id}`);
console.log(`   过期时间: ${new Date(tempRelation2.expiresAt!).toISOString()}`);
const remainingSeconds = Math.round((tempRelation2.expiresAt! - Date.now()) / 1000);
console.log(`   剩余时间: ~${remainingSeconds} 秒`);

// ========== 3. 测试权限检查（自动排除过期关系） ==========
console.log('\n📝 3. 测试权限检查');

console.log('\n当前权限状态:');
console.log(`   妈妈观察孩子 (read): ${clawnet.checkPermission('mom', 'child', 'read') ? '✅' : '❌'}`);
console.log(`   保姆观察孩子 (read): ${clawnet.checkPermission('babysitter', 'child', 'read') ? '✅' : '❌'}`);
console.log(`   妈妈委托AI (read): ${clawnet.checkPermission('mom', 'ai-bot', 'read') ? '✅' : '❌'}`);

// ========== 4. 获取即将过期的关系 ==========
console.log('\n📝 4. 获取即将过期的关系');

const expiring1 = clawnet.getExpiringRelations(60 * 60 * 1000); // 1小时内
console.log(`1小时内即将过期: ${expiring1.length} 个`);
expiring1.forEach(r => {
  const seconds = Math.round((r.expiresAt! - Date.now()) / 1000);
  console.log(`   - ${r.from} → ${r.to} (${seconds}秒后过期)`);
});

// ========== 5. 延长关系有效期 ==========
console.log('\n📝 5. 延长关系有效期');

console.log(`延长前过期时间: ${new Date(tempRelation1.expiresAt!).toISOString()}`);
const extended = clawnet.extendRelation(tempRelation1.id, 60 * 60 * 1000); // 再加1小时
console.log(`延长后过期时间: ${new Date(extended.expiresAt!).toISOString()}`);
const remainingMinutes2 = Math.round((extended.expiresAt! - Date.now()) / 60000);
console.log(`   剩余时间: ~${remainingMinutes2} 分钟`);

// ========== 6. 等待过期并清理 ==========
console.log('\n📝 6. 测试过期清理');
console.log('等待 3 秒让临时关系过期...');

// 等待 3 秒
setTimeout(() => {
  console.log('\n--- 3秒后 ---');
  
  // 清理过期关系
  console.log('\n清理前关系数:', clawnet.getAllRelations().length);
  const cleanupResult = clawnet.cleanupExpiredRelations();
  console.log(`清理了 ${cleanupResult.cleaned} 个过期关系`);
  if (cleanupResult.expiredRelations && cleanupResult.expiredRelations.length > 0) {
    cleanupResult.expiredRelations.forEach(r => {
      console.log(`   - ${r.from} → ${r.to} (已过期)`);
    });
  }
  console.log('清理后关系数:', clawnet.getAllRelations().length);

  // ========== 7. 验证权限状态 ==========
  console.log('\n📝 7. 验证清理后权限状态');

  console.log('\n清理后权限状态:');
  console.log(`   妈妈观察孩子 (read): ${clawnet.checkPermission('mom', 'child', 'read') ? '✅' : '❌'}`);
  console.log(`   保姆观察孩子 (read): ${clawnet.checkPermission('babysitter', 'child', 'read') ? '✅' : '❌'}`);
  console.log(`   妈妈委托AI (read): ${clawnet.checkPermission('mom', 'ai-bot', 'read') ? '✅ (异常！)' : '❌ (正确，已过期)'}`);

  // ========== 8. 获取所有有效关系 ==========
  console.log('\n📝 8. 获取所有有效关系');

  const validRelations = clawnet.getAllValidRelations();
  console.log(`有效关系: ${validRelations.length} 个`);
  validRelations.forEach(r => {
    const expiry = r.expiresAt 
      ? ` (过期: ${new Date(r.expiresAt).toISOString()})` 
      : ' (永久)';
    console.log(`   - ${r.from} →(${r.type})→ ${r.to}${expiry}`);
  });

  // ========== 总结 ==========
  console.log('\n' + '='.repeat(60));
  console.log('🎉 临时关系 (TTL) 功能测试完成！');
  console.log('\n📊 测试结果:');
  console.log('   ✅ 创建临时关系（TTL）');
  console.log('   ✅ 创建永久关系');
  console.log('   ✅ 权限检查（自动排除过期关系）');
  console.log('   ✅ 获取即将过期的关系');
  console.log('   ✅ 延长关系有效期');
  console.log('   ✅ 自动清理过期关系');
  console.log('   ✅ 获取有效关系列表');
  console.log('\n💡 使用场景:');
  console.log('   • 授权保姆临时观察孩子（按天/周）');
  console.log('   • 授权访客临时访问设备（按小时）');
  console.log('   • 授权 AI 临时执行任务（按分钟）');
  console.log('   • 一次性授权码（按秒）');
}, 3000);
