import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
  Unique,
} from 'typeorm';
import { TeamPlayer } from './TeamPlayer';

/**
 * Team entity for managing generated teams
 */
@Entity('teams')
@Unique(['match_date', 'team_number'])
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  @Index('idx_teams_match_date')
  match_date!: Date;

  @Column()
  team_number!: number;

  @Column({ type: 'text', nullable: true })
  team_name?: string | undefined;

  @Column({ type: 'boolean', default: false })
  is_published!: boolean;

  @Column({ type: 'datetime', nullable: true })
  published_at?: Date | undefined;

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @OneToMany(() => TeamPlayer, teamPlayer => teamPlayer.team)
  teamPlayers!: TeamPlayer[];

  /**
   * Publish the team
   */
  publish(): void {
    this.is_published = true;
    this.published_at = new Date();
  }

  /**
   * Check if team is published
   */
  isTeamPublished(): boolean {
    return this.is_published;
  }

  /**
   * Get team display name
   */
  getDisplayName(): string {
    return this.team_name || `Team ${this.team_number}`;
  }

  /**
   * Get match date as string
   */
  getMatchDateString(): string {
    return this.match_date.toISOString().split('T')[0]!;
  }

  /**
   * Set team name
   */
  setTeamName(name: string): void {
    this.team_name = name;
  }
} 