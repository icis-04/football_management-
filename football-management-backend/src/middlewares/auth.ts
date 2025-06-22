import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { createApiResponse } from '../utils';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(createApiResponse(false, undefined, undefined, {
      code: 'AUTH_TOKEN_MISSING',
      message: 'Authorization token is required',
    }));
    return;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    (req as AuthenticatedRequest).user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json(createApiResponse(false, undefined, undefined, {
      code: 'AUTH_TOKEN_INVALID',
      message: 'Invalid or expired token',
    }));
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json(createApiResponse(false, undefined, undefined, {
      code: 'PERMISSION_DENIED',
      message: 'Admin privileges required',
    }));
    return;
  }
  next();
}; 