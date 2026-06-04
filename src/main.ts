import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Mauricio Grueso - API de Reservas de Hoteles')
    .setDescription('API REST completa para gestión de reservas hoteleras con WebSockets, Email y Notificaciones')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    '/',
    app,
    SwaggerModule.createDocument(app, config),
  );
  await app.listen(3000);
  console.log('🚀 Servidor ejecutándose en http://localhost:3000');
  console.log('📚 Swagger disponible en http://localhost:3000');
}
bootstrap();