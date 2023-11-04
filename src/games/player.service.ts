import { redis } from 'src/redis';

export class PlayerService {
  async changePlayerStatus(userId, status) {
    const userStatus = await redis.hget(`userId:${userId}`, 'currentStatus');
    if (userStatus === status) return false;
    redis.hset(`userId:${userId}`, 'currentStatus', status);
    return true;
  }

  async handleBet(userId, bet) {
    const _status = await redis.hset(
      `userId:${userId}`,
      'currentBet',
      bet.toString(),
    );
    if (!_status) return false;
    return true;
  }
}
