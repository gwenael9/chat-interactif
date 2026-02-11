import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GetHistoryDto } from './dtos/get-history.dto';
import { ChatService } from './chat.service';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageCreatedEvent } from './chat.event';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server!: Server;

  // Quand un client se connecte, il rejoint sa room personnelle
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      void client.join(`user:${userId}`);
      console.log(`User ${userId} connecté (socket: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket ${client.id} déconnecté`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    await client.join(`conversation:${payload.conversationId}`);
    console.log(
      `Socket ${client.id} a rejoint la conversation ${payload.conversationId}`,
    );
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    await client.leave(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { conversationId: string; senderId: string; content: string },
  ) {
    console.log('Message reçu:', payload.content);

    // save dans la base
    const message = await this.chatService.saveMessage({
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      content: payload.content,
    });

    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('newMessage', message);
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

  @OnEvent('chat.message.created')
  handleMessageCreated(event: MessageCreatedEvent) {
    this.server
      .to(`conversation:${event.conversationId}`)
      .emit('newMessage', event.message);
  }
}
