import { Response } from 'express';
import { TeamGenerationService } from '../services/TeamGenerationService';
import { NotificationService } from '../services/NotificationService';
import { AuthenticatedRequest } from '../types/auth';
import { createApiResponse } from '../utils';
import { logger } from '../config/logger';

export class AdminTeamsController {
  private teamGenerationService: TeamGenerationService;
  private notificationService: NotificationService;

  constructor() {
    this.teamGenerationService = new TeamGenerationService();
    this.notificationService = new NotificationService();
  }

  /**
   * Generate teams for a specific match date
   * POST /api/v1/admin/teams/generate
   */
  generateTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { matchDate } = req.body;
      const adminId = req.user!.userId;

      if (!matchDate) {
        res.status(400).json(
          createApiResponse(false, null, 'Match date is required', {
            code: 'MISSING_MATCH_DATE'
          })
        );
        return;
      }

      const date = new Date(matchDate);
      
      // Validate date is valid
      if (isNaN(date.getTime())) {
        res.status(400).json(
          createApiResponse(false, null, 'Invalid match date', {
            code: 'INVALID_DATE'
          })
        );
        return;
      }

      logger.info('Admin triggering team generation', {
        adminId,
        matchDate: date.toISOString().split('T')[0]
      });

      const result = await this.teamGenerationService.generateTeams(date);

      if (result.error) {
        if (result.error === 'INSUFFICIENT_PLAYERS') {
          res.status(400).json(
            createApiResponse(false, null, result.teamConfiguration || 'Insufficient players for team generation', {
              code: result.error,
              totalPlayers: result.totalPlayers
            })
          );
          return;
        }
        
        res.status(500).json(
          createApiResponse(false, null, 'Team generation failed', {
            code: result.error
          })
        );
        return;
      }

      res.json(createApiResponse(true, result, 'Teams generated successfully'));
    } catch (error) {
      logger.error('Team generation failed', {
        adminId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(
        createApiResponse(false, null, 'Failed to generate teams')
      );
    }
  };

  /**
   * Publish teams for a specific match date
   * POST /api/v1/admin/teams/publish
   */
  publishTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { matchDate } = req.body;
      const adminId = req.user!.userId;

      if (!matchDate) {
        res.status(400).json(
          createApiResponse(false, null, 'Match date is required', {
            code: 'MISSING_MATCH_DATE'
          })
        );
        return;
      }

      const date = new Date(matchDate);
      
      if (isNaN(date.getTime())) {
        res.status(400).json(
          createApiResponse(false, null, 'Invalid match date', {
            code: 'INVALID_DATE'
          })
        );
        return;
      }

      logger.info('Admin publishing teams', {
        adminId,
        matchDate: date.toISOString().split('T')[0]
      });

      await this.teamGenerationService.publishTeams(date);

      // Send team announcement notifications to all active users
      try {
        await this.notificationService.sendTeamAnnouncementNotifications(date);
      } catch (notificationError) {
        // Log the error but don't fail the publish operation
        logger.warn('Failed to send notifications after publishing teams', {
          matchDate: date.toISOString(),
          error: (notificationError as Error).message
        });
      }

      res.json(createApiResponse(true, { matchDate }, 'Teams published successfully'));
    } catch (error) {
      logger.error('Team publication failed', {
        adminId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(
        createApiResponse(false, null, 'Failed to publish teams')
      );
    }
  };

  /**
   * Preview teams for a specific match date (unpublished teams)
   * GET /api/v1/admin/teams/preview
   */
  previewTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { matchDate } = req.query;
      const adminId = req.user!.userId;

      if (!matchDate) {
        res.status(400).json(
          createApiResponse(false, null, 'Match date is required', {
            code: 'MISSING_MATCH_DATE'
          })
        );
        return;
      }

      const date = new Date(matchDate as string);
      
      if (isNaN(date.getTime())) {
        res.status(400).json(
          createApiResponse(false, null, 'Invalid match date', {
            code: 'INVALID_DATE'
          })
        );
        return;
      }

      logger.info('Admin previewing teams', {
        adminId,
        matchDate: date.toISOString().split('T')[0]
      });

      // Get all teams (published and unpublished) for admin preview
      const teams = await this.teamGenerationService.getAllTeamsForMatch(date);

      if (!teams || teams.length === 0) {
        res.status(404).json(
          createApiResponse(false, null, 'No teams found for this match date', {
            code: 'NO_TEAMS_FOUND'
          })
        );
        return;
      }

      res.json(createApiResponse(true, { teams, matchDate }, 'Teams retrieved successfully'));
    } catch (error) {
      logger.error('Team preview failed', {
        adminId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(
        createApiResponse(false, null, 'Failed to preview teams')
      );
    }
  };
} 