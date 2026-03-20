/**
 * 持久化存储模块
 * 使用 SQLite
 */

import Database from 'better-sqlite3';
import { Node, Relation } from './types';

export class Storage {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables() {
    // 创建节点表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        metadata TEXT,
        createdAt INTEGER NOT NULL
      )
    `);

    // 创建关系表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS relations (
        id TEXT PRIMARY KEY,
        from_node TEXT NOT NULL,
        to_node TEXT NOT NULL,
        type TEXT NOT NULL,
        permissions TEXT NOT NULL,
        metadata TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (from_node) REFERENCES nodes(id),
        FOREIGN KEY (to_node) REFERENCES nodes(id)
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_node);
      CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_node);
    `);
  }

  // 节点操作
  saveNode(node: Node): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO nodes (id, type, name, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      node.id,
      node.type,
      node.name,
      JSON.stringify(node.metadata || {}),
      node.createdAt
    );
  }

  getNode(id: string): Node | undefined {
    const stmt = this.db.prepare('SELECT * FROM nodes WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    };
  }

  deleteNode(id: string): void {
    // 先删除相关关系
    const delRelations = this.db.prepare(
      'DELETE FROM relations WHERE from_node = ? OR to_node = ?'
    );
    delRelations.run(id, id);

    // 删除节点
    const stmt = this.db.prepare('DELETE FROM nodes WHERE id = ?');
    stmt.run(id);
  }

  getAllNodes(): Node[] {
    const stmt = this.db.prepare('SELECT * FROM nodes');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  // 关系操作
  saveRelation(relation: Relation): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO relations 
      (id, from_node, to_node, type, permissions, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      relation.id,
      relation.from,
      relation.to,
      relation.type,
      JSON.stringify(relation.permissions),
      JSON.stringify(relation.metadata || {}),
      relation.createdAt
    );
  }

  getRelation(id: string): Relation | undefined {
    const stmt = this.db.prepare('SELECT * FROM relations WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    
    return {
      id: row.id,
      from: row.from_node,
      to: row.to_node,
      type: row.type,
      permissions: JSON.parse(row.permissions),
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.createdAt
    };
  }

  getRelationsByNode(nodeId: string): Relation[] {
    const stmt = this.db.prepare(
      'SELECT * FROM relations WHERE from_node = ? OR to_node = ?'
    );
    const rows = stmt.all(nodeId, nodeId) as any[];
    return rows.map(row => ({
      id: row.id,
      from: row.from_node,
      to: row.to_node,
      type: row.type,
      permissions: JSON.parse(row.permissions),
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.createdAt
    }));
  }

  deleteRelation(id: string): void {
    const stmt = this.db.prepare('DELETE FROM relations WHERE id = ?');
    stmt.run(id);
  }

  getAllRelations(): Relation[] {
    const stmt = this.db.prepare('SELECT * FROM relations');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      from: row.from_node,
      to: row.to_node,
      type: row.type,
      permissions: JSON.parse(row.permissions),
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.createdAt
    }));
  }

  close(): void {
    this.db.close();
  }
}
