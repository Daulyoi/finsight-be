import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rekening } from '../../accounts/entities/account.entity';
import { MccMap } from '../../mcc_map/entities/mcc_map.entity';

@Entity('transaksi')
export class Transaksi {
  @PrimaryColumn({ name: 'id_transaksi', type: 'varchar', length: 255 })
  idTransaksi!: string;

  @Column({ name: 'id_rekening', type: 'varchar', length: 255, nullable: false })
  idRekening!: string;

  @ManyToOne(() => Rekening, (rekening) => rekening.transaksis, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_rekening' })
  rekening!: Rekening;

  @Column({ name: 'timestamp', type: 'timestamp', nullable: false })
  timestamp!: Date;

  @Column({ name: 'tipe_mutasi', type: 'varchar', length: 255, nullable: false })
  tipeMutasi!: string;

  @Column({ name: 'deskripsi_mutasi', type: 'varchar', length: 255, nullable: true })
  deskripsiMutasi!: string | null;

  @Column({ name: 'catatan_mutasi', type: 'varchar', length: 255, nullable: true })
  catatanMutasi!: string | null;

  @Column({ name: 'id_mcc', type: 'varchar', length: 255, nullable: true })
  idMcc!: string | null;

  @ManyToOne(() => MccMap, (mccMap) => mccMap.transaksis, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'id_mcc' })
  mccMap!: MccMap | null;

  @Column({ name: 'nominal', type: 'bigint', nullable: false })
  nominal!: string;

  @Column({ name: 'sisa_saldo', type: 'bigint', nullable: false })
  sisaSaldo!: string;

  @Column({ name: 'label_anomali', type: 'boolean', nullable: false })
  labelAnomali!: boolean;

  @Column({ name: 'bulan', type: 'date', nullable: false })
  bulan!: Date;

  @Column({ name: 'hari_bulan', type: 'date', nullable: false })
  hariBulan!: Date;

  @Column({ name: 'hari_minggu', type: 'date', nullable: false })
  hariMinggu!: Date;

  @Column({ name: 'jam', type: 'time', nullable: false })
  jam!: string;

  @Column({ name: 'menit', type: 'time', nullable: false })
  menit!: string;

  @Column({ name: 'hour_sin', type: 'varchar', length: 255, nullable: true })
  hourSin!: string | null;

  @Column({ name: 'hour_cos', type: 'varchar', length: 255, nullable: true })
  hourCos!: string | null;

  @Column({ name: 'month_sin', type: 'varchar', length: 255, nullable: true })
  monthSin!: string | null;

  @Column({ name: 'month_cos', type: 'varchar', length: 255, nullable: true })
  monthCos!: string | null;
}
