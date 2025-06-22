import { DataSource } from 'typeorm';
import { config } from './environment';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { Availability } from '../models/Availability';
import { Team } from '../models/Team';
import { TeamPlayer } from '../models/TeamPlayer';
import { AdminAuditLog } from '../models/AdminAuditLog';
// Phase 6 models
import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { PlayerStatistics } from '../models/PlayerStatistics';
import { SystemMetrics } from '../models/SystemMetrics';
import { TeamTemplate } from '../models/TeamTemplate';

/**
 * Database configuration and connection setup
 */
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: config.DATABASE_PATH,
  synchronize: config.NODE_ENV === 'development',
  logging: config.NODE_ENV === 'development',
  entities: [
    User, 
    AllowedEmail, 
    Availability, 
    Team, 
    TeamPlayer, 
    AdminAuditLog,
    // Phase 6 entities
    Notification,
    NotificationPreference,
    PlayerStatistics,
    SystemMetrics,
    TeamTemplate
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('Database connection established successfully');
    return AppDataSource;
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error during database closure:', error);
    throw error;
  }
};
