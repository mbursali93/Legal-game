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
import { KirmastiDto } from './dtos/kirmasti.dto';

@Controller('kirmasti')
export class KirmastiController {
  constructor(private readonly kirmastiService: KirmastiService) {}

  @Get()
  async getRooms() {
    // return await this.kirmastiService.getRooms();
  }

  @UseGuards(AuthGuard)
  @Post() //TODO: Create Dto for body
  async createRoom(@Request() req, @Body() body: KirmastiDto) {
    const userId = req.user.userId;
    return await this.kirmastiService.createRoom(userId, body);
  }
}
