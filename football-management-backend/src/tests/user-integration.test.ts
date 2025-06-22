import request from 'supertest';
import App from '../app';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { hashPassword } from '../utils';

describe('User Integration Tests', () => {
  let app: App;
  let server: any;
  let userToken: string;
  let testUser: User;

  beforeAll(async () => {
    // Initialize app and database
    app = new App();
    server = app.app;
    
    // Wait for database to be ready and sync schema
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.synchronize(true); // Force sync schema
    
    // Clean up test data properly
    const userRepo = AppDataSource.getRepository(User);
    const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);
    
    // Delete all users and allowed emails
    await userRepo.clear();
    await allowedEmailRepo.clear();

    // Create test admin user for allowed email
    const adminUser = new User();
    adminUser.email = 'admin@test.com';
    adminUser.name = 'Admin User';
    adminUser.password = await hashPassword('password123');
    adminUser.is_admin = true;
    adminUser.is_active = true;
    adminUser.preferred_position = 'any';
    const savedAdmin = await userRepo.save(adminUser);

    // Create allowed email
    const allowedEmail = new AllowedEmail();
    allowedEmail.email = 'test@example.com';
    allowedEmail.added_by_admin_id = savedAdmin.id;
    allowedEmail.used = false;
    await allowedEmailRepo.save(allowedEmail);

    // Mark allowed email as used
    allowedEmail.used = true;
    await allowedEmailRepo.save(allowedEmail);

    // Create test user
    testUser = new User();
    testUser.email = 'test@example.com';
    testUser.name = 'Test User';
    testUser.password = await hashPassword('password123');
    testUser.is_admin = false;
    testUser.is_active = true;
    testUser.preferred_position = 'midfielder';
    testUser = await userRepo.save(testUser);

    // Login to get token
    const loginResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    userToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up properly with correct order for foreign keys
    if (AppDataSource.isInitialized) {
      const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);
      const userRepo = AppDataSource.getRepository(User);
      
      // Delete allowed emails first (they reference users)
      await allowedEmailRepo.clear();
      // Then delete users
      await userRepo.clear();
      
      await AppDataSource.destroy();
    }
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile', async () => {
      const response = await request(server)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: 'test@example.com',
        name: 'Test User',
        preferred_position: 'midfielder',
        is_admin: false,
      });
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(server).get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        preferredPosition: 'forward',
      };

      const response = await request(server)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Updated Name');
      expect(response.body.data.user.preferred_position).toBe('forward');
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should validate update data', async () => {
      const response = await request(server)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'A', // Too short
          preferredPosition: 'invalid', // Invalid position
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/users/players', () => {
    it('should get all active players', async () => {
      const response = await request(server)
        .get('/api/v1/users/players')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.players)).toBe(true);
      expect(response.body.data.players.length).toBeGreaterThan(0);
      
      // Check that passwords are not included
      response.body.data.players.forEach((player: any) => {
        expect(player.password).toBeUndefined();
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('name');
        expect(player).toHaveProperty('email');
        expect(player).toHaveProperty('preferred_position');
      });
    });
  });

  describe('DELETE /api/v1/users/me/avatar', () => {
    it('should remove profile picture', async () => {
      const response = await request(server)
        .delete('/api/v1/users/me/avatar')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.profile_pic_url).toBeNull();
      expect(response.body.message).toBe('Avatar removed successfully');
    });
  });
}); 