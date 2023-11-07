import { Module } from '@nestjs/common';
import { KirmastiController } from './kirmasti/kirmasti.controller';
import { KirmastiService } from './kirmasti/kirmasti.service';
import { KirmastiGateway } from './kirmasti/kirmasti.gateway';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: Kirmasti.name, schema: KirmastiSchema },
    // ]),
  ],
  controllers: [KirmastiController],
  providers: [KirmastiService, KirmastiGateway],
})
export class GamesModule {}
