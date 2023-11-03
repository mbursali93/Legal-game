import { redis } from 'src/redis';

export class PlayerService {
  async changePlayerStatus(userId, status) {
    const _status = await redis.hset(
      `userId:${userId}`,
      'currentStatus',
      status,
    );
    if (!_status) return false;
    return true;
  }
    
    async handleBet() {
        
    }
}
