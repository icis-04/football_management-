import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PlayerStatistics } from '../models/PlayerStatistics';
import { SystemMetrics } from '../models/SystemMetrics';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { TeamPlayer } from '../models/TeamPlayer';
import { Availability } from '../models/Availability';
import { logger } from '../config/logger';

export interface PlayerPerformanceData {
  userId: number;
  userName: string;
  email: string;
  gamesPlayed: number;
  availabilityRate: number;
  participationRate: number;
  preferredPosition: string;
  timesGoalkeeper: number;
  timesSubstitute: number;
  lastPlayedDate?: Date;
}

export interface TeamAnalytics {
  totalTeamsGenerated: number;
  averagePlayersPerTeam: number;
  positionDistribution: Record<string, number>;
  goalkeeperDistribution: {
    teamsWithGoalkeeper: number;
    teamsWithoutGoalkeeper: number;
    averageGoalkeepersPerTeam: number;
  };
  substituteAnalytics: {
    averageSubstitutesPerMatch: number;
    mostCommonSubstitutePositions: Array<{
      position: string;
      count: number;
    }>;
  };
}

export interface SystemAnalytics {
  userActivity: {
    totalActiveUsers: number;
    newUsersThisMonth: number;
    averageLoginFrequency: number;
  };
  availability: {
    averageSubmissionRate: number;
    peakSubmissionHours: number[];
    lateSubmissions: number;
  };
  teamGeneration: {
    totalGenerations: number;
    averageGenerationTime: number;
    failureRate: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    peakUsageHours: number[];
  };
}

export class AnalyticsService {
  private playerStatsRepository: Repository<PlayerStatistics>;
  private systemMetricsRepository: Repository<SystemMetrics>;
  private userRepository: Repository<User>;
  private teamRepository: Repository<Team>;
  private teamPlayerRepository: Repository<TeamPlayer>;
  private availabilityRepository: Repository<Availability>;

  constructor() {
    this.playerStatsRepository = AppDataSource.getRepository(PlayerStatistics);
    this.systemMetricsRepository = AppDataSource.getRepository(SystemMetrics);
    this.userRepository = AppDataSource.getRepository(User);
    this.teamRepository = AppDataSource.getRepository(Team);
    this.teamPlayerRepository = AppDataSource.getRepository(TeamPlayer);
    this.availabilityRepository = AppDataSource.getRepository(Availability);
  }

  async updatePlayerStatistics(userId: number, matchDate: Date, wasSelected: boolean, position?: string): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      
      let stats = await this.playerStatsRepository.findOne({
        where: { user_id: userId, season_year: currentYear }
      });

      if (!stats) {
        stats = this.playerStatsRepository.create({
          user_id: userId,
          season_year: currentYear,
          games_played: 0,
          games_available: 0,
          games_unavailable: 0,
          times_goalkeeper: 0,
          times_substitute: 0,
          availability_rate: 0,
          participation_rate: 0,
          preferred_position_played_rate: 0
        });
      }

      // Update availability stats
      const availability = await this.availabilityRepository.findOne({
        where: { user_id: userId, match_date: matchDate }
      });

      if (availability?.is_available) {
        stats.games_available += 1;
        if (wasSelected) {
          stats.games_played += 1;
          stats.last_played_date = matchDate;
          
          if (position === 'goalkeeper') {
            stats.times_goalkeeper += 1;
          }
        }
      } else {
        stats.games_unavailable += 1;
      }

      // Check if player was a substitute
      const teamPlayer = await this.teamPlayerRepository.findOne({
        where: { user_id: userId },
        relations: ['team']
      });

      if (teamPlayer?.is_substitute) {
        stats.times_substitute += 1;
      }

      // Update calculated rates
      stats.updateRates();

      await this.playerStatsRepository.save(stats);

      logger.info('Player statistics updated', {
        userId,
        matchDate,
        wasSelected,
        position
      });
    } catch (error) {
      logger.error('Failed to update player statistics', {
        userId,
        matchDate,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getPlayerPerformanceData(seasonYear?: number): Promise<PlayerPerformanceData[]> {
    try {
      const year = seasonYear || new Date().getFullYear();
      
      const stats = await this.playerStatsRepository
        .createQueryBuilder('stats')
        .leftJoinAndSelect('stats.user', 'user')
        .where('stats.season_year = :year', { year })
        .andWhere('user.is_active = 1')
        .orderBy('stats.availability_rate', 'DESC')
        .getMany();

      return stats.map(stat => ({
        userId: stat.user_id,
        userName: stat.user.name,
        email: stat.user.email,
        gamesPlayed: stat.games_played,
        availabilityRate: stat.availability_rate,
        participationRate: stat.participation_rate,
        preferredPosition: stat.user.preferred_position || 'any',
        timesGoalkeeper: stat.times_goalkeeper,
        timesSubstitute: stat.times_substitute,
        lastPlayedDate: stat.last_played_date
      }));
    } catch (error) {
      logger.error('Failed to get player performance data', {
        seasonYear,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getTeamAnalytics(startDate?: Date, endDate?: Date): Promise<TeamAnalytics> {
    try {
      const dateFilter = startDate && endDate 
        ? 'team.match_date BETWEEN :startDate AND :endDate'
        : 'team.match_date >= date("now", "-30 days")';

      const queryBuilder = this.teamRepository
        .createQueryBuilder('team')
        .leftJoinAndSelect('team.teamPlayers', 'player')
        .leftJoinAndSelect('player.user', 'user');

      if (startDate && endDate) {
        queryBuilder.where(dateFilter, { startDate, endDate });
      } else {
        queryBuilder.where(dateFilter);
      }

      const teams = await queryBuilder.getMany();

      const totalTeamsGenerated = teams.length;
      const totalPlayers = teams.reduce((sum, team) => sum + team.teamPlayers.length, 0);
      const averagePlayersPerTeam = totalTeamsGenerated > 0 ? totalPlayers / totalTeamsGenerated : 0;

      // Position distribution
      const positionDistribution: Record<string, number> = {};
      let teamsWithGoalkeeper = 0;
      let totalGoalkeepers = 0;
      let totalSubstitutes = 0;
      const substitutePositions: Record<string, number> = {};

      teams.forEach(team => {
        let hasGoalkeeper = false;
        team.teamPlayers.forEach(player => {
          const position = player.assigned_position || player.user.preferred_position || 'any';
          positionDistribution[position] = (positionDistribution[position] || 0) + 1;

          if (position === 'goalkeeper') {
            totalGoalkeepers += 1;
            hasGoalkeeper = true;
          }

          if (player.is_substitute) {
            totalSubstitutes += 1;
            const subPosition = player.substitute_for_position || position;
            substitutePositions[subPosition] = (substitutePositions[subPosition] || 0) + 1;
          }
        });

        if (hasGoalkeeper) {
          teamsWithGoalkeeper += 1;
        }
      });

      const mostCommonSubstitutePositions = Object.entries(substitutePositions)
        .map(([position, count]) => ({ position, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalTeamsGenerated,
        averagePlayersPerTeam: Math.round(averagePlayersPerTeam * 100) / 100,
        positionDistribution,
        goalkeeperDistribution: {
          teamsWithGoalkeeper,
          teamsWithoutGoalkeeper: totalTeamsGenerated - teamsWithGoalkeeper,
          averageGoalkeepersPerTeam: totalTeamsGenerated > 0 ? totalGoalkeepers / totalTeamsGenerated : 0
        },
        substituteAnalytics: {
          averageSubstitutesPerMatch: totalTeamsGenerated > 0 ? totalSubstitutes / totalTeamsGenerated : 0,
          mostCommonSubstitutePositions
        }
      };
    } catch (error) {
      logger.error('Failed to get team analytics', {
        startDate,
        endDate,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async recordSystemMetric(
    metricType: string,
    metricName: string,
    value: number,
    unit?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const metric = this.systemMetricsRepository.create({
        metric_type: metricType,
        metric_name: metricName,
        metric_value: value,
        metric_unit: unit,
        metric_date: new Date(),
        metric_hour: new Date().getHours(),
        metadata: metadata ? JSON.stringify(metadata) : undefined
      });

      await this.systemMetricsRepository.save(metric);
    } catch (error) {
      logger.error('Failed to record system metric', {
        metricType,
        metricName,
        value,
        error: (error as Error).message
      });
    }
  }

  async getSystemAnalytics(): Promise<SystemAnalytics> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // User activity metrics
      const totalActiveUsers = await this.userRepository.count({
        where: { is_active: true }
      });

      const newUsersThisMonth = await this.userRepository.count({
        where: { 
          is_active: true,
          created_at: { $gte: thirtyDaysAgo } as any
        }
      });

      // Availability metrics
      const totalAvailabilitySubmissions = await this.availabilityRepository.count({
        where: { match_date: { $gte: thirtyDaysAgo } as any }
      });

      const availableSubmissions = await this.availabilityRepository.count({
        where: { 
          match_date: { $gte: thirtyDaysAgo } as any,
          is_available: true
        }
      });

      const averageSubmissionRate = totalAvailabilitySubmissions > 0 
        ? (availableSubmissions / totalAvailabilitySubmissions) * 100 
        : 0;

      // System performance metrics
      const responseTimeMetrics = await this.systemMetricsRepository.find({
        where: { 
          metric_type: 'response_time',
          metric_date: { $gte: thirtyDaysAgo } as any
        }
      });

      const averageResponseTime = responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, metric) => sum + metric.metric_value, 0) / responseTimeMetrics.length
        : 0;

      const errorMetrics = await this.systemMetricsRepository.count({
        where: { 
          metric_type: 'error_count',
          metric_date: { $gte: thirtyDaysAgo } as any
        }
      });

      return {
        userActivity: {
          totalActiveUsers,
          newUsersThisMonth,
          averageLoginFrequency: 0 // TODO: Implement login tracking
        },
        availability: {
          averageSubmissionRate: Math.round(averageSubmissionRate * 100) / 100,
          peakSubmissionHours: [18, 19, 20], // TODO: Calculate from actual data
          lateSubmissions: 0 // TODO: Implement late submission tracking
        },
        teamGeneration: {
          totalGenerations: await this.teamRepository.count({
            where: { match_date: { $gte: thirtyDaysAgo } as any }
          }),
          averageGenerationTime: 0, // TODO: Implement generation time tracking
          failureRate: 0 // TODO: Implement failure tracking
        },
        performance: {
          averageResponseTime: Math.round(averageResponseTime * 100) / 100,
          errorRate: errorMetrics,
          peakUsageHours: [12, 18, 19] // TODO: Calculate from actual data
        }
      };
    } catch (error) {
      logger.error('Failed to get system analytics', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getAvailabilityTrends(days: number = 30): Promise<Array<{
    date: string;
    availableCount: number;
    totalResponses: number;
    percentage: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await this.availabilityRepository
        .createQueryBuilder('availability')
        .select([
          'DATE(availability.match_date) as date',
          'COUNT(CASE WHEN availability.is_available = 1 THEN 1 END) as availableCount',
          'COUNT(*) as totalResponses'
        ])
        .where('availability.match_date >= :startDate', { startDate })
        .groupBy('DATE(availability.match_date)')
        .orderBy('availability.match_date', 'ASC')
        .getRawMany();

      return trends.map(trend => ({
        date: trend.date,
        availableCount: parseInt(trend.availableCount),
        totalResponses: parseInt(trend.totalResponses),
        percentage: trend.totalResponses > 0 
          ? Math.round((trend.availableCount / trend.totalResponses) * 100)
          : 0
      }));
    } catch (error) {
      logger.error('Failed to get availability trends', {
        days,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async generateDailyReport(): Promise<void> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Record daily metrics
      await this.recordSystemMetric(
        'daily_report',
        'active_users',
        await this.userRepository.count({ where: { is_active: true } })
      );

      await this.recordSystemMetric(
        'daily_report',
        'availability_submissions',
        await this.availabilityRepository.count({
          where: { 
            match_date: yesterday,
            created_at: { $gte: yesterday } as any
          }
        })
      );

      logger.info('Daily analytics report generated', { date: yesterday });
    } catch (error) {
      logger.error('Failed to generate daily report', {
        error: (error as Error).message
      });
    }
  }
}
