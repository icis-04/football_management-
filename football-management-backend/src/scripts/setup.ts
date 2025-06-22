import { initializeDatabase } from '../config/database';
import { AdminService } from '../services/AdminService';
import { logger } from '../config/logger';

async function setupDatabase() {
  try {
    logger.info('Starting database setup...');
    
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Create admin service
    const adminService = new AdminService();

    // Create initial admin user
    try {
      const admin = await adminService.createInitialAdmin(
        'admin@football.com',
        'admin123',
        'System Administrator'
      );
      logger.info('Initial admin created:', { id: admin.id, email: admin.email });
    } catch (error) {
      if ((error as Error).message === 'ADMIN_ALREADY_EXISTS') {
        logger.info('Admin already exists, skipping creation');
      } else {
        throw error;
      }
    }

    // Add some allowed emails for testing
    const testEmails = [
      'player1@test.com',
      'player2@test.com',
      'player3@test.com',
      'goalkeeper1@test.com',
      'midfielder1@test.com',
    ];

    for (const email of testEmails) {
      try {
        await adminService.addAllowedEmail(email, 1); // Assuming admin ID is 1
        logger.info('Added allowed email:', email);
      } catch (error) {
        if ((error as Error).message === 'EMAIL_ALREADY_ALLOWED') {
          logger.info('Email already allowed:', email);
        } else {
          logger.error('Failed to add email:', email, error);
        }
      }
    }

    logger.info('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase }; 