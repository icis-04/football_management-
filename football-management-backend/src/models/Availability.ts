import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User';

/**
 * Availability entity for tracking player availability for matches
 */
@Entity('availability')
@Unique(['user_id', 'match_date'])
export class Availability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column({ type: 'date' })
  @Index('idx_availability_match_date')
  match_date!: Date;

  @Column()
  is_available!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, user => user.availabilities)
  @JoinColumn({ name: 'user_id' })
  @Index('idx_availability_user')
  user!: User;

  /**
   * Update availability status
   */
  updateAvailability(isAvailable: boolean): void {
    this.is_available = isAvailable;
    this.updated_at = new Date();
  }

  /**
   * Check if player is available
   */
  isPlayerAvailable(): boolean {
    return this.is_available;
  }

  /**
   * Get match date as string
   */
  getMatchDateString(): string {
    return this.match_date.toISOString().split('T')[0]!;
  }
} 