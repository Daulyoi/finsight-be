import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Nasabah } from '../../users/entities/user.entity';
import { Transaksi } from '../../transactions/entities/transaction.entity';

@Entity('rekening')
export class Rekening {
  @PrimaryColumn({ name: 'id_rekening', type: 'varchar', length: 255 })
  idRekening!: string;

  @Column({ name: 'id_nasabah', type: 'varchar', length: 255, nullable: false })
  idNasabah!: string;

  @ManyToOne(() => Nasabah, (nasabah) => nasabah.rekenings, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'id_nasabah' })
  nasabah!: Nasabah;

  @Column({ name: 'saldo', type: 'bigint', nullable: false })
  saldo!: string;

  @Column({ name: 'status', type: 'varchar', length: 255, nullable: false })
  status!: string;

  @OneToMany(() => Transaksi, (transaksi) => transaksi.rekening)
  transaksis!: Transaksi[];
}
