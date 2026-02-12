import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket, JwtPayload } from './type';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    let token: string | undefined;

    if (client.handshake.headers?.cookie) {
      const cookies = client.handshake.headers.cookie;
      const match = cookies.match(/authToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      throw new WsException('Token manquant');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
      return true;
    } catch (error) {
      console.log('WsGuard - Token invalide:', error);
      throw new WsException('Token invalide');
    }
  }
}
