import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { User } from '../models/User';
import { logger } from '../config/logger';
import nodemailer from 'nodemailer';
import { config } from '../config/environment';

export interface NotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  sendEmail?: boolean;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private preferenceRepository: Repository<NotificationPreference>;
  private userRepository: Repository<User>;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.preferenceRepository = AppDataSource.getRepository(NotificationPreference);
    this.userRepository = AppDataSource.getRepository(User);
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    try {
      if (config.EMAIL_HOST && config.EMAIL_USER && config.EMAIL_PASS) {
        this.emailTransporter = nodemailer.createTransport({
          host: config.EMAIL_HOST,
          port: config.EMAIL_PORT || 587,
          secure: config.EMAIL_SECURE || false,
          auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS,
          },
        });
        logger.info('Email transporter initialized successfully');
      } else {
        logger.warn('Email configuration not found, email notifications disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error: (error as Error).message });
    }
  }

  async createNotification(data: NotificationData): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : undefined,
      });

      const savedNotification = await this.notificationRepository.save(notification);

      // Send email if requested and user has email notifications enabled
      if (data.sendEmail) {
        await this.sendEmailNotification(savedNotification);
      }

      logger.info('Notification created', {
        notificationId: savedNotification.id,
        userId: data.userId,
        type: data.type
      });

      return savedNotification;
    } catch (error) {
      logger.error('Failed to create notification', {
        userId: data.userId,
        type: data.type,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      if (!this.emailTransporter) {
        logger.warn('Email transporter not available, skipping email notification');
        return;
      }

      const user = await this.userRepository.findOne({
        where: { id: notification.user_id }
      });

      if (!user) {
        logger.error('User not found for notification', { notificationId: notification.id });
        return;
      }

      const preferences = await this.getUserPreferences(user.id);
      if (!preferences.email_notifications) {
        logger.info('User has email notifications disabled', { userId: user.id });
        return;
      }

      const emailTemplate = this.getEmailTemplate(notification);
      
      await this.emailTransporter.sendMail({
        from: config.EMAIL_FROM || config.EMAIL_USER,
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      // Update notification as sent
      await this.notificationRepository.update(notification.id, {
        sent_at: new Date()
      });

      logger.info('Email notification sent', {
        notificationId: notification.id,
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      logger.error('Failed to send email notification', {
        notificationId: notification.id,
        error: (error as Error).message
      });
    }
  }

  private getEmailTemplate(notification: Notification): EmailTemplate {
    const baseTemplate = {
      subject: notification.title,
      text: notification.message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">${notification.title}</h2>
          <p style="color: #34495e; line-height: 1.6;">${notification.message}</p>
          <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            This is an automated message from Football Team Management System.
          </p>
        </div>
      `
    };

    // Customize templates based on notification type
    switch (notification.type) {
      case 'availability_reminder':
        return {
          ...baseTemplate,
          subject: '⚽ Availability Reminder - Football Match',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">⚽ Don't Forget to Submit Your Availability!</h2>
              <p style="color: #34495e; line-height: 1.6;">${notification.message}</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${config.FRONTEND_URL}/availability" 
                   style="background-color: #27ae60; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Submit Availability
                </a>
              </div>
              <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
              <p style="color: #7f8c8d; font-size: 12px;">
                This is an automated reminder from Football Team Management System.
              </p>
            </div>
          `
        };

      case 'team_published':
        return {
          ...baseTemplate,
          subject: '🏆 Teams Announced - Check Your Assignment!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3498db;">🏆 Teams Have Been Announced!</h2>
              <p style="color: #34495e; line-height: 1.6;">${notification.message}</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${config.FRONTEND_URL}/teams" 
                   style="background-color: #3498db; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Teams
                </a>
              </div>
              <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
              <p style="color: #7f8c8d; font-size: 12px;">
                Good luck with your match! ⚽
              </p>
            </div>
          `
        };

      default:
        return baseTemplate;
    }
  }

  async getUserPreferences(userId: number): Promise<NotificationPreference> {
    try {
      let preferences = await this.preferenceRepository.findOne({
        where: { user_id: userId }
      });

      if (!preferences) {
        // Create default preferences
        preferences = this.preferenceRepository.create({
          user_id: userId,
          email_notifications: true,
          availability_reminders: true,
          team_announcements: true,
          admin_updates: true,
          reminder_hours_before: 24
        });
        preferences = await this.preferenceRepository.save(preferences);
      }

      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async updateUserPreferences(userId: number, updates: Partial<NotificationPreference>): Promise<NotificationPreference> {
    try {
      let preferences = await this.getUserPreferences(userId);
      
      Object.assign(preferences, updates);
      preferences = await this.preferenceRepository.save(preferences);

      logger.info('User notification preferences updated', { userId });
      return preferences;
    } catch (error) {
      logger.error('Failed to update user preferences', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getUserNotifications(userId: number, limit: number = 20, offset: number = 0): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const [notifications, total] = await this.notificationRepository.findAndCount({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: limit,
        skip: offset
      });

      const unreadCount = await this.notificationRepository.count({
        where: { user_id: userId, is_read: false }
      });

      return { notifications, total, unreadCount };
    } catch (error) {
      logger.error('Failed to get user notifications', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    try {
      await this.notificationRepository.update(
        { id: notificationId, user_id: userId },
        { is_read: true, read_at: new Date() }
      );

      logger.info('Notification marked as read', { notificationId, userId });
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        notificationId,
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await this.notificationRepository.update(
        { user_id: userId, is_read: false },
        { is_read: true, read_at: new Date() }
      );

      logger.info('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async sendAvailabilityReminders(matchDate: Date): Promise<void> {
    try {
      // Get all active users with reminder preferences
      const users = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.notificationPreferences', 'prefs')
        .where('user.is_active = 1')
        .andWhere('(prefs.availability_reminders IS NULL OR prefs.availability_reminders = 1)')
        .getMany();

      const reminders = users.map(user => ({
        userId: user.id,
        type: 'availability_reminder',
        title: 'Availability Reminder',
        message: `Don't forget to submit your availability for the match on ${matchDate.toDateString()}. The deadline is approaching!`,
        data: { matchDate: matchDate.toISOString() },
        sendEmail: true
      }));

      for (const reminder of reminders) {
        await this.createNotification(reminder);
      }

      logger.info('Availability reminders sent', {
        matchDate,
        recipientCount: reminders.length
      });
    } catch (error) {
      logger.error('Failed to send availability reminders', {
        matchDate,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async sendTeamAnnouncementNotifications(matchDate: Date): Promise<void> {
    try {
      // Get all active users with team announcement preferences
      const users = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.notificationPreferences', 'prefs')
        .where('user.is_active = 1')
        .andWhere('(prefs.team_announcements IS NULL OR prefs.team_announcements = 1)')
        .getMany();

      const notifications = users.map(user => ({
        userId: user.id,
        type: 'team_published',
        title: 'Teams Announced!',
        message: `Teams for the match on ${matchDate.toDateString()} have been published. Check your team assignment!`,
        data: { matchDate: matchDate.toISOString() },
        sendEmail: true
      }));

      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      logger.info('Team announcement notifications sent', {
        matchDate,
        recipientCount: notifications.length
      });
    } catch (error) {
      logger.error('Failed to send team announcement notifications', {
        matchDate,
        error: (error as Error).message
      });
      throw error;
    }
  }
}
