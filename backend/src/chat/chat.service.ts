import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MessageEntity } from './entity/message.entity';
import { ConversationUserEntity } from './entity/conversation-user.entity';
import { UserService } from 'src/user/user.service';
import { ConversationEntity } from './entity/conversation.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageCreatedEvent } from './chat.event';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    private userService: UserService,

    @InjectRepository(ConversationUserEntity)
    private readonly convUserRepo: Repository<ConversationUserEntity>,

    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,

    private eventEmitter: EventEmitter2,
  ) {}

  async createConversation(
    participantIds: string[],
    conversatioName: string,
  ): Promise<ConversationEntity> {
    for (const participantId of participantIds) {
      const participant = await this.userService.findOne(participantId);
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }
    }

    const conversation = this.conversationRepo.create({
      isGroup: participantIds.length > 2,
      participants: participantIds.map((id) => ({ userId: id })),
      name: conversatioName,
    });

    const savedConversation = await this.conversationRepo.save(conversation);

    return savedConversation;
  }

  async saveMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    const membership = await this.convUserRepo.findOne({
      where: { conversationId: data.conversationId, userId: data.senderId },
    });

    if (!membership) throw new ForbiddenException('User not in conversation');

    const message = this.messageRepo.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
    });

    const saved = await this.messageRepo.save(message);

    this.eventEmitter.emit(
      'chat.message.created',
      new MessageCreatedEvent(data.conversationId, saved),
    );

    return saved;
  }

  async markAsRead(userId: string, conversationId: string, messageId: string) {
    await this.convUserRepo.update(
      { userId, conversationId },
      { lastReadMessageId: messageId },
    );
  }

  async getUnreadCount(userId: string, conversationId: string) {
    const lastRead = await this.convUserRepo.findOne({
      where: { userId, conversationId },
    });

    return this.messageRepo.count({
      where: {
        conversationId,
        id: MoreThan(lastRead?.lastReadMessageId || ''),
      },
    });
  }

  async getMessagesByConversation(
    conversationId: string,
  ): Promise<MessageEntity[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' }, // du plus ancien au plus récent
    });
  }
}
