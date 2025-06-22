import request from 'supertest';
import App from '../app';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { Availability } from '../models/Availability';
import { hashPassword } from '../utils';

describe('Availability Integration Tests', () => {
  let app: App;
  let server: any;
  let userToken: string;
  let testUser: User;
  let adminUser: User;

  beforeAll(async () => {
    // Initialize app and database
    app = new App();
    server = app.app;
    
    // Wait for database to be ready and sync schema
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.synchronize(true);
    
    // Clean up test data properly
    const userRepo = AppDataSource.getRepository(User);
    const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);
    const availabilityRepo = AppDataSource.getRepository(Availability);
    
    await availabilityRepo.clear();
    await allowedEmailRepo.clear();
    await userRepo.clear();

    // Create test admin user
    adminUser = new User();
    adminUser.email = 'admin@test.com';
    adminUser.name = 'Admin User';
    adminUser.password = await hashPassword('password123');
    adminUser.is_admin = true;
    adminUser.is_active = true;
    adminUser.preferred_position = 'any';
    adminUser = await userRepo.save(adminUser);

    // Create allowed email
    const allowedEmail = new AllowedEmail();
    allowedEmail.email = 'test@example.com';
    allowedEmail.added_by_admin_id = adminUser.id;
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
    // Clean up properly
    if (AppDataSource.isInitialized) {
      const availabilityRepo = AppDataSource.getRepository(Availability);
      const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);
      const userRepo = AppDataSource.getRepository(User);
      
      await availabilityRepo.clear();
      await allowedEmailRepo.clear();
      await userRepo.clear();
      
      await AppDataSource.destroy();
    }
  });

  describe('POST /api/v1/availability', () => {
    it('should submit availability for a future match', async () => {
      // Create a future match date (next Monday)
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
      const matchDate = nextMonday.toISOString().split('T')[0];

      const response = await request(server)
        .post('/api/v1/availability')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          matchDate,
          isAvailable: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availability).toMatchObject({
        user_id: testUser.id,
        is_available: true,
      });
      expect(response.body.message).toBe('Availability submitted successfully');
    });

    it('should validate match date format', async () => {
      const response = await request(server)
        .post('/api/v1/availability')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          matchDate: 'invalid-date',
          isAvailable: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .post('/api/v1/availability')
        .send({
          matchDate: '2025-01-01',
          isAvailable: true,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  describe('GET /api/v1/availability/my', () => {
    it('should get user availability for upcoming matches', async () => {
      const response = await request(server)
        .get('/api/v1/availability/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.availability)).toBe(true);
      
      // Should include upcoming matches
      expect(response.body.data.availability.length).toBeGreaterThan(0);
      
      // Check structure of availability items
      response.body.data.availability.forEach((item: any) => {
        expect(item).toHaveProperty('matchDate');
        expect(item).toHaveProperty('dayOfWeek');
        expect(item).toHaveProperty('deadline');
        expect(item).toHaveProperty('isSubmissionAllowed');
        expect(['monday', 'wednesday']).toContain(item.dayOfWeek);
      });
    });
  });

  describe('GET /api/v1/availability/matches', () => {
    it('should get upcoming matches', async () => {
      const response = await request(server)
        .get('/api/v1/availability/matches')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.matches)).toBe(true);
      
      // Should include upcoming matches
      expect(response.body.data.matches.length).toBeGreaterThan(0);
      
      // Check structure
      response.body.data.matches.forEach((match: any) => {
        expect(match).toHaveProperty('date');
        expect(match).toHaveProperty('dayOfWeek');
        expect(match).toHaveProperty('availabilityDeadline');
        expect(match).toHaveProperty('isAvailabilityOpen');
        expect(match).toHaveProperty('isTeamsPublished');
      });
    });
  });

  describe('GET /api/v1/availability/match/:date', () => {
    it('should get availability for a specific match', async () => {
      // Use a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const matchDate = futureDate.toISOString().split('T')[0];

      const response = await request(server)
        .get(`/api/v1/availability/match/${matchDate}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availability).toHaveProperty('matchDate');
      expect(response.body.data.availability).toHaveProperty('availablePlayers');
      expect(response.body.data.availability).toHaveProperty('unavailablePlayers');
      expect(response.body.data.availability).toHaveProperty('noResponsePlayers');
      expect(response.body.data.availability).toHaveProperty('totalCount');
      expect(response.body.data.availability).toHaveProperty('availableCount');
    });

    it('should validate date parameter format', async () => {
      const response = await request(server)
        .get('/api/v1/availability/match/invalid-date')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/availability/:date', () => {
    it('should update availability for a specific date', async () => {
      // Create a future match date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const matchDate = futureDate.toISOString().split('T')[0];

      // First submit availability
      await request(server)
        .post('/api/v1/availability')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          matchDate,
          isAvailable: true,
        });

      // Then update it
      const response = await request(server)
        .put(`/api/v1/availability/${matchDate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          isAvailable: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availability.is_available).toBe(false);
      expect(response.body.message).toBe('Availability updated successfully');
    });

    it('should validate availability status', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 21);
      const matchDate = futureDate.toISOString().split('T')[0];

      const response = await request(server)
        .put(`/api/v1/availability/${matchDate}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          isAvailable: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
}); 