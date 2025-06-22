import bcrypt from 'bcrypt';
import { User } from '../../models/User';
import { AllowedEmail } from '../../models/AllowedEmail';
import { AppDataSource } from '../../config/database';

/**
 * Create a test user with default values
 */
export async function createTestUser(
  email: string,
  name: string,
  preferredPosition: string = 'midfielder',
  isActive: boolean = true
): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = userRepository.create({
    email,
    name,
    password: hashedPassword,
    preferred_position: preferredPosition,
    is_admin: false,
    is_active: isActive,
  });
  
  return await userRepository.save(user);
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(
  email: string,
  name: string,
  isActive: boolean = true
): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);
  const allowedEmailRepository = AppDataSource.getRepository(AllowedEmail);
  
  // Create admin user first
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = userRepository.create({
    email,
    name,
    password: hashedPassword,
    preferred_position: 'any',
    is_admin: true,
    is_active: isActive,
  });
  
  const savedAdmin = await userRepository.save(admin);
  
  // Add admin email to allowed emails
  const allowedEmail = allowedEmailRepository.create({
    email,
    added_by_admin_id: savedAdmin.id,
    used: true,
  });
  await allowedEmailRepository.save(allowedEmail);
  
  return savedAdmin;
}

/**
 * Create multiple test users at once
 */
export async function createMultipleTestUsers(
  count: number,
  baseEmail: string = 'user',
  baseName: string = 'User'
): Promise<User[]> {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const email = `${baseEmail}${i}@test.com`;
    const name = `${baseName} ${i}`;
    const position = i % 4 === 0 ? 'goalkeeper' : 
                   i % 4 === 1 ? 'defender' :
                   i % 4 === 2 ? 'midfielder' : 'forward';
    
    const user = await createTestUser(email, name, position);
    users.push(user);
  }
  
  return users;
}
