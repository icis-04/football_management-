import { Router } from 'express';
import { AdvancedTeamController } from '../controllers/AdvancedTeamController';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAdmin } from '../middlewares/requireAdmin';
import Joi from 'joi';

const router = Router();
const advancedTeamController = new AdvancedTeamController();

// Validation schemas
const teamAdjustmentSchema = Joi.object({
  teamId: Joi.number().required(),
  playerId: Joi.number().required(),
  action: Joi.string().valid('add', 'remove', 'move', 'substitute').required(),
  targetTeamId: Joi.number().optional(),
  newPosition: Joi.string().optional()
});

const swapPlayersSchema = Joi.object({
  team1Id: Joi.number().required(),
  player1Id: Joi.number().required(),
  team2Id: Joi.number().required(),
  player2Id: Joi.number().required()
});

const templateSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  teamConfiguration: Joi.object().required(),
  playerCount: Joi.number().min(18).max(50).required(),
  teamCount: Joi.number().min(2).max(3).required()
});

const applyTemplateSchema = Joi.object({
  matchDate: Joi.date().required()
});

const bulkOperationsSchema = Joi.object({
  operations: Joi.array().items(teamAdjustmentSchema).min(1).max(20).required()
});

// Apply authentication and admin requirement to all routes
router.use(authenticate);
router.use(requireAdmin);

// Team adjustment operations
router.post('/adjust', 
  validateRequest(teamAdjustmentSchema),
  advancedTeamController.adjustTeam.bind(advancedTeamController)
);

// Swap players between teams
router.post('/swap-players',
  validateRequest(swapPlayersSchema),
  advancedTeamController.swapPlayers.bind(advancedTeamController)
);

// Team templates
router.post('/:teamId/save-template',
  validateRequest(templateSchema),
  advancedTeamController.saveAsTemplate.bind(advancedTeamController)
);

router.get('/templates', advancedTeamController.getTemplates.bind(advancedTeamController));

router.post('/templates/:templateId/apply',
  validateRequest(applyTemplateSchema),
  advancedTeamController.applyTemplate.bind(advancedTeamController)
);

// Team analysis
router.get('/:teamId/balance', advancedTeamController.analyzeBalance.bind(advancedTeamController));

router.get('/:teamId/history', advancedTeamController.getModificationHistory.bind(advancedTeamController));

// Bulk operations
router.post('/bulk-operations',
  validateRequest(bulkOperationsSchema),
  advancedTeamController.bulkTeamOperations.bind(advancedTeamController)
);

// Team optimization (future feature)
router.post('/optimize', advancedTeamController.optimizeTeams.bind(advancedTeamController));

export default router;
