/**
 * 简单 Token 认证中间件
 */

import { Request, Response, NextFunction } from 'express';

// 从环境变量读取 API Tokens
const API_TOKENS = (process.env.CLAWNET_TOKENS || 'clawnet-secret-token').split(',');

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      authenticated?: boolean;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 健康检查不需要认证
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  // 从 header 或 query 获取 token
  const token = req.headers['authorization']?.replace('Bearer ', '') || 
                (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Token required. Use Authorization: Bearer <token> or ?token=<token>' 
    });
    return;
  }

  if (!API_TOKENS.includes(token)) {
    res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    });
    return;
  }

  req.authenticated = true;
  next();
}

// 生成 Token（简单示例）
export function generateToken(): string {
  return `clawnet-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
}
