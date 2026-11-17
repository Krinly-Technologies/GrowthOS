import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiDocument, createApp } from './app.js';
import { parseEnv } from './config.js';

const env = parseEnv(process.env);
const app = await createApp(env);

if (env.NODE_ENV !== 'production') {
  SwaggerModule.setup('docs', app, buildOpenApiDocument(app));
}

await app.listen({ port: env.PORT, host: env.HOST });
