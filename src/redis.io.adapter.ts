import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { redis } from './redis';
import { UserSocket } from './interfaces';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    server.use(async (socket, next) => {
      const isConnected = await this.checkUserConnection(socket);
      if (!isConnected) throw new UnauthorizedException();

      next();
    });
    return server;
  }

  private async checkUserConnection(socket: UserSocket): Promise<any> {
    const token = socket.handshake.headers.authorization;
    const { userId } = verify(token, process.env.JWT_SECRET) as JwtPayload;
    const currentToken = await redis.hget(`userId:${userId}`, 'currentToken');
    if (token !== currentToken) {
      return false;
    }

    socket['user'] = userId;
    console.log(socket.user);
    return true;
  }
}
