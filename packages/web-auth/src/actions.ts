'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { safeNextPath } from './paths';
import { createSupabaseServerClient } from './server';

export interface FormState {
  error?: string;
}

const Credentials = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

/** Password sign-in shared by the authenticated apps. Redirects to `next` on success. */
export async function signInWithPassword(
  _: FormState | undefined,
  form: FormData,
): Promise<FormState> {
  const parsed = Credentials.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        error.code === 'email_not_confirmed'
          ? 'Please verify your email address first. Check your inbox for the link.'
          : 'Incorrect email or password.',
    };
  }
  redirect(safeNextPath(form.get('next')));
}
