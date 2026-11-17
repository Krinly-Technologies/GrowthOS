import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from './server';

/** Route handler for `POST /auth/signout`: ends the session and returns to sign-in. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
