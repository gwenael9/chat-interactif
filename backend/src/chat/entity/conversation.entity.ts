import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { ConversationUserEntity } from './conversation-user.entity';
import { MessageEntity } from './message.entity';

@Entity('conversation')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isGroup: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ConversationUserEntity, (cu) => cu.conversation)
  participants: ConversationUserEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];

  @Column()
  name: string;
}
