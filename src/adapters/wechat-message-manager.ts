/**
 * 微信消息去重和历史记录管理
 */

export interface MessageRecord {
  msgId: string;
  fromUser: string;
  createTime: number;
  content: string;
  type: string;
  processedAt: number;
}

export class WeChatMessageManager {
  private processedMessages: Map<string, number> = new Map();
  private messageHistory: MessageRecord[] = [];
  private config: {
    deduplication: boolean;
    deduplicationTTL: number;
    saveHistory: boolean;
    historyLimit: number;
  };
  
  constructor(config?: {
    deduplication?: boolean;
    deduplicationTTL?: number;
    saveHistory?: boolean;
    historyLimit?: number;
  }) {
    this.config = {
      deduplication: config?.deduplication ?? true,
      deduplicationTTL: config?.deduplicationTTL ?? 300, // 5分钟
      saveHistory: config?.saveHistory ?? true,
      historyLimit: config?.historyLimit ?? 100
    };
    
    // 定期清理过期的去重记录
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }
  
  /**
   * 检查消息是否已处理
   */
  isDuplicate(msgId: string, fromUser: string, createTime: number): boolean {
    if (!this.config.deduplication) {
      return false;
    }
    
    // 使用 msgId 作为唯一标识（推荐）
    const key = msgId || `${fromUser}-${createTime}`;
    const processedAt = this.processedMessages.get(key);
    
    if (processedAt) {
      const elapsed = Date.now() - processedAt;
      if (elapsed < this.config.deduplicationTTL * 1000) {
        return true; // 重复消息
      }
    }
    
    return false;
  }
  
  /**
   * 标记消息为已处理
   */
  markProcessed(msgId: string, fromUser: string, createTime: number): void {
    const key = msgId || `${fromUser}-${createTime}`;
    this.processedMessages.set(key, Date.now());
  }
  
  /**
   * 保存消息历史
   */
  saveHistory(record: MessageRecord): void {
    if (!this.config.saveHistory) {
      return;
    }
    
    this.messageHistory.push(record);
    
    // 限制历史记录数量
    if (this.messageHistory.length > this.config.historyLimit) {
      this.messageHistory.shift();
    }
  }
  
  /**
   * 获取消息历史
   */
  getHistory(limit?: number): MessageRecord[] {
    if (limit) {
      return this.messageHistory.slice(-limit);
    }
    return [...this.messageHistory];
  }
  
  /**
   * 清理过期的去重记录
   */
  private cleanup(): void {
    const now = Date.now();
    const ttl = this.config.deduplicationTTL * 1000;
    
    for (const [key, processedAt] of this.processedMessages.entries()) {
      if (now - processedAt > ttl) {
        this.processedMessages.delete(key);
      }
    }
  }
}
