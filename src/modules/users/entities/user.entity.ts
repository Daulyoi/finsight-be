import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Rekening } from '../../accounts/entities/account.entity';
import { SejarahPersona } from '../../persona_history/entities/persona_history.entity';

@Entity('nasabah')
export class Nasabah {
  @PrimaryColumn({ name: 'id_nasabah', type: 'varchar', length: 255 })
  idNasabah!: string;

  @Column({ name: 'nama_nasabah', type: 'varchar', length: 255, nullable: false })
  namaNasabah!: string;

  @Column({ name: 'tanggal_lahir', type: 'date', nullable: false })
  tanggalLahir!: Date;

  @Column({ name: 'nama_ibu_kandung', type: 'varchar', length: 255, nullable: false })
  namaIbuKandung!: string;

  @Column({ name: 'segmen_demografi', type: 'varchar', length: 255, nullable: true })
  segmenDemografi!: string | null;

  @Column({ name: 'gaji_bulanan', type: 'bigint', nullable: true })
  gajiBulanan!: string | null;

  @Column({ name: 'persona_dasar', type: 'varchar', length: 255, nullable: true })
  personaDasar!: string | null;

  @Column({ name: 'is_dynamic', type: 'boolean', nullable: false })
  isDynamic!: boolean;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true, nullable: false })
  email!: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: false })
  password!: string;

  @Column({ name: 'current_hashed_refresh_token', type: 'varchar', length: 255, nullable: true })
  currentHashedRefreshToken!: string | null;

  @OneToMany(() => Rekening, (rekening) => rekening.nasabah)
  rekenings!: Rekening[];

  @OneToMany(() => SejarahPersona, (sejarahPersona) => sejarahPersona.nasabah)
  sejarahPersonas!: SejarahPersona[];
}
