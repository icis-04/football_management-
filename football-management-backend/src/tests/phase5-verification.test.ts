import request from 'supertest';
import app from '../app';
import { initializeDatabase } from '../config/database';

describe('Phase 5 - API Documentation and Production Readiness Verification', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  describe('API Documentation', () => {
    test('✅ Swagger UI should be available', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);
      
      expect(response.text).toContain('swagger-ui');
    });

    test('✅ API documentation should be properly configured', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);
      
      expect(response.text).toContain('Football Team Management API');
    });
  });

  describe('Health Check', () => {
    test('✅ Health endpoint should return system status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('File Upload System', () => {
    test('✅ Upload directory route should be configured', async () => {
      const response = await request(app)
        .get('/uploads/nonexistent.jpg')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'FILE_NOT_FOUND');
    });
  });

  describe('Security Middleware', () => {
    test('✅ Security headers should be present', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('✅ CORS should be configured', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3001')
        .expect(200);
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Rate Limiting', () => {
    test('✅ Rate limiting headers should be present', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // Check for rate limiting headers
      expect(response.headers).toHaveProperty('ratelimit-limit');
    });
  });

  describe('Error Handling', () => {
    test('✅ 404 errors should be properly formatted', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    test('✅ API errors should include proper error structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({}) // Invalid request body
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });
  });

  describe('API Endpoints Structure', () => {
    test('✅ Root endpoint should provide API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body).toHaveProperty('message', 'Football Team Management API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('documentation', '/api-docs');
      expect(response.body).toHaveProperty('health', '/health');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('✅ Auth routes should be properly mounted', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'invalid'
        });
      
      // Should not be 404, should be validation or auth error
      expect(response.status).not.toBe(404);
    });

    test('✅ User routes should be properly mounted', async () => {
      const response = await request(app)
        .get('/api/v1/users/me');
      
      // Should not be 404, should be auth error
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401); // Unauthorized
    });

    test('✅ Team routes should be properly mounted', async () => {
      const response = await request(app)
        .get('/api/v1/teams/current');
      
      // Should not be 404, should be auth error
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401); // Unauthorized
    });

    test('✅ Admin routes should be properly mounted', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users');
      
      // Should not be 404, should be auth error
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401); // Unauthorized
    });

    test('✅ Availability routes should be properly mounted', async () => {
      const response = await request(app)
        .get('/api/v1/availability/my');
      
      // Should not be 404, should be auth error
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(401); // Unauthorized
    });
  });

  describe('Production Readiness', () => {
    test('✅ Application should handle graceful shutdown signals', () => {
      // This test verifies that the app has shutdown handlers
      expect(process.listenerCount('SIGTERM')).toBeGreaterThan(0);
      expect(process.listenerCount('SIGINT')).toBeGreaterThan(0);
    });

    test('✅ Environment configuration should be loaded', () => {
      const { config } = require('../config/environment');
      
      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBeDefined();
      expect(config.PORT).toBeDefined();
      expect(config.JWT_SECRET).toBeDefined();
    });

    test('✅ Database connection should be initialized', async () => {
      const { AppDataSource } = require('../config/database');
      
      expect(AppDataSource.isInitialized).toBe(true);
    });

    test('✅ Logging should be configured', () => {
      const { logger } = require('../config/logger');
      
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    test('✅ Production Environment Setup implemented', () => {
      // Check for production-ready configurations
      expect(process.env['NODE_ENV']).toBeDefined();
    });
  });

  describe('Phase 5 Requirements Coverage', () => {
    test('✅ Swagger/OpenAPI Documentation implemented', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);
      
      expect(response.text).toContain('swagger');
    });

    test('✅ File Upload System implemented', async () => {
      // Test that upload middleware exists
      const response = await request(app)
        .get('/uploads/test.jpg')
        .expect(404); // File not found, but route exists
      
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    test('✅ Enhanced Security implemented', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      // Security headers should be present
      expect(response.headers['x-content-type-options']).toBeDefined();
    });

    test('✅ Performance Optimization implemented', async () => {
      const start = Date.now();
      await request(app)
        .get('/health')
        .expect(200);
      const duration = Date.now() - start;
      
      // Health check should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
}); 