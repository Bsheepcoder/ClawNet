/**
 * 路由引擎模块
 * 基于关系的智能路由
 */

import { Event, RouteResult, Permission } from './types';
import { RelationGraph } from './graph';
import { PermissionSystem } from './permission';

export type EventHandler = (event: Event) => Promise<void>;

export class Router {
  private handlers: Map<string, EventHandler> = new Map();

  constructor(
    private graph: RelationGraph,
    private permission: PermissionSystem
  ) {}

  // 注册事件处理器
  registerHandler(nodeId: string, handler: EventHandler): void {
    this.handlers.set(nodeId, handler);
  }

  // 注销事件处理器
  unregisterHandler(nodeId: string): void {
    this.handlers.delete(nodeId);
  }

  // 路由事件
  async route(event: Omit<Event, 'id' | 'timestamp'>): Promise<RouteResult> {
    const fullEvent: Event = {
      ...event,
      id: `${event.from}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // 找到所有有 read 权限的目标节点
    const targets = this.permission.getAuthorizedTargets(
      event.from,
      'read'
    );

    const delivered: string[] = [];
    const failed: string[] = [];

    // 投递到每个目标
    for (const targetId of targets) {
      const handler = this.handlers.get(targetId);
      
      if (handler) {
        try {
          await handler(fullEvent);
          delivered.push(targetId);
        } catch (error) {
          console.error(`Failed to deliver to ${targetId}:`, error);
          failed.push(targetId);
        }
      }
    }

    return {
      eventId: fullEvent.id,
      targets,
      delivered,
      failed
    };
  }

  // 定向路由（只路由到指定节点）
  async routeTo(
    event: Omit<Event, 'id' | 'timestamp'>,
    targetId: string
  ): Promise<boolean> {
    // 检查权限
    if (!this.permission.checkPermission(event.from, targetId, 'read')) {
      return false;
    }

    const fullEvent: Event = {
      ...event,
      id: `${event.from}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    const handler = this.handlers.get(targetId);
    if (handler) {
      try {
        await handler(fullEvent);
        return true;
      } catch (error) {
        console.error(`Failed to deliver to ${targetId}:`, error);
        return false;
      }
    }

    return false;
  }
}
