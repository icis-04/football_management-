import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('player_statistics')
export class PlayerStatistics {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'season_year', default: new Date().getFullYear() })
  season_year!: number;

  @Column({ name: 'games_played', default: 0 })
  games_played!: number;

  @Column({ name: 'games_available', default: 0 })
  games_available!: number;

  @Column({ name: 'games_unavailable', default: 0 })
  games_unavailable!: number;

  @Column({ name: 'times_goalkeeper', default: 0 })
  times_goalkeeper!: number;

  @Column({ name: 'times_substitute', default: 0 })
  times_substitute!: number;

  @Column({ name: 'availability_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  availability_rate!: number; // Percentage

  @Column({ name: 'participation_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  participation_rate!: number; // Percentage

  @Column({ name: 'last_played_date', type: 'date', nullable: true })
  last_played_date?: Date;

  @Column({ name: 'preferred_position_played_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  preferred_position_played_rate!: number; // How often they play their preferred position

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Calculate and update rates
  updateRates(): void {
    const totalGames = this.games_available + this.games_unavailable;
    this.availability_rate = totalGames > 0 ? (this.games_available / totalGames) * 100 : 0;
    this.participation_rate = this.games_available > 0 ? (this.games_played / this.games_available) * 100 : 0;
  }
}
