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
    // const _status = await redis.hset(`userId:${userId}`, 'currentBet', bet);
    // if (!_status) return false;
    // return true;
    const currentBet = parseInt(
      await redis.hget(`userId:${userId}`, 'currentBet'),
    );
    const currentMoney = parseInt(
      await redis.hget(`userId:${userId}`, 'currentMoney'),
    );

    redis.hset(`userId:${userId}`, 'currentMoney', currentMoney - bet);
    redis.hset(`userId:${userId}`, 'currentBet', currentBet + bet);

    return true;
  }

  async handleUserWinning(userId, money: number) {
    const currentMoney = parseInt(
      await redis.hget(`userId:${userId}`, 'currentMoney'),
    );

    const newMoney = money + currentMoney;
    await redis.hset(`userId:${userId}`, 'currentMoney', newMoney);
    return true;
  }

  async handleUserLeave(userId) {
    const currentMoney = parseInt(
      await redis.hget(`userId:${userId}`, 'currentMoney'),
    );
    const currentBet = parseInt(
      await redis.hget(`userId:${userId}`, 'currentBet'),
    );
    const newAmount = currentMoney - currentBet;

    redis.hset(`userId:${userId}`, 'currentMoney', newAmount);
    redis.hset(`userId:${userId}`, 'currentBet', 0);
  }
}
