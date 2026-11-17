import { defineConfig } from 'prisma/config';

// Schema changes are made with SQL migrations in /supabase/migrations, applied by the Supabase
// CLI. Prisma is used only to generate the typed client, so no datasource URL is configured.
export default defineConfig({
  schema: 'prisma/schema.prisma',
});
