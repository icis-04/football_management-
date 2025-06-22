import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'email_notifications', default: true })
  email_notifications!: boolean;

  @Column({ name: 'availability_reminders', default: true })
  availability_reminders!: boolean;

  @Column({ name: 'team_announcements', default: true })
  team_announcements!: boolean;

  @Column({ name: 'admin_updates', default: true })
  admin_updates!: boolean;

  @Column({ name: 'reminder_hours_before', default: 24 })
  reminder_hours_before!: number; // Hours before deadline to send reminder

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
