import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.isAdmin) {
      logger.warn('Non-admin user attempted to access admin route', {
        userId: req.user.userId,
        email: req.user.email,
        route: req.path,
        method: req.method
      });

      res.status(403).json({
        success: false,
        error: 'ADMIN_ACCESS_REQUIRED',
        message: 'Admin access required'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error', {
      error: (error as Error).message,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
}; 