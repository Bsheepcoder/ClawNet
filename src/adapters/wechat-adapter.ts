/**
 * 微信公众号适配器
 * 将微信消息转换为 ClawNet 消息格式
 */

import { IPlatformAdapter, PlatformMessage, PlatformReply } from './adapter';
import { ClawNet } from '../index';
import { WeChatReplyConfig, WeChatNodeConfig } from '../types';
import { WeChatMessageManager, MessageRecord } from './wechat-message-manager';
import * as crypto from 'crypto';

export interface WeChatConfig {
  appId: string;
  appSecret: string;
  token: string;
  encodingAESKey?: string;
}

// 从环境变量读取配置
export function getWeChatConfig(): WeChatConfig {
  return {
    appId: process.env.WECHAT_APPID || '',
    appSecret: process.env.WECHAT_APPSECRET || '',
    token: process.env.WECHAT_TOKEN || 'clawnet',
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY
  };
}

export interface WeChatTextMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'text';
  Content: string;
  MsgId: number;
}

export interface WeChatEventMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'event';
  Event: 'subscribe' | 'unsubscribe' | 'CLICK' | 'VIEW';
  EventKey?: string;
}

export type WeChatMessage = WeChatTextMessage | WeChatEventMessage;

export class WeChatAdapter implements IPlatformAdapter {
  readonly platform = 'wechat';
  
  private config: WeChatConfig;
  private clawnet: ClawNet;
  private appId: string;
  private messageManager: WeChatMessageManager;
  
  constructor(config: WeChatConfig, clawnet: ClawNet) {
    this.config = config;
    this.clawnet = clawnet;
    this.appId = config.appId;
    this.messageManager = new WeChatMessageManager({
      deduplication: true,
      deduplicationTTL: 300,
      saveHistory: true,
      historyLimit: 100
    });
  }
  
  /**
   * 获取消息历史
   */
  getMessageHistory(limit?: number): import('./wechat-message-manager').MessageRecord[] {
    return this.messageManager.getHistory(limit);
  }
  
  async initialize(): Promise<void> {
    // 验证配置
    if (!this.config.appId || !this.config.appSecret || !this.config.token) {
      throw new Error('微信配置不完整');
    }
    
    console.log(`✅ 微信适配器初始化成功 (AppID: ${this.appId})`);
  }
  
  /**
   * 处理微信消息
   */
  async handleMessage(xmlData: string): Promise<string> {
    const startTime = Date.now();
    const TIMEOUT = 4500; // 4.5秒超时（留0.5秒余量）
    
    // ========== 1. 存储原始XML ==========
    const fs = require('fs');
    const messageLogFile = '/root/.openclaw/workspace/clawnet-mvp/wechat-messages.json';
    const timestamp = new Date().toISOString();
    
    // 读取现有消息
    let messageLog: any = { messages: [], lastUpdated: null };
    try {
      const data = fs.readFileSync(messageLogFile, 'utf-8');
      messageLog = JSON.parse(data);
    } catch (e) {
      // 文件不存在，使用默认值
    }
    
    // 添加新消息
    const newMessage: any = {
      timestamp,
      rawXML: xmlData,
      processed: false,
      response: null
    };
    messageLog.messages.push(newMessage);
    messageLog.lastUpdated = timestamp;
    
    // 限制保存最近100条
    if (messageLog.messages.length > 100) {
      messageLog.messages = messageLog.messages.slice(-100);
    }
    
    // 保存
    fs.writeFileSync(messageLogFile, JSON.stringify(messageLog, null, 2));
    
    try {
      // 2. 解析 XML
      const message = this.parseXML(xmlData);
      
      // 3. 转换为平台消息
      const platformMsg = await this.parseMessage(message);
      
      // 4. 消息去重检查
      const msgId = (message as any).MsgId?.toString()?.trim() || '';
      const createTime = platformMsg.timestamp || Date.now();
      
      if (this.messageManager.isDuplicate(msgId, platformMsg.fromUserId, createTime)) {
        console.log('⚠️  重复消息，跳过处理，返回success');
        return 'success'; // 返回success，避免微信重试
      }
      
      // 标记为已处理
      this.messageManager.markProcessed(msgId, platformMsg.fromUserId, createTime);
      
      // 记录完整消息内容
      console.log('=== 收到微信消息 ===');
      console.log('用户OpenID:', platformMsg.fromUserId);
      console.log('消息类型:', platformMsg.type);
      console.log('消息内容:', platformMsg.content);
      console.log('MsgId:', msgId || '无');
      console.log('CreateTime:', createTime);
      console.log('发送时间:', new Date(createTime * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      console.log('==================');
      
      // 5. 保存消息历史
      const messageRecord: MessageRecord = {
        msgId,
        fromUser: platformMsg.fromUserId,
        createTime,
        content: platformMsg.content,
        type: platformMsg.type,
        processedAt: Date.now()
      };
      this.messageManager.saveHistory(messageRecord);
      
      // 6. 检查超时
      if (Date.now() - startTime > TIMEOUT) {
        console.warn('⚠️  处理超时，返回success');
        return 'success';
      }
      
      // 7. 映射为 ClawNet 节点
      const userId = `wechat-${platformMsg.fromUserId}`;
      
      // 创建或获取用户节点
      try {
        this.clawnet.addNode({
          id: userId,
          type: 'human',
          name: `微信用户-${platformMsg.fromUserId.slice(-8)}`
        });
      } catch (error: any) {
        // 节点可能已存在，忽略
      }
      
      // 8. 获取公众号节点配置
      const mpNodeId = `wechat-mp-${this.appId}`;
      const mpNode = this.clawnet.getNode(mpNodeId);
      const nodeConfig: WeChatNodeConfig = mpNode?.config?.wechat || {};
      const config = nodeConfig.reply;
      
      console.log('📋 公众节点ID:', mpNodeId);
      console.log('📋 节点存在:', !!mpNode);
      console.log('📋 节点config:', JSON.stringify(mpNode?.config));
      console.log('📋 reply配置:', JSON.stringify(config));
      
      // 9. 根据配置生成回复
      let reply: PlatformReply;
      
      // 检查是否使用Bot回复
      const configAny = config as any;
      if (configAny?.defaultType === 'bot' && configAny?.bot?.nodeId) {
        console.log('🤖 使用Bot回复模式');
        reply = await this.generateBotReply(platformMsg, configAny.bot.nodeId);
      } else {
        reply = await Promise.race([
          this.generateReply(platformMsg, config),
          new Promise<PlatformReply>((_, reject) => 
            setTimeout(() => reject(new Error('回复生成超时')), TIMEOUT - (Date.now() - startTime))
          )
        ]);
      }
      
      console.log('📤 回复类型:', reply.type);
      console.log('📤 回复内容:', reply.content.substring(0, 100));
      console.log('⏱️  处理耗时:', Date.now() - startTime, 'ms');
      
      // 10. 更新消息记录
      newMessage.processed = true;
      newMessage.response = reply.content;
      fs.writeFileSync(messageLogFile, JSON.stringify(messageLog, null, 2));
      
      // 11. 返回XML格式回复
      return this.formatReply(platformMsg.fromUserId, reply);
      
    } catch (error: any) {
      console.error('❌ 处理微信消息失败:', error.message);
      console.error('⏱️  失败耗时:', Date.now() - startTime, 'ms');
      
      // 更新错误信息
      newMessage.processed = false;
      newMessage.response = `Error: ${error.message}`;
      fs.writeFileSync(messageLogFile, JSON.stringify(messageLog, null, 2));
      
      // 超时或错误时返回success，让微信不重试
      return 'success';
    }
  }
  
  /**
   * 根据配置生成回复
   */
  private async generateReply(
    message: PlatformMessage,
    config?: WeChatReplyConfig
  ): Promise<PlatformReply> {
    // 没有配置，返回默认回复
    if (!config) {
      console.log('⚠️  没有配置，使用默认回复');
      return {
        type: 'text',
        content: '收到消息'
      };
    }
    
    console.log('📋 配置存在:', JSON.stringify(config));
    
    // 如果有text配置且没有defaultType，默认使用text
    const replyType = config.defaultType || (config.text ? 'text' : undefined);
    console.log('📋 回复类型:', replyType);
    
    // 根据回复类型生成
    switch (replyType) {
      case 'text':
        return this.generateTextReply(message, config.text);
      case 'news':
        return this.generateNewsReply(config.news);
      case 'ai':
        return this.generateAIReply();
      case 'none':
        return { type: 'text', content: 'success' };
      default:
        console.log('⚠️  未知类型，使用默认回复');
        return { type: 'text', content: '收到消息' };
    }
  }
  
  /**
   * 生成Bot回复（简化版 - 直接回复）
   */
  private async generateBotReply(message: PlatformMessage, botNodeId: string): Promise<PlatformReply> {
    try {
      console.log('🤖 Bot回复模式 - 委托给:', botNodeId);
      
      // 简化：直接返回固定回复
      // TODO: 后续通过ClawNet路由到Bot节点进行AI处理
      return {
        type: 'text',
        content: `【Bot(${botNodeId})】收到您的消息："${message.content}"，我正在学习中...`
      };
    } catch (error: any) {
      console.error('❌ Bot回复失败:', error.message);
      return {
        type: 'text',
        content: '感谢您的消息！Bot暂时离线。'
      };
    }
  }
  
  /**
   * 生成文本回复
   */
  private generateTextReply(
    message: PlatformMessage,
    textConfig?: { content: string; keywords?: Record<string, string> }
  ): PlatformReply {
    if (!textConfig) {
      return { type: 'text', content: '收到消息' };
    }
    
    // 检查关键词匹配
    if (textConfig.keywords) {
      const content = message.content.toLowerCase();
      for (const [keyword, reply] of Object.entries(textConfig.keywords)) {
        if (content.includes(keyword)) {
          return {
            type: 'text',
            content: this.replaceVariables(reply, message)
          };
        }
      }
    }
    
    // 返回默认内容
    return {
      type: 'text',
      content: this.replaceVariables(textConfig.content, message)
    };
  }
  
  /**
   * 生成图文回复
   */
  private generateNewsReply(
    newsConfig?: { articles: any[] }
  ): PlatformReply {
    if (!newsConfig || !newsConfig.articles || newsConfig.articles.length === 0) {
      return { type: 'text', content: '暂无图文消息' };
    }
    
    // 微信图文消息需要特殊XML格式，这里返回JSON字符串
    // 实际XML格式化在formatReply中处理
    return {
      type: 'text' as any,
      content: JSON.stringify({
        msgType: 'news',
        articles: newsConfig.articles
      })
    };
  }
  
  /**
   * 生成AI回复
   */
  private generateAIReply(): PlatformReply {
    // 转接AI需要返回特定XML
    return {
      type: 'text' as any,
      content: 'transfer_biz_ai_ivr'
    };
  }
  
  /**
   * 替换变量
   */
  private replaceVariables(text: string, message: PlatformMessage): string {
    const now = new Date();
    return text
      .replace(/\{\{openid\}\}/g, message.fromUserId)
      .replace(/\{\{time\}\}/g, now.toTimeString().split(' ')[0])
      .replace(/\{\{date\}\}/g, now.toISOString().split('T')[0])
      .replace(/\{\{datetime\}\}/g, now.toISOString());
  }
  
  /**
   * 解析平台消息
   */
  async parseMessage(rawData: WeChatMessage): Promise<PlatformMessage> {
    const msg: PlatformMessage = {
      id: (rawData as any).MsgId?.toString() || `${Date.now()}`,
      fromUserId: rawData.FromUserName,
      toUserId: rawData.ToUserName,
      type: rawData.MsgType === 'text' ? 'text' : 'text',
      content: (rawData as WeChatTextMessage).Content || '',
      timestamp: rawData.CreateTime * 1000,
      metadata: {
        platform: 'wechat',
        msgType: rawData.MsgType,
        event: (rawData as WeChatEventMessage).Event
      }
    };
    
    return msg;
  }
  
  /**
   * 发送回复
   */
  async sendReply(userId: string, reply: PlatformReply): Promise<void> {
    // 使用客服消息接口发送
    // 这里需要获取 access_token
    const accessToken = await this.getAccessToken();
    
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    
    const data = {
      touser: userId,
      msgtype: reply.type,
      text: {
        content: reply.content
      }
    };
    
    // 发送 HTTP 请求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json() as any;
    
    if (result.errcode !== 0) {
      throw new Error(`发送微信消息失败: ${result.errmsg}`);
    }
  }
  
  /**
   * 验证消息签名
   */
  verifySignature(data: any, signature: string): boolean {
    const { signature: sig, timestamp, nonce, echostr } = data;
    
    // 排序并拼接
    const arr = [this.config.token, timestamp, nonce].sort();
    const str = arr.join('');
    
    // SHA1 加密
    const hash = crypto.createHash('sha1').update(str).digest('hex');
    
    return hash === signature;
  }
  
  /**
   * 格式化回复消息
   */
  private formatReply(toUser: string, reply: PlatformReply): string {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // ✅ 关键修复：FromUserName必须使用公众号原始ID（gh_开头），不是AppID
    const ghId = 'gh_dc46038d7a40';  // 公众号原始ID
    
    if (reply.type === 'text') {
      const xml = `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${ghId}]]></FromUserName>
  <CreateTime>${timestamp}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${reply.content}]]></Content>
</xml>`;
      
      console.log('📤 最终返回的XML:');
      console.log(xml);
      
      return xml;
    }
    
    // 其他类型暂时返回文本
    return this.formatReply(toUser, { type: 'text', content: '暂不支持此类型消息' });
  }
  
  /**
   * 解析 XML
   */
  private parseXML(xmlString: string): WeChatMessage {
    // 处理JSON.stringify导致的转义
    let cleanXML = xmlString;
    if (cleanXML.startsWith('"') && cleanXML.endsWith('"')) {
      try {
        cleanXML = JSON.parse(cleanXML);
        console.log('🔧 XML已反转义');
      } catch (e) {
        console.log('⚠️  JSON.parse失败');
      }
    }
    
    // 简单的 XML 解析（生产环境应使用专业库）
    const extract = (tag: string): string => {
      const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's');
      const match = cleanXML.match(regex);
      if (match) return match[1];
      
      // 尝试非CDATA格式
      const regex2 = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
      const match2 = cleanXML.match(regex2);
      return match2 ? match2[1] : '';
    };
    
    const msgType = extract('MsgType');
    console.log('📝 消息类型:', msgType);
    
    if (msgType === 'text') {
      const msgIdStr = extract('MsgId');
      const createTimeStr = extract('CreateTime');
      console.log('📝 MsgId字符串:', msgIdStr);
      console.log('📝 CreateTime字符串:', createTimeStr);
      
      return {
        ToUserName: extract('ToUserName'),
        FromUserName: extract('FromUserName'),
        CreateTime: parseInt(createTimeStr) || 0,
        MsgType: 'text',
        Content: extract('Content'),
        MsgId: parseInt(msgIdStr) || 0
      };
    } else if (msgType === 'event') {
      return {
        ToUserName: extract('ToUserName'),
        FromUserName: extract('FromUserName'),
        CreateTime: parseInt(extract('CreateTime')) || 0,
        MsgType: 'event',
        Event: extract('Event') as any,
        EventKey: extract('EventKey')
      };
    }
    
    throw new Error(`不支持的消息类型: ${msgType}`);
  }
  
  /**
   * 获取微信 access_token
   */
  private async getAccessToken(): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`;
    
    const response = await fetch(url);
    const result = await response.json() as any;
    
    if (result.errcode) {
      throw new Error(`获取 access_token 失败: ${result.errmsg}`);
    }
    
    return result.access_token;
  }
}
