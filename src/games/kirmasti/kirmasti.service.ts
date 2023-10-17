import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kirmasti, KirmastiDocument } from 'src/schemas/kirmasti.schema';

@Injectable()
export class KirmastiService {
  constructor(
    @InjectModel(Kirmasti.name) private kirmastiModel: Model<KirmastiDocument>,
  ) {}
  async getRooms(username, page = 1, limit = 10, minBet, maxBet, maxPlayers) {
    return 'rooms';
  }

  async createRoom(userId) {
    const userRooms = await this.kirmastiModel.findOne({ })
  }
}
