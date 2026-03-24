/**
 * REST API 服务器（增强版）
 * + WebSocket 实时推送
 * + Token 认证
 * + 微信公众号集成
 * + 实例管理
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ClawNet } from './index';
import { Storage } from './storage';
import { RelationType, Permission } from './types';
import { WebSocketService } from './websocket';
import { authMiddleware, generateToken } from './auth';
import { WeChatAdapter, WeChatConfig, getWeChatConfig } from './adapters/wechat-adapter';
import { InstanceManager, OpenClawInstance } from './instance-service';
import { listInstances, getInstance, createInstance, startInstance, stopInstance, connectInstance, deleteInstance } from './instance-service';
import QRCode from 'qrcode';
import { setupNodeDiscoveryAPI } from './api/node-discovery';

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const CLAWNET_URL = process.env.CLAWNET_URL || `http://localhost:${PORT}`;

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.text({ type: ['text/xml', 'application/xml'] }));  // 支持XML文本

// 初始化
const storage = new Storage('clawnet.db');
const clawnet = new ClawNet();
const wsService = new WebSocketService(server);

// 加载已有数据
storage.getAllNodes().forEach(node => {
  clawnet.addNode(node);
});
storage.getAllRelations().forEach(relation => {
  clawnet.addRelation(
    relation.from,
    relation.to,
    relation.type,
    relation.permissions
  );
});

// ========== 微信接口（新路由规范） ==========
// ========== 微信接口（必须在认证中间件之前！） ==========

let wechatAdapter: WeChatAdapter | null = null;

// 初始化微信适配器
const wechatConfig = getWeChatConfig();

if (wechatConfig.appId && wechatConfig.appSecret) {
  wechatAdapter = new WeChatAdapter(wechatConfig, clawnet);
  wechatAdapter.initialize().catch(err => {
    console.error('❌ 微信适配器初始化失败:', err);
  });
}

// 微信公众号节点ID
const WECHAT_NODE_ID = `wechat-mp-${wechatConfig.appId || 'default'}`;

// 微信接口：验证（GET）和消息接收（POST）共用同一个URL
app.get(`/clawnet/node/${WECHAT_NODE_ID}/message`, (req: Request, res: Response) => {
  if (!wechatAdapter) {
    console.warn('⚠️  微信适配器未配置');
    return res.status(200).send('error');
  }
  
  const { signature, timestamp, nonce, echostr } = req.query;
  
  if (wechatAdapter.verifySignature(
    { signature, timestamp, nonce, echostr },
    signature as string
  )) {
    console.log('✅ 微信验证成功');
    res.status(200).send(echostr);
  } else {
    console.log('❌ 微信验证失败');
    res.status(200).send('error');
  }
});

app.post(`/clawnet/node/${WECHAT_NODE_ID}/message`, async (req: Request, res: Response) => {
  if (!wechatAdapter) {
    return res.status(200).send('error');
  }
  
  try {
    // 获取原始XML字符串
    const xmlData = typeof req.body === 'string' 
      ? req.body 
      : (req as any).rawBody || JSON.stringify(req.body);
    
    console.log('📩 收到微信消息');
    console.log('📝 XML数据类型:', typeof xmlData);
    console.log('📝 XML数据:', xmlData.substring(0, 200) + '...');
    
    const reply = await wechatAdapter.handleMessage(xmlData);
    
    console.log('📤 返回给微信的内容:');
    console.log(reply);
    console.log('📤 内容类型:', typeof reply);
    console.log('📤 内容长度:', reply.length);
    
    res.set('Content-Type', 'application/xml');
    res.status(200).send(reply);
  } catch (error: any) {
    console.error('❌ 处理微信消息失败:', error);
    res.status(200).send('');
  }
});
// ========== 认证中间件（微信接口之后） ==========

app.use(authMiddleware);

// ========== WebSocket 处理器 ==========

clawnet.registerHandler('websocket-broadcaster', async (event) => {
  const authorizedTargets = clawnet.getPermissionSystem()
    .getAuthorizedTargets(event.from, 'read');
  const sentTo = wsService.sendToNodes(authorizedTargets, event);
  console.log(`📡 Event ${event.type} sent to ${sentTo.length} nodes via WebSocket`);
});

// ========== 节点 API ==========

app.post('/nodes', (req: Request, res: Response) => {
  try {
    const { id, type, name, metadata, config } = req.body;
    
    const nodeData: any = { id, type, name, metadata };
    if (config) {
      nodeData.config = config;  // 支持创建时设置config
    }
    
    const node = clawnet.addNode(nodeData);
    storage.saveNode(node);
    res.json({ success: true, data: node });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/nodes/:id', (req: Request, res: Response) => {
  const node = clawnet.getNode(req.params.id);
  if (!node) {
    res.status(404).json({ success: false, error: 'Node not found' });
    return;
  }
  res.json({ success: true, data: node });
});

app.get('/nodes', (req: Request, res: Response) => {
  // 从数据库读取节点，而不是从内存（这样可以获取最新的心跳状态）
  const nodes = storage.getAllNodes();
  res.json({ success: true, data: nodes });
});

app.delete('/nodes/:id', (req: Request, res: Response) => {
  clawnet.removeNode(req.params.id);
  storage.deleteNode(req.params.id);
  res.json({ success: true });
});

// ========== 关系 API ==========

app.post('/relations', (req: Request, res: Response) => {
  try {
    const { from, to, type, permissions, ttl, expiresAt, isTemporary } = req.body;
    
    const relation = clawnet.addRelation(
      from,
      to,
      type as RelationType,
      permissions as Permission[],
      { ttl, expiresAt, isTemporary }
    );
    
    storage.saveRelation(relation);
    res.json({ success: true, data: relation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/relations/node/:nodeId', (req: Request, res: Response) => {
  const relations = clawnet.getRelations(req.params.nodeId);
  res.json({ success: true, data: relations });
});

app.get('/relations', (req: Request, res: Response) => {
  const relations = clawnet.getAllRelations();
  res.json({ success: true, data: relations });
});

app.delete('/relations/:id', (req: Request, res: Response) => {
  clawnet.removeRelation(req.params.id);
  storage.deleteRelation(req.params.id);
  res.json({ success: true });
});

// ========== 关系请求 API（遵循关系宪章） ==========

// 发起关系请求
app.post('/relations/request', (req: Request, res: Response) => {
  try {
    const { from, to, type, permissions, message } = req.body;
    
    const request = clawnet.requestRelation(
      from,
      to,
      type as RelationType,
      permissions as Permission[],
      message
    );
    
    console.log(`📧 关系请求已创建: ${from} →(${type})→ ${to}`);
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取待处理的请求
app.get('/relations/pending/:nodeId', (req: Request, res: Response) => {
  const requests = clawnet.getPendingRequests(req.params.nodeId);
  res.json({ success: true, data: requests });
});

// 获取发出的请求
app.get('/relations/sent/:nodeId', (req: Request, res: Response) => {
  const requests = clawnet.getSentRequests(req.params.nodeId);
  res.json({ success: true, data: requests });
});

// 接受关系请求
app.post('/relations/request/:requestId/accept', (req: Request, res: Response) => {
  try {
    const { grantedPermissions, response } = req.body;
    
    const relation = clawnet.acceptRelationRequest(
      req.params.requestId,
      grantedPermissions,
      response
    );
    
    storage.saveRelation(relation);
    console.log(`✅ 关系请求已接受: ${relation.id}`);
    res.json({ success: true, data: relation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 拒绝关系请求
app.post('/relations/request/:requestId/reject', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    clawnet.rejectRelationRequest(req.params.requestId, reason);
    console.log(`❌ 关系请求已拒绝: ${req.params.requestId}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 取消关系请求
app.post('/relations/request/:requestId/cancel', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    clawnet.cancelRelationRequest(req.params.requestId, reason);
    console.log(`🚫 关系请求已取消: ${req.params.requestId}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 撤销关系
app.post('/relations/:relationId/revoke', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    clawnet.revokeRelation(req.params.relationId, reason);
    storage.deleteRelation(req.params.relationId);
    console.log(`↩️ 关系已撤销: ${req.params.relationId}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取审计日志
app.get('/audit-logs', (req: Request, res: Response) => {
  const { actor, target, action, since, limit } = req.query;
  
  const logs = clawnet.getAuditLogs({
    actor: actor as string,
    target: target as string,
    action: action as any,
    since: since ? parseInt(since as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined
  });
  
  res.json({ success: true, data: logs });
});

// 获取请求统计
app.get('/relations/stats', (req: Request, res: Response) => {
  const stats = clawnet.getRequestStats();
  res.json({ success: true, data: stats });
});

// ========== 临时关系 API ==========

// 清理过期关系
app.post('/relations/cleanup', (req: Request, res: Response) => {
  try {
    const result = clawnet.cleanupExpiredRelations();
    
    // 从存储中删除过期关系
    result.expiredRelations.forEach(relation => {
      storage.deleteRelation(relation.id);
    });
    
    console.log(`🧹 清理了 ${result.cleaned} 个过期关系`);
    res.json({ 
      success: true, 
      data: {
        cleaned: result.cleaned,
        expiredRelations: result.expiredRelations.map(r => ({
          id: r.id,
          from: r.from,
          to: r.to,
          type: r.type,
          expiredAt: r.expiresAt
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取即将过期的关系
app.get('/relations/expiring', (req: Request, res: Response) => {
  try {
    const within = req.query.within ? parseInt(req.query.within as string) : 3600000; // 默认1小时
    const relations = clawnet.getExpiringRelations(within);
    res.json({ success: true, data: relations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 延长关系有效期
app.post('/relations/:relationId/extend', (req: Request, res: Response) => {
  try {
    const { ttl } = req.body; // 延长的毫秒数
    
    if (!ttl || ttl <= 0) {
      res.status(400).json({ success: false, error: 'Invalid TTL' });
      return;
    }
    
    const relation = clawnet.extendRelation(req.params.relationId, ttl);
    storage.saveRelation(relation);
    
    console.log(`⏰ 关系已延长: ${relation.id}, 新过期时间: ${new Date(relation.expiresAt!).toISOString()}`);
    res.json({ success: true, data: relation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 检查关系是否有效
app.get('/relations/:relationId/valid', (req: Request, res: Response) => {
  try {
    const isValid = clawnet.isRelationValid(req.params.relationId);
    res.json({ success: true, data: { relationId: req.params.relationId, isValid } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== 权限 API ==========

app.get('/permissions/check', (req: Request, res: Response) => {
  const { node, target, action } = req.query;
  
  if (!node || !target || !action) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing parameters: node, target, action' 
    });
    return;
  }

  const allowed = clawnet.checkPermission(
    node as string,
    target as string,
    action as Permission
  );
  
  res.json({ 
    success: true, 
    data: { 
      node, 
      target, 
      action, 
      allowed 
    } 
  });
});

// ========== 节点配置 API ==========

// 深度合并工具函数
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// 获取节点配置
app.get('/nodes/:id/config', (req: Request, res: Response) => {
  const node = clawnet.getNode(req.params.id);
  if (!node) {
    res.status(404).json({ success: false, error: 'Node not found' });
    return;
  }
  res.json({ success: true, data: node.config || {} });
});

// 更新节点配置（完整替换）
app.put('/nodes/:id/config', (req: Request, res: Response) => {
  try {
    const nodeId = req.params.id;
    const node = clawnet.getNode(nodeId);
    if (!node) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }
    
    const updatedNode = clawnet.updateNode(nodeId, { config: req.body });
    storage.saveNode(updatedNode);
    res.json({ success: true, data: updatedNode.config });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 部分更新节点配置（合并）
app.patch('/nodes/:id/config', (req: Request, res: Response) => {
  try {
    const nodeId = req.params.id;
    const node = clawnet.getNode(nodeId);
    if (!node) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }
    
    // 深度合并配置
    const currentConfig = node.config || {};
    const newConfig = deepMerge(currentConfig, req.body);
    
    const updatedNode = clawnet.updateNode(nodeId, { config: newConfig });
    storage.saveNode(updatedNode);
    res.json({ success: true, data: updatedNode.config });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== 微信消息历史 API ==========

// 获取消息历史（内存）
app.get('/wechat/messages', (req: Request, res: Response) => {
  if (!wechatAdapter) {
    res.status(503).json({ success: false, error: '微信适配器未配置' });
    return;
  }
  
  const limit = parseInt(req.query.limit as string) || 50;
  const history = wechatAdapter.getMessageHistory(limit);
  res.json({ success: true, data: history });
});

// 获取消息日志（文件）
app.get('/wechat/messages/log', (req: Request, res: Response) => {
  const fs = require('fs');
  const messageLogFile = '/root/.openclaw/workspace/clawnet-mvp/wechat-messages.json';
  
  try {
    const data = fs.readFileSync(messageLogFile, 'utf-8');
    const messageLog = JSON.parse(data);
    res.json({ 
      success: true, 
      total: messageLog.messages.length,
      lastUpdated: messageLog.lastUpdated,
      data: messageLog.messages 
    });
  } catch (error: any) {
    res.status(404).json({ 
      success: false, 
      error: '消息日志不存在或为空',
      hint: '请先给公众号发送消息'
    });
  }
});

// ========== 路由 API ==========

// 消息历史记录
const messageHistory: any[] = [];

app.post('/route', async (req: Request, res: Response) => {
  try {
    const { from, type, payload } = req.body;
    
    // 创建完整事件
    const event = {
      id: `${from}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      type,
      payload,
      timestamp: Date.now()
    };
    
    // 获取路由目标
    const result = await clawnet.route({ from, type, payload });
    
    // 通过 WebSocket 投递到目标节点
    const delivered: string[] = [];
    const failed: string[] = [];
    
    for (const targetId of result.targets) {
      const sent = wsService.sendToNode(targetId, {
        type: 'message',
        from: event.from,
        to: targetId,
        timestamp: event.timestamp,
        payload: {
          eventType: event.type,
          data: event.payload,
          eventId: event.id,
          targets: result.targets
        }
      } as any);
      
      if (sent) {
        delivered.push(targetId);
      } else {
        failed.push(targetId);
      }
    }
    
    // 记录到消息历史
    const messageRecord = {
      ...event,
      targets: result.targets,
      delivered,
      failed,
      status: delivered.length > 0 ? 'delivered' : 'failed'
    };
    messageHistory.push(messageRecord);
    
    // 保持最近 1000 条消息
    if (messageHistory.length > 1000) {
      messageHistory.shift();
    }
    
    res.json({ 
      success: true, 
      data: {
        eventId: event.id,
        targets: result.targets,
        delivered,
        failed
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取消息历史
app.get('/messages', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const nodeFilter = req.query.node as string;
  
  let messages = messageHistory;
  
  if (nodeFilter) {
    messages = messages.filter(m => 
      m.from === nodeFilter || 
      m.targets?.includes(nodeFilter)
    );
  }
  
  res.json({ 
    success: true, 
    data: messages.slice(-limit)
  });
});

// ========== WebSocket API ==========

app.get('/ws/online', (req: Request, res: Response) => {
  const nodes = wsService.getOnlineNodes();
  res.json({ success: true, data: nodes });
});

// ========== 节点发现与通信 API ==========
setupNodeDiscoveryAPI(app, clawnet, storage);

import WechatListener from './wechat-listener';

// ========== 微信消息监听器 ==========
const wechatListener = new WechatListener({
  gatewayUrl: `ws://localhost:${process.env.OPENCLAW_GATEWAY_PORT || 18789}`,
  clawnetUrl: 'ws://localhost:3000',
  clawnetToken: 'clawnet-secret-token'
});

// 自动启动微信监听器
wechatListener.start();

// 微信监听器状态 API
app.get('/wechat-listener/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: wechatListener.getStatus()
  });
});

console.log('🎧 微信消息监听器已启动');
console.log('   将自动监听已连接微信的实例消息');

// ========== 实例管理 API ==========

// 列出所有实例
app.get('/instances', async (req: Request, res: Response) => {
  try {
    const instances = await listInstances(CLAWNET_URL);
    res.json({ success: true, data: instances });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个实例
app.get('/instances/:name', async (req: Request, res: Response) => {
  try {
    const instance = await getInstance(req.params.name);
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    res.json({ success: true, data: instance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建新实例
app.post('/instances', async (req: Request, res: Response) => {
  try {
    const { name, autoInstallWeixin } = req.body;
    const result = await createInstance({ name, autoInstallWeixin });
    
    if (result.success) {
      res.json({ success: true, data: result.instance });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动实例网关
app.post('/instances/:name/start', async (req: Request, res: Response) => {
  try {
    const result = await startInstance(req.params.name);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 停止实例网关
app.post('/instances/:name/stop', async (req: Request, res: Response) => {
  try {
    const result = await stopInstance(req.params.name);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 连接实例到 ClawNet
app.post('/instances/:name/connect', async (req: Request, res: Response) => {
  try {
    const result = await connectInstance(req.params.name, CLAWNET_URL);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== 实例管理 API (新增) ==========

// 列出所有实例
app.get('/instances', async (req, res) => {
  try {
    const instances = await listInstances(CLAWNET_URL);
    res.json({ success: true, data: instances });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个实例
app.get('/instances/:name', async (req: Request, res: Response) => {
  try {
    const instance = await getInstance(req.params.name);
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    res.json({ success: true, data: instance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建新实例
app.post('/instances', async (req: Request, res: Response) => {
  try {
    const { name, autoInstallWeixin } = req.body;
    const result = await createInstance({ name, autoInstallWeixin });
    
    if (result.success) {
      res.json({ success: true, data: result.instance });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动实例网关
app.post('/instances/:name/start', async (req: Request, res: Response) => {
  try {
    const result = await startInstance(req.params.name);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 停止实例网关
app.post('/instances/:name/stop', async (req: Request, res: Response) => {
  try {
    const result = await stopInstance(req.params.name);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 连接实例到 ClawNet
app.post('/instances/:name/connect', async (req: Request, res: Response) => {
  try {
    const result = await connectInstance(req.params.name, CLAWNET_URL);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除实例
app.delete('/instances/:name', async (req: Request, res: Response) => {
  try {
    const result = await deleteInstance(req.params.name);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 微信ClawBot连接 - 执行登录命令并返回输出
app.post('/instances/:name/wechat/login', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    
    // 执行登录命令（异步，通过WebSocket推送输出）
    const { spawn } = require('child_process');
    const sessionId = `wechat-login-${instanceName}-${Date.now()}`;
    
    console.log(`[wechat-login] Starting login for instance: ${instanceName}`);
    console.log(`[wechat-login] Session ID: ${sessionId}`);
    
    res.json({
      success: true,
      data: {
        sessionId,
        message: '登录命令已启动，请通过WebSocket接收输出',
        wsChannel: `/ws/instances/${instanceName}/wechat/login`
      }
    });
    
    // 异步执行命令
    console.log(`[wechat-login] Spawning command: openclaw --profile ${instanceName} channels login --channel openclaw-weixin`);
    
    const child = spawn('openclaw', [
      '--profile', instanceName,
      'channels', 'login',
      '--channel', 'openclaw-weixin'
    ], {
      cwd: process.env.HOME || '/root',
      env: { ...process.env, TERM: 'xterm-256color' }
    });
    
    let output = '';
    
    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      console.log(`[wechat-login][stdout] ${text.trim()}`);
      
      // 通过WebSocket推送输出
      wsService.broadcast({
        type: 'wechat:login:output',
        sessionId,
        instance: instanceName,
        output: text,
        timestamp: Date.now()
      });
      
      // 检查是否包含二维码URL（匹配微信的URL格式）
      const qrUrlMatch = text.match(/https?:\/\/[^\s]+?(?:liteapp\.weixin\.qq\.com|qr|login)[^\s]*/i);
      if (qrUrlMatch) {
        console.log(`[wechat-login] QR code URL detected: ${qrUrlMatch[0]}`);
        wsService.broadcast({
          type: 'wechat:login:qrcode',
          sessionId,
          instance: instanceName,
          qrUrl: qrUrlMatch[0],
          timestamp: Date.now()
        });
      }
    });
    
    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      console.error(`[wechat-login][stderr] ${text.trim()}`);
      
      wsService.broadcast({
        type: 'wechat:login:output',
        sessionId,
        instance: instanceName,
        output: text,
        timestamp: Date.now()
      });
      
      // stderr 也可能包含二维码URL
      const qrUrlMatch = text.match(/https?:\/\/[^\s]+?(?:liteapp\.weixin\.qq\.com|qr|login)[^\s]*/i);
      if (qrUrlMatch) {
        console.log(`[wechat-login] QR code URL detected in stderr: ${qrUrlMatch[0]}`);
        wsService.broadcast({
          type: 'wechat:login:qrcode',
          sessionId,
          instance: instanceName,
          qrUrl: qrUrlMatch[0],
          timestamp: Date.now()
        });
      }
    });
    
    child.on('close', (code: number) => {
      console.log(`[wechat-login] Command completed with code: ${code}`);
      wsService.broadcast({
        type: 'wechat:login:complete',
        sessionId,
        instance: instanceName,
        code,
        output,
        timestamp: Date.now()
      });
    });
    
    child.on('error', (error: Error) => {
      console.error(`[wechat-login] Command error: ${error.message}`);
      wsService.broadcast({
        type: 'wechat:login:error',
        sessionId,
        instance: instanceName,
        error: error.message,
        timestamp: Date.now()
      });
    });
    
  } catch (error: any) {
    console.error(`[wechat-login] Exception: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 微信ClawBot连接 - 获取连接信息
app.get('/instances/:name/wechat/qrcode', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    
    // 微信登录需要使用CLI，Web端暂不支持直接扫码
    // 返回CLI命令和详细说明
    res.json({
      success: false,
      error: 'Web端暂不支持直接扫码连接',
      fallback: {
        method: 'cli',
        command: `openclaw --profile ${instanceName} channels login --channel openclaw-weixin`,
        message: '请在终端运行上述命令进行微信ClawBot连接',
        steps: [
          '1. 复制上方命令',
          '2. 在终端中粘贴并执行',
          '3. 等待二维码在终端显示',
          '4. 使用微信扫描二维码',
          '5. 按照微信提示完成连接',
          '6. 连接成功后刷新此页面查看状态'
        ],
        tips: [
          '💡 提示：微信登录是一次性操作，使用CLI更可靠',
          '💡 如果二维码显示不清晰，命令会输出二维码URL',
          '💡 可以在浏览器中打开URL查看高清二维码'
        ],
        // 新增：支持通过WebSocket执行
        websocket: {
          endpoint: '/ws/instances/:name/wechat/login',
          description: '通过WebSocket实时推送登录输出'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// ========== OpenClaw 实例配置管理 API ==========

// 获取实例的 OpenClaw 配置
app.get('/instances/:name/openclaw-config', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    const configPath = instanceName === 'derder' 
      ? '/root/.openclaw/openclaw.json'
      : `/root/.openclaw-${instanceName}/openclaw.json`;
    
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, error: '配置文件不存在' });
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // 提取关键配置
    const openclawConfig = {
      instance: instanceName,
      model: config.agents?.defaults?.model || null,
      workspace: config.agents?.defaults?.workspace || null,
      clawnet: config.clawnet || null,
      wechat: config.channels?.telegram || null,
      gateway: config.gateway || null,
      full: config  // 完整配置（用于高级用户）
    };
    
    res.json({ success: true, data: openclawConfig });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新实例的 OpenClaw 配置
app.put('/instances/:name/openclaw-config', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    const configPath = instanceName === 'derder' 
      ? '/root/.openclaw/openclaw.json'
      : `/root/.openclaw-${instanceName}/openclaw.json`;
    
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, error: '配置文件不存在' });
    }
    
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // 深度合并配置
    function deepMerge(target: any, source: any): any {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }
    
    const newConfig = deepMerge(currentConfig, req.body);
    
    // 备份原配置
    const backupPath = `${configPath}.backup-${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    
    // 写入新配置
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    
    res.json({ 
      success: true, 
      data: {
        message: '配置已更新，需要重启实例生效',
        backupPath,
        updatedFields: Object.keys(req.body)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取实例的模型配置
app.get('/instances/:name/model-config', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    const configPath = instanceName === 'derder' 
      ? '/root/.openclaw/openclaw.json'
      : `/root/.openclaw-${instanceName}/openclaw.json`;
    
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    res.json({ 
      success: true, 
      data: {
        instance: instanceName,
        model: config.agents?.defaults?.model || { primary: '未配置', fallbacks: [] },
        providers: config.models?.providers || {}
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新实例的模型配置
app.put('/instances/:name/model-config', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    const { primary, fallbacks } = req.body;
    
    const configPath = instanceName === 'derder' 
      ? '/root/.openclaw/openclaw.json'
      : `/root/.openclaw-${instanceName}/openclaw.json`;
    
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // 更新模型配置
    if (!config.agents) config.agents = {};
    if (!config.agents.defaults) config.agents.defaults = {};
    
    config.agents.defaults.model = {
      primary: primary || 'zai/glm-5',
      fallbacks: fallbacks || ['zai/glm-4.7', 'zai/glm-4.7-flash']
    };
    
    // 备份并写入
    const backupPath = `${configPath}.backup-${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.json({ 
      success: true, 
      data: {
        message: '模型配置已更新，需要重启实例生效',
        model: config.agents.defaults.model,
        backupPath
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取实例的 ClawNet 配置
app.get('/instances/:name/clawnet-config', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    const configPath = instanceName === 'derder' 
      ? '/root/.openclaw/openclaw.json'
      : `/root/.openclaw-${instanceName}/openclaw.json`;
    
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    res.json({ 
      success: true, 
      data: {
        instance: instanceName,
        clawnet: config.clawnet || { enabled: false, forwardWechat: false }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新实例的 ClawNet 配置
app.put('/instances/:name/clawnet-config', async (req: Request, res: Response) => {
  try {
    const instanceName = req.params.name;
    const { forwardWechat, endpoint } = req.body;
    
    const configPath = instanceName === 'derder' 
      ? '/root/.openclaw/openclaw.json'
      : `/root/.openclaw-${instanceName}/openclaw.json`;
    
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // 更新 ClawNet 配置
    config.clawnet = {
      forwardWechat: forwardWechat !== undefined ? forwardWechat : true,
      endpoint: endpoint || 'http://localhost:19100/message'
    };
    
    // 备份并写入
    const backupPath = `${configPath}.backup-${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.json({ 
      success: true, 
      data: {
        message: 'ClawNet 配置已更新，需要重启实例生效',
        clawnet: config.clawnet,
        backupPath
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== 工具 API ==========

app.post('/tokens', (req: Request, res: Response) => {
  const token = generateToken();
  res.json({ 
    success: true, 
    data: { 
      token,
      usage: 'Authorization: Bearer <token> or ?token=<token>'
    } 
  });
});

// ========== 健康检查（无需认证） ==========

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    features: {
      rest: true,
      websocket: true,
      auth: true,
      wechat: wechatAdapter !== null
    },
    stats: {
      nodes: clawnet.getAllNodes().length,
      relations: clawnet.getAllRelations().length,
      wsConnections: wsService.getOnlineNodes().length
    }
  });
});

// ========== 启动服务器 ==========

server.listen(PORT, HOST, () => {
  console.log(`🚀 ClawNet API running on http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket: ws://${HOST}:${PORT}?nodeId=<nodeId>&token=<token>`);
  console.log(`📖 Health: http://${HOST}:${PORT}/health`);
  console.log(`🔑 Token: POST /tokens to get a token`);
  console.log(`⚡ Port: ${PORT} (configured via PORT env var)`);
  
  if (wechatAdapter) {
    console.log(`💬 WeChat: http://${HOST}:${PORT}/wechat/mp/message`);
  }
  
  // 提示如果端口是80
  if (PORT === 80) {
    console.log(`✅ 监听80端口，可以直接用于微信公众号`);
  }
  
  // 提示如果端口不是80/443
  if (PORT !== 80 && PORT !== 443) {
    console.log(`⚠️  注意：微信公众号只支持80和443端口`);
    console.log(`   当前端口：${PORT}`);
    console.log(`   建议：使用Nginx反向代理或设置 PORT=80`);
  }
});

export { app, wsService };
