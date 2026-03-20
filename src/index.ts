/**
 * ClawNet - 多节点关系网络
 * 核心入口
 * 
 * 遵循关系宪章：平等、自愿、最小权限、可撤销、透明、隐私
 */

import {
  Node,
  Relation,
  Event,
  RouteResult,
  RelationType,
  Permission,
  ClawNetAPI
} from './types';
import { RelationGraph } from './graph';
import { PermissionSystem } from './permission';
import { Router, EventHandler } from './router';
import { RelationRequestManager, RelationRequest, AuditLog, AuditAction } from './relation-request';

export class ClawNet implements ClawNetAPI {
  private graph: RelationGraph;
  private permission: PermissionSystem;
  private router: Router;
  private requestManager: RelationRequestManager;

  constructor() {
    this.graph = new RelationGraph();
    this.permission = new PermissionSystem(this.graph);
    this.router = new Router(this.graph, this.permission);
    this.requestManager = new RelationRequestManager();
  }

  // ========== 节点管理 ==========

  addNode(node: Omit<Node, 'createdAt'>): Node {
    return this.graph.addNode(node);
  }

  getNode(id: string): Node | undefined {
    return this.graph.getNode(id);
  }

  removeNode(id: string): void {
    this.graph.removeNode(id);
  }

  updateNode(id: string, updates: Partial<Node>): Node {
    return this.graph.updateNode(id, updates);
  }

  // ========== 关系管理 ==========

  addRelation(
    from: string,
    to: string,
    type: RelationType,
    permissions: Permission[],
    options?: {
      expiresAt?: number;
      ttl?: number;
      isTemporary?: boolean;
    }
  ): Relation {
    return this.graph.addRelation(from, to, type, permissions, options);
  }

  getRelations(nodeId: string): Relation[] {
    return this.graph.getRelations(nodeId);
  }

  getValidRelations(nodeId: string): Relation[] {
    return this.graph.getValidRelations(nodeId);
  }

  removeRelation(id: string): void {
    this.graph.removeRelation(id);
  }

  // ========== 临时关系管理 ==========

  // 检查关系是否有效
  isRelationValid(relationId: string): boolean {
    const relation = this.graph.getAllRelations().find(r => r.id === relationId);
    return relation ? this.graph.isRelationValid(relation) : false;
  }

  // 清理过期关系
  cleanupExpiredRelations(): { cleaned: number; expiredRelations: Relation[] } {
    const result = this.graph.cleanupExpiredRelations();
    
    // 记录审计日志
    result.expiredRelations.forEach(relation => {
      this.requestManager.addAuditLog({
        action: 'relation_update',
        actor: 'system',
        target: relation.to,
        relationId: relation.id,
        details: {
          reason: 'expired',
          relationType: relation.type,
          permissions: relation.permissions
        },
        metadata: {}
      });
    });

    return result;
  }

  // 获取即将过期的关系
  getExpiringRelations(withinMs: number): Relation[] {
    return this.graph.getExpiringRelations(withinMs);
  }

  // 延长关系有效期
  extendRelation(relationId: string, additionalTtl: number): Relation {
    const relation = this.graph.extendRelation(relationId, additionalTtl);
    
    // 记录审计日志
    this.requestManager.addAuditLog({
      action: 'relation_update',
      actor: relation.from,
      target: relation.to,
      relationId: relation.id,
      details: {
        reason: 'extended',
        additionalTtl,
        newExpiresAt: relation.expiresAt
      },
      metadata: {}
    });

    return relation;
  }

  // 获取所有有效关系
  getAllValidRelations(): Relation[] {
    return this.graph.getAllRelations().filter(r => this.graph.isRelationValid(r));
  }

  // ========== 路由 ==========

  route(event: Omit<Event, 'id' | 'timestamp'>): Promise<RouteResult> {
    return this.router.route(event);
  }

  // ========== 权限 ==========

  checkPermission(
    node: string,
    target: string,
    action: Permission
  ): boolean {
    return this.permission.checkPermission(node, target, action);
  }

  // ========== 扩展 API ==========

  // 注册事件处理器
  registerHandler(nodeId: string, handler: EventHandler): void {
    this.router.registerHandler(nodeId, handler);
  }

  // 获取所有节点
  getAllNodes(): Node[] {
    return this.graph.getAllNodes();
  }

  // 获取所有关系
  getAllRelations(): Relation[] {
    return this.graph.getAllRelations();
  }

  // 获取权限系统
  getPermissionSystem(): PermissionSystem {
    return this.permission;
  }

  // 获取路由器
  getRouter(): Router {
    return this.router;
  }

  // ========== 关系请求管理（遵循关系宪章） ==========

  // 发起关系请求
  requestRelation(
    from: string,
    to: string,
    type: RelationType,
    permissions: Permission[],
    message?: string
  ): RelationRequest {
    // 检查节点是否存在
    if (!this.graph.getNode(from)) {
      throw new Error(`Node ${from} not found`);
    }
    if (!this.graph.getNode(to)) {
      throw new Error(`Node ${to} not found`);
    }

    // 创建请求（需要目标节点确认）
    return this.requestManager.createRequest(from, to, type, permissions, message);
  }

  // 获取待处理的请求
  getPendingRequests(nodeId: string): RelationRequest[] {
    return this.requestManager.getPendingRequests(nodeId);
  }

  // 获取发出的请求
  getSentRequests(nodeId: string): RelationRequest[] {
    return this.requestManager.getSentRequests(nodeId);
  }

  // 接受关系请求
  acceptRelationRequest(
    requestId: string,
    grantedPermissions?: Permission[],
    response?: string
  ): Relation {
    const request = this.requestManager.acceptRequest(requestId, grantedPermissions, response);
    
    // 创建关系
    const relation = this.graph.addRelation(
      request.from,
      request.to,
      request.type,
      request.grantedPermissions || request.requestedPermissions
    );

    // 记录审计日志
    this.requestManager.addAuditLog({
      action: 'relation_create',
      actor: request.to,
      target: request.from,
      relationId: relation.id,
      requestId: request.id,
      details: {
        relationType: request.type,
        permissions: request.grantedPermissions,
        message: response
      },
      metadata: {}
    });

    return relation;
  }

  // 拒绝关系请求
  rejectRelationRequest(requestId: string, reason?: string): void {
    this.requestManager.rejectRequest(requestId, reason);
  }

  // 取消关系请求
  cancelRelationRequest(requestId: string, reason?: string): void {
    this.requestManager.cancelRequest(requestId, reason);
  }

  // 撤销关系（可撤销原则）
  revokeRelation(relationId: string, reason?: string): void {
    const relation = this.graph.getAllRelations().find(r => r.id === relationId);
    if (!relation) {
      throw new Error(`Relation ${relationId} not found`);
    }

    // 记录审计日志
    this.requestManager.addAuditLog({
      action: 'relation_revoke',
      actor: relation.from,
      target: relation.to,
      relationId: relation.id,
      details: {
        relationType: relation.type,
        permissions: relation.permissions,
        reason
      },
      metadata: {}
    });

    // 删除关系
    this.graph.removeRelation(relationId);
  }

  // 获取审计日志
  getAuditLogs(filters?: {
    actor?: string;
    target?: string;
    action?: string;
    since?: number;
    limit?: number;
  }): AuditLog[] {
    return this.requestManager.getAuditLogs(filters as any);
  }

  // 获取请求统计
  getRequestStats() {
    return this.requestManager.getStats();
  }

  // 清理过期请求
  cleanupExpiredRequests(): number {
    return this.requestManager.cleanupExpired();
  }
}

// 导出类型
export * from './types';
export { RelationGraph } from './graph';
export { PermissionSystem } from './permission';
export { Router } from './router';
export {
  RelationRequestManager,
  RelationRequest,
  RelationRequestStatus,
  AuditLog,
  AuditAction
} from './relation-request';
