/**
 * 微信消息接收（POST 请求）
 * 注意：微信接口必须放在认证中间件之前
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ClawNet } from './index';
import { Storage } from './storage';
import { RelationType, Permission } from './types';
import { WebSocketService } from './websocket';
import { authMiddleware, generateToken } from './auth';
import { WeChatAdapter, WeChatConfig } from './adapters/wechat-adapter';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

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

// ========== 微信接口（必须在认证中间件之前！） ==========

let wechatAdapter: WeChatAdapter | null = null;

// 初始化微信适配器
const wechatConfig: WeChatConfig = {
  appId: process.env.WECHAT_APPID || '',
  appSecret: process.env.WECHAT_APPSECRET || '',
  token: process.env.WECHAT_TOKEN || 'clawnet',
  encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY
};

if (wechatConfig.appId && wechatConfig.appSecret) {
  wechatAdapter = new WeChatAdapter(wechatConfig, clawnet);
  wechatAdapter.initialize().catch(err => {
    console.error('❌ 微信适配器初始化失败:', err);
  });
}

// 微信服务器验证（GET 请求）- 无需认证
app.get('/wechat/mp/message', (req: Request, res: Response) => {
  if (!wechatAdapter) {
    return res.status(503).send('微信适配器未配置');
  }
  
  const { signature, timestamp, nonce, echostr } = req.query;
  
  // 验证签名
  if (wechatAdapter.verifySignature(
    { signature, timestamp, nonce, echostr },
    signature as string
  )) {
    console.log('✅ 微信验证成功');
    res.send(echostr);
  } else {
    console.log('❌ 微信验证失败');
    res.status(403).send('验证失败');
  }
});

// 微信消息接收（POST 请求）- 无需认证
app.post('/wechat/mp/message', async (req: Request, res: Response) => {
  if (!wechatAdapter) {
    return res.status(503).send('微信适配器未配置');
  }
  
  try {
    const xmlData = req.body;
    console.log('📩 收到微信消息');
    const reply = await wechatAdapter.handleMessage(xmlData);
    res.set('Content-Type', 'application/xml');
    res.send(reply);
  } catch (error: any) {
    console.error('❌ 处理微信消息失败:', error);
    res.status(500).send('处理失败');
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

// ========== 其他 API（需要认证） ==========

// 省略其他路由...
