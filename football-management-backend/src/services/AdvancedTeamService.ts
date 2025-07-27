import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Team } from '../models/Team';
import { TeamTemplate } from '../models/TeamTemplate';
import { User } from '../models/User';
import { logger } from '../config/logger';
import { TeamGenerationService } from './TeamGenerationService';

export interface TeamAdjustment {
  teamId: number;
  playerId: number;
  action: 'add' | 'remove' | 'move' | 'substitute';
  targetTeamId?: number;
  newPosition?: string;
}

export interface TeamTemplateData {
  name: string;
  description?: string;
  teamConfiguration: any;
  playerCount: number;
  teamCount: number;
}

export interface TeamBalanceMetrics {
  positionBalance: Record<string, number>;
  skillBalance: number; // Future implementation
  experienceBalance: number; // Future implementation
  overallBalance: number;
}

export class AdvancedTeamService extends TeamGenerationService {
  private teamTemplateRepository: Repository<TeamTemplate>;
  private userRepository: Repository<User>;

  constructor() {
    super();
    this.teamTemplateRepository = AppDataSource.getRepository(TeamTemplate);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async applyTeamAdjustment(adjustment: TeamAdjustment, adminId: number): Promise<void> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: adjustment.teamId },
        relations: ['teamPlayers', 'teamPlayers.user']
      });

      if (!team) {
        throw new Error('Team not found');
      }

      if (team.is_published) {
        logger.warn('Attempting to modify published team', {
          teamId: adjustment.teamId,
          adminId
        });
      }

      switch (adjustment.action) {
        case 'add':
          await this.addPlayerToTeam(adjustment.teamId, adjustment.playerId, adjustment.newPosition);
          break;
        case 'remove':
          await this.removePlayerFromTeam(adjustment.teamId, adjustment.playerId);
          break;
        case 'move':
          if (!adjustment.targetTeamId) {
            throw new Error('Target team ID required for move action');
          }
          await this.movePlayerBetweenTeams(
            adjustment.teamId, 
            adjustment.targetTeamId, 
            adjustment.playerId,
            adjustment.newPosition
          );
          break;
        case 'substitute':
          await this.togglePlayerSubstituteStatus(adjustment.teamId, adjustment.playerId);
          break;
        default:
          throw new Error('Invalid adjustment action');
      }

      // Log the adjustment
      await this.logAdminAction(adminId, 'TEAM_ADJUSTMENT', 'team', adjustment.teamId, {
        action: adjustment.action,
        playerId: adjustment.playerId,
        targetTeamId: adjustment.targetTeamId,
        newPosition: adjustment.newPosition
      });

      logger.info('Team adjustment applied', {
        teamId: adjustment.teamId,
        action: adjustment.action,
        playerId: adjustment.playerId,
        adminId
      });
    } catch (error) {
      logger.error('Failed to apply team adjustment', {
        adjustment,
        adminId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async addPlayerToTeam(teamId: number, playerId: number, position?: string): Promise<void> {
    const existingPlayer = await this.teamPlayerRepository.findOne({
      where: { team_id: teamId, user_id: playerId }
    });

    if (existingPlayer) {
      throw new Error('Player already assigned to this team');
    }

    const user = await this.userRepository.findOne({
      where: { id: playerId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const teamPlayer = this.teamPlayerRepository.create({
      team_id: teamId,
      user_id: playerId,
      assigned_position: position || user.preferred_position || 'any',
      is_substitute: false
    });

    await this.teamPlayerRepository.save(teamPlayer);
  }

  private async removePlayerFromTeam(teamId: number, playerId: number): Promise<void> {
    const result = await this.teamPlayerRepository.delete({
      team_id: teamId,
      user_id: playerId
    });

    if (result.affected === 0) {
      throw new Error('Player not found in team');
    }
  }

  private async movePlayerBetweenTeams(
    sourceTeamId: number, 
    targetTeamId: number, 
    playerId: number,
    newPosition?: string
  ): Promise<void> {
    // Remove from source team
    await this.removePlayerFromTeam(sourceTeamId, playerId);
    
    // Add to target team
    await this.addPlayerToTeam(targetTeamId, playerId, newPosition);
  }

  private async togglePlayerSubstituteStatus(teamId: number, playerId: number): Promise<void> {
    const teamPlayer = await this.teamPlayerRepository.findOne({
      where: { team_id: teamId, user_id: playerId }
    });

    if (!teamPlayer) {
      throw new Error('Player not found in team');
    }

    teamPlayer.is_substitute = !teamPlayer.is_substitute;
    await this.teamPlayerRepository.save(teamPlayer);
  }

  async saveTeamAsTemplate(
    teamId: number, 
    templateData: TeamTemplateData, 
    adminId: number
  ): Promise<TeamTemplate> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: teamId },
        relations: ['teamPlayers', 'teamPlayers.user']
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const template = this.teamTemplateRepository.create({
        name: templateData.name,
        description: templateData.description,
        created_by_admin_id: adminId,
        team_configuration: JSON.stringify(templateData.teamConfiguration),
        player_count: templateData.playerCount,
        team_count: templateData.teamCount
      });

      const savedTemplate = await this.teamTemplateRepository.save(template);

      await this.logAdminAction(adminId, 'CREATE_TEAM_TEMPLATE', 'team_template', savedTemplate.id, {
        templateName: templateData.name,
        sourceTeamId: teamId
      });

      logger.info('Team template created', {
        templateId: savedTemplate.id,
        templateName: templateData.name,
        sourceTeamId: teamId,
        adminId
      });

      return savedTemplate;
    } catch (error) {
      logger.error('Failed to save team template', {
        teamId,
        templateData,
        adminId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getTeamTemplates(adminId: number): Promise<TeamTemplate[]> {
    try {
      return await this.teamTemplateRepository.find({
        where: { is_active: true },
        relations: ['createdByAdmin'],
        order: { created_at: 'DESC' }
      });
    } catch (error) {
      logger.error('Failed to get team templates', {
        adminId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async applyTeamTemplate(templateId: number, matchDate: Date, adminId: number): Promise<Team[]> {
    try {
      const template = await this.teamTemplateRepository.findOne({
        where: { id: templateId, is_active: true }
      });

      if (!template) {
        throw new Error('Team template not found');
      }

      const configuration = template.getParsedConfiguration();
      
      // Generate teams using the template configuration
      const teams = await this.generateTeamsFromTemplate(matchDate, configuration);

      // Update template usage
      template.incrementUsage();
      await this.teamTemplateRepository.save(template);

      await this.logAdminAction(adminId, 'APPLY_TEAM_TEMPLATE', 'team_template', templateId, {
        matchDate: matchDate.toISOString(),
        teamsGenerated: teams.length
      });

      logger.info('Team template applied', {
        templateId,
        templateName: template.name,
        matchDate,
        teamsGenerated: teams.length,
        adminId
      });

      return teams;
    } catch (error) {
      logger.error('Failed to apply team template', {
        templateId,
        matchDate,
        adminId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async generateTeamsFromTemplate(matchDate: Date, configuration: any): Promise<Team[]> {
    // This would implement template-based team generation
    // For now, fall back to regular generation
    const result = await this.generateTeams(matchDate);
    
    // Get the actual Team entities from the database
    const teams = await this.teamRepository.find({
      where: { match_date: matchDate },
      order: { team_number: 'ASC' }
    });
    
    return teams;
  }

  async analyzeTeamBalance(teamId: number): Promise<TeamBalanceMetrics> {
    try {
      const team = await this.teamRepository.findOne({
        where: { id: teamId },
        relations: ['teamPlayers', 'teamPlayers.user']
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const positionBalance: Record<string, number> = {};
      
      team.teamPlayers.forEach(player => {
        const position = player.assigned_position || player.user.preferred_position || 'any';
        positionBalance[position] = (positionBalance[position] || 0) + 1;
      });

      // Calculate balance score (simplified)
      const positions = Object.keys(positionBalance);
      const counts = Object.values(positionBalance);
      const averageCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
      const variance = counts.reduce((sum, count) => sum + Math.pow(count - averageCount, 2), 0) / counts.length;
      const overallBalance = Math.max(0, 100 - (variance * 10)); // Simplified balance score

      return {
        positionBalance,
        skillBalance: 75, // Placeholder for future implementation
        experienceBalance: 80, // Placeholder for future implementation
        overallBalance: Math.round(overallBalance)
      };
    } catch (error) {
      logger.error('Failed to analyze team balance', {
        teamId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async swapPlayers(
    team1Id: number, 
    player1Id: number, 
    team2Id: number, 
    player2Id: number, 
    adminId: number
  ): Promise<void> {
    try {
      const player1 = await this.teamPlayerRepository.findOne({
        where: { team_id: team1Id, user_id: player1Id }
      });

      const player2 = await this.teamPlayerRepository.findOne({
        where: { team_id: team2Id, user_id: player2Id }
      });

      if (!player1 || !player2) {
        throw new Error('One or both players not found in specified teams');
      }

      // Swap team assignments
      const temp = player1.team_id;
      player1.team_id = player2.team_id;
      player2.team_id = temp;

      await this.teamPlayerRepository.save([player1, player2]);

      await this.logAdminAction(adminId, 'SWAP_PLAYERS', 'team', team1Id, {
        player1Id,
        player2Id,
        team1Id,
        team2Id
      });

      logger.info('Players swapped between teams', {
        player1Id,
        player2Id,
        team1Id,
        team2Id,
        adminId
      });
    } catch (error) {
      logger.error('Failed to swap players', {
        team1Id,
        player1Id,
        team2Id,
        player2Id,
        adminId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getTeamModificationHistory(teamId: number): Promise<any[]> {
    try {
      // This would query the admin audit log for team modifications
      // Simplified implementation
      return [];
    } catch (error) {
      logger.error('Failed to get team modification history', {
        teamId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async logAdminAction(
    adminId: number,
    action: string,
    targetType: string,
    targetId: number,
    details: any
  ): Promise<void> {
    // This would use the AdminService to log actions
    // For now, just log to console
    logger.info('Admin action logged', {
      adminId,
      action,
      targetType,
      targetId,
      details
    });
  }
}
