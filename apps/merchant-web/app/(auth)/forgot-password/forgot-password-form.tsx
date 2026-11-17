'use client';

import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { requestPasswordReset } from '../actions';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  if (state?.message) return <FormMessage message={state.message} />;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormField id="email" label="Email" type="email" autoComplete="email" required />
      <FormMessage error={state?.error} />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
