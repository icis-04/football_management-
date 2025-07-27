import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import Joi from 'joi';
import { AuthenticatedRequest } from '../types';

const router = Router();
const notificationController = new NotificationController();

// Validation schemas
const updatePreferencesSchema = Joi.object({
  email_notifications: Joi.boolean().optional(),
  availability_reminders: Joi.boolean().optional(),
  team_announcements: Joi.boolean().optional(),
  admin_updates: Joi.boolean().optional(),
  reminder_hours_before: Joi.number().min(1).max(168).optional() // 1 hour to 1 week
});

// Apply authentication to all routes
router.use(authenticate);

// Get user notifications
router.get('/', (req, res) => notificationController.getNotifications(req as AuthenticatedRequest, res));

// Mark notification as read
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req as AuthenticatedRequest, res));

// Mark all notifications as read
router.patch('/read-all', (req, res) => notificationController.markAllAsRead(req as AuthenticatedRequest, res));

// Get notification preferences
router.get('/preferences', (req, res) => notificationController.getPreferences(req as AuthenticatedRequest, res));

// Update notification preferences
router.put('/preferences', 
  validate(updatePreferencesSchema),
  (req, res) => notificationController.updatePreferences(req as AuthenticatedRequest, res)
);

// Send test notification (for testing purposes)
router.post('/test', (req, res) => notificationController.sendTestNotification(req as AuthenticatedRequest, res));

export default router;
