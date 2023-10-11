import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 2000;
  await app.listen(PORT, () =>
    console.log(`game-service is runnning on port:${PORT}`),
  );
}
bootstrap();
