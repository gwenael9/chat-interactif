import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import * as wsGuard from '../auth/guards/ws.guard';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageCreatedEvent } from './chat.event';
import * as type from 'src/auth/guards/type';

@WebSocketGateway({
  cors: { origin: 'http://localhost:5500', credentials: true },
  maxHttpBufferSize: 1e6,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: type.AuthenticatedSocket) {
    try {
      let token: string | undefined;

      if (client.handshake.headers?.cookie) {
        const cookies = client.handshake.headers.cookie;
        const match = cookies.match(/authToken=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }

      if (!token) {
        console.log('Connexion refusée : pas de token dans le cookie');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token);

      client.data.user = payload;
      await client.join(`user:${payload.sub}`);

      console.log(`✅ User ${payload.sub} connecté (socket: ${client.id})`);
    } catch (error) {
      console.log('Connexion refusée : token invalide', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: type.AuthenticatedSocket) {
    const userId = client.data.user?.sub || 'unknown';
    console.log(`Socket ${client.id} (user: ${userId}) déconnecté`);
  }

  @UseGuards(wsGuard.WsGuard)
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: type.AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;

    if (!userId) {
      return { error: 'Non authentifié' };
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const isMember = await this.chatService.isMemberOfConversation(
      userId,
      payload.conversationId,
    );

    if (!isMember) {
      return { error: 'Non autorisé à rejoindre cette conversation' };
    }

    await client.join(`conversation:${payload.conversationId}`);
    console.log(
      `Socket ${client.id} a rejoint la conversation ${payload.conversationId}`,
    );
  }

  @UseGuards(wsGuard.WsGuard)
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: type.AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    await client.leave(`conversation:${payload.conversationId}`);
  }

  @OnEvent('chat.message.created')
  handleMessageCreated(event: MessageCreatedEvent) {
    console.log('Broadcasting message to conversation:', event.conversationId);

    this.server
      .to(`conversation:${event.conversationId}`)
      .emit('newMessage', event.message);
  }

  @UseGuards(wsGuard.WsGuard)
  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: type.AuthenticatedSocket,
    @MessageBody() dto: { conversationId: string },
  ) {
    const userId = client.data.user?.sub;

    if (!userId) {
      return { error: 'Non authentifié' };
    }

    // Vérifier autorisation
    const isMember = await this.chatService.isMemberOfConversation(
      userId,
      dto.conversationId,
    );

    if (!isMember) {
      return { error: 'Non autorisé' };
    }

    const messages = await this.chatService.getMessagesByConversation(
      dto.conversationId,
    );

    client.emit('history', messages);
  }
}
