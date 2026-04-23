import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChatSession } from '../../chat-sessions/entities/chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  chatSession!: ChatSession;

  @Column({ type: 'varchar' })
  role!: 'user' | 'assistant';

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'json', nullable: true })
  contextData?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
