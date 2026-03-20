#!/usr/bin/env node
/**
 * 测试 ClawNet 连接
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function testConnection() {
  console.log('🔍 Testing ClawNet connection...\n');
  
  try {
    const response = await fetch(`${CLAWNET_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${CLAWNET_TOKEN}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ ClawNet is running\n');
      console.log('Features:');
      console.log(`  REST API:      ${result.features.rest ? '✅' : '❌'}`);
      console.log(`  WebSocket:     ${result.features.websocket ? '✅' : '❌'}`);
      console.log(`  Auth:          ${result.features.auth ? '✅' : '❌'}`);
      console.log('\nStats:');
      console.log(`  Nodes:         ${result.stats.nodes}`);
      console.log(`  Relations:     ${result.stats.relations}`);
      console.log(`  WS Connections:${result.stats.wsConnections}`);
    } else {
      console.error('❌ ClawNet health check failed');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  }
}

testConnection();
