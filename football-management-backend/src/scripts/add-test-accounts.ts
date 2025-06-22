import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import bcrypt from 'bcrypt';

const testAccounts = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    preferred_position: 'Midfielder',
    is_admin: true
  },
  {
    email: 'player@test.com',
    password: 'password123',
    name: 'Test Player',
    preferred_position: 'Midfielder',
    is_admin: false
  },
  {
    email: 'goalkeeper@test.com',
    password: 'keeper123',
    name: 'Test Goalkeeper',
    preferred_position: 'Goalkeeper',
    is_admin: false
  },
  {
    email: 'forward@test.com',
    password: 'striker123',
    name: 'Test Forward',
    preferred_position: 'Forward',
    is_admin: false
  }
];

async function addTestAccounts() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);
    const allowedEmailRepository = AppDataSource.getRepository(AllowedEmail);

    // First, create the admin user if it doesn't exist
    let adminUser = await userRepository.findOne({
      where: { email: 'admin@test.com' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = userRepository.create({
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Admin User',
        preferred_position: 'Midfielder',
        is_admin: true,
        is_active: true
      });
      await userRepository.save(adminUser);
      console.log('Created admin user: admin@test.com');
    }

    // Add all test emails to allowed emails with admin as the creator
    for (const account of testAccounts) {
      const existingAllowedEmail = await allowedEmailRepository.findOne({
        where: { email: account.email }
      });

      if (!existingAllowedEmail) {
        const allowedEmail = allowedEmailRepository.create({
          email: account.email,
          used: true,
          added_by_admin_id: adminUser.id
        });
        await allowedEmailRepository.save(allowedEmail);
        console.log(`Added ${account.email} to allowed emails`);
      }
    }

    // Now create the remaining user accounts
    for (const account of testAccounts) {
      // Skip admin since we already created it
      if (account.email === 'admin@test.com') {
        continue;
      }

      const existingUser = await userRepository.findOne({
        where: { email: account.email }
      });

      if (existingUser) {
        console.log(`User ${account.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(account.password, 10);
      const user = userRepository.create({
        email: account.email,
        password: hashedPassword,
        name: account.name,
        preferred_position: account.preferred_position,
        is_admin: account.is_admin,
        is_active: true
      });

      await userRepository.save(user);
      console.log(`Created user: ${account.email} (admin: ${account.is_admin})`);
    }

    // Also add a pattern for @test.com emails to allowed emails
    const testEmailPattern = await allowedEmailRepository.findOne({
      where: { email: '*@test.com' }
    });

    if (!testEmailPattern) {
      const allowedPattern = allowedEmailRepository.create({
        email: '*@test.com',
        used: false,
        added_by_admin_id: adminUser.id
      });
      await allowedEmailRepository.save(allowedPattern);
      console.log('Added *@test.com pattern to allowed emails');
    }

    console.log('\nAll test accounts created successfully!');
    console.log('\nTest accounts:');
    testAccounts.forEach(acc => {
      console.log(`- ${acc.email} / ${acc.password} (${acc.is_admin ? 'Admin' : 'Player'})`);
    });

  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the script
addTestAccounts(); 