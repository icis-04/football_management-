import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { logger } from '../config/logger';


export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  /**
   * Add allowed email
   */
  addAllowedEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const adminId = req.user!.userId;

      const result = await this.adminService.addAllowedEmail(email, adminId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Email added to allowed list successfully'
      });
    } catch (error) {
      logger.error('Admin add allowed email failed', {
        error: (error as Error).message,
        adminId: req.user?.userId
      });

      const message = (error as Error).message;
      if (message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_ALLOWED',
          message: 'Email already in allowed list'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to add allowed email'
        });
      }
    }
  };

  /**
   * Get all allowed emails
   */
  getAllowedEmails = async (req: Request, res: Response): Promise<void> => {
    try {
      const emails = await this.adminService.getAllowedEmails();

      res.json({
        success: true,
        data: emails
      });
    } catch (error) {
      logger.error('Admin get allowed emails failed', {
        error: (error as Error).message,
        adminId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve allowed emails'
      });
    }
  };

  /**
   * Remove allowed email
   */
  removeAllowedEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const emailId = parseInt(req.params['id'] || '0');
      const adminId = req.user!.userId;

      if (isNaN(emailId) || emailId === 0) {
        res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL_ID',
          message: 'Invalid email ID'
        });
        return;
      }

      await this.adminService.removeAllowedEmail(emailId, adminId);

      res.json({
        success: true,
        message: 'Allowed email removed successfully'
      });
    } catch (error) {
      logger.error('Admin remove allowed email failed', {
        error: (error as Error).message,
        emailId: req.params['id'],
        adminId: req.user?.userId
      });

      const message = (error as Error).message;
      if (message === 'EMAIL_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: 'EMAIL_NOT_FOUND',
          message: 'Allowed email not found'
        });
      } else if (message === 'EMAIL_ALREADY_USED') {
        res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_USED',
          message: 'Cannot remove email that has been used for registration'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to remove allowed email'
        });
      }
    }
  };

  /**
   * Bulk add allowed emails
   */
  bulkAddAllowedEmails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { emails } = req.body;
      const adminId = req.user!.userId;

      if (!Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({
          success: false,
          error: 'INVALID_EMAILS',
          message: 'Emails must be a non-empty array'
        });
        return;
      }

      if (emails.length > 50) {
        res.status(400).json({
          success: false,
          error: 'TOO_MANY_EMAILS',
          message: 'Cannot add more than 50 emails at once'
        });
        return;
      }

      const result = await this.adminService.bulkAddAllowedEmails(emails, adminId);

      res.status(201).json({
        success: true,
        data: result,
        message: `Bulk add completed: ${result.added.length} added, ${result.skipped.length} skipped, ${result.errors.length} errors`
      });
    } catch (error) {
      logger.error('Admin bulk add allowed emails failed', {
        error: (error as Error).message,
        adminId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to bulk add allowed emails'
      });
    }
  };

  /**
   * Get all users
   */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.adminService.getAllUsers();

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Admin get all users failed', {
        error: (error as Error).message,
        adminId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve users'
      });
    }
  };

  /**
   * Update user status
   */
  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params['id'] || '0');
      const { isActive } = req.body;
      const adminId = req.user!.userId;

      if (isNaN(userId) || userId === 0) {
        res.status(400).json({
          success: false,
          error: 'INVALID_USER_ID',
          message: 'Invalid user ID'
        });
        return;
      }

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: 'isActive must be a boolean'
        });
        return;
      }

      await this.adminService.updateUserStatus(userId, isActive, adminId);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      logger.error('Admin update user status failed', {
        error: (error as Error).message,
        userId: req.params['id'],
        adminId: req.user?.userId
      });

      const message = (error as Error).message;
      if (message === 'USER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      } else if (message === 'CANNOT_DEACTIVATE_ADMIN') {
        res.status(409).json({
          success: false,
          error: 'CANNOT_DEACTIVATE_ADMIN',
          message: 'Cannot deactivate admin user'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to update user status'
        });
      }
    }
  };

  /**
   * Get availability analytics
   */
  getAvailabilityAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const analytics = await this.adminService.getAvailabilityAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Admin get availability analytics failed', {
        error: (error as Error).message,
        adminId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve availability analytics'
      });
    }
  };

  /**
   * Get audit log
   */
  getAuditLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query['limit'] as string) || 50;

      if (limit > 100) {
        res.status(400).json({
          success: false,
          error: 'LIMIT_TOO_HIGH',
          message: 'Limit cannot exceed 100'
        });
        return;
      }

      const result = await this.adminService.getAuditLogs(limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Admin get audit log failed', {
        error: (error as Error).message,
        adminId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve audit log'
      });
    }
  };
} 