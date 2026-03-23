import express, { Request, Response } from 'express';
import { ClawNet } from '../index';
import { Storage } from '../storage';

/**
 * 节点发现与通信 API
 */
export function setupNodeDiscoveryAPI(
  app: express.Application,
  clawnet: ClawNet,
  storage: Storage
) {
  /**
   * 发现节点 - 获取所有可达节点
   */
  app.get('/nodes/:id/discover', async (req: Request, res: Response) => {
    try {
      const nodeId = req.params.id;
      const currentNode = clawnet.getNode(nodeId);

      if (!currentNode) {
        return res.status(404).json({
          success: false,
          error: 'Node not found'
        });
      }

      // 获取所有节点
      const allNodes = clawnet.getAllNodes();

      // 过滤掉自己
      const discoverableNodes = allNodes.filter(n => n.id !== nodeId);

      res.json({
        success: true,
        data: {
          currentNode: nodeId,
          discoveredNodes: discoverableNodes,
          totalNodes: discoverableNodes.length,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * 发送消息到节点
   */
  app.post('/messages', async (req: Request, res: Response) => {
    try {
      const { from, to, type, payload } = req.body;

      if (!from || !to || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: from, to, type'
        });
      }

      // 验证源节点和目标节点是否存在
      const sourceNode = clawnet.getNode(from);
      const targetNode = clawnet.getNode(to);

      if (!sourceNode) {
        return res.status(404).json({
          success: false,
          error: `Source node not found: ${from}`
        });
      }

      if (!targetNode) {
        return res.status(404).json({
          success: false,
          error: `Target node not found: ${to}`
        });
      }

      // 创建消息
      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from,
        to,
        type,
        payload: payload || {},
        timestamp: Date.now(),
        status: 'sent'
      };

      // TODO: 实际的消息路由和投递逻辑
      // 这里先将消息存储,后续可以实现WebSocket推送

      res.json({
        success: true,
        data: message
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * 节点心跳
   */
  app.post('/nodes/:id/heartbeat', async (req: Request, res: Response) => {
    try {
      const nodeId = req.params.id;
      const { status, metadata } = req.body;

      const node = clawnet.getNode(nodeId);
      if (!node) {
        return res.status(404).json({
          success: false,
          error: 'Node not found'
        });
      }

      // 更新节点状态
      const updatedNode = {
        ...node,
        lastHeartbeat: Date.now(),
        status: status || 'online',
        metadata: { ...node.metadata, ...metadata }
      };

      // 保存更新
      clawnet.updateNode(nodeId, updatedNode);

      res.json({
        success: true,
        data: {
          nodeId,
          lastHeartbeat: updatedNode.lastHeartbeat,
          status: updatedNode.status
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * 获取节点对等列表
   */
  app.get('/nodes/:id/peers', async (req: Request, res: Response) => {
    try {
      const nodeId = req.params.id;

      const node = clawnet.getNode(nodeId);
      if (!node) {
        return res.status(404).json({
          success: false,
          error: 'Node not found'
        });
      }

      // 获取所有关系
      const relations = clawnet.getRelations(nodeId);

      // 提取对等节点ID
      const peerIds = relations.map((r: any) =>
        r.from === nodeId ? r.to : r.from
      );

      // 获取对等节点详情
      const peers = peerIds
        .map((id: string) => clawnet.getNode(id))
        .filter(Boolean);

      res.json({
        success: true,
        data: {
          nodeId,
          peers,
          totalPeers: peers.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}
