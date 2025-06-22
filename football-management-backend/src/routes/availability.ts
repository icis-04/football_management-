import { Router } from 'express';
import { AvailabilityController } from '../controllers/AvailabilityController';
import { authenticate } from '../middlewares/auth';
import { validate, validateParams } from '../middlewares/validation';
import {
  submitAvailabilitySchema,
  updateAvailabilitySchema,
  matchDateParamSchema,
} from '../validators/availability';

const router = Router();
const availabilityController = new AvailabilityController();

// All availability routes require authentication
router.use(authenticate);

// POST /api/v1/availability - Submit availability for a match
router.post(
  '/',
  validate(submitAvailabilitySchema),
  availabilityController.submitAvailability
);

// GET /api/v1/availability/my - Get current user's availability for upcoming matches
router.get('/my', availabilityController.getMyAvailability);

// GET /api/v1/availability/matches - Get upcoming matches
router.get('/matches', availabilityController.getUpcomingMatches);

// GET /api/v1/availability/match/:date - Get all players' availability for a specific match
router.get(
  '/match/:date',
  validateParams(matchDateParamSchema),
  availabilityController.getMatchAvailability
);

// PUT /api/v1/availability/:date - Update availability for a specific match date
router.put(
  '/:date',
  validateParams(matchDateParamSchema),
  validate(updateAvailabilitySchema),
  availabilityController.updateAvailability
);

export default router; 