import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KirmastiGateway } from './games/kirmasti/kirmasti.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, KirmastiGateway],
})
export class AppModule {}
