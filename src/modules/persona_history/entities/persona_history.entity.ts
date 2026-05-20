import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Nasabah } from '../../users/entities/user.entity';

@Entity('sejarah_persona')
export class SejarahPersona {
  @PrimaryGeneratedColumn({ name: 'id_sejarah_persona' })
  idSejarahPersona!: number;

  @Column({ name: 'id_nasabah', type: 'varchar', length: 255, nullable: false })
  idNasabah!: string;

  @ManyToOne(() => Nasabah, (nasabah) => nasabah.sejarahPersonas, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'id_nasabah' })
  nasabah!: Nasabah;

  @Column({ name: 'persona_dasar', type: 'varchar', length: 255, nullable: false })
  personaDasar!: string;

  @Column({ name: 'bulan', type: 'date', nullable: false })
  bulan!: Date;
}
