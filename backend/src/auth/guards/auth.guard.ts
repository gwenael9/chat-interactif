import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

export interface RequestWithCookies extends RequestWithUser {
  cookies: {
    authToken?: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithCookies & RequestWithUser>();

    const token =
      (request as RequestWithCookies).cookies?.authToken ||
      this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Vous n'êtes pas connecté !");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      (request as RequestWithUser).user = payload;
      return true;
    } catch (error: unknown) {
      throw new UnauthorizedException(
        `Token invalide: ${(error as Error).message}`,
      );
    }
  }
}
