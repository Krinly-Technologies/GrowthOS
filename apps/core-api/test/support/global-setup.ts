import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

/**
 * Integration tests run against the local Supabase stack (`pnpm exec supabase start`), which
 * provides real Auth (JWKS, signed ES256 tokens) and the migrated database. Credentials are read
 * from `supabase status` so no keys are committed. Explicit environment variables win.
 */
export default function setup(): void {
  const status = JSON.parse(
    execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  ) as Record<string, string | undefined>;

  const defaults: Record<string, string | undefined> = {
    SUPABASE_URL: status.API_URL,
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
    SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    // Same host/port as the migration URL, but as the runtime role created by supabase/seed.sql.
    DATABASE_URL: status.DB_URL?.replace('postgres:postgres@', 'krinly_app:krinly_app_local@'),
    DATABASE_MIGRATION_URL: status.DB_URL,
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (!value) throw new Error(`supabase status did not report a value for ${key}`);
    process.env[key] ??= value;
  }
}
