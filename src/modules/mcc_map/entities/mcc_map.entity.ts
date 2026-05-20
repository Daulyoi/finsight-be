import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Transaksi } from '../../transactions/entities/transaction.entity';

@Entity('mcc_map')
export class MccMap {
  @PrimaryColumn({ name: 'mcc_id', type: 'varchar', length: 255 })
  mccId!: string;

  @Column({ name: 'mcc_number', type: 'integer', nullable: false })
  mccNumber!: number;

  @OneToMany(() => Transaksi, (transaksi) => transaksi.mccMap)
  transaksis!: Transaksi[];
}
