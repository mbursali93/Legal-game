import {
  BadRequestException,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { redis } from 'src/redis';
import { Kirmasti, KirmastiDocument } from 'src/schemas/kirmasti.schema';
import * as crypto from 'crypto';

@Injectable()
export class KirmastiService {
  constructor() {} // @InjectModel(Kirmasti.name) private kirmastiModel: Model<KirmastiDocument>,
  async getRooms(username, page = 1, limit = 10, minBet, maxBet, maxPlayers) {
    return 'rooms';
  }

  async createRoom(userId, body) {
    const { callBet, dealBet, maxUsers } = body;

    try {
      const userRoom = await redis.hget(`userId:${userId}`, 'currentRoom');
      if (userRoom)
        throw new BadRequestException('User is currently in a room.');

      // TODO: Add Level Control

      const roomId = this.generateRoomId();

      Promise.all([
        redis.hset(`roomId:${roomId}`, 'callBet', callBet),
        redis.hset(`roomId:${roomId}`, 'dealBet', dealBet),
        redis.hset(`roomId:${roomId}`, 'totalMoney', 0),
        redis.hset(`roomId:${roomId}`, 'maxUsers', maxUsers),
        redis.hset(`userId:${userId}`, 'currentRoom', roomId),
      ]);

      return {
        message: 'Room Created Successfuly',
        error: null,
        statusCode: 201,
      };

    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  generateRoomId() {
    const digit = 5;
    const roomId = crypto.randomBytes(digit).toString('hex');
    return roomId;
  }
}
