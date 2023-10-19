import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { KirmastiService } from './kirmasti.service';
import { AuthGuard } from 'src/auth.guard';

@Controller('kirmasti')
export class KirmastiController {
  constructor(private readonly kirmastiService: KirmastiService) {}

  @Get()
  async getRooms() {
    // return await this.kirmastiService.getRooms();
  }

  @UseGuards(AuthGuard)
  @Post()
  async createRoom(@Request() req, @Body() body) {
    const userId = req.user.userId;
    return await this.kirmastiService.createRoom(userId);
  }
}
