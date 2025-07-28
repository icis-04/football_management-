import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import bcrypt from 'bcrypt';
import { logger } from '../config/logger';

export async function initializeAdminUser() {
  try {
    const adminEmail = 'c.iwuchukwu@yahoo.com';
    const adminPassword = 'iwuchukwu';

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);

    // Check if admin already exists
    let adminUser = await userRepo.findOne({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      // Create admin user first
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = userRepo.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'C. Iwuchukwu',
        preferred_position: 'any',
        is_admin: true,
        is_active: true
      });
      adminUser = await userRepo.save(adminUser);
      logger.info('Admin user created during initialization');

      // Check if email is in allowed list
      const existingAllowedEmail = await allowedEmailRepo.findOne({
        where: { email: adminEmail }
      });

      if (!existingAllowedEmail) {
        // Get any admin to use as creator (or use the newly created admin)
        const anyAdmin = await userRepo.findOne({
          where: { is_admin: true }
        });

        if (anyAdmin) {
          const newAllowedEmail = allowedEmailRepo.create({
            email: adminEmail,
            added_by_admin_id: anyAdmin.id,
            used: true
          });
          await allowedEmailRepo.save(newAllowedEmail);
          logger.info('Added admin email to allowed list during initialization');
        }
      }
    }
  } catch (error) {
    logger.error('Failed to initialize admin user:', error);
    // Don't throw - we don't want to prevent app startup
  }
} 