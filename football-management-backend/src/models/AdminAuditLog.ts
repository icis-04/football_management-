import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

/**
 * AdminAuditLog entity for tracking admin actions
 */
@Entity('admin_audit_log')
export class AdminAuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  admin_id!: number;

  @Column()
  action!: string;

  @Column({ type: 'text', nullable: true })
  target_type!: string | null;

  @Column({ type: 'integer', nullable: true })
  target_id!: number | null;

  @Column({ type: 'text', nullable: true })
  details!: string | null; // JSON string

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin!: User;
} 