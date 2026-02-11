import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageEntity } from './entity/message.entity';
import { MarkAsReadDto } from './dtos/mark-as-read.dto';
import { AuthGuard, type RequestWithUser } from 'src/auth/guards/auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post('conversations')
  async createConversation(
    @Body() body: { participantIds: string[] },
    @Req() req: RequestWithUser,
  ) {
    if (!body.participantIds) {
      throw new UnauthorizedException(
        'Veuillez renseigner au moins 1 participant.',
      );
    }
    const uniqueParticipants = Array.from(
      new Set([...body.participantIds, req.user.sub]),
    );
    return await this.chatService.createConversation(uniqueParticipants);
  }

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

  // @Post('messages')
  // async sendMessage(
  //   @Body() dto: SendMessageDto,
  //   @Req() req: RequestWithUser,
  // ): Promise<MessageEntity> {
  //   return this.chatService.saveMessage({
  //     conversationId: dto.conversationId,
  //     senderId: req.user.sub,
  //     content: dto.content,
  //   });
  // }

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

  // @Post('history')
  // async getHistory(@Body() dto: GetHistoryDto): Promise<MessageEntity[]> {
  //   return this.chatService.getMessagesByConversation(dto.conversationId);
  // }
}
