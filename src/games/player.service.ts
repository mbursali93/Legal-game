import { Injectable } from '@nestjs/common';
import { redis } from 'src/redis';

@Injectable()
export class PlayerService {
  async changePlayerStatus(userId, status) {
    const userStatus = await redis.hget(`userId:${userId}`, 'currentStatus');
    if (userStatus === status) return false;
    redis.hset(`userId:${userId}`, 'currentStatus', status);
    return true;
  }

  async handleBet(userId, bet: number) {
    const _status = await redis.hset(
      `userId:${userId}`,
      'currentBet',
      bet.toString(),
    );
    if (!_status) return false;
    return true;
  }
}
