import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('detected_anomalies')
export class DetectedAnomaly {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_transaksi', type: 'varchar', length: 255 })
  idTransaksi!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'report_type', type: 'varchar', length: 10 })
  reportType!: 'weekly' | 'monthly';

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @Column({ name: 'kategori_detail', type: 'varchar', length: 255 })
  kategoriDetail!: string;

  @Column({ type: 'bigint' })
  nominal!: string;

  @Column({ type: 'double precision' })
  mae!: number;

  @Column({ name: 'threshold_val', type: 'double precision' })
  thresholdVal!: number;

  @Column({ type: 'double precision' })
  ratio!: number;

  @Column({ name: 'anomaly_context', type: 'text', nullable: true })
  anomalyContext!: string | null;

  @Column({ name: 'detected_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  detectedAt!: Date;
}
