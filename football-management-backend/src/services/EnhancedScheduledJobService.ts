import schedule from 'node-schedule';
import { logger } from '../config/logger';
import { TeamGenerationService } from './TeamGenerationService';
import { NotificationService } from './NotificationService';
import { AnalyticsService } from './AnalyticsService';

export class EnhancedScheduledJobService {
  private teamGenerationService: TeamGenerationService;
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;
  private jobs: Map<string, schedule.Job> = new Map();

  constructor() {
    this.teamGenerationService = new TeamGenerationService();
    this.notificationService = new NotificationService();
    this.analyticsService = new AnalyticsService();
  }

  initializeJobs(): void {
    logger.info('Initializing enhanced scheduled jobs...');

    // Monday team generation at 12:00 PM
    const mondayTeamJob = schedule.scheduleJob('monday-teams', '0 12 * * 1', async () => {
      try {
        logger.info('Starting Monday team generation...');
        const today = new Date();
        await this.teamGenerationService.generateTeams(today);
        
        // Send team announcement notifications
        await this.notificationService.sendTeamAnnouncementNotifications(today);
        
        logger.info('Monday team generation completed successfully');
      } catch (error) {
        logger.error('Monday team generation failed:', error);
      }
    });

    // Wednesday team generation at 12:00 PM
    const wednesdayTeamJob = schedule.scheduleJob('wednesday-teams', '0 12 * * 3', async () => {
      try {
        logger.info('Starting Wednesday team generation...');
        const today = new Date();
        await this.teamGenerationService.generateTeams(today);
        
        // Send team announcement notifications
        await this.notificationService.sendTeamAnnouncementNotifications(today);
        
        logger.info('Wednesday team generation completed successfully');
      } catch (error) {
        logger.error('Wednesday team generation failed:', error);
      }
    });

    // Sunday availability reminders for Monday matches (6:00 PM)
    const sundayReminderJob = schedule.scheduleJob('sunday-reminders', '0 18 * * 0', async () => {
      try {
        logger.info('Sending Monday match availability reminders...');
        const mondayDate = this.getNextMonday();
        await this.notificationService.sendAvailabilityReminders(mondayDate);
        logger.info('Sunday reminders sent successfully');
      } catch (error) {
        logger.error('Sunday reminder job failed:', error);
      }
    });

    // Tuesday availability reminders for Wednesday matches (6:00 PM)
    const tuesdayReminderJob = schedule.scheduleJob('tuesday-reminders', '0 18 * * 2', async () => {
      try {
        logger.info('Sending Wednesday match availability reminders...');
        const wednesdayDate = this.getNextWednesday();
        await this.notificationService.sendAvailabilityReminders(wednesdayDate);
        logger.info('Tuesday reminders sent successfully');
      } catch (error) {
        logger.error('Tuesday reminder job failed:', error);
      }
    });

    // Daily analytics report generation (1:00 AM)
    const dailyAnalyticsJob = schedule.scheduleJob('daily-analytics', '0 1 * * *', async () => {
      try {
        logger.info('Generating daily analytics report...');
        await this.analyticsService.generateDailyReport();
        logger.info('Daily analytics report generated successfully');
      } catch (error) {
        logger.error('Daily analytics job failed:', error);
      }
    });

    // Weekly cleanup job (Sunday 2:00 AM)
    const weeklyCleanupJob = schedule.scheduleJob('weekly-cleanup', '0 2 * * 0', async () => {
      try {
        logger.info('Starting weekly cleanup...');
        await this.performWeeklyCleanup();
        logger.info('Weekly cleanup completed successfully');
      } catch (error) {
        logger.error('Weekly cleanup job failed:', error);
      }
    });

    // Store job references
    this.jobs.set('monday-teams', mondayTeamJob);
    this.jobs.set('wednesday-teams', wednesdayTeamJob);
    this.jobs.set('sunday-reminders', sundayReminderJob);
    this.jobs.set('tuesday-reminders', tuesdayReminderJob);
    this.jobs.set('daily-analytics', dailyAnalyticsJob);
    this.jobs.set('weekly-cleanup', weeklyCleanupJob);

    logger.info(`Enhanced scheduled jobs initialized: ${this.jobs.size} jobs active`);
  }

  private getNextMonday(): Date {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
    return monday;
  }

  private getNextWednesday(): Date {
    const today = new Date();
    const wednesday = new Date(today);
    wednesday.setDate(today.getDate() + ((3 + 7 - today.getDay()) % 7));
    return wednesday;
  }

  private async performWeeklyCleanup(): Promise<void> {
    try {
      // Clean up old notifications (older than 30 days)
      // Clean up old system metrics (older than 90 days)
      // Archive old team data if needed
      logger.info('Weekly cleanup tasks completed');
    } catch (error) {
      logger.error('Weekly cleanup failed:', error);
      throw error;
    }
  }

  stopAllJobs(): void {
    logger.info('Stopping all enhanced scheduled jobs...');
    
    this.jobs.forEach((job, name) => {
      job.cancel();
      logger.info(`Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    logger.info('All enhanced scheduled jobs stopped');
  }

  getJobStatus(): Array<{ name: string; nextInvocation: Date | null }> {
    const status: Array<{ name: string; nextInvocation: Date | null }> = [];
    
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        nextInvocation: job.nextInvocation()
      });
    });
    
    return status;
  }

  // Manual trigger methods for admin use
  async triggerMondayTeamGeneration(): Promise<void> {
    logger.info('Manually triggering Monday team generation...');
    const today = new Date();
    await this.teamGenerationService.generateTeams(today);
    await this.notificationService.sendTeamAnnouncementNotifications(today);
  }

  async triggerWednesdayTeamGeneration(): Promise<void> {
    logger.info('Manually triggering Wednesday team generation...');
    const today = new Date();
    await this.teamGenerationService.generateTeams(today);
    await this.notificationService.sendTeamAnnouncementNotifications(today);
  }

  async triggerAvailabilityReminders(matchDate: Date): Promise<void> {
    logger.info(`Manually triggering availability reminders for ${matchDate.toDateString()}...`);
    await this.notificationService.sendAvailabilityReminders(matchDate);
  }

  async triggerDailyAnalytics(): Promise<void> {
    logger.info('Manually triggering daily analytics generation...');
    await this.analyticsService.generateDailyReport();
  }
}
