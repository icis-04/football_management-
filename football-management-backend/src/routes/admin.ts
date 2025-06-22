import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateRequest } from '../middlewares/validateRequest';
import { 
  addAllowedEmailSchema, 
  bulkAddAllowedEmailsSchema, 
  updateUserStatusSchema,
  auditLogQuerySchema 
} from '../validators/admin';

const router = Router();
const adminController = new AdminController();

// Apply authentication and admin requirement to all routes
router.use(authenticate);
router.use(requireAdmin);

// Email management routes
router.post('/allowed-emails', validateRequest(addAllowedEmailSchema), adminController.addAllowedEmail);
router.get('/allowed-emails', adminController.getAllowedEmails);
router.delete('/allowed-emails/:id', adminController.removeAllowedEmail);
router.post('/allowed-emails/bulk', validateRequest(bulkAddAllowedEmailsSchema), adminController.bulkAddAllowedEmails);

// User management routes
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', validateRequest(updateUserStatusSchema), adminController.updateUserStatus);

// Analytics routes
router.get('/analytics/availability', adminController.getAvailabilityAnalytics);

// Audit log routes
router.get('/audit-log', validateRequest(auditLogQuerySchema, 'query'), adminController.getAuditLog);

export default router; 