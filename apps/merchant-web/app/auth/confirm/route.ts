import { safeNextPath } from '@krinly/web-auth/paths';
import { createSupabaseServerClient } from '@krinly/web-auth/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

const SUPPORTED_TYPES = new Set<string>(['email', 'signup', 'recovery', 'email_change']);

function isSupportedType(type: string | null): type is EmailOtpType {
  return type !== null && SUPPORTED_TYPES.has(type);
}

/** Verifies emailed links (sign-up confirmation, password recovery) on the server. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type');

  if (tokenHash && isSupportedType(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(safeNextPath(params.get('next')));
  }
  redirect('/login?error=link-invalid');
}
