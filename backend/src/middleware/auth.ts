import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'sales' | 'warehouse' | 'accounts';
    name: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // JWT_SECRET is guaranteed to be set — index.ts guards against missing value at startup.
  const jwtSecret = process.env.JWT_SECRET as string;

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      // Distinguish between expired and completely invalid tokens
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid token. Access denied.' });
    }
    req.user = decoded as AuthRequest['user'];
    next();
  });
};

export const requireRole = (allowedRoles: Array<'admin' | 'sales' | 'warehouse' | 'accounts'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
    }

    next();
  };
};
