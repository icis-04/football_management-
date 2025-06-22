import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { createApiResponse } from '../utils';
import { AuthenticatedRequest } from '../types';
import { logger } from '../config/logger';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  async getPlayerPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const seasonYear = req.query.year ? parseInt(req.query.year as string) : undefined;

      const playerData = await this.analyticsService.getPlayerPerformanceData(seasonYear);

      res.json(createApiResponse(true, {
        players: playerData,
        seasonYear: seasonYear || new Date().getFullYear()
      }));
    } catch (error) {
      logger.error('Failed to get player performance analytics', {
        seasonYear: req.query.year,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get player performance analytics'));
    }
  }

  async getTeamAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const teamAnalytics = await this.analyticsService.getTeamAnalytics(startDate, endDate);

      res.json(createApiResponse(true, teamAnalytics));
    } catch (error) {
      logger.error('Failed to get team analytics', {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get team analytics'));
    }
  }

  async getSystemAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const systemAnalytics = await this.analyticsService.getSystemAnalytics();

      res.json(createApiResponse(true, systemAnalytics));
    } catch (error) {
      logger.error('Failed to get system analytics', {
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get system analytics'));
    }
  }

  async getAvailabilityTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const trends = await this.analyticsService.getAvailabilityTrends(days);

      res.json(createApiResponse(true, {
        trends,
        period: `${days} days`
      }));
    } catch (error) {
      logger.error('Failed to get availability trends', {
        days: req.query.days,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get availability trends'));
    }
  }

  async getDashboardSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get a comprehensive dashboard summary
      const [playerData, teamAnalytics, systemAnalytics, trends] = await Promise.all([
        this.analyticsService.getPlayerPerformanceData(),
        this.analyticsService.getTeamAnalytics(),
        this.analyticsService.getSystemAnalytics(),
        this.analyticsService.getAvailabilityTrends(7) // Last 7 days
      ]);

      const summary = {
        overview: {
          totalPlayers: playerData.length,
          activeUsers: systemAnalytics.userActivity.totalActiveUsers,
          teamsGenerated: teamAnalytics.totalTeamsGenerated,
          averageAvailability: trends.length > 0 
            ? Math.round(trends.reduce((sum, trend) => sum + trend.percentage, 0) / trends.length)
            : 0
        },
        topPerformers: playerData
          .sort((a, b) => b.availabilityRate - a.availabilityRate)
          .slice(0, 5)
          .map(player => ({
            name: player.userName,
            availabilityRate: player.availabilityRate,
            gamesPlayed: player.gamesPlayed
          })),
        recentTrends: trends,
        teamStats: {
          averagePlayersPerTeam: teamAnalytics.averagePlayersPerTeam,
          positionDistribution: teamAnalytics.positionDistribution,
          goalkeeperCoverage: teamAnalytics.goalkeeperDistribution
        },
        systemHealth: {
          averageResponseTime: systemAnalytics.performance.averageResponseTime,
          errorRate: systemAnalytics.performance.errorRate,
          uptime: 99.9 // Placeholder
        }
      };

      res.json(createApiResponse(true, summary));
    } catch (error) {
      logger.error('Failed to get dashboard summary', {
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get dashboard summary'));
    }
  }

  async getPlayerStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const seasonYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      const playerData = await this.analyticsService.getPlayerPerformanceData(seasonYear);
      const userStats = playerData.find(player => player.userId === userId);

      if (!userStats) {
        res.status(404).json(createApiResponse(false, null, 'Player statistics not found'));
        return;
      }

      // Get additional context
      const allPlayersAvg = {
        availabilityRate: playerData.reduce((sum, p) => sum + p.availabilityRate, 0) / playerData.length,
        gamesPlayed: playerData.reduce((sum, p) => sum + p.gamesPlayed, 0) / playerData.length
      };

      const ranking = {
        availabilityRank: playerData
          .sort((a, b) => b.availabilityRate - a.availabilityRate)
          .findIndex(p => p.userId === userId) + 1,
        gamesPlayedRank: playerData
          .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
          .findIndex(p => p.userId === userId) + 1,
        totalPlayers: playerData.length
      };

      res.json(createApiResponse(true, {
        personalStats: userStats,
        averages: allPlayersAvg,
        ranking,
        seasonYear
      }));
    } catch (error) {
      logger.error('Failed to get player stats', {
        userId: req.user?.userId,
        error: (error as Error).message
      });
      res.status(500).json(createApiResponse(false, null, 'Failed to get player statistics'));
    }
  }
}
