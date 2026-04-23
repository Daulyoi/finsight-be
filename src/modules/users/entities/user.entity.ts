// entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { ChatSession } from '../../chat-sessions/entities/chat-session.entity';

export type PersonaType = 'spendthrift' | 'balanced' | 'tightwad';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({
    name: 'monthly_income',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  monthlyIncome: number = 0;

  @Column({
    name: 'savings_goal',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  savingsGoal: number = 0;

  @Column({ name: 'persona_type', type: 'varchar', nullable: true })
  personaType!: PersonaType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];

  @OneToMany(() => ChatSession, (session) => session.user)
  chatSessions!: ChatSession[];
}
