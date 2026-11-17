import { Module } from '@nestjs/common';
import { ENV, type Env } from '../config.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { AiController } from './ai.controller.js';
import { AiServiceClient } from './ai-service.client.js';

@Module({
  imports: [OrganizationsModule],
  controllers: [AiController],
  providers: [
    {
      provide: AiServiceClient,
      inject: [ENV],
      // Absent configuration disables AI features (503) rather than failing startup.
      useFactory: (env: Env): AiServiceClient | null =>
        env.AI_SERVICE_URL && env.AI_SERVICE_TOKEN
          ? new AiServiceClient({
              baseUrl: env.AI_SERVICE_URL,
              serviceToken: env.AI_SERVICE_TOKEN,
              timeoutMs: env.AI_SERVICE_TIMEOUT_MS,
            })
          : null,
    },
  ],
})
export class AiModule {}
