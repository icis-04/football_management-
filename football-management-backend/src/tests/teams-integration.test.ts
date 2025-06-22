import request from 'supertest';
import { DataSource } from 'typeorm';
import App from '../app';
import { initializeDatabase } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { Availability } from '../models/Availability';
import { Team } from '../models/Team';
import { TeamPlayer } from '../models/TeamPlayer';
import { createTestUser, createTestAdmin } from './helpers/testHelpers';

describe('Team Generation Integration Tests', () => {
  let app: App;
  let dataSource: DataSource;
  let adminToken: string;
  let userTokens: string[] = [];

  beforeAll(async () => {
    // Initialize test database
    dataSource = await initializeDatabase();
    app = new App();
    
    // Create admin user
    await createTestAdmin('admin@test.com', 'Admin User');
    
    // Login admin to get token
    const adminLoginResponse = await request(app.app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    adminToken = adminLoginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await dataSource.getRepository(TeamPlayer).delete({});
    await dataSource.getRepository(Team).delete({});
    await dataSource.getRepository(Availability).delete({});
    await dataSource.getRepository(User).delete({});
    await dataSource.getRepository(AllowedEmail).delete({});
    userTokens = [];
  });

  describe('Team Generation Scenarios', () => {
    test('should generate 2 teams with 18 players (minimum)', async () => {
      // Create 18 players with availability
      await createPlayersWithAvailability(18, '2025-01-20');
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.teams).toHaveLength(2);
      expect(response.body.data.teams[0].players).toHaveLength(9);
      expect(response.body.data.teams[1].players).toHaveLength(9);
    });

    test('should generate 2 teams with 20 players (10 per team)', async () => {
      // Create 20 players with availability
      await createPlayersWithAvailability(20, '2025-01-20');
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.teams).toHaveLength(2);
      expect(response.body.data.teams[0].players).toHaveLength(10);
      expect(response.body.data.teams[1].players).toHaveLength(10);
    });

    test('should generate 2 teams with substitutes when 22 players available', async () => {
      // Create 22 players with availability
      await createPlayersWithAvailability(22, '2025-01-20');
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.teams).toHaveLength(2);
      
      // Check that we have main players and substitutes
      const totalMainPlayers = response.body.data.teams.reduce((sum: number, team: any) => sum + team.players.length, 0);
      const totalSubstitutes = response.body.data.teams.reduce((sum: number, team: any) => sum + team.substitutes.length, 0);
      
      expect(totalMainPlayers).toBe(20);
      expect(totalSubstitutes).toBe(2);
    });

    test('should generate 3 teams when 25+ players available', async () => {
      // Create 25 players with availability
      await createPlayersWithAvailability(25, '2025-01-20');
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.teams).toHaveLength(3);
      
      // Check team sizes
      const teamSizes = response.body.data.teams.map((team: any) => team.players.length);
      expect(teamSizes.sort()).toEqual([5, 10, 10]); // 25 players distributed
    });

    test('should properly distribute goalkeepers (1 per team max)', async () => {
      // Create players with 3 goalkeepers
      await createPlayersWithAvailability(20, '2025-01-20', 3);
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      
      // Check goalkeeper distribution
      let totalGoalkeepers = 0;
      response.body.data.teams.forEach((team: any) => {
        const goalkeepers = team.players.filter((p: any) => p.assignedPosition === 'goalkeeper');
        expect(goalkeepers.length).toBeLessThanOrEqual(1);
        totalGoalkeepers += goalkeepers.length;
      });
      
      // Should have at most 2 goalkeepers in main teams (1 per team)
      expect(totalGoalkeepers).toBeLessThanOrEqual(2);
    });

    test('should handle goalkeeper substitutes correctly', async () => {
      // Create players with 4 goalkeepers for 2 teams
      await createPlayersWithAvailability(20, '2025-01-20', 4);
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      
      // Check that extra goalkeepers become substitutes
      let mainGoalkeepers = 0;
      let gkSubstitutes = 0;
      
      response.body.data.teams.forEach((team: any) => {
        // Count main goalkeepers
        const mainGks = team.players.filter((p: any) => p.assignedPosition === 'goalkeeper');
        mainGoalkeepers += mainGks.length;
        
        // Count goalkeeper substitutes
        const gkSubs = team.substitutes.filter((p: any) => p.substituteForPosition === 'goalkeeper');
        gkSubstitutes += gkSubs.length;
      });
      
      expect(mainGoalkeepers).toBeLessThanOrEqual(2); // Max 1 per team
      expect(gkSubstitutes).toBeGreaterThan(0); // Extra goalkeepers should be substitutes
    });

    test('should fail with insufficient players (< 18)', async () => {
      // Create only 15 players
      await createPlayersWithAvailability(15, '2025-01-20');
      
      // Trigger team generation
      const response = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PLAYERS');
    });

    test('should publish teams successfully', async () => {
      // Create players and generate teams
      await createPlayersWithAvailability(20, '2025-01-20');
      
      await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      // Publish teams
      const publishResponse = await request(app.app)
        .post('/api/v1/admin/teams/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(publishResponse.status).toBe(200);
      expect(publishResponse.body.success).toBe(true);
    });

    test('should allow players to view published teams', async () => {
      // Create players and generate teams
      await createPlayersWithAvailability(20, '2025-01-20');
      
      await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      // Publish teams
      await request(app.app)
        .post('/api/v1/admin/teams/publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      // Player should be able to view teams
      const viewResponse = await request(app.app)
        .get('/api/v1/teams/match/2025-01-20')
        .set('Authorization', `Bearer ${userTokens[0]}`);

      expect(viewResponse.status).toBe(200);
      expect(viewResponse.body.success).toBe(true);
      expect(viewResponse.body.data.teams).toBeDefined();
      expect(viewResponse.body.data.teams).toHaveLength(2);
    });

    test('should not allow viewing unpublished teams', async () => {
      // Create players and generate teams but don't publish
      await createPlayersWithAvailability(20, '2025-01-20');
      
      await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      // Player should not be able to view unpublished teams
      const viewResponse = await request(app.app)
        .get('/api/v1/teams/match/2025-01-20')
        .set('Authorization', `Bearer ${userTokens[0]}`);

      expect(viewResponse.status).toBe(404);
      expect(viewResponse.body.success).toBe(false);
      expect(viewResponse.body.error.code).toBe('TEAMS_NOT_PUBLISHED');
    });
  });

  describe('Team Preview and Management', () => {
    test('should allow admin to preview teams before publication', async () => {
      // Create players and generate teams
      await createPlayersWithAvailability(20, '2025-01-20');
      
      await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      // Admin should be able to preview teams
      const previewResponse = await request(app.app)
        .get('/api/v1/admin/teams/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          matchDate: '2025-01-20'
        });

      expect(previewResponse.status).toBe(200);
      expect(previewResponse.body.success).toBe(true);
      expect(previewResponse.body.data.teams).toBeDefined();
      expect(previewResponse.body.data.teams).toHaveLength(2);
    });

    test('should allow admin to regenerate teams', async () => {
      // Create players and generate teams
      await createPlayersWithAvailability(20, '2025-01-20');
      
      await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      // Regenerate teams
      const secondGeneration = await request(app.app)
        .post('/api/v1/admin/teams/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchDate: '2025-01-20'
        });

      expect(secondGeneration.status).toBe(200);
      expect(secondGeneration.body.success).toBe(true);
      
      // Teams should be different due to randomization (though not guaranteed)
      expect(secondGeneration.body.data.teams).toHaveLength(2);
    });
  });

  // Helper function to create players with availability
  async function createPlayersWithAvailability(count: number, matchDate: string, goalkeepers: number = 2): Promise<User[]> {
    const users: User[] = [];
    
    for (let i = 0; i < count; i++) {
      const email = `player${i}@test.com`;
      const preferredPosition = i < goalkeepers ? 'goalkeeper' : 
                              i < goalkeepers + 5 ? 'defender' :
                              i < goalkeepers + 10 ? 'midfielder' : 'forward';
      
      // Add allowed email
      await request(app.app)
        .post('/api/v1/admin/allowed-emails')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email });

      // Create user
      const user = await createTestUser(email, `Player ${i}`, preferredPosition);
      users.push(user);

      // Login to get token
      const loginResponse = await request(app.app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'password123'
        });
      
      userTokens.push(loginResponse.body.data.accessToken);

      // Submit availability
      await request(app.app)
        .post('/api/v1/availability')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .send({
          matchDate,
          isAvailable: true
        });
    }
    
    return users;
  }
}); 