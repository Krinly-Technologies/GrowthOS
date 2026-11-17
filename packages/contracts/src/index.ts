import createClient from 'openapi-fetch';
import type { paths as CoreApiPaths } from './generated/core-api.js';

export type { CoreApiPaths };
export type {
  paths as AiServicePaths,
  components as AiServiceComponents,
} from './generated/ai-service.js';

export type CoreApiClient = ReturnType<typeof createClient<CoreApiPaths>>;

/** Typed core-api client. `accessToken` is the caller's Supabase session token. */
export function createCoreApiClient(baseUrl: string, accessToken: string): CoreApiClient {
  return createClient<CoreApiPaths>({
    baseUrl,
    headers: { authorization: `Bearer ${accessToken}` },
  });
}
