import { z } from 'zod';

const csv = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()));

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Railway injects PORT. '::' binds IPv4 and IPv6, required for Railway private networking.
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().default('::'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    // Runtime connection as the non-owner `krinly_app` role. Never the migration role.
    DATABASE_URL: z.url(),
    SUPABASE_URL: z.url(),
    CORS_ORIGINS: csv.default([]),
    MERCHANT_APP_URL: z.url(),
    INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    AI_SERVICE_URL: z.url().optional(),
    AI_SERVICE_TOKEN: z.string().min(32).optional(),
    AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().min(100).max(120_000).default(20_000),
    SENTRY_DSN: z.url().optional(),
  })
  .refine((env) => Boolean(env.AI_SERVICE_URL) === Boolean(env.AI_SERVICE_TOKEN), {
    message: 'AI_SERVICE_URL and AI_SERVICE_TOKEN must be set together',
    path: ['AI_SERVICE_TOKEN'],
  });

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return result.data;
}
