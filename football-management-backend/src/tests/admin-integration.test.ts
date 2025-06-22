import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { AdminAuditLog } from '../models/AdminAuditLog';
import bcrypt from 'bcrypt';

describe('Admin Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    // Force synchronization to ensure all tables are created
    await AppDataSource.synchronize(true);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clear all tables
    await AppDataSource.getRepository(AdminAuditLog).clear();
    await AppDataSource.getRepository(AllowedEmail).clear();
    await AppDataSource.getRepository(User).clear();

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userRepo = AppDataSource.getRepository(User);
    
    adminUser = userRepo.create({
      email: 'admin@test.com',
      name: 'Admin User',
      password: hashedPassword,
      preferred_position: 'midfielder',
      is_admin: true,
      is_active: true
    });
    await userRepo.save(adminUser);

    // Create regular user
    regularUser = userRepo.create({
      email: 'user@test.com',
      name: 'Regular User',
      password: hashedPassword,
      preferred_position: 'forward',
      is_admin: false,
      is_active: true
    });
    await userRepo.save(regularUser);

    // Get tokens
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    adminToken = adminLoginResponse.body.data.accessToken;

    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });
    userToken = userLoginResponse.body.data.accessToken;
  });

  describe('Admin Access Control', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('ADMIN_ACCESS_REQUIRED');
    });

    it('should allow access to admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users');

      expect(response.status).toBe(401);
    });
  });

  describe('Allowed Email Management', () => {
    it('should add a new allowed email', async () => {
      const response = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@test.com');
      expect(response.body.data.used).toBe(false);
      expect(response.body.data.addedBy).toBe('Admin User');
    });

    it('should prevent adding duplicate emails', async () => {
      // Add email first time
      await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'duplicate@test.com'
        });

      // Try to add same email again
      const response = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'duplicate@test.com'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('EMAIL_ALREADY_ALLOWED');
    });

    it('should mark email as used if user already registered', async () => {
      const response = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'user@test.com' // This user already exists
        });

      expect(response.status).toBe(201);
      expect(response.body.data.used).toBe(true);
    });

    it('should get all allowed emails', async () => {
      // Add a few emails
      await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'email1@test.com' });

      await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'email2@test.com' });

      const response = await request(app)
        .get('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('used');
      expect(response.body.data[0]).toHaveProperty('addedBy');
    });

    it('should remove allowed email', async () => {
      // Add email first
      const addResponse = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'todelete@test.com' });

      const emailId = addResponse.body.data.id;

      // Remove email
      const response = await request(app)
        .delete(`/api/v1/admin/allowed-emails/${emailId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify email is removed
      const getResponse = await request(app)
        .get('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.body.data).toHaveLength(0);
    });

    it('should prevent removing used email', async () => {
      // Add email for existing user
      const addResponse = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'user@test.com' });

      const emailId = addResponse.body.data.id;

      // Try to remove used email
      const response = await request(app)
        .delete(`/api/v1/admin/allowed-emails/${emailId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('EMAIL_ALREADY_USED');
    });

    it('should bulk add allowed emails', async () => {
      const emails = [
        'bulk1@test.com',
        'bulk2@test.com',
        'bulk3@test.com'
      ];

      const response = await request(app)
        .post('/api/v1/admin/allowed-emails/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.added).toHaveLength(3);
      expect(response.body.data.skipped).toHaveLength(0);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should handle invalid emails in bulk add', async () => {
      const emails = [
        'valid@test.com',
        'invalid-email',
        'another@test.com'
      ];

      const response = await request(app)
        .post('/api/v1/admin/allowed-emails/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ emails });

      expect(response.status).toBe(201);
      expect(response.body.data.added).toHaveLength(2);
      expect(response.body.data.errors).toHaveLength(1);
    });
  });

  describe('User Management', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const users = response.body.data;
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('isActive');
      expect(users[0]).toHaveProperty('isAdmin');
      expect(users[0]).toHaveProperty('preferredPosition');
    });

    it('should deactivate user', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');
    });

    it('should activate user', async () => {
      // First deactivate
      await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      // Then activate
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('activated');
    });

    it('should prevent deactivating admin users', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${adminUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('CANNOT_DEACTIVATE_ADMIN');
    });

    it('should handle non-existent user', async () => {
      const response = await request(app)
        .put('/api/v1/admin/users/99999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('USER_NOT_FOUND');
    });
  });

  describe('Analytics', () => {
    it('should get availability analytics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/availability')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalMatches');
      expect(response.body.data).toHaveProperty('averageAvailability');
      expect(response.body.data).toHaveProperty('topPlayers');
      expect(response.body.data).toHaveProperty('availabilityTrends');
    });
  });

  describe('Audit Log', () => {
    it('should get audit log', async () => {
      // Perform some admin actions to create audit entries
      await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'audit@test.com' });

      const response = await request(app)
        .get('/api/v1/admin/audit-log')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      if (response.body.data.length > 0) {
        const logEntry = response.body.data[0];
        expect(logEntry).toHaveProperty('action');
        expect(logEntry).toHaveProperty('createdAt');
        expect(logEntry).toHaveProperty('admin');
      }
    });

    it('should respect audit log limit', async () => {
      const response = await request(app)
        .get('/api/v1/admin/audit-log?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/admin/audit-log?limit=300')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_LIMIT');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should require email field', async () => {
      const response = await request(app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should validate user status update', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: 'not-boolean' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_STATUS');
    });
  });
}); 