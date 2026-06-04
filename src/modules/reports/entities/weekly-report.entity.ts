import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Nasabah } from '../../users/entities/user.entity';

@Entity('weekly_reports')
@Unique(['userId', 'reportDate'])
export class WeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @ManyToOne(() => Nasabah, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  nasabah!: Nasabah;

  @Column({ name: 'report_date', type: 'date' })
  reportDate!: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: string;

  @Column({ type: 'varchar', length: 255 })
  persona!: string;

  @Column({ name: 'wants_ratio', type: 'numeric', precision: 5, scale: 4 })
  wantsRatio!: number;

  @Column({ name: 'needs_ratio', type: 'numeric', precision: 5, scale: 4 })
  needsRatio!: number;

  @Column({ name: 'total_pengeluaran', type: 'bigint' })
  totalPengeluaran!: string;

  @Column({ name: 'anomali_count', type: 'integer', default: 0 })
  anomaliCount!: number;

  @Column({ name: 'report_text', type: 'text' })
  reportText!: string;

  @Column({ name: 'generated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt!: Date;
}
