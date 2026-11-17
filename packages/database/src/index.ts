import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from './generated/prisma/client.js';

export { Prisma, PrismaClient };
export type * from './generated/prisma/models.js';

export type DbTransaction = Prisma.TransactionClient;

export interface UserContext {
  userId: string;
  requestId: string;
}

export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/**
 * Runs `work` in a transaction whose RLS context is the given user.
 *
 * The settings are transaction-local (`set_config(..., true)`), so they are discarded on
 * commit/rollback and never leak to another request sharing a pooled connection. This is what
 * makes the pattern safe behind a transaction-mode pooler.
 */
export async function asUser<T>(
  prisma: PrismaClient,
  context: UserContext,
  work: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.user_id', ${context.userId}, true), set_config('app.request_id', ${context.requestId}, true)`;
    return work(tx);
  });
}
