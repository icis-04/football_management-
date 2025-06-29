import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { AdminAuditLog } from '../models/AdminAuditLog';
import { logger } from '../config/logger';

export class AdminService {
  private userRepository = AppDataSource.getRepository(User);
  private allowedEmailRepository = AppDataSource.getRepository(AllowedEmail);
  private auditLogRepository = AppDataSource.getRepository(AdminAuditLog);

  async getAllUsers() {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'email', 'name', 'preferred_position', 'is_admin', 'is_active', 'created_at'],
        order: { created_at: 'DESC' }
      });
      return users;
    } catch (error) {
      logger.error('Failed to get all users:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, isActive: boolean, adminId: number) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Prevent deactivating admin users
      if (!isActive && user.is_admin) {
        throw new Error('CANNOT_DEACTIVATE_ADMIN');
      }

      user.is_active = isActive;
      await this.userRepository.save(user);

      // Log the action
      await this.createAuditLog(adminId, 'UPDATE_USER_STATUS', 'user', userId, `Set active to ${isActive}`);

      return user;
    } catch (error) {
      logger.error('Failed to update user status:', error);
      throw error;
    }
  }

  async getAllowedEmails() {
    try {
      const emails = await this.allowedEmailRepository.find({
        order: { created_at: 'DESC' }
      });
      return emails;
    } catch (error) {
      logger.error('Failed to get allowed emails:', error);
      throw error;
    }
  }

  async addAllowedEmail(email: string, adminId: number) {
    try {
      const existing = await this.allowedEmailRepository.findOne({ where: { email } });
      if (existing) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      const allowedEmail = this.allowedEmailRepository.create({
        email,
        added_by_admin_id: adminId,
        used: false
      });

      await this.allowedEmailRepository.save(allowedEmail);
      await this.createAuditLog(adminId, 'ADD_ALLOWED_EMAIL', 'allowed_email', allowedEmail.id, email);

      return allowedEmail;
    } catch (error) {
      logger.error('Failed to add allowed email:', error);
      throw error;
    }
  }

  async removeAllowedEmail(emailId: number, adminId: number) {
    try {
      const email = await this.allowedEmailRepository.findOne({ where: { id: emailId } });
      if (!email) {
        throw new Error('EMAIL_NOT_FOUND');
      }

      if (email.used) {
        throw new Error('EMAIL_ALREADY_USED');
      }

      await this.allowedEmailRepository.remove(email);
      await this.createAuditLog(adminId, 'REMOVE_ALLOWED_EMAIL', 'allowed_email', emailId, email.email);

      return true;
    } catch (error) {
      logger.error('Failed to remove allowed email:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({ where: { is_active: true } });
      const totalAllowedEmails = await this.allowedEmailRepository.count();
      const usedEmails = await this.allowedEmailRepository.count({ where: { used: true } });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalAllowedEmails,
        usedEmails,
        unusedEmails: totalAllowedEmails - usedEmails
      };
    } catch (error) {
      logger.error('Failed to get admin stats:', error);
      throw error;
    }
  }

  async createAuditLog(adminId: number, action: string, targetType?: string, targetId?: number, details?: string) {
    try {
      const log = this.auditLogRepository.create({
        admin_id: adminId,
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        details: details || null
      });
      await this.auditLogRepository.save(log);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw, just log the error
    }
  }

  async getAuditLogs(limit: number = 50, offset: number = 0) {
    try {
      const logs = await this.auditLogRepository.find({
        order: { created_at: 'DESC' },
        take: limit,
        skip: offset
      });
      return logs;
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  async bulkAddAllowedEmails(emails: string[], adminId: number) {
    const result = {
      added: [] as AllowedEmail[],
      skipped: [] as string[],
      errors: [] as { email: string; error: string }[]
    };

    for (const email of emails) {
      try {
        const existing = await this.allowedEmailRepository.findOne({ where: { email } });
        if (existing) {
          result.skipped.push(email);
          continue;
        }

        const allowedEmail = this.allowedEmailRepository.create({
          email,
          added_by_admin_id: adminId,
          used: false
        });

        await this.allowedEmailRepository.save(allowedEmail);
        await this.createAuditLog(adminId, 'ADD_ALLOWED_EMAIL', 'allowed_email', allowedEmail.id, email);
        result.added.push(allowedEmail);
      } catch (error) {
        result.errors.push({ email, error: (error as Error).message });
      }
    }

    return result;
  }

  async getAvailabilityAnalytics() {
    // TODO: Implement availability analytics
    // For now, return placeholder data
    return {
      totalPlayers: 0,
      activePlayers: 0,
      averageAvailability: 0,
      weeklyTrends: []
    };
  }
} 