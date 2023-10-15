import { Controller, Get, Post } from '@nestjs/common';
import { KirmastiService } from './kirmasti.service';

@Controller('kirmasti')
export class KirmastiController {
  constructor(private readonly kirmastiService: KirmastiService) {}

  @Get()
  async getRooms() {
    return await this.kirmastiService.getRooms();
  }

  @Post()
  async createRoom() {
    return await this.kirmastiService.createRoom();
  }
}
