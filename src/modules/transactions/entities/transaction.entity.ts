import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column()
  merchant!: string;

  @Column()
  category!: string;

  @Column()
  subcategory!: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ default: 0 })
  anomaly_score: number = 0;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
