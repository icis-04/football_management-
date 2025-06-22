import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column()
  type!: string; // 'availability_reminder', 'team_published', 'admin_alert', etc.

  @Column()
  title!: string;

  @Column()
  message!: string;

  @Column({ type: 'text', nullable: true })
  data?: string; // JSON string for additional data

  @Column({ name: 'is_read', default: false })
  is_read!: boolean;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sent_at?: Date;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  read_at?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Helper method to parse data
  getParsedData(): any {
    return this.data ? JSON.parse(this.data) : null;
  }

  // Helper method to set data
  setData(data: any): void {
    this.data = JSON.stringify(data);
  }
}
