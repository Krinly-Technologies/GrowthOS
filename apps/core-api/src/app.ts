import 'reflect-metadata';
import helmet from '@fastify/helmet';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Env } from './config.js';
import { validationException } from './http/errors.js';
import { resolveRequestId, REQUEST_ID_HEADER } from './http/request-context.js';

const BODY_LIMIT_BYTES = 100 * 1024;

export function createAdapter(): FastifyAdapter {
  return new FastifyAdapter({
    genReqId: resolveRequestId,
    bodyLimit: BODY_LIMIT_BYTES,
    // Railway terminates TLS at its proxy.
    trustProxy: true,
  });
}

/** Applies the HTTP configuration shared by the server, tests and OpenAPI export. */
export async function configureApp(app: NestFastifyApplication, env: Env): Promise<void> {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  app.useGlobalPipes(new StandardSchemaValidationPipe({ exceptionFactory: validationException }));
  app.enableCors({
    origin: env.CORS_ORIGINS,
    allowedHeaders: ['authorization', 'content-type', REQUEST_ID_HEADER],
    exposedHeaders: [REQUEST_ID_HEADER],
  });
  await app.register(helmet);
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (request, reply) => {
      void reply.header(REQUEST_ID_HEADER, request.id);
    });
}

export function buildOpenApiDocument(app: NestFastifyApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Krinly Core API')
    .setVersion('1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  return SwaggerModule.createDocument(app, config);
}

export async function createApp(env: Env): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(env),
    createAdapter(),
    { bufferLogs: true },
  );
  await configureApp(app, env);
  return app;
}
