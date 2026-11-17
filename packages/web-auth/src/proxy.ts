import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/**
 * Refreshes the Supabase session cookie on every request and redirects signed-out visitors away
 * from protected pages. Based on the official @supabase/ssr Next.js proxy pattern.
 *
 * This is a convenience redirect only: every data request is authorized by core-api.
 */
export async function updateSession(
  request: NextRequest,
  options: { publicPaths: string[]; signInPath: string },
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options: cookieOptions } of cookiesToSet) {
          response.cookies.set(name, value, cookieOptions);
        }
      },
    },
  });

  // Must run immediately after creating the client: it validates and refreshes the session.
  const { data } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;
  const isPublic = options.publicPaths.some((p) => path === p || path.startsWith(`${p}/`));
  if (!data?.claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = options.signInPath;
    url.search = '';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  return response;
}
