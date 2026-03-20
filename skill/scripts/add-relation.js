#!/usr/bin/env node
/**
 * 创建关系
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function addRelation() {
  const args = process.argv.slice(2);
  const params: any = {};
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
      params[key.slice(2)] = value;
    }
  });

  if (!params.from || !params.to || !params.type || !params.permissions) {
    console.error('Usage: add-relation.js --from=<from-id> --to=<to-id> --type=<type> --permissions=<perms>');
    console.error('  Types: observe, manage, collaborate, delegate');
    console.error('  Permissions: read, write, admin (comma-separated)');
    process.exit(1);
  }

  const response = await fetch(`${CLAWNET_URL}/relations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLAWNET_TOKEN}`
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      type: params.type,
      permissions: params.permissions.split(',')
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log(`✅ Relation created: ${result.data.from} → ${result.data.to}`);
    console.log(`   Type: ${result.data.type}`);
    console.log(`   Permissions: ${result.data.permissions.join(', ')}`);
  } else {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }
}

addRelation();
