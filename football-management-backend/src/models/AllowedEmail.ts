import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * AllowedEmail entity for managing pre-approved email addresses
 */
@Entity('allowed_emails')
export class AllowedEmail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Index('idx_allowed_emails_email')
  email!: string;

  @Column()
  added_by_admin_id!: number;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by_admin_id' })
  addedByAdmin!: User;

  /**
   * Mark email as used
   */
  markAsUsed(): void {
    this.used = true;
  }

  /**
   * Check if email is available for registration
   */
  isAvailableForRegistration(): boolean {
    return !this.used;
  }
} 