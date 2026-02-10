import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MessageEntity } from './entity/message.entity';
import { ConversationUserEntity } from './entity/conversation-user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,

    @InjectRepository(ConversationUserEntity)
    private readonly convUserRepo: Repository<ConversationUserEntity>,
  ) {}

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

    return this.messageRepo.save(message);
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

  async getMessagesByConversation(conversationId: string) {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' }, // du plus ancien au plus récent
    });
  }
}
