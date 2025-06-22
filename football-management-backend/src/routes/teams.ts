import { Router } from 'express';
import { TeamsController } from '../controllers/TeamsController';
import { authenticate } from '../middlewares/auth';
import { validateParams } from '../middlewares/validation';
import { matchDateParamSchema } from '../validators/availability';

const router = Router();
const teamsController = new TeamsController();

// All teams routes require authentication
router.use(authenticate);

// GET /api/v1/teams/current - Get current week's teams (after 12pm)
router.get('/current', teamsController.getCurrentWeekTeams);

// GET /api/v1/teams/match/:date - Get teams for specific match
router.get(
  '/match/:date',
  validateParams(matchDateParamSchema),
  teamsController.getTeamsForMatch
);

// GET /api/v1/teams/my-history - Get user's team history
router.get('/my-history', teamsController.getMyTeamHistory);

export default router; 