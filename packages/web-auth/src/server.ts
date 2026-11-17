import 'server-only';
import { createCoreApiClient, type CoreApiClient } from '@krinly/contracts';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  assertConfigured,
  PUBLIC_CORE_API_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from './config';

/**
 * Supabase client bound to the request cookies. Create one per request; never share it.
 * Follows the official @supabase/ssr pattern for the Next.js App Router.
 */
export async function createSupabaseServerClient() {
  // Reading cookies first also marks the calling route as dynamic (never prerendered).
  const cookieStore = await cookies();
  assertConfigured();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet)
            cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session on every
          // request, so a refresh attempted here can be safely dropped.
        }
      },
    },
  });
}

/**
 * The current user's access token, or a redirect to sign-in.
 *
 * The token is not trusted here: it is forwarded to core-api, which verifies its signature
 * against Supabase's JWKS before doing anything with it.
 */
export async function requireAccessToken(signInPath = '/login'): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) redirect(signInPath);
  return token;
}

/** core-api client authenticated as the current user, for Server Components and Actions. */
export async function serverCoreApi(signInPath = '/login'): Promise<CoreApiClient> {
  // Server-side calls may use the private network address when deployed on Railway.
  const baseUrl = process.env.CORE_API_INTERNAL_URL ?? PUBLIC_CORE_API_URL;
  return createCoreApiClient(baseUrl, await requireAccessToken(signInPath));
}
