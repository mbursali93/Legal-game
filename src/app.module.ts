import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Kirmasti, KirmastiSchema } from './schemas/kirmasti.schema';
import { KirmastiService } from './games/kirmasti/kirmasti.service';
import { ConfigModule } from '@nestjs/config';
import { KirmastiController } from './games/kirmasti/kirmasti.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot(process.env.MONGO_URL, {
    //   user: process.env.MONGO_USER,
    //   pass: process.env.MONGO_PASS,
    //   dbName: process.env.MONGO_DBNAME,
    // }),
    // MongooseModule.forFeature([
    //   { name: Kirmasti.name, schema: KirmastiSchema },
    // ]),
    GamesModule,
  ],
  controllers: [AppController, KirmastiController],
  providers: [AppService, KirmastiService],
})
export class AppModule {}
