import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.ts'],
    // Defaults match the local Supabase stack and the runtime role password in supabase/seed.sql.
    env: {
      DATABASE_MIGRATION_URL:
        process.env.DATABASE_MIGRATION_URL ??
        'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://krinly_app:krinly_app_local@127.0.0.1:54322/postgres',
    },
    fileParallelism: false,
  },
});
