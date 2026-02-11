import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageEntity } from './entity/message.entity';
import { SendMessageDto } from './dtos/send-message.dto';
import { GetHistoryDto } from './dtos/get-history.dto';
import { MarkAsReadDto } from './dtos/mark-as-read.dto';
import { type RequestWithUser } from 'src/auth/guards/auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Récupérer l'historique d'une conversation
   * GET /chat/conversations/:id/messages
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id', ParseUUIDPipe) conversationId: string,
  ): Promise<MessageEntity[]> {
    return this.chatService.getMessagesByConversation(conversationId);
  }

  /**
   * Envoyer un message
   * POST /chat/messages
   */
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Req() req: RequestWithUser,
  ): Promise<MessageEntity> {
    return this.chatService.saveMessage({
      conversationId: dto.conversationId,
      senderId: req.user.sub,
      content: dto.content,
    });
  }

  /**
   * Marquer un message comme lu
   * POST /chat/read
   */
  @Post('read')
  async markAsRead(@Body() dto: MarkAsReadDto, @Req() req: RequestWithUser) {
    return this.chatService.markAsRead(
      req.user.sub,
      dto.conversationId,
      dto.messageId,
    );
  }

  /**
   * Récupérer l'historique via POST (alternative au GET)
   * POST /chat/history
   */
  @Post('history')
  async getHistory(@Body() dto: GetHistoryDto): Promise<MessageEntity[]> {
    return this.chatService.getMessagesByConversation(dto.conversationId);
  }
}
