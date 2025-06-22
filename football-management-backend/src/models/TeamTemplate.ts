import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('team_templates')
export class TeamTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'created_by_admin_id' })
  created_by_admin_id!: number;

  @Column({ name: 'team_configuration', type: 'text' })
  team_configuration!: string; // JSON string containing team setup

  @Column({ name: 'player_count' })
  player_count!: number;

  @Column({ name: 'team_count' })
  team_count!: number;

  @Column({ name: 'is_active', default: true })
  is_active!: boolean;

  @Column({ name: 'usage_count', default: 0 })
  usage_count!: number; // How many times this template has been used

  @Column({ name: 'last_used_date', type: 'datetime', nullable: true })
  last_used_date?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_admin_id' })
  createdByAdmin!: User;

  // Helper method to parse team configuration
  getParsedConfiguration(): any {
    return JSON.parse(this.team_configuration);
  }

  // Helper method to set team configuration
  setConfiguration(config: any): void {
    this.team_configuration = JSON.stringify(config);
  }

  // Increment usage count
  incrementUsage(): void {
    this.usage_count += 1;
    this.last_used_date = new Date();
  }
}
