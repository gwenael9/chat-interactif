import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: 'http://localhost:5500', credentials: true },
})
export class FriendGateway {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.userSockets.set(data.userId, client);
  }

  notifyFriendRequest(
    friendId: string,
    payload: { fromUserId: string; fromPseudo: string },
  ) {
    const friendSocket = this.userSockets.get(friendId);
    if (!friendSocket) return;

    friendSocket.emit('friendRequest', payload);
  }
}
