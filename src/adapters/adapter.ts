/**
 * ClawNet 平台适配器接口
 * 所有平台适配器都需要实现这个接口
 */

export interface PlatformMessage {
  id: string;              // 消息唯一ID
  fromUserId: string;      // 发送者平台ID
  toUserId: string;        // 接收者平台ID
  type: 'text' | 'image' | 'voice' | 'video' | 'file';
  content: string;         // 消息内容
  timestamp: number;       // 时间戳
  metadata?: any;          // 额外元数据
}

export interface PlatformReply {
  type: 'text' | 'image' | 'voice' | 'video' | 'file';
  content: string;
  metadata?: any;
}

export interface IPlatformAdapter {
  // 平台名称
  readonly platform: string;
  
  // 初始化适配器
  initialize(): Promise<void>;
  
  // 解析平台消息
  parseMessage(rawData: any): Promise<PlatformMessage>;
  
  // 发送回复
  sendReply(userId: string, reply: PlatformReply): Promise<void>;
  
  // 验证消息来源（安全）
  verifySignature(data: any, signature: string): boolean;
}
