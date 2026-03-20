#!/usr/bin/env node
/**
 * 检查权限
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function checkPermission() {
  const args = process.argv.slice(2);
  const params: any = {};
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
      params[key.slice(2)] = value;
    }
  });

  if (!params.node || !params.target || !params.action) {
    console.error('Usage: check-permission.js --node=<node> --target=<target> --action=<action>');
    process.exit(1);
  }

  const url = `${CLAWNET_URL}/permissions/check?node=${params.node}&target=${params.target}&action=${params.action}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${CLAWNET_TOKEN}`
    }
  });

  const result = await response.json();
  
  if (result.success) {
    console.log(`${result.data.allowed ? '✅' : '❌'} Permission: ${params.action}`);
    console.log(`   ${params.node} → ${params.target}: ${result.data.allowed ? 'ALLOWED' : 'DENIED'}`);
  } else {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }
}

checkPermission();
