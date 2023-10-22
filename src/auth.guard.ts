import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { redis } from './redis';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isHttpRequest = context.getType() === 'http';
    if (isHttpRequest) {
      return this.handleHttpRequest(context);
    } else {
      return this.handleWebSocketConnection(context);
    }
  }

  private async handleHttpRequest(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization header missing');
    }

    try {
      const payload = (await verify(
        token,
        process.env.JWT_SECRET,
      )) as JwtPayload;

      const userId = payload.userId;
      const currentUserToken = await redis.hget(
        `userId:${userId}`,
        'currentToken',
      );

      if (token !== currentUserToken) throw new UnauthorizedException();

      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async handleWebSocketConnection(
    context: ExecutionContext,
  ): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authorizationHeader = client.handshake.headers.authorization;

    if (!authorizationHeader) {
      return false;
      throw new UnauthorizedException('Authorization header missing');
    }

    try {
      const payload = (await verify(
        authorizationHeader,
        process.env.JWT_SECRET,
      )) as JwtPayload;

      context.switchToWs().getClient().user = payload.userId;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
