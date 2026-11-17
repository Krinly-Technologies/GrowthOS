import { Controller, Get, HttpStatus, Logger } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Public } from '../auth/auth.decorators.js';
import { PrismaService } from '../database/prisma.service.js';
import { ApiException } from '../http/errors.js';
import { ApiErrors } from '../http/openapi.decorators.js';

const READINESS_TIMEOUT_MS = 2_000;

const Health = z.object({ status: z.literal('ok') });
const Ready = z.object({
  status: z.literal('ready'),
  checks: z.object({ database: z.literal('ok') }),
});

@ApiTags('health')
@Public()
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly db: PrismaService) {}

  /** Liveness: the process is serving HTTP. Has no dependencies by design. */
  @Get('health')
  @ApiOkResponse({ standardSchema: Health })
  health(): z.infer<typeof Health> {
    return { status: 'ok' };
  }

  /** Readiness: dependencies required to serve traffic are reachable. */
  @Get('ready')
  @ApiOkResponse({ standardSchema: Ready })
  @ApiErrors(503)
  async ready(): Promise<z.infer<typeof Ready>> {
    try {
      await Promise.race([
        this.db.client.$queryRaw`select 1`,
        new Promise((_, reject) =>
          setTimeout(() => {
            reject(new Error(`database check exceeded ${READINESS_TIMEOUT_MS}ms`));
          }, READINESS_TIMEOUT_MS).unref(),
        ),
      ]);
    } catch (error) {
      this.logger.warn({ err: error }, 'Readiness check failed');
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, 'NOT_READY', 'Database unavailable');
    }
    return { status: 'ready', checks: { database: 'ok' } };
  }
}
