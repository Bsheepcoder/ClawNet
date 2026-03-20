/**
 * WebSocket 服务
 * 实时事件推送
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { Event } from './types';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map(); // nodeId -> WebSocket connections

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // 从 URL 获取 nodeId
      const url = new URL(req.url || '', `http://localhost`);
      const nodeId = url.searchParams.get('nodeId');
      const token = url.searchParams.get('token');

      // TODO: 验证 token

      if (!nodeId) {
        ws.close(1008, 'nodeId required');
        return;
      }

      // 注册连接
      if (!this.clients.has(nodeId)) {
        this.clients.set(nodeId, new Set());
      }
      this.clients.get(nodeId)!.add(ws);

      console.log(`📡 WebSocket connected: ${nodeId}`);

      // 发送确认
      ws.send(JSON.stringify({
        type: 'connected',
        nodeId,
        timestamp: Date.now()
      }));

      // 处理消息
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(nodeId, message, ws);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      // 处理断开
      ws.on('close', () => {
        const connections = this.clients.get(nodeId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            this.clients.delete(nodeId);
          }
        }
        console.log(`📡 WebSocket disconnected: ${nodeId}`);
      });
    });
  }

  private handleMessage(nodeId: string, message: any, ws: WebSocket) {
    // 处理客户端发来的消息
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      
      default:
        console.log(`📨 WebSocket message from ${nodeId}:`, message);
    }
  }

  // 推送事件给节点
  sendToNode(nodeId: string, event: Event): boolean {
    const connections = this.clients.get(nodeId);
    if (!connections || connections.size === 0) {
      return false;
    }

    const message = JSON.stringify({
      type: 'event',
      data: event
    });

    let sent = false;
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent = true;
      }
    });

    return sent;
  }

  // 推送事件给多个节点
  sendToNodes(nodeIds: string[], event: Event): string[] {
    const sentTo: string[] = [];
    nodeIds.forEach(nodeId => {
      if (this.sendToNode(nodeId, event)) {
        sentTo.push(nodeId);
      }
    });
    return sentTo;
  }

  // 获取在线节点
  getOnlineNodes(): string[] {
    return Array.from(this.clients.keys());
  }

  // 关闭服务
  close() {
    this.wss.close();
  }
}
