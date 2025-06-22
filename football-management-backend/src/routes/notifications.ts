import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import Joi from 'joi';

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
router.get('/', notificationController.getNotifications.bind(notificationController));

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Get notification preferences
router.get('/preferences', notificationController.getPreferences.bind(notificationController));

// Update notification preferences
router.put('/preferences', 
  validateRequest(updatePreferencesSchema),
  notificationController.updatePreferences.bind(notificationController)
);

// Send test notification (for testing purposes)
router.post('/test', notificationController.sendTestNotification.bind(notificationController));

export default router;
