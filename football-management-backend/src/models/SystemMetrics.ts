import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('system_metrics')
export class SystemMetrics {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'metric_type' })
  metric_type!: string; // 'response_time', 'error_count', 'user_activity', 'team_generation', etc.

  @Column({ name: 'metric_name' })
  metric_name!: string; // Specific metric name

  @Column({ name: 'metric_value', type: 'decimal', precision: 10, scale: 3 })
  metric_value!: number;

  @Column({ name: 'metric_unit', nullable: true })
  metric_unit?: string; // 'ms', 'count', 'percentage', etc.

  @Column({ name: 'metric_date', type: 'date' })
  metric_date!: Date;

  @Column({ name: 'metric_hour', nullable: true })
  metric_hour?: number; // 0-23 for hourly metrics

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON string for additional data

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  // Helper method to parse metadata
  getParsedMetadata(): any {
    return this.metadata ? JSON.parse(this.metadata) : null;
  }

  // Helper method to set metadata
  setMetadata(data: any): void {
    this.metadata = JSON.stringify(data);
  }
}
