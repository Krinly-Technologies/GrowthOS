'use client';

import { createCoreApiClient, type CoreApiClient } from '@krinly/contracts';
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_CORE_API_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

/** core-api client for Client Components, authenticated with the browser session. */
export async function browserCoreApi(): Promise<CoreApiClient> {
  const { data } = await createSupabaseBrowserClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return createCoreApiClient(PUBLIC_CORE_API_URL, token);
}
