import { Module } from '@nestjs/common';
import { KirmastiController } from './kirmasti/kirmasti.controller';
import { KirmastiService } from './kirmasti/kirmasti.service';
import { KirmastiGateway } from './kirmasti/kirmasti.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Kirmasti, KirmastiSchema } from 'src/schemas/kirmasti.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Kirmasti.name, schema: KirmastiSchema },
    ]),
  ],
  controllers: [KirmastiController],
  providers: [KirmastiService, KirmastiGateway],
})
export class GamesModule {}
