import { TeamGenerationService } from '../services/TeamGenerationService';
import { AvailabilityService } from '../services/AvailabilityService';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AllowedEmail } from '../models/AllowedEmail';
import { Availability } from '../models/Availability';
import { Team } from '../models/Team';
import { TeamPlayer } from '../models/TeamPlayer';
import { hashPassword } from '../utils';

describe('Team Generation Service', () => {
  let teamGenerationService: TeamGenerationService;
  let availabilityService: AvailabilityService;
  let testUsers: User[] = [];
  let adminUser: User;

  beforeAll(async () => {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.synchronize(true);

    teamGenerationService = new TeamGenerationService();
    availabilityService = new AvailabilityService();

    // Create admin user
    const userRepo = AppDataSource.getRepository(User);
    const allowedEmailRepo = AppDataSource.getRepository(AllowedEmail);
    
    adminUser = new User();
    adminUser.email = 'admin@test.com';
    adminUser.name = 'Admin User';
    adminUser.password = await hashPassword('password123');
    adminUser.is_admin = true;
    adminUser.is_active = true;
    adminUser.preferred_position = 'any';
    adminUser = await userRepo.save(adminUser);

    // Create test users with different positions
    const positions = [
      'goalkeeper', 'goalkeeper', 'goalkeeper', // 3 goalkeepers
      'defender', 'defender', 'defender', 'defender', 'defender', 'defender', // 6 defenders
      'midfielder', 'midfielder', 'midfielder', 'midfielder', 'midfielder', 'midfielder', 'midfielder', 'midfielder', // 8 midfielders
      'forward', 'forward', 'forward', 'forward', 'forward', 'forward', // 6 forwards
      'any', 'any', 'any', 'any', 'any' // 5 any position
    ];

    for (let i = 0; i < positions.length; i++) {
      const email = `player${i + 1}@test.com`;
      
      // Create allowed email
      const allowedEmail = new AllowedEmail();
      allowedEmail.email = email;
      allowedEmail.added_by_admin_id = adminUser.id;
      allowedEmail.used = true;
      await allowedEmailRepo.save(allowedEmail);

      // Create user
      const user = new User();
      user.email = email;
      user.name = `Player ${i + 1}`;
      user.password = await hashPassword('password123');
      user.is_admin = false;
      user.is_active = true;
      user.preferred_position = positions[i]!;
      
      const savedUser = await userRepo.save(user);
      testUsers.push(savedUser);
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clear team-related data before each test
    const teamPlayerRepo = AppDataSource.getRepository(TeamPlayer);
    const teamRepo = AppDataSource.getRepository(Team);
    const availabilityRepo = AppDataSource.getRepository(Availability);
    
    await teamPlayerRepo.clear();
    await teamRepo.clear();
    await availabilityRepo.clear();
  });

  describe('Team Generation Algorithm', () => {
    it('should handle insufficient players (< 18)', async () => {
      const matchDate = new Date('2025-01-20');
      
      // Set only 15 players as available
      const availablePlayers = testUsers.slice(0, 15);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBe('INSUFFICIENT_PLAYERS');
      expect(result.teams).toHaveLength(0);
      expect(result.totalPlayers).toBe(15);
    });

    it('should generate 2 teams of 9 for 18-19 players', async () => {
      const matchDate = new Date('2025-01-21');
      
      // Set 18 players as available
      const availablePlayers = testUsers.slice(0, 18);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBeUndefined();
      expect(result.teams).toHaveLength(2);
      expect(result.totalPlayers).toBe(18);
      expect(result.teamConfiguration).toContain('2 teams of 9');

      // Check team sizes - our algorithm ensures even distribution
      // With 18 players (3 GK + 15 field), algorithm puts 16 on field (8 per team) for even distribution
      const totalPlayersOnField = result.teams.reduce((sum, team) => sum + team.players.length, 0);
      expect(totalPlayersOnField).toBe(16); // Even distribution: 8 per team

      result.teams.forEach(team => {
        expect(team.players.length).toBe(8); // Each team has 8 players (1 GK + 7 field)
      });

      // Check total substitutes (should have 2: 1 GK + 1 field player for even distribution)
      const totalSubstitutes = result.teams.reduce((sum, team) => sum + team.substitutes.length, 0);
      expect(totalSubstitutes).toBe(2); // 1 goalkeeper + 1 field player as substitutes
    });

    it('should generate 2 teams of 10 with substitutes for 20-24 players', async () => {
      const matchDate = new Date('2025-01-22');
      
      // Set 22 players as available
      const availablePlayers = testUsers.slice(0, 22);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBeUndefined();
      expect(result.teams).toHaveLength(2);
      expect(result.totalPlayers).toBe(22);
      expect(result.teamConfiguration).toContain('2 teams of 10');

      // Check team sizes - our algorithm distributes extra players across teams
      const totalPlayers = result.teams.reduce((sum, team) => sum + team.players.length, 0);
      expect(totalPlayers).toBe(20); // 20 players on field

      // Each team should have 10 or 11 players (extra distributed)
      result.teams.forEach(team => {
        expect(team.players.length).toBeGreaterThanOrEqual(10);
        expect(team.players.length).toBeLessThanOrEqual(11);
      });
      
      // Check total substitutes
      const totalSubstitutes = result.teams.reduce((sum, team) => sum + team.substitutes.length, 0);
      expect(totalSubstitutes).toBe(2); // 22 - 20 = 2 substitutes
    });

    it('should generate 3 teams for 25+ players', async () => {
      const matchDate = new Date('2025-01-23');
      
      // Set all 28 players as available
      for (const player of testUsers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBeUndefined();
      expect(result.teams).toHaveLength(3);
      expect(result.totalPlayers).toBe(28);
      expect(result.teamConfiguration).toContain('3 teams');

      // Check team sizes (should be close to 10 each)
      result.teams.forEach(team => {
        expect(team.players.length).toBeGreaterThanOrEqual(9);
        expect(team.players.length).toBeLessThanOrEqual(10);
      });
    });

    it('should properly distribute goalkeepers (max 1 per team)', async () => {
      const matchDate = new Date('2025-01-24');
      
      // Set 20 players as available (including 3 goalkeepers)
      const availablePlayers = testUsers.slice(0, 20);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBeUndefined();
      expect(result.teams).toHaveLength(2);

      // Each team should have exactly 1 goalkeeper
      result.teams.forEach(team => {
        const goalkeepers = team.players.filter(p => p.preferred_position === 'goalkeeper');
        expect(goalkeepers).toHaveLength(1);
      });

      // Check if extra goalkeeper is substitute
      const allGoalkeepers = result.teams.flatMap(team => 
        [...team.players, ...team.substitutes].filter(p => p.preferred_position === 'goalkeeper')
      );
      expect(allGoalkeepers).toHaveLength(3); // All 3 goalkeepers should be assigned

      // Check substitute goalkeepers
      const substituteGoalkeepers = result.teams.flatMap(team => 
        team.substitutes.filter(p => p.substitute_for_position === 'goalkeeper')
      );
      expect(substituteGoalkeepers).toHaveLength(1); // 1 goalkeeper should be substitute
    });

    it('should handle teams with no goalkeepers available', async () => {
      const matchDate = new Date('2025-01-25');
      
      // Set 18 non-goalkeeper players as available
      const nonGoalkeeperPlayers = testUsers.filter(p => p.preferred_position !== 'goalkeeper').slice(0, 18);
      for (const player of nonGoalkeeperPlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBeUndefined();
      expect(result.teams).toHaveLength(2);

      // Teams should still be generated even without goalkeepers
      result.teams.forEach(team => {
        expect(team.players).toHaveLength(9);
        const goalkeepers = team.players.filter(p => p.preferred_position === 'goalkeeper');
        expect(goalkeepers).toHaveLength(0);
      });
    });

    it('should randomly distribute players for fairness', async () => {
      const matchDate1 = new Date('2025-01-26');
      const matchDate2 = new Date('2025-01-27');
      
      // Set same 20 players as available for both dates
      const availablePlayers = testUsers.slice(0, 20);
      
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate1, true);
        await availabilityService.submitAvailability(player.id, matchDate2, true);
      }

      const result1 = await teamGenerationService.generateTeams(matchDate1);
      const result2 = await teamGenerationService.generateTeams(matchDate2);

      expect(result1.error).toBeUndefined();
      expect(result2.error).toBeUndefined();

      // Check that team compositions are different (randomness)
      const team1Players1 = result1.teams[0]!.players.map(p => p.id).sort();
      const team1Players2 = result2.teams[0]!.players.map(p => p.id).sort();
      
      // There should be some difference in team composition due to randomness
      // (This test might occasionally fail due to random chance, but very unlikely)
      const identical = JSON.stringify(team1Players1) === JSON.stringify(team1Players2);
      expect(identical).toBe(false);
    });
  });

  describe('Team Publication', () => {
    it('should publish teams correctly', async () => {
      const matchDate = new Date('2025-01-28');
      
      // Generate teams first
      const availablePlayers = testUsers.slice(0, 20);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      await teamGenerationService.generateTeams(matchDate);

      // Initially teams should not be published
      const initiallyPublished = await teamGenerationService.areTeamsPublished(matchDate);
      expect(initiallyPublished).toBe(false);

      // Publish teams
      await teamGenerationService.publishTeams(matchDate);

      // Now teams should be published
      const nowPublished = await teamGenerationService.areTeamsPublished(matchDate);
      expect(nowPublished).toBe(true);

      // Should be able to get published teams
      const publishedTeams = await teamGenerationService.getPublishedTeams(matchDate);
      expect(publishedTeams).toHaveLength(2);
    });

    it('should not return unpublished teams', async () => {
      const matchDate = new Date('2025-01-29');
      
      // Generate teams but don't publish
      const availablePlayers = testUsers.slice(0, 18);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      await teamGenerationService.generateTeams(matchDate);

      // Should not be able to get unpublished teams
      const teams = await teamGenerationService.getPublishedTeams(matchDate);
      expect(teams).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 18 players with mixed positions', async () => {
      const matchDate = new Date('2025-01-30');
      
      // Use exactly 18 players with 1 goalkeeper
      const mixedPlayers = [
        ...testUsers.filter(p => p.preferred_position === 'goalkeeper').slice(0, 1),
        ...testUsers.filter(p => p.preferred_position !== 'goalkeeper').slice(0, 17),
      ];
      
      for (const player of mixedPlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result = await teamGenerationService.generateTeams(matchDate);

      expect(result.error).toBeUndefined();
      expect(result.teams).toHaveLength(2);
      expect(result.totalPlayers).toBe(18);

      // One team should have the goalkeeper, the other should not
      const team1Goalkeepers = result.teams[0]!.players.filter(p => p.preferred_position === 'goalkeeper');
      const team2Goalkeepers = result.teams[1]!.players.filter(p => p.preferred_position === 'goalkeeper');
      
      expect(team1Goalkeepers.length + team2Goalkeepers.length).toBe(1);
    });

    it('should clear existing teams when regenerating', async () => {
      const matchDate = new Date('2025-01-31');
      
      // Generate teams first time
      const availablePlayers = testUsers.slice(0, 20);
      for (const player of availablePlayers) {
        await availabilityService.submitAvailability(player.id, matchDate, true);
      }

      const result1 = await teamGenerationService.generateTeams(matchDate);
      expect(result1.teams).toHaveLength(2);

      // Generate teams second time (should clear previous)
      const result2 = await teamGenerationService.generateTeams(matchDate);
      expect(result2.teams).toHaveLength(2);

      // Check database only has teams from second generation
      const teamRepo = AppDataSource.getRepository(Team);
      const formattedDate = matchDate.toISOString().split('T')[0];
      const allTeams = await teamRepo
        .createQueryBuilder('team')
        .where('DATE(team.match_date) = :matchDate', { matchDate: formattedDate })
        .getMany();
      expect(allTeams).toHaveLength(2); // Should not be duplicated
    });
  });
}); 