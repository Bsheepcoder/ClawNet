/**
 * 权限系统模块
 * 关系即权限
 * 
 * 注意：权限检查只考虑有效的关系（未过期的临时关系）
 */

import { Relation, Permission } from './types';
import { RelationGraph } from './graph';

export class PermissionSystem {
  constructor(private graph: RelationGraph) {}

  // 检查权限（只考虑有效关系）
  checkPermission(
    node: string,
    target: string,
    action: Permission
  ): boolean {
    // 获取 node 的所有有效关系
    const relations = this.graph.getValidRelations(node);
    
    // 找到直接关系
    const directRelations = relations.filter(
      r => (r.from === node && r.to === target) ||
           (r.to === node && r.from === target)
    );

    // 如果有任一关系包含所需权限，则允许
    return directRelations.some(r => r.permissions.includes(action));
  }

  // 获取节点对目标的所有权限（只考虑有效关系）
  getPermissions(node: string, target: string): Permission[] {
    const relations = this.graph.getValidRelations(node);
    
    const directRelations = relations.filter(
      r => (r.from === node && r.to === target) ||
           (r.to === node && r.from === target)
    );

    // 合并所有权限
    const permissions = new Set<Permission>();
    directRelations.forEach(r => {
      r.permissions.forEach(p => permissions.add(p));
    });

    return Array.from(permissions);
  }

  // 获取有权限的所有目标（只考虑有效关系）
  getAuthorizedTargets(node: string, action: Permission): string[] {
    const relations = this.graph.getValidRelations(node);
    
    const targets = new Set<string>();
    relations.forEach(r => {
      if (r.permissions.includes(action)) {
        if (r.from === node) targets.add(r.to);
        if (r.to === node) targets.add(r.from);
      }
    });

    return Array.from(targets);
  }

  // 检查是否有任一权限（只考虑有效关系）
  hasAnyPermission(node: string, target: string): boolean {
    const relations = this.graph.getValidRelations(node);
    
    return relations.some(
      r => ((r.from === node && r.to === target) ||
            (r.to === node && r.from === target)) &&
           r.permissions.length > 0
    );
  }
}
