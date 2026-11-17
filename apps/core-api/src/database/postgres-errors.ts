import { Prisma } from '@krinly/database';

/**
 * Extracts the PostgreSQL SQLSTATE from a Prisma error, including errors raised by our own
 * SQL functions (custom KRxxx codes) and constraint violations.
 */
export function sqlState(error: unknown): string | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  if (error.code === 'P2002') return '23505';
  const meta = error.meta as
    { code?: unknown; driverAdapterError?: { cause?: { originalCode?: unknown } } } | undefined;
  const code = meta?.driverAdapterError?.cause?.originalCode ?? meta?.code;
  return typeof code === 'string' ? code : undefined;
}
