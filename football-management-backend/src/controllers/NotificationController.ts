import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { createApiResponse } from '../utils';
import { AuthenticatedRequest } from '../types';
import { logger } from '../config/logger';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.notificationService.getUserNotifications(userId, limit, offset);

      res.json(createApiResponse(true, result));
    } catch (error) {
      logger.error('Failed to get notifications', {
        userId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get notifications'));
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const notificationId = parseInt(req.params.id);

      await this.notificationService.markNotificationAsRead(notificationId, userId);

      res.json(createApiResponse(true, null, 'Notification marked as read'));
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        userId: req.user?.userId,
        notificationId: req.params.id,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to mark notification as read'));
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      await this.notificationService.markAllNotificationsAsRead(userId);

      res.json(createApiResponse(true, null, 'All notifications marked as read'));
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to mark all notifications as read'));
    }
  }

  async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const preferences = await this.notificationService.getUserPreferences(userId);

      res.json(createApiResponse(true, preferences));
    } catch (error) {
      logger.error('Failed to get notification preferences', {
        userId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get notification preferences'));
    }
  }

  async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updates = req.body;

      const preferences = await this.notificationService.updateUserPreferences(userId, updates);

      res.json(createApiResponse(true, preferences, 'Notification preferences updated'));
    } catch (error) {
      logger.error('Failed to update notification preferences', {
        userId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to update notification preferences'));
    }
  }

  async sendTestNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      await this.notificationService.createNotification({
        userId,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working correctly.',
        sendEmail: true
      });

      res.json(createApiResponse(true, null, 'Test notification sent'));
    } catch (error) {
      logger.error('Failed to send test notification', {
        userId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to send test notification'));
    }
  }
}
