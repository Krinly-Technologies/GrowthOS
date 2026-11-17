'use server';

import type { FormState } from '@krinly/web-auth/actions';
import { createSupabaseServerClient } from '@krinly/web-auth/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export interface MessageState extends FormState {
  message?: string;
}

const MIN_PASSWORD_LENGTH = 10;
// bcrypt, used by Supabase Auth, ignores input beyond 72 bytes.
const MAX_PASSWORD_LENGTH = 72;

const Email = z.email('Enter a valid email address');
const Password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Use at most ${MAX_PASSWORD_LENGTH} characters`);

export async function signUp(_: MessageState | undefined, form: FormData): Promise<MessageState> {
  const parsed = z
    .object({ email: Email, password: Password })
    .safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message };
  // Same response whether or not the address already has an account (no account enumeration).
  return { message: 'Check your email for a link to verify your address and finish signing up.' };
}

export async function requestPasswordReset(
  _: MessageState | undefined,
  form: FormData,
): Promise<MessageState> {
  const parsed = Email.safeParse(form.get('email'));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data);
  if (error?.status === 429)
    return { error: 'Too many requests. Please wait a minute and try again.' };
  if (error) return { error: 'Could not send the reset email. Please try again.' };
  return { message: 'If an account exists for that address, a reset link is on its way.' };
}

export async function updatePassword(
  _: MessageState | undefined,
  form: FormData,
): Promise<MessageState> {
  const parsed = Password.safeParse(form.get('password'));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  if (parsed.data !== form.get('confirm')) return { error: 'The passwords do not match' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };
  redirect('/');
}
