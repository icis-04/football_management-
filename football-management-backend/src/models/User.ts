import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

/**
 * User entity representing players and administrators
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Index('idx_users_email')
  email!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;

  @Column({
    type: 'text',
    nullable: true,
    default: 'any',
  })
  preferred_position!: string;

  @Column({ type: 'text', nullable: true })
  profile_pic_url?: string | undefined;

  @Column({ default: false })
  is_admin!: boolean;

  @Column({ default: true })
  @Index('idx_users_active')
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany('Availability', 'user')
  availabilities!: any[];

  @OneToMany('TeamPlayer', 'user')
  teamPlayers!: any[];

  @OneToMany('AdminAuditLog', 'admin')
  auditLogs!: any[];

  @OneToMany('AllowedEmail', 'addedByAdmin')
  addedEmails!: any[];

  @OneToMany('NotificationPreference', 'user')
  notificationPreferences!: any[];

  /**
   * Convert to safe user profile (without password)
   */
  toProfile(): Omit<User, 'password' | 'toProfile' | 'isGoalkeeper' | 'isActiveUser' | 'isAdminUser'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = this;
    return profile;
  }

  /**
   * Check if user is a goalkeeper
   */
  isGoalkeeper(): boolean {
    return this.preferred_position === 'goalkeeper';
  }

  /**
   * Check if user is active
   */
  isActiveUser(): boolean {
    return this.is_active;
  }

  /**
   * Check if user is admin
   */
  isAdminUser(): boolean {
    return this.is_admin;
  }
} 