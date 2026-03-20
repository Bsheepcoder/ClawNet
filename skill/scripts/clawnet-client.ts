/**
 * ClawNet Skill 脚本
 */

const CLAWNET_URL = process.env.CLAWNET_URL || 'http://localhost:3000';
const CLAWNET_TOKEN = process.env.CLAWNET_TOKEN || 'clawnet-secret-token';

async function request(endpoint: string, options: any = {}) {
  const url = `${CLAWNET_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CLAWNET_TOKEN}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`ClawNet error: ${response.statusText}`);
  }

  return response.json();
}

// 注册 Bot
export async function registerBot(id: string, name: string) {
  return request('/nodes', {
    method: 'POST',
    body: JSON.stringify({ id, type: 'bot', name })
  });
}

// 创建关系
export async function addRelation(
  from: string,
  to: string,
  type: string,
  permissions: string[]
) {
  return request('/relations', {
    method: 'POST',
    body: JSON.stringify({ from, to, type, permissions })
  });
}

// 检查权限
export async function checkPermission(
  node: string,
  target: string,
  action: string
) {
  const result = await request(
    `/permissions/check?node=${node}&target=${target}&action=${action}`
  );
  return result.data.allowed;
}

// 路由事件
export async function routeEvent(
  from: string,
  type: string,
  payload: any
) {
  return request('/route', {
    method: 'POST',
    body: JSON.stringify({ from, type, payload })
  });
}

// 获取在线节点
export async function getOnlineNodes() {
  const result = await request('/ws/online');
  return result.data;
}

// 获取所有节点
export async function getAllNodes() {
  const result = await request('/nodes');
  return result.data;
}

// 获取所有关系
export async function getAllRelations() {
  const result = await request('/relations');
  return result.data;
}
