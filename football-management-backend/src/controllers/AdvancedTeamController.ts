import { Request, Response } from 'express';
import { AdvancedTeamService } from '../services/AdvancedTeamService';
import { createApiResponse } from '../utils';
import { AuthenticatedRequest } from '../types';
import { logger } from '../config/logger';

export class AdvancedTeamController {
  private advancedTeamService: AdvancedTeamService;

  constructor() {
    this.advancedTeamService = new AdvancedTeamService();
  }

  async adjustTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const adjustment = req.body;

      await this.advancedTeamService.applyTeamAdjustment(adjustment, adminId);

      res.json(createApiResponse(true, null, 'Team adjustment applied successfully'));
    } catch (error) {
      logger.error('Failed to apply team adjustment', {
        adminId: req.user?.id,
        adjustment: req.body,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to apply team adjustment'));
    }
  }

  async swapPlayers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { team1Id, player1Id, team2Id, player2Id } = req.body;

      await this.advancedTeamService.swapPlayers(team1Id, player1Id, team2Id, player2Id, adminId);

      res.json(createApiResponse(true, null, 'Players swapped successfully'));
    } catch (error) {
      logger.error('Failed to swap players', {
        adminId: req.user?.id,
        swapData: req.body,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to swap players'));
    }
  }

  async saveAsTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const teamId = parseInt(req.params.teamId);
      const templateData = req.body;

      const template = await this.advancedTeamService.saveTeamAsTemplate(teamId, templateData, adminId);

      res.json(createApiResponse(true, template, 'Team template created successfully'));
    } catch (error) {
      logger.error('Failed to save team template', {
        adminId: req.user?.id,
        teamId: req.params.teamId,
        templateData: req.body,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to save team template'));
    }
  }

  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;

      const templates = await this.advancedTeamService.getTeamTemplates(adminId);

      res.json(createApiResponse(true, templates));
    } catch (error) {
      logger.error('Failed to get team templates', {
        adminId: req.user?.id,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get team templates'));
    }
  }

  async applyTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const templateId = parseInt(req.params.templateId);
      const { matchDate } = req.body;

      const teams = await this.advancedTeamService.applyTeamTemplate(
        templateId, 
        new Date(matchDate), 
        adminId
      );

      res.json(createApiResponse(true, teams, 'Team template applied successfully'));
    } catch (error) {
      logger.error('Failed to apply team template', {
        adminId: req.user?.id,
        templateId: req.params.templateId,
        matchDate: req.body.matchDate,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to apply team template'));
    }
  }

  async analyzeBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.teamId);

      const balance = await this.advancedTeamService.analyzeTeamBalance(teamId);

      res.json(createApiResponse(true, balance));
    } catch (error) {
      logger.error('Failed to analyze team balance', {
        teamId: req.params.teamId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to analyze team balance'));
    }
  }

  async getModificationHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.teamId);

      const history = await this.advancedTeamService.getTeamModificationHistory(teamId);

      res.json(createApiResponse(true, history));
    } catch (error) {
      logger.error('Failed to get team modification history', {
        teamId: req.params.teamId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get team modification history'));
    }
  }

  async bulkTeamOperations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { operations } = req.body;

      const results = [];
      for (const operation of operations) {
        try {
          await this.advancedTeamService.applyTeamAdjustment(operation, adminId);
          results.push({ operation, success: true });
        } catch (error) {
          results.push({ 
            operation, 
            success: false, 
            error: (error as Error).message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json(createApiResponse(true, {
        results,
        summary: {
          total: operations.length,
          successful: successCount,
          failed: failureCount
        }
      }, `Bulk operations completed: ${successCount} successful, ${failureCount} failed`));
    } catch (error) {
      logger.error('Failed to execute bulk team operations', {
        adminId: req.user?.id,
        operations: req.body.operations,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to execute bulk team operations'));
    }
  }

  async optimizeTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { matchDate, optimizationCriteria } = req.body;

      // This would implement advanced team optimization algorithms
      // For now, return a placeholder response
      
      res.json(createApiResponse(true, {
        message: 'Team optimization feature coming soon',
        criteria: optimizationCriteria,
        matchDate
      }, 'Team optimization analysis completed'));
    } catch (error) {
      logger.error('Failed to optimize teams', {
        adminId: req.user?.id,
        matchDate: req.body.matchDate,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to optimize teams'));
    }
  }
}
