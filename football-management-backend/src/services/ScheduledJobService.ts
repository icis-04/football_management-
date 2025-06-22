import cron from 'node-cron';
import { TeamGenerationService } from './TeamGenerationService';
import { AvailabilityService } from './AvailabilityService';
import { logger } from '../config/logger';

export class ScheduledJobService {
  private teamGenerationService: TeamGenerationService;
  private availabilityService: AvailabilityService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.teamGenerationService = new TeamGenerationService();
    this.availabilityService = new AvailabilityService();
  }

  /**
   * Initialize all scheduled jobs
   */
  initializeJobs(): void {
    try {
      // Generate and publish teams at 12:00 PM on Mondays
      const mondayJob = cron.schedule('0 12 * * 1', async () => {
        await this.handleMondayTeamGeneration();
      }, {
        scheduled: true,
        timezone: 'UTC',
      });
      this.jobs.set('mondayTeamGeneration', mondayJob);

      // Generate and publish teams at 12:00 PM on Wednesdays
      const wednesdayJob = cron.schedule('0 12 * * 3', async () => {
        await this.handleWednesdayTeamGeneration();
      }, {
        scheduled: true,
        timezone: 'UTC',
      });
      this.jobs.set('wednesdayTeamGeneration', wednesdayJob);

      // Clean up old data monthly (1st day of month at midnight)
      const cleanupJob = cron.schedule('0 0 1 * *', async () => {
        await this.handleDataCleanup();
      }, {
        scheduled: true,
        timezone: 'UTC',
      });
      this.jobs.set('dataCleanup', cleanupJob);

      logger.info('Scheduled jobs initialized', {
        jobCount: this.jobs.size,
        jobs: Array.from(this.jobs.keys()),
      });
    } catch (error) {
      logger.error('Failed to initialize scheduled jobs', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle Monday team generation and publication
   */
  private async handleMondayTeamGeneration(): Promise<void> {
    try {
      const today = new Date();
      const mondayDate = new Date(today);
      
      // Ensure it's Monday
      if (mondayDate.getDay() !== 1) {
        logger.warn('Monday job triggered on non-Monday', {
          actualDay: mondayDate.getDay(),
          date: mondayDate.toISOString(),
        });
        return;
      }

      logger.info('Starting Monday team generation', {
        date: mondayDate.toISOString().split('T')[0],
      });

      // Generate teams
      const result = await this.teamGenerationService.generateTeams(mondayDate);
      
      if (result.error) {
        logger.warn('Monday team generation failed', {
          date: mondayDate.toISOString().split('T')[0],
          error: result.error,
          playerCount: result.totalPlayers,
        });
        return;
      }

      // Publish teams immediately (it's 12 PM)
      await this.teamGenerationService.publishTeams(mondayDate);

      logger.info('Monday team generation and publication completed', {
        date: mondayDate.toISOString().split('T')[0],
        teamCount: result.teams.length,
        totalPlayers: result.totalPlayers,
      });
    } catch (error) {
      logger.error('Monday team generation job failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
  }

  /**
   * Handle Wednesday team generation and publication
   */
  private async handleWednesdayTeamGeneration(): Promise<void> {
    try {
      const today = new Date();
      const wednesdayDate = new Date(today);
      
      // Ensure it's Wednesday
      if (wednesdayDate.getDay() !== 3) {
        logger.warn('Wednesday job triggered on non-Wednesday', {
          actualDay: wednesdayDate.getDay(),
          date: wednesdayDate.toISOString(),
        });
        return;
      }

      logger.info('Starting Wednesday team generation', {
        date: wednesdayDate.toISOString().split('T')[0],
      });

      // Generate teams
      const result = await this.teamGenerationService.generateTeams(wednesdayDate);
      
      if (result.error) {
        logger.warn('Wednesday team generation failed', {
          date: wednesdayDate.toISOString().split('T')[0],
          error: result.error,
          playerCount: result.totalPlayers,
        });
        return;
      }

      // Publish teams immediately (it's 12 PM)
      await this.teamGenerationService.publishTeams(wednesdayDate);

      logger.info('Wednesday team generation and publication completed', {
        date: wednesdayDate.toISOString().split('T')[0],
        teamCount: result.teams.length,
        totalPlayers: result.totalPlayers,
      });
    } catch (error) {
      logger.error('Wednesday team generation job failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
  }

  /**
   * Handle monthly data cleanup
   */
  private async handleDataCleanup(): Promise<void> {
    try {
      logger.info('Starting monthly data cleanup');

      // Clean up old availability records
      await this.availabilityService.cleanupOldAvailability();

      // TODO: Add more cleanup tasks as needed
      // - Old team records
      // - Old audit logs
      // - Unused uploaded files

      logger.info('Monthly data cleanup completed');
    } catch (error) {
      logger.error('Monthly data cleanup job failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
  }

  /**
   * Manually trigger team generation for a specific date
   */
  async manualTeamGeneration(matchDate: Date): Promise<any> {
    try {
      logger.info('Manual team generation triggered', {
        date: matchDate.toISOString().split('T')[0],
      });

      const result = await this.teamGenerationService.generateTeams(matchDate);
      
      // If it's past 12 PM on the match day, publish immediately
      const now = new Date();
      const matchDay = new Date(matchDate);
      matchDay.setHours(12, 0, 0, 0);
      
      if (now >= matchDay) {
        await this.teamGenerationService.publishTeams(matchDate);
        logger.info('Teams published immediately (past deadline)', {
          date: matchDate.toISOString().split('T')[0],
        });
      }

      return result;
    } catch (error) {
      logger.error('Manual team generation failed', {
        date: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs(): void {
    try {
      this.jobs.forEach((job, name) => {
        job.stop();
        logger.info('Stopped scheduled job', { jobName: name });
      });
      
      this.jobs.clear();
      logger.info('All scheduled jobs stopped');
    } catch (error) {
      logger.error('Failed to stop scheduled jobs', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get status of all jobs
   */
  getJobStatus(): any[] {
    return Array.from(this.jobs.entries()).map(([name, _job]) => ({
      name,
      scheduled: true,
      status: 'active',
    }));
  }
} 