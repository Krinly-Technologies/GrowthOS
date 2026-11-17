// Writes the OpenAPI document for packages/contracts. Runs without a database or network:
// the Prisma client and JWKS fetcher are lazy.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildOpenApiDocument, createApp } from './app.js';
import { parseEnv } from './config.js';

const output = process.argv[2];
if (!output) throw new Error('Usage: node dist/openapi.js <output.json>');

const app = await createApp(
  parseEnv({
    NODE_ENV: 'development',
    LOG_LEVEL: 'warn',
    DATABASE_URL: 'postgresql://openapi@localhost:5432/unused',
    SUPABASE_URL: 'http://localhost:54321',
    MERCHANT_APP_URL: 'http://localhost:3000',
  }),
);
await app.init();
const document = buildOpenApiDocument(app);
mkdirSync(dirname(resolve(output)), { recursive: true });
writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
await app.close();
