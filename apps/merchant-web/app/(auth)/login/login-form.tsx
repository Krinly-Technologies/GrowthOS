'use client';

import { signInWithPassword } from '@krinly/web-auth/actions';
import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action] = useActionState(signInWithPassword, undefined);
  const error =
    state?.error ??
    (linkError ? 'That link is invalid or has expired. Please try again.' : undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormField id="email" label="Email" type="email" autoComplete="email" required />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormMessage error={error} />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
