import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication to all routes
router.use(authenticate);

// Personal player statistics (available to all users)
router.get('/my-stats', analyticsController.getPlayerStats.bind(analyticsController));

// Admin-only analytics routes
router.use(requireAdmin);

// Dashboard summary
router.get('/dashboard', analyticsController.getDashboardSummary.bind(analyticsController));

// Player performance analytics
router.get('/players', analyticsController.getPlayerPerformance.bind(analyticsController));

// Team analytics
router.get('/teams', analyticsController.getTeamAnalytics.bind(analyticsController));

// System analytics
router.get('/system', analyticsController.getSystemAnalytics.bind(analyticsController));

// Availability trends
router.get('/availability-trends', analyticsController.getAvailabilityTrends.bind(analyticsController));

export default router;
