import { AppDataSource, initializeDatabase } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import bcrypt from 'bcrypt';
import { logger } from '../config/logger';

async function createAdmin() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    const adminEmail = 'c.iwuchukwu@yahoo.com';
    const adminPassword = 'iwuchukwu';

    // Get repositories
    const userRepo = AppDataSource.getRepository(User);
    const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);

    // Check if admin already exists
    let adminUser = await userRepo.findOne({
      where: { email: adminEmail }
    });

    if (adminUser) {
      logger.info('Admin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser.password = hashedPassword;
      adminUser.is_admin = true;
      adminUser.is_active = true;
      await userRepo.save(adminUser);
      logger.info('Admin password updated');
    } else {
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
      logger.info('Admin user created');
    }

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
        logger.info('Added email to allowed list');
      }
    } else {
      // Update to used if not already
      existingAllowedEmail.used = true;
      await allowedEmailRepo.save(existingAllowedEmail);
      logger.info('Updated allowed email status');
    }

    logger.info(`
========================================
Admin setup complete!
Email: ${adminEmail}
Password: ${adminPassword}
========================================
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Failed to create admin:', error);
    process.exit(1);
  }
}

// Run the script
createAdmin(); 