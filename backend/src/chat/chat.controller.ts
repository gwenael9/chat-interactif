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
import {
  CreateConversationDto,
  CreateMessageDto,
} from './dtos/conversation.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: RequestWithUser,
  ) {
    console.log('dto', dto);
    if (!dto.participantsIds) {
      throw new UnauthorizedException(
        'Veuillez renseigner au moins 1 participant.',
      );
    }
    const uniqueParticipants = Array.from(
      new Set([...dto.participantsIds, req.user.sub]),
    );
    return await this.chatService.createConversation(
      uniqueParticipants,
      dto.name,
    );
  }

  @UseGuards(AuthGuard)
  @Get('conversations')
  async getAllConversation(@Req() req: RequestWithUser) {
    return this.chatService.findAll(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('conversations/:id')
  async getOneConversation(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.chatService.findOne(id, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post()
  async createMessage(
    @Body()
    dto: CreateMessageDto,
    @Req() req: RequestWithUser,
  ): Promise<MessageEntity> {
    return this.chatService.saveMessage(
      dto.conversationId,
      req.user.sub,
      dto.content,
    );
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id', ParseUUIDPipe) conversationId: string,
  ): Promise<MessageEntity[]> {
    return this.chatService.getMessagesByConversation(conversationId);
  }

  @Post('read')
  async markAsRead(@Body() dto: MarkAsReadDto, @Req() req: RequestWithUser) {
    return this.chatService.markAsRead(
      req.user.sub,
      dto.conversationId,
      dto.messageId,
    );
  }
}
