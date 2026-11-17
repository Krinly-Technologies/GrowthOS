import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage } from 'node:http';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ENV, type Env } from './config.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { ApiExceptionFilter } from './http/errors.js';
import { redactUrl, REQUEST_ID_HEADER } from './http/request-context.js';
import { MeController } from './identity/me.controller.js';
import { OperatorController } from './operator/operator.controller.js';
import { OrganizationsModule } from './organizations/organizations.module.js';

@Module({})
export class AppModule {
  static register(env: Env): DynamicModule {
    return {
      module: AppModule,
      global: true,
      imports: [
        SentryModule.forRoot(),
        LoggerModule.forRoot({
          pinoHttp: {
            level: env.LOG_LEVEL,
            genReqId: (req: IncomingMessage) => req.headers[REQUEST_ID_HEADER] as string,
            // Log only what is needed: never headers (authorization) or raw invitation tokens.
            serializers: {
              req: (req: { id: string; method: string; url?: string }) => ({
                id: req.id,
                method: req.method,
                url: redactUrl(req.url),
              }),
              res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
            },
          },
        }),
        DatabaseModule,
        AuthModule,
        OrganizationsModule,
        AiModule,
      ],
      controllers: [HealthController, MeController, OperatorController],
      providers: [
        { provide: ENV, useValue: env },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
      exports: [ENV],
    };
  }
}
