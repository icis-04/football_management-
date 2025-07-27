import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication to all routes
router.use(authenticate);

// Player-specific analytics
router.get('/my-stats', (req, res) => analyticsController.getPlayerStats(req as AuthenticatedRequest, res));

// Admin routes
router.use(requireAdmin);

// Dashboard summary
router.get('/dashboard', (req, res) => analyticsController.getDashboardSummary(req as AuthenticatedRequest, res));

// Player performance analytics
router.get('/players', (req, res) => analyticsController.getPlayerPerformance(req as AuthenticatedRequest, res));

// Team analytics
router.get('/teams', (req, res) => analyticsController.getTeamAnalytics(req as AuthenticatedRequest, res));

// System analytics
router.get('/system', (req, res) => analyticsController.getSystemAnalytics(req as AuthenticatedRequest, res));

// Availability trends
router.get('/availability-trends', (req, res) => analyticsController.getAvailabilityTrends(req as AuthenticatedRequest, res));

export default router;
