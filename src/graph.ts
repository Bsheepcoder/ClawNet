/**
 * 关系图谱模块
 * 管理节点关系
 */

import { Node, Relation, RelationType, Permission } from './types';

export class RelationGraph {
  private nodes: Map<string, Node> = new Map();
  private relations: Map<string, Relation> = new Map();
  private nodeRelations: Map<string, Set<string>> = new Map(); // 节点 -> 关系ID集合

  // 添加节点
  addNode(node: Omit<Node, 'createdAt'>): Node {
    const newNode: Node = {
      ...node,
      createdAt: Date.now()
    };
    this.nodes.set(node.id, newNode);
    this.nodeRelations.set(node.id, new Set());
    return newNode;
  }

  // 获取节点
  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  // 移除节点
  removeNode(id: string): void {
    // 删除所有相关关系
    const relationIds = this.nodeRelations.get(id);
    if (relationIds) {
      relationIds.forEach(relId => this.relations.delete(relId));
    }
    
    this.nodes.delete(id);
    this.nodeRelations.delete(id);
  }

  // 更新节点
  updateNode(id: string, updates: Partial<Node>): Node {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Node ${id} not found`);
    }
    
    const updatedNode: Node = {
      ...node,
      ...updates,
      id: node.id,  // 不允许修改ID
      createdAt: node.createdAt  // 不允许修改创建时间
    };
    
    this.nodes.set(id, updatedNode);
    return updatedNode;
  }

  // 添加关系（支持临时关系）
  addRelation(
    from: string,
    to: string,
    type: RelationType,
    permissions: Permission[],
    options?: {
      expiresAt?: number;      // 过期时间
      ttl?: number;            // 存活时间（毫秒）
      isTemporary?: boolean;   // 是否为临时关系
    }
  ): Relation {
    // 检查节点是否存在
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error('Node not found');
    }

    const id = `${from}-${to}-${Date.now()}`;
    const now = Date.now();
    
    // 计算 expiresAt
    let expiresAt: number | undefined;
    let isTemporary = false;
    
    if (options) {
      if (options.ttl && options.ttl > 0) {
        expiresAt = now + options.ttl;
        isTemporary = true;
      } else if (options.expiresAt && options.expiresAt > now) {
        expiresAt = options.expiresAt;
        isTemporary = true;
      }
      if (options.isTemporary !== undefined) {
        isTemporary = options.isTemporary;
      }
    }

    const relation: Relation = {
      id,
      from,
      to,
      type,
      permissions,
      createdAt: now,
      expiresAt,
      isTemporary
    };

    this.relations.set(id, relation);
    
    // 更新节点关系索引
    this.nodeRelations.get(from)?.add(id);
    this.nodeRelations.get(to)?.add(id);

    return relation;
  }

  // 检查关系是否有效（未过期）
  isRelationValid(relation: Relation): boolean {
    if (!relation.expiresAt) return true;
    return relation.expiresAt > Date.now();
  }

  // 获取有效的关系（排除过期的）
  getValidRelations(nodeId: string): Relation[] {
    return this.getRelations(nodeId).filter(r => this.isRelationValid(r));
  }

  // 清理过期关系
  cleanupExpiredRelations(): {
    cleaned: number;
    expiredRelations: Relation[];
  } {
    const now = Date.now();
    const expiredRelations: Relation[] = [];
    
    this.relations.forEach((relation, id) => {
      if (relation.expiresAt && relation.expiresAt < now) {
        expiredRelations.push(relation);
        this.removeRelation(id);
      }
    });

    return {
      cleaned: expiredRelations.length,
      expiredRelations
    };
  }

  // 获取即将过期的关系
  getExpiringRelations(withinMs: number): Relation[] {
    const now = Date.now();
    const threshold = now + withinMs;
    
    return this.getAllRelations().filter(r => 
      r.expiresAt && 
      r.expiresAt > now && 
      r.expiresAt <= threshold
    );
  }

  // 延长关系有效期
  extendRelation(relationId: string, additionalTtl: number): Relation {
    const relation = this.relations.get(relationId);
    if (!relation) {
      throw new Error(`Relation ${relationId} not found`);
    }

    const now = Date.now();
    const currentExpiry = relation.expiresAt || now;
    const newExpiry = Math.max(currentExpiry, now) + additionalTtl;

    const updatedRelation: Relation = {
      ...relation,
      expiresAt: newExpiry,
      isTemporary: true
    };

    this.relations.set(relationId, updatedRelation);
    return updatedRelation;
  }

  // 获取节点的所有关系
  getRelations(nodeId: string): Relation[] {
    const relationIds = this.nodeRelations.get(nodeId);
    if (!relationIds) return [];

    return Array.from(relationIds)
      .map(id => this.relations.get(id))
      .filter((r): r is Relation => r !== undefined);
  }

  // 获取节点的关系（作为 from）
  getOutgoingRelations(nodeId: string): Relation[] {
    return this.getRelations(nodeId).filter(r => r.from === nodeId);
  }

  // 获取节点的关系（作为 to）
  getIncomingRelations(nodeId: string): Relation[] {
    return this.getRelations(nodeId).filter(r => r.to === nodeId);
  }

  // 移除关系
  removeRelation(id: string): void {
    const relation = this.relations.get(id);
    if (!relation) return;

    this.relations.delete(id);
    this.nodeRelations.get(relation.from)?.delete(id);
    this.nodeRelations.get(relation.to)?.delete(id);
  }

  // 获取所有节点
  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  // 获取所有关系
  getAllRelations(): Relation[] {
    return Array.from(this.relations.values());
  }
}
