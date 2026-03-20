#!/usr/bin/env node
/**
 * ClawNet CLI - 命令行配置工具
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function request(endpoint, options = {}) {
  const url = `${CLAWNET_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CLAWNET_TOKEN}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || response.statusText);
  }

  return result;
}

function printHelp() {
  console.log(`
ClawNet CLI - 命令行配置工具

用法：clawnet <command> [options]

节点管理：
  create-node <id> [--name <name>] [--type <type>]     创建节点
  list-nodes                                           列出所有节点
  get-node <id>                                        查看节点详情
  delete-node <id>                                     删除节点

关系管理：
  add-relation <from> <to> [--type <type>] [--perms <perms>]  创建关系
  list-relations                                       列出所有关系
  delete-relation <id>                                 删除关系

权限检查：
  check-perm <node> <target> <action>                  检查权限

事件路由：
  route <from> <type> <payload>                        路由事件

WebSocket：
  list-online                                          查看在线节点

其他：
  health                                               健康检查
  token                                                生成新 Token
  help                                                 显示帮助

选项：
  --name <name>      节点名称
  --type <type>      节点类型（默认：bot）
  --perms <perms>    权限列表（逗号分隔，如：read,write）
  --json             输出 JSON 格式

示例：
  clawnet create-node bot-mom --name "妈妈Bot"
  clawnet add-relation bot-mom bot-teacher --type collaborate --perms "read,write"
  clawnet check-perm bot-mom bot-teacher read
  clawnet route bot-mom observation '{"message":"测试"}'

环境变量：
  CLAWNET_URL      ClawNet 服务地址（默认：http://localhost:3000）
  CLAWNET_TOKEN    API Token（默认：clawnet-secret-token）
`);
}

async function createNode(args) {
  const id = args[0];
  if (!id) {
    console.error('❌ 用法：clawnet create-node <id> [--name <name>] [--type <type>]');
    process.exit(1);
  }

  const name = getArg(args, '--name') || id;
  const type = getArg(args, '--type') || 'bot';

  const result = await request('/nodes', {
    method: 'POST',
    body: JSON.stringify({ id, type, name })
  });

  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`✅ 节点创建成功`);
    console.log(`   ID:   ${result.data.id}`);
    console.log(`   类型: ${result.data.type}`);
    console.log(`   名称: ${result.data.name}`);
  }
}

async function listNodes(args) {
  const result = await request('/nodes');
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`📋 节点列表 (${result.data.length} 个):\n`);
    result.data.forEach(node => {
      console.log(`   ${node.id}`);
      console.log(`     类型: ${node.type}`);
      console.log(`     名称: ${node.name}`);
      console.log(`     创建: ${new Date(node.createdAt).toLocaleString()}`);
      console.log();
    });
  }
}

async function getNode(args) {
  const id = args[0];
  if (!id) {
    console.error('❌ 用法：clawnet get-node <id>');
    process.exit(1);
  }

  const result = await request(`/nodes/${id}`);
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`📄 节点详情:\n`);
    console.log(`   ID:   ${result.data.id}`);
    console.log(`   类型: ${result.data.type}`);
    console.log(`   名称: ${result.data.name}`);
    console.log(`   创建: ${new Date(result.data.createdAt).toLocaleString()}`);
  }
}

async function deleteNode(args) {
  const id = args[0];
  if (!id) {
    console.error('❌ 用法：clawnet delete-node <id>');
    process.exit(1);
  }

  await request(`/nodes/${id}`, { method: 'DELETE' });
  console.log(`✅ 节点已删除: ${id}`);
}

async function addRelation(args) {
  const from = args[0];
  const to = args[1];
  
  if (!from || !to) {
    console.error('❌ 用法：clawnet add-relation <from> <to> [--type <type>] [--perms <perms>]');
    process.exit(1);
  }

  const type = getArg(args, '--type') || 'observe';
  const permsStr = getArg(args, '--perms') || 'read';
  const permissions = permsStr.split(',').map(p => p.trim());

  const result = await request('/relations', {
    method: 'POST',
    body: JSON.stringify({ from, to, type, permissions })
  });

  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`✅ 关系创建成功`);
    console.log(`   ${result.data.from} → ${result.data.to}`);
    console.log(`   类型: ${result.data.type}`);
    console.log(`   权限: ${result.data.permissions.join(', ')}`);
  }
}

async function listRelations(args) {
  const result = await request('/relations');
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`🔗 关系列表 (${result.data.length} 个):\n`);
    result.data.forEach(rel => {
      console.log(`   ${rel.from} → ${rel.to}`);
      console.log(`     类型: ${rel.type}`);
      console.log(`     权限: ${rel.permissions.join(', ')}`);
      console.log();
    });
  }
}

async function deleteRelation(args) {
  const id = args[0];
  if (!id) {
    console.error('❌ 用法：clawnet delete-relation <id>');
    process.exit(1);
  }

  await request(`/relations/${id}`, { method: 'DELETE' });
  console.log(`✅ 关系已删除: ${id}`);
}

async function checkPerm(args) {
  const node = args[0];
  const target = args[1];
  const action = args[2];
  
  if (!node || !target || !action) {
    console.error('❌ 用法：clawnet check-perm <node> <target> <action>');
    process.exit(1);
  }

  const result = await request(
    `/permissions/check?node=${node}&target=${target}&action=${action}`
  );

  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    const icon = result.data.allowed ? '✅' : '❌';
    console.log(`${icon} 权限: ${result.data.node} → ${result.data.target}`);
    console.log(`   操作: ${result.data.action}`);
    console.log(`   结果: ${result.data.allowed ? '允许' : '拒绝'}`);
  }
}

async function route(args) {
  const from = args[0];
  const type = args[1];
  const payload = args[2];
  
  if (!from || !type || !payload) {
    console.error('❌ 用法：clawnet route <from> <type> <payload>');
    process.exit(1);
  }

  const result = await request('/route', {
    method: 'POST',
    body: JSON.stringify({ from, type, payload: JSON.parse(payload) })
  });

  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`📨 事件路由完成`);
    console.log(`   事件ID: ${result.data.eventId}`);
    console.log(`   目标节点: ${result.data.targets.join(', ')}`);
    console.log(`   投递成功: ${result.data.delivered.join(', ')}`);
    if (result.data.failed.length > 0) {
      console.log(`   投递失败: ${result.data.failed.join(', ')}`);
    }
  }
}

async function listOnline(args) {
  const result = await request('/ws/online');
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`📡 在线节点 (${result.data.length} 个):\n`);
    result.data.forEach(node => {
      console.log(`   ${node}`);
    });
  }
}

async function health(args) {
  const result = await request('/health');
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✅ ClawNet 状态: ${result.status}\n`);
    console.log(`功能:`);
    console.log(`  REST API:  ${result.features.rest ? '✅' : '❌'}`);
    console.log(`  WebSocket: ${result.features.websocket ? '✅' : '❌'}`);
    console.log(`  认证:      ${result.features.auth ? '✅' : '❌'}\n`);
    console.log(`统计:`);
    console.log(`  节点数:       ${result.stats.nodes}`);
    console.log(`  关系数:       ${result.stats.relations}`);
    console.log(`  WS 连接数:    ${result.stats.wsConnections}`);
  }
}

async function token(args) {
  const result = await request('/tokens', { method: 'POST' });
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`🔑 新 Token:\n`);
    console.log(`   ${result.data.token}\n`);
    console.log(`使用方式:`);
    console.log(`  export CLAWNET_TOKEN="${result.data.token}"`);
    console.log(`  或`);
    console.log(`  clawnet <command> --token ${result.data.token}`);
  }
}

function getArg(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

// 主程序
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // 没有命令或 help，显示帮助
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'create-node':
        await createNode(args.slice(1));
        break;
      case 'list-nodes':
        await listNodes(args.slice(1));
        break;
      case 'get-node':
        await getNode(args.slice(1));
        break;
      case 'delete-node':
        await deleteNode(args.slice(1));
        break;
      case 'add-relation':
        await addRelation(args.slice(1));
        break;
      case 'list-relations':
        await listRelations(args.slice(1));
        break;
      case 'delete-relation':
        await deleteRelation(args.slice(1));
        break;
      case 'check-perm':
        await checkPerm(args.slice(1));
        break;
      case 'route':
        await route(args.slice(1));
        break;
      case 'list-online':
        await listOnline(args.slice(1));
        break;
      case 'health':
        await health(args.slice(1));
        break;
      case 'token':
        await token(args.slice(1));
        break;
      default:
        console.error(`❌ 未知命令: ${command}\n`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
