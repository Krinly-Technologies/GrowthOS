import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import {
  asUser,
  createPrismaClient,
  type DbTransaction,
  type PrismaClient,
  type UserContext,
} from '@krinly/database';
import { ENV, type Env } from '../config.js';

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  /** Connects lazily on first query; readiness is reported by GET /v1/ready. */
  readonly client: PrismaClient;

  constructor(@Inject(ENV) env: Env) {
    this.client = createPrismaClient(env.DATABASE_URL);
  }

  /** Runs work in a transaction scoped to the user, so RLS policies apply to every statement. */
  asUser<T>(context: UserContext, work: (tx: DbTransaction) => Promise<T>): Promise<T> {
    return asUser(this.client, context, work);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
