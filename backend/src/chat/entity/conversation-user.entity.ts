import { Entity, ManyToOne, Column, PrimaryColumn } from 'typeorm';
import { UserEntity } from 'src/user/user.entity';
import { ConversationEntity } from './conversation.entity';

@Entity('conversation_user')
export class ConversationUserEntity {
  @PrimaryColumn('uuid')
  conversationId: string;

  @PrimaryColumn('uuid')
  userId: string;

  @ManyToOne(() => ConversationEntity, (c) => c.participants, {
    onDelete: 'CASCADE',
  })
  conversation: ConversationEntity;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @Column({ nullable: true })
  lastReadMessageId: string;
}
