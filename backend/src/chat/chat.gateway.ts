import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GetHistoryDto } from './dtos/get-history.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string },
  ) {
    console.log('Message reçu:', payload.content);

    this.server.emit('newMessage', {
      content: payload.content,
      senderSocketId: client.id,
    });
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: GetHistoryDto,
  ) {
    const messages = await this.chatService.getMessagesByConversation(
      dto.conversationId,
    );

    client.emit('history', messages);
  }
}
