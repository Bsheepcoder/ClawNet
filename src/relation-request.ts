/**
 * 关系请求模块
 * 实现关系宪章：自愿原则、透明原则
 */

import { RelationType, Permission } from './types';

// 关系请求状态
export type RelationRequestStatus = 
  | 'pending'    // 待确认
  | 'accepted'   // 已接受
  | 'rejected'   // 已拒绝
  | 'expired'    // 已过期
  | 'cancelled'; // 已取消

// 关系请求
export interface RelationRequest {
  id: string;
  from: string;           // 发起节点
  to: string;             // 目标节点
  type: RelationType;
  requestedPermissions: Permission[];  // 请求的权限
  grantedPermissions?: Permission[];   // 实际授予的权限（可能少于请求的）
  status: RelationRequestStatus;
  message?: string;       // 请求说明
  response?: string;      // 响应说明
  createdAt: number;
  expiresAt?: number;     // 过期时间
  respondedAt?: number;   // 响应时间
  respondedBy?: string;   // 响应者（通常是目标节点）
}

// 审计日志动作类型
export type AuditAction =
  | 'relation_request'
  | 'relation_accept'
  | 'relation_reject'
  | 'relation_cancel'
  | 'relation_revoke'
  | 'relation_create'
  | 'relation_update';

// 审计日志
export interface AuditLog {
  id: string;
  timestamp: number;
  action: AuditAction;
  actor: string;          // 执行者
  target?: string;        // 目标节点
  relationId?: string;    // 相关关系ID
  requestId?: string;     // 相关请求ID
  details: {
    relationType?: RelationType;
    permissions?: Permission[];
    reason?: string;
    message?: string;
    [key: string]: any;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

// 关系请求管理器
export class RelationRequestManager {
  private requests: Map<string, RelationRequest> = new Map();
  private nodeRequests: Map<string, Set<string>> = new Map(); // 节点 -> 请求ID集合
  private auditLogs: AuditLog[] = [];
  private requestTTL: number = 7 * 24 * 60 * 60 * 1000; // 7天过期

  // 创建关系请求
  createRequest(
    from: string,
    to: string,
    type: RelationType,
    permissions: Permission[],
    message?: string
  ): RelationRequest {
    const id = `req-${from}-${to}-${Date.now()}`;
    const request: RelationRequest = {
      id,
      from,
      to,
      type,
      requestedPermissions: permissions,
      status: 'pending',
      message,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.requestTTL
    };

    this.requests.set(id, request);
    
    // 更新节点请求索引
    if (!this.nodeRequests.has(from)) {
      this.nodeRequests.set(from, new Set());
    }
    this.nodeRequests.get(from)!.add(id);
    
    if (!this.nodeRequests.has(to)) {
      this.nodeRequests.set(to, new Set());
    }
    this.nodeRequests.get(to)!.add(id);

    // 记录审计日志
    this.addAuditLog({
      action: 'relation_request',
      actor: from,
      target: to,
      requestId: id,
      details: {
        relationType: type,
        permissions,
        message
      },
      metadata: {}
    });

    return request;
  }

  // 获取请求
  getRequest(id: string): RelationRequest | undefined {
    return this.requests.get(id);
  }

  // 获取节点的待处理请求
  getPendingRequests(nodeId: string): RelationRequest[] {
    const requestIds = this.nodeRequests.get(nodeId);
    if (!requestIds) return [];

    return Array.from(requestIds)
      .map(id => this.requests.get(id))
      .filter((r): r is RelationRequest => 
        r !== undefined && 
        r.status === 'pending' && 
        r.to === nodeId &&
        (!r.expiresAt || r.expiresAt > Date.now())
      );
  }

  // 获取节点发出的请求
  getSentRequests(nodeId: string): RelationRequest[] {
    const requestIds = this.nodeRequests.get(nodeId);
    if (!requestIds) return [];

    return Array.from(requestIds)
      .map(id => this.requests.get(id))
      .filter((r): r is RelationRequest => 
        r !== undefined && r.from === nodeId
      );
  }

  // 接受请求
  acceptRequest(
    requestId: string, 
    grantedPermissions?: Permission[],
    response?: string
  ): RelationRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request ${requestId} is not pending (status: ${request.status})`);
    }

    if (request.expiresAt && request.expiresAt < Date.now()) {
      request.status = 'expired';
      throw new Error(`Request ${requestId} has expired`);
    }

    // 更新请求状态
    request.status = 'accepted';
    request.grantedPermissions = grantedPermissions || request.requestedPermissions;
    request.response = response;
    request.respondedAt = Date.now();
    request.respondedBy = request.to;

    // 记录审计日志
    this.addAuditLog({
      action: 'relation_accept',
      actor: request.to,
      target: request.from,
      requestId: request.id,
      details: {
        relationType: request.type,
        permissions: request.grantedPermissions,
        message: response
      },
      metadata: {}
    });

    return request;
  }

  // 拒绝请求
  rejectRequest(requestId: string, reason?: string): RelationRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request ${requestId} is not pending`);
    }

    // 更新请求状态
    request.status = 'rejected';
    request.response = reason;
    request.respondedAt = Date.now();
    request.respondedBy = request.to;

    // 记录审计日志
    this.addAuditLog({
      action: 'relation_reject',
      actor: request.to,
      target: request.from,
      requestId: request.id,
      details: {
        relationType: request.type,
        reason
      },
      metadata: {}
    });

    return request;
  }

  // 取消请求
  cancelRequest(requestId: string, reason?: string): RelationRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Request ${requestId} is not pending`);
    }

    // 更新请求状态
    request.status = 'cancelled';
    request.response = reason;
    request.respondedAt = Date.now();
    request.respondedBy = request.from;

    // 记录审计日志
    this.addAuditLog({
      action: 'relation_cancel',
      actor: request.from,
      target: request.to,
      requestId: request.id,
      details: {
        relationType: request.type,
        reason
      },
      metadata: {}
    });

    return request;
  }

  // 清理过期请求
  cleanupExpired(): number {
    let count = 0;
    const now = Date.now();

    this.requests.forEach((request, id) => {
      if (request.status === 'pending' && request.expiresAt && request.expiresAt < now) {
        request.status = 'expired';
        count++;
      }
    });

    return count;
  }

  // 添加审计日志
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const auditLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.auditLogs.push(auditLog);

    // 保持日志在合理范围内（最近 10000 条）
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }

    return auditLog;
  }

  // 获取审计日志
  getAuditLogs(filters?: {
    actor?: string;
    target?: string;
    action?: AuditAction;
    since?: number;
    limit?: number;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.actor) {
        logs = logs.filter(l => l.actor === filters.actor);
      }
      if (filters.target) {
        logs = logs.filter(l => l.target === filters.target);
      }
      if (filters.action) {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.since !== undefined) {
        logs = logs.filter(l => l.timestamp >= filters.since!);
      }
      if (filters.limit) {
        logs = logs.slice(-filters.limit);
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // 获取统计
  getStats() {
    const now = Date.now();
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    let expired = 0;

    this.requests.forEach(r => {
      switch (r.status) {
        case 'pending': 
          if (!r.expiresAt || r.expiresAt > now) pending++;
          else expired++;
          break;
        case 'accepted': accepted++; break;
        case 'rejected': rejected++; break;
        case 'expired': expired++; break;
      }
    });

    return {
      total: this.requests.size,
      pending,
      accepted,
      rejected,
      expired,
      auditLogs: this.auditLogs.length
    };
  }
}
