#!/usr/bin/env node
/**
 * 获取在线节点
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function getOnline() {
  const response = await fetch(`${CLAWNET_URL}/ws/online`, {
    headers: {
      'Authorization': `Bearer ${CLAWNET_TOKEN}`
    }
  });

  const result = await response.json();
  
  if (result.success) {
    const nodes = result.data;
    console.log(`📡 Online nodes (${nodes.length}):`);
    nodes.forEach((node: string) => {
      console.log(`   - ${node}`);
    });
  } else {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }
}

getOnline();
