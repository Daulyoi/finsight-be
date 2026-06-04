import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Nasabah } from '../../users/entities/user.entity';

@Entity('monthly_reports')
@Unique(['userId', 'targetMonth'])
export class MonthlyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @ManyToOne(() => Nasabah, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  nasabah!: Nasabah;

  @Column({ name: 'target_month', type: 'char', length: 7 })
  targetMonth!: string; // YYYY-MM

  @Column({ type: 'varchar', length: 255 })
  persona!: string;

  @Column({ name: 'persona_sebelum', type: 'varchar', length: 255, nullable: true })
  personaSebelum!: string | null;

  @Column({ name: 'savings_rate', type: 'numeric', precision: 6, scale: 4 })
  savingsRate!: number;

  @Column({ name: 'wants_ratio', type: 'numeric', precision: 5, scale: 4 })
  wantsRatio!: number;

  @Column({ name: 'needs_ratio', type: 'numeric', precision: 5, scale: 4 })
  needsRatio!: number;

  @Column({ name: 'wants_amount', type: 'bigint' })
  wantsAmount!: string;

  @Column({ name: 'needs_amount', type: 'bigint' })
  needsAmount!: string;

  @Column({ name: 'savings_amount', type: 'bigint' })
  savingsAmount!: string;

  @Column({ name: 'behavioral_features', type: 'jsonb', nullable: true })
  behavioralFeatures!: any;

  @Column({ name: 'report_text', type: 'text' })
  reportText!: string;

  @Column({ name: 'generated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt!: Date;
}
