import { Response } from 'express';
import { TeamGenerationService } from '../services/TeamGenerationService';
import { AuthenticatedRequest } from '../types/auth';
import { createApiResponse } from '../utils';
import { logger } from '../config/logger';

export class TeamsController {
  private teamGenerationService: TeamGenerationService;

  constructor() {
    this.teamGenerationService = new TeamGenerationService();
  }

  getCurrentWeekTeams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const today = new Date();
      const currentWeekDates = this.getCurrentWeekMatchDates(today);
      
      const teamsData = [];
      
      for (const matchDate of currentWeekDates) {
        const arePublished = await this.teamGenerationService.areTeamsPublished(matchDate.date);
        
        if (arePublished) {
          const teams = await this.teamGenerationService.getPublishedTeams(matchDate.date);
          teamsData.push({
            matchDate: matchDate.date.toISOString().split('T')[0],
            dayOfWeek: matchDate.dayOfWeek,
            teams,
          });
        }
      }

      res.json(createApiResponse(true, { matches: teamsData }));
    } catch (error) {
      logger.error('Get current week teams failed', {
        error: (error as Error).message,
        userId: req.user?.id,
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get current week teams',
        })
      );
    }
  };

  getTeamsForMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      
      // Parse match date
      const parsedDate = new Date(date + 'T00:00:00.000Z');
      
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'INVALID_DATE',
            message: 'Invalid date format',
          })
        );
        return;
      }

      // Check if teams are published
      const arePublished = await this.teamGenerationService.areTeamsPublished(parsedDate);
      
      if (!arePublished) {
        res.status(404).json(
          createApiResponse(false, undefined, undefined, {
            code: 'TEAMS_NOT_PUBLISHED',
            message: 'Teams have not been published for this match yet',
          })
        );
        return;
      }

      const teams = await this.teamGenerationService.getPublishedTeams(parsedDate);
      
      res.json(createApiResponse(true, { 
        matchDate: date,
        teams,
      }));
    } catch (error) {
      logger.error('Get teams for match failed', {
        error: (error as Error).message,
        date: req.params['date'],
        userId: req.user?.id,
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get teams for match',
        })
      );
    }
  };

  getMyTeamHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Implement team history for user
      // This would require querying historical team assignments
      
      res.json(createApiResponse(true, { 
        history: [],
        message: 'Team history feature coming soon',
      }));
    } catch (error) {
      logger.error('Get my team history failed', {
        error: (error as Error).message,
        userId: req.user?.id,
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get team history',
        })
      );
    }
  };

  /**
   * Get current week's match dates (Monday and Wednesday)
   */
  private getCurrentWeekMatchDates(today: Date): Array<{ date: Date; dayOfWeek: string }> {
    const matches = [];
    
    // Find this week's Monday
    const monday = new Date(today);
    const daysFromMonday = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 system
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    
    // Add Monday
    matches.push({
      date: new Date(monday),
      dayOfWeek: 'monday',
    });
    
    // Add Wednesday (2 days after Monday)
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);
    matches.push({
      date: new Date(wednesday),
      dayOfWeek: 'wednesday',
    });
    
    return matches;
  }
} 