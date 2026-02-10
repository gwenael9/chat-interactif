import { NestFactory } from '@nestjs/core';
import { AppModule, registerGlobals } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const PORT = 4000;

  registerGlobals(app);

  // app.enableCors({
  //   origin:
  //   credentials: true,
  // });

  app.use(cookieParser());
  await app.listen(PORT);
}
void bootstrap();
