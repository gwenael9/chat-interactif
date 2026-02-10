import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { UserEntity } from '../user/user.entity';
import { MessageEntity } from './entity/message.entity';
import { ConversationEntity } from './entity/conversation.entity';
import { ConversationUserEntity } from './entity/conversation-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      ConversationEntity,
      ConversationUserEntity,
      UserEntity,
    ]),
  ],
  controllers : [ConversationEntity],
  providers: [ChatGateway, ChatService],

})
export class ChatModule {}


