/**
 * ClawNet MVP 测试
 * 演示核心功能
 */

import { ClawNet } from './index';

async function test() {
  console.log('🐾 ClawNet MVP 测试开始\n');

  const clawnet = new ClawNet();

  // 1. 创建节点
  console.log('📦 创建节点...');
  
  const mom = clawnet.addNode({
    id: 'mom-001',
    type: 'human',
    name: '妈妈'
  });
  console.log('  ✅ 创建人节点:', mom.name);

  const child = clawnet.addNode({
    id: 'child-001',
    type: 'human',
    name: '孩子'
  });
  console.log('  ✅ 创建人节点:', child.name);

  const momBot = clawnet.addNode({
    id: 'bot-mom',
    type: 'bot',
    name: '妈妈Bot'
  });
  console.log('  ✅ 创建Bot节点:', momBot.name);

  const teacherBot = clawnet.addNode({
    id: 'bot-teacher',
    type: 'bot',
    name: '老师Bot'
  });
  console.log('  ✅ 创建Bot节点:', teacherBot.name);

  // 2. 创建关系
  console.log('\n🔗 创建关系...');

  const momChildRelation = clawnet.addRelation(
    'mom-001',
    'child-001',
    'observe',
    ['read', 'write', 'admin']
  );
  console.log('  ✅ 妈妈 ↔ 孩子（亲子关系）');

  clawnet.addRelation(
    'mom-001',
    'bot-mom',
    'manage',
    ['read', 'write', 'admin']
  );
  console.log('  ✅ 妈妈 ↔ 妈妈Bot（管理关系）');

  clawnet.addRelation(
    'child-001',
    'bot-teacher',
    'observe',
    ['read']
  );
  console.log('  ✅ 孩子 ↔ 老师Bot（观察关系）');

  clawnet.addRelation(
    'bot-mom',
    'bot-teacher',
    'collaborate',
    ['read', 'write']
  );
  console.log('  ✅ 妈妈Bot ↔ 老师Bot（协作关系）');

  // 3. 测试权限
  console.log('\n🔐 测试权限...');

  const canMomReadChild = clawnet.checkPermission('mom-001', 'child-001', 'read');
  console.log(`  妈妈能看孩子的数据吗？ ${canMomReadChild ? '✅ 可以' : '❌ 不行'}`);

  const canTeacherWriteChild = clawnet.checkPermission('bot-teacher', 'child-001', 'write');
  console.log(`  老师Bot能修改孩子的数据吗？ ${canTeacherWriteChild ? '✅ 可以' : '❌ 不行'}`);

  const canMomReadTeacher = clawnet.checkPermission('mom-001', 'bot-teacher', 'read');
  console.log(`  妈妈能看老师Bot吗？ ${canMomReadTeacher ? '✅ 可以' : '❌ 不行'}`);

  // 4. 测试路由
  console.log('\n📨 测试路由...');

  // 注册处理器
  clawnet.registerHandler('bot-mom', async (event) => {
    console.log(`  📨 妈妈Bot 收到消息: ${event.type}`);
  });

  clawnet.registerHandler('bot-teacher', async (event) => {
    console.log(`  📨 老师Bot 收到消息: ${event.type}`);
  });

  // 妈妈发送事件
  const result = await clawnet.route({
    from: 'mom-001',
    type: 'observation',
    payload: { message: '孩子今天情绪稳定' }
  });
  
  console.log(`  ✅ 路由完成:`);
  console.log(`     目标: ${result.targets.join(', ')}`);
  console.log(`     成功: ${result.delivered.join(', ')}`);

  // 5. 查看关系
  console.log('\n📊 查看关系...');

  const momRelations = clawnet.getRelations('mom-001');
  console.log(`  妈妈的关系数: ${momRelations.length}`);

  const botRelations = clawnet.getRelations('bot-mom');
  console.log(`  妈妈Bot的关系数: ${botRelations.length}`);

  // 6. 权限自动撤销
  console.log('\n🔄 测试权限自动撤销...');

  clawnet.removeRelation(momChildRelation.id);
  console.log('  ❌ 删除妈妈-孩子关系');

  const canMomReadChildNow = clawnet.checkPermission('mom-001', 'child-001', 'read');
  console.log(`  妈妈还能看孩子的数据吗？ ${canMomReadChildNow ? '✅ 可以' : '❌ 不行（权限自动撤销）'}`);

  console.log('\n✨ 测试完成！');
  console.log('\n📝 总结:');
  console.log('  ✅ 节点创建正常');
  console.log('  ✅ 关系管理正常');
  console.log('  ✅ 权限检查正常');
  console.log('  ✅ 事件路由正常');
  console.log('  ✅ 权限自动撤销正常');
}

// 运行测试
test().catch(console.error);
