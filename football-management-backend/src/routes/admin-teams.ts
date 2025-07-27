import { Router } from 'express';
import { AdminTeamsController } from '../controllers/AdminTeamsController';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateRequest } from '../middlewares/validateRequest';
import Joi from 'joi';

const router = Router();
const adminTeamsController = new AdminTeamsController();

// Validation schemas
const generateTeamsSchema = Joi.object({
  matchDate: Joi.date().iso().required()
});

const publishTeamsSchema = Joi.object({
  matchDate: Joi.date().iso().required()
});

// Apply authentication and admin requirement to all routes
router.use(authenticate);
router.use(requireAdmin);

// Team generation and management routes
router.post('/generate', 
  validateRequest(generateTeamsSchema), 
  adminTeamsController.generateTeams
);

router.post('/publish', 
  validateRequest(publishTeamsSchema), 
  adminTeamsController.publishTeams
);

router.get('/preview', 
  adminTeamsController.previewTeams
);

export default router; 