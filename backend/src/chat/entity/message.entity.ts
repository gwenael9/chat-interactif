 import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ConversationEntity } from './conversation.entity';

@Entity('message')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversationId: string;

  @Column('uuid')
  senderId: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ConversationEntity, (c) => c.messages, {
    onDelete: 'CASCADE',
  })
  conversation: ConversationEntity;

  @ManyToOne(() => UserEntity)
  sender: UserEntity;
}
