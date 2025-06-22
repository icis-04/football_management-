import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Team } from './Team';
import { User } from './User';

/**
 * TeamPlayer entity for managing player assignments to teams
 */
@Entity('team_players')
@Unique(['team_id', 'user_id'])
export class TeamPlayer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  team_id!: number;

  @Column()
  user_id!: number;

  @Column({ type: 'text', nullable: true })
  assigned_position?: string | undefined;

  @Column({ type: 'boolean', default: false })
  is_substitute!: boolean;

  @Column({ type: 'text', nullable: true })
  substitute_for_position?: string | undefined;

  // Relations
  @ManyToOne(() => Team, team => team.teamPlayers)
  @JoinColumn({ name: 'team_id' })
  @Index('idx_team_players_team')
  team!: Team;

  @ManyToOne(() => User, user => user.teamPlayers)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /**
   * Set as substitute
   */
  setAsSubstitute(substituteFor?: string): void {
    this.is_substitute = true;
    this.substitute_for_position = substituteFor;
  }

  /**
   * Set as regular player
   */
  setAsRegularPlayer(position?: string): void {
    this.is_substitute = false;
    this.assigned_position = position;
    this.substitute_for_position = undefined;
  }

  /**
   * Check if player is substitute
   */
  isPlayerSubstitute(): boolean {
    return this.is_substitute;
  }

  /**
   * Check if player is goalkeeper substitute
   */
  isGoalkeeperSubstitute(): boolean {
    return this.is_substitute && this.substitute_for_position === 'goalkeeper';
  }

  /**
   * Get display position
   */
  getDisplayPosition(): string {
    if (this.is_substitute) {
      return this.substitute_for_position 
        ? `${this.substitute_for_position} (Substitute)`
        : 'Substitute';
    }
    return this.assigned_position || 'Player';
  }
} 