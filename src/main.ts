import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis.io.adapter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalPipes(new ValidationPipe());
  const PORT = process.env.PORT || 2000;
  await app.listen(PORT, () =>
    console.log(`game-service is runnning on port:${PORT}`),
  );
}
bootstrap();
