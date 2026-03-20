#!/usr/bin/env node
/**
 * 注册 Bot 到 ClawNet
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function registerBot() {
  const args = process.argv.slice(2);
  const params: any = {};
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
      params[key.slice(2)] = value;
    }
  });

  if (!params.id) {
    console.error('Usage: register-bot.js --id=<bot-id> --name=<bot-name>');
    process.exit(1);
  }

  const response = await fetch(`${CLAWNET_URL}/nodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLAWNET_TOKEN}`
    },
    body: JSON.stringify({
      id: params.id,
      type: 'bot',
      name: params.name || params.id
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log(`✅ Bot registered: ${result.data.id}`);
    console.log(`   Type: ${result.data.type}`);
    console.log(`   Name: ${result.data.name}`);
  } else {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }
}

registerBot();
