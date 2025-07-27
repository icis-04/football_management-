import { Repository } from 'typeorm';
import { Team } from '../models/Team';
import { TeamPlayer } from '../models/TeamPlayer';
import { AppDataSource } from '../config/database';
import { AvailabilityService } from './AvailabilityService';
import { logger } from '../config/logger';
import { shuffle } from '../utils';

export interface Player {
  id: number;
  name: string;
  email: string;
  preferred_position: string;
  profile_pic_url?: string;
  is_admin: boolean;
}

export interface GeneratedTeam {
  teamNumber: number;
  teamName: string;
  players: TeamPlayerAssignment[];
  substitutes: TeamPlayerAssignment[];
}

export interface TeamPlayerAssignment {
  id: number;
  name: string;
  preferred_position: string;
  assigned_position?: string | undefined;
  is_substitute: boolean;
  substitute_for_position?: string | undefined;
  profile_pic_url?: string | undefined;
}

export interface TeamGenerationResult {
  teams: GeneratedTeam[];
  error?: string;
  matchDate: string;
  totalPlayers: number;
  teamConfiguration: string;
}

export class TeamGenerationService {
  private teamRepository: Repository<Team>;
  private teamPlayerRepository: Repository<TeamPlayer>;
  private availabilityService: AvailabilityService;

  constructor() {
    this.teamRepository = AppDataSource.getRepository(Team);
    this.teamPlayerRepository = AppDataSource.getRepository(TeamPlayer);
    this.availabilityService = new AvailabilityService();
  }

  /**
   * Generate teams for a specific match date
   */
  async generateTeams(matchDate: Date): Promise<TeamGenerationResult> {
    try {
      const matchDateStr = matchDate.toISOString().split('T')[0]!;
      
      // Get available players
      const availablePlayers = await this.availabilityService.getAvailablePlayersForMatch(matchDate);
      
      logger.info('Starting team generation', {
        matchDate: matchDateStr,
        playerCount: availablePlayers.length,
      });

      // Check minimum player requirement
      if (availablePlayers.length < 18) {
        return {
          teams: [],
          error: 'INSUFFICIENT_PLAYERS',
          matchDate: matchDateStr,
          totalPlayers: availablePlayers.length,
          teamConfiguration: `Need at least 18 players, only ${availablePlayers.length} available`,
        };
      }

      // Determine team configuration
      const teamConfig = this.determineTeamConfiguration(availablePlayers.length);
      
      // Generate teams using the algorithm
      const generatedTeams = this.executeTeamGenerationAlgorithm(availablePlayers, teamConfig);

      // Clear existing teams for this match date
      await this.clearExistingTeams(matchDate);

      // Save teams to database
      const savedTeams = await this.saveTeamsToDatabase(matchDate, generatedTeams);

      logger.info('Team generation completed successfully', {
        matchDate: matchDateStr,
        teamCount: savedTeams.length,
        totalPlayers: availablePlayers.length,
        configuration: teamConfig.description,
      });

      return {
        teams: savedTeams,
        matchDate: matchDateStr,
        totalPlayers: availablePlayers.length,
        teamConfiguration: teamConfig.description,
      };
    } catch (error) {
      logger.error('Team generation failed', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Determine the optimal team configuration based on player count
   */
  private determineTeamConfiguration(playerCount: number): any {
    if (playerCount < 18) {
      return {
        teamCount: 0,
        playersPerTeam: 0,
        description: 'Insufficient players',
      };
    } else if (playerCount <= 19) {
      return {
        teamCount: 2,
        playersPerTeam: 9,
        description: '2 teams of 9 players each',
      };
    } else if (playerCount >= 20 && playerCount < 25) {
      return {
        teamCount: 2,
        playersPerTeam: 10,
        description: '2 teams of 10 players each (extras as substitutes)',
      };
    } else {
      // For 25+ players, distribute as evenly as possible across 3 teams
      const basePlayersPerTeam = Math.floor(playerCount / 3);
      return {
        teamCount: 3,
        playersPerTeam: basePlayersPerTeam,
        description: '3 teams',
      };
    }
  }

  /**
   * Execute the core team generation algorithm
   */
  private executeTeamGenerationAlgorithm(players: Player[], teamConfig: any): GeneratedTeam[] {
    // Separate goalkeepers from field players
    const goalkeepers = players.filter(p => p.preferred_position === 'goalkeeper');
    const fieldPlayers = players.filter(p => p.preferred_position !== 'goalkeeper');

    logger.info('Player distribution', {
      totalPlayers: players.length,
      goalkeepers: goalkeepers.length,
      fieldPlayers: fieldPlayers.length,
      teamCount: teamConfig.teamCount,
    });

    // Initialize teams
    const teams: GeneratedTeam[] = [];
    for (let i = 0; i < teamConfig.teamCount; i++) {
      teams.push({
        teamNumber: i + 1,
        teamName: `Team ${i + 1}`,
        players: [],
        substitutes: [],
      });
    }

    // Step 1: Distribute goalkeepers (max 1 per team)
    const assignedGKs = this.distributeGoalkeepers(teams, goalkeepers);

    // Step 2: Shuffle field players for fairness
    const shuffledFieldPlayers = shuffle([...fieldPlayers]);

    // Step 3: Distribute field players to fill teams
    const assignedFieldPlayers = this.distributeFieldPlayers(teams, shuffledFieldPlayers, teamConfig.playersPerTeam);

    // Step 4: Handle remaining players as substitutes
    this.handleSubstitutes(teams, assignedFieldPlayers, assignedGKs, shuffledFieldPlayers, goalkeepers);

    return teams;
  }

  /**
   * Distribute goalkeepers ensuring max 1 per team
   */
  private distributeGoalkeepers(teams: GeneratedTeam[], goalkeepers: Player[]): Player[] {
    const shuffledGKs = shuffle([...goalkeepers]);
    
    // Assign primary goalkeepers (max 1 per team)
    const primaryGKs = shuffledGKs.slice(0, teams.length);
    primaryGKs.forEach((gk, index) => {
      const team = teams[index];
      if (team) {
        team.players.push({
          id: gk.id,
          name: gk.name,
          preferred_position: gk.preferred_position,
          assigned_position: 'goalkeeper',
          is_substitute: false,
          profile_pic_url: gk.profile_pic_url,
        });
      }
    });

    // Remaining goalkeepers will be handled as substitutes later
    logger.info('Goalkeeper distribution', {
      primaryGKs: primaryGKs.length,
      remainingGKs: shuffledGKs.length - primaryGKs.length,
    });

    return primaryGKs;
  }

  /**
   * Distribute field players evenly across teams
   */
  private distributeFieldPlayers(teams: GeneratedTeam[], fieldPlayers: Player[], playersPerTeam: number): Player[] {
    let playerIndex = 0;
    const assignedPlayers: Player[] = [];

    // Calculate how many field players we can actually assign
    const totalSlotsNeeded = teams.reduce((sum, team) => {
      const currentTeamSize = team.players.length; // includes goalkeepers already assigned
      return sum + Math.max(0, playersPerTeam - currentTeamSize);
    }, 0);
    
    // For even distribution, ensure we don't have uneven teams
    // If we have an odd number of field players for 2 teams, put one as substitute
    let maxFieldPlayersToAssign = Math.min(fieldPlayers.length, totalSlotsNeeded);
    
    if (teams.length === 2 && maxFieldPlayersToAssign % 2 !== 0) {
      // For 2 teams, if odd number of field players, make one a substitute
      maxFieldPlayersToAssign = maxFieldPlayersToAssign - 1;
    }

    // First pass: Fill each team to the required size
    for (let teamIdx = 0; teamIdx < teams.length && playerIndex < maxFieldPlayersToAssign; teamIdx++) {
      const team = teams[teamIdx];
      if (!team) continue;
      
      const currentTeamSize = team.players.length;
      const playersNeeded = playersPerTeam - currentTeamSize;
      const maxPlayersForThisTeam = Math.min(playersNeeded, Math.floor(maxFieldPlayersToAssign / teams.length));

      for (let i = 0; i < maxPlayersForThisTeam && playerIndex < maxFieldPlayersToAssign; i++) {
        const player = fieldPlayers[playerIndex];
        if (player) {
          team.players.push({
            id: player.id,
            name: player.name,
            preferred_position: player.preferred_position,
            assigned_position: player.preferred_position,
            is_substitute: false,
            profile_pic_url: player.profile_pic_url || undefined,
          });
          assignedPlayers.push(player);
          playerIndex++;
        }
      }
    }

    // Second round: distribute any remaining players evenly
    let teamIndex = 0;
    while (playerIndex < maxFieldPlayersToAssign) {
      const player = fieldPlayers[playerIndex];
      const team = teams[teamIndex];
      if (player && team && team.players.length < playersPerTeam) {
        team.players.push({
          id: player.id,
          name: player.name,
          preferred_position: player.preferred_position,
          assigned_position: player.preferred_position,
          is_substitute: false,
          profile_pic_url: player.profile_pic_url || undefined,
        });
        assignedPlayers.push(player);
        playerIndex++;
      }
      teamIndex = (teamIndex + 1) % teams.length;
    }

    // Third pass: Only for 3-team case - distribute remaining players evenly
    if (teams.length === 3 && playerIndex < fieldPlayers.length) {
      teamIndex = 0;
      while (playerIndex < fieldPlayers.length) {
        const player = fieldPlayers[playerIndex];
        const team = teams[teamIndex];
        if (player && team) {
          team.players.push({
            id: player.id,
            name: player.name,
            preferred_position: player.preferred_position,
            assigned_position: player.preferred_position,
            is_substitute: false,
            profile_pic_url: player.profile_pic_url || undefined,
          });
          assignedPlayers.push(player);
          playerIndex++;
          teamIndex = (teamIndex + 1) % teams.length;
        } else {
          break;
        }
      }
    }

    logger.info('Field player distribution', {
      playersAssigned: playerIndex,
      remainingPlayers: fieldPlayers.length - playerIndex,
      totalSlotsNeeded,
      maxFieldPlayersToAssign,
    });

    return assignedPlayers;
  }

  /**
   * Handle remaining players as substitutes
   */
  private handleSubstitutes(teams: GeneratedTeam[], assignedFieldPlayers: Player[], assignedGKs: Player[], allFieldPlayers: Player[], allGoalkeepers: Player[]): void {
    // Get remaining field players
    const remainingFieldPlayers = allFieldPlayers.filter(p => !assignedFieldPlayers.includes(p));

    // Get remaining goalkeepers
    const remainingGKs = allGoalkeepers.filter(p => !assignedGKs.includes(p));

    // Distribute remaining field players as substitutes
    remainingFieldPlayers.forEach((player, index) => {
      const teamIndex = index % teams.length;
      const team = teams[teamIndex];
      if (team) {
        team.substitutes.push({
          id: player.id,
          name: player.name,
          preferred_position: player.preferred_position,
          is_substitute: true,
          substitute_for_position: player.preferred_position,
          profile_pic_url: player.profile_pic_url || undefined,
        });
      }
    });

    // Distribute remaining goalkeepers as substitutes
    remainingGKs.forEach((gk, index) => {
      const teamIndex = index % teams.length;
      const team = teams[teamIndex];
      if (team) {
        team.substitutes.push({
          id: gk.id,
          name: gk.name,
          preferred_position: gk.preferred_position,
          is_substitute: true,
          substitute_for_position: 'goalkeeper',
          profile_pic_url: gk.profile_pic_url || undefined,
        });
      }
    });

    logger.info('Substitute distribution', {
      fieldPlayerSubstitutes: remainingFieldPlayers.length,
      goalkeeperSubstitutes: remainingGKs.length,
    });
  }

  /**
   * Clear existing teams for a match date
   */
  private async clearExistingTeams(matchDate: Date): Promise<void> {
    // Format the date to ensure consistent comparison
    const formattedDate = matchDate.toISOString().split('T')[0];
    
    const existingTeams = await this.teamRepository
      .createQueryBuilder('team')
      .where('DATE(team.match_date) = :matchDate', { matchDate: formattedDate })
      .getMany();

    if (existingTeams.length > 0) {
      // Delete team players first (foreign key constraint)
      for (const team of existingTeams) {
        await this.teamPlayerRepository.delete({ team_id: team.id });
      }
      
      // Delete teams
      for (const team of existingTeams) {
        await this.teamRepository.delete({ id: team.id });
      }
      
      logger.info('Cleared existing teams', {
        matchDate: formattedDate,
        teamsCleared: existingTeams.length,
      });
    }
  }

  /**
   * Save generated teams to database
   */
  private async saveTeamsToDatabase(matchDate: Date, generatedTeams: GeneratedTeam[]): Promise<GeneratedTeam[]> {
    const savedTeams: GeneratedTeam[] = [];

    for (const generatedTeam of generatedTeams) {
      // Create team record
      const team = this.teamRepository.create({
        match_date: matchDate,
        team_number: generatedTeam.teamNumber,
        team_name: generatedTeam.teamName,
        is_published: false, // Teams are generated but not published until 12 PM
      });
      const savedTeam = await this.teamRepository.save(team);

      // Save team players
      for (const player of generatedTeam.players) {
        const teamPlayer = this.teamPlayerRepository.create({
          team_id: savedTeam.id,
          user_id: player.id,
          assigned_position: player.assigned_position,
          is_substitute: false,
        });
        await this.teamPlayerRepository.save(teamPlayer);
      }

      // Save substitutes
      for (const substitute of generatedTeam.substitutes) {
        const teamPlayer = this.teamPlayerRepository.create({
          team_id: savedTeam.id,
          user_id: substitute.id,
          assigned_position: substitute.preferred_position,
          is_substitute: true,
          substitute_for_position: substitute.substitute_for_position,
        });
        await this.teamPlayerRepository.save(teamPlayer);
      }

      savedTeams.push(generatedTeam);
    }

    return savedTeams;
  }

  /**
   * Publish teams (make them visible to players)
   */
  async publishTeams(matchDate: Date): Promise<void> {
    try {
      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      const result = await this.teamRepository
        .createQueryBuilder()
        .update(Team)
        .set({ 
          is_published: true, 
          published_at: new Date() 
        })
        .where('DATE(match_date) = :matchDate', { matchDate: formattedDate })
        .execute();

      logger.info('Teams published', {
        matchDate: formattedDate,
        teamsPublished: result.affected,
      });
    } catch (error) {
      logger.error('Failed to publish teams', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get teams for a specific match (only if published)
   */
  async getPublishedTeams(matchDate: Date): Promise<GeneratedTeam[]> {
    try {
      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      const teams = await this.teamRepository
        .createQueryBuilder('team')
        .leftJoinAndSelect('team.teamPlayers', 'teamPlayer')
        .leftJoinAndSelect('teamPlayer.user', 'user')
        .where('DATE(team.match_date) = :matchDate', { matchDate: formattedDate })
        .andWhere('team.is_published = :isPublished', { isPublished: true })
        .orderBy('team.team_number', 'ASC')
        .addOrderBy('teamPlayer.is_substitute', 'ASC')
        .getMany();

      return teams.map(team => ({
        teamNumber: team.team_number,
        teamName: team.team_name || `Team ${team.team_number}`,
        players: team.teamPlayers
          .filter(tp => !tp.is_substitute)
          .map(tp => ({
            id: tp.user.id,
            name: tp.user.name,
            preferred_position: tp.user.preferred_position,
            assigned_position: tp.assigned_position,
            is_substitute: false,
            profile_pic_url: tp.user.profile_pic_url,
          })),
        substitutes: team.teamPlayers
          .filter(tp => tp.is_substitute)
          .map(tp => ({
            id: tp.user.id,
            name: tp.user.name,
            preferred_position: tp.user.preferred_position,
            is_substitute: true,
            substitute_for_position: tp.substitute_for_position,
            profile_pic_url: tp.user.profile_pic_url,
          })),
      }));
    } catch (error) {
      logger.error('Failed to get published teams', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if teams are published for a match
   */
  async areTeamsPublished(matchDate: Date): Promise<boolean> {
    try {
      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      const count = await this.teamRepository
        .createQueryBuilder('team')
        .where('DATE(team.match_date) = :matchDate', { matchDate: formattedDate })
        .andWhere('team.is_published = :isPublished', { isPublished: true })
        .getCount();
        
      return count > 0;
    } catch (error) {
      logger.error('Failed to check if teams are published', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get all teams for a specific match (both published and unpublished)
   * This is for admin preview functionality
   */
  async getAllTeamsForMatch(matchDate: Date): Promise<GeneratedTeam[]> {
    try {
      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      const teams = await this.teamRepository
        .createQueryBuilder('team')
        .leftJoinAndSelect('team.teamPlayers', 'teamPlayer')
        .leftJoinAndSelect('teamPlayer.user', 'user')
        .where('DATE(team.match_date) = :matchDate', { matchDate: formattedDate })
        .orderBy('team.team_number', 'ASC')
        .addOrderBy('teamPlayer.is_substitute', 'ASC')
        .getMany();

      return teams.map(team => ({
        teamNumber: team.team_number,
        teamName: team.team_name || `Team ${team.team_number}`,
        players: team.teamPlayers
          .filter(tp => !tp.is_substitute)
          .map(tp => ({
            id: tp.user.id,
            name: tp.user.name,
            preferred_position: tp.user.preferred_position,
            assigned_position: tp.assigned_position,
            is_substitute: false,
            profile_pic_url: tp.user.profile_pic_url,
          })),
        substitutes: team.teamPlayers
          .filter(tp => tp.is_substitute)
          .map(tp => ({
            id: tp.user.id,
            name: tp.user.name,
            preferred_position: tp.user.preferred_position,
            is_substitute: true,
            substitute_for_position: tp.substitute_for_position,
            profile_pic_url: tp.user.profile_pic_url,
          })),
      }));
    } catch (error) {
      logger.error('Failed to get all teams for match', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }
} 