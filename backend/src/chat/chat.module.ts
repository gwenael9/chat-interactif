import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessageEntity } from './entity/message.entity';
import { ConversationEntity } from './entity/conversation.entity';
import { ConversationUserEntity } from './entity/conversation-user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      ConversationEntity,
      ConversationUserEntity,
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
