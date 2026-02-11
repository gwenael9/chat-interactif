import { NestFactory } from '@nestjs/core';
import { AppModule, registerGlobals } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const PORT = 4000;

  registerGlobals(app);

  app.enableCors({
    origin: 'http://localhost:5500',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.use(cookieParser());
  await app.listen(PORT);
}
void bootstrap();
