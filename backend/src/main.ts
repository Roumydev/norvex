import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

const server = express();
let app: any;

async function createApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://norvex-sigma.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  return app;
}

// Local development
if (!process.env.VERCEL) {
  createApp().then(async (a) => {
    const port = process.env.PORT || 4000;
    await a.listen(port);
    console.log(`Norvex backend running on port ${port}`);
  });
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await createApp();
  return server(req, res);
}