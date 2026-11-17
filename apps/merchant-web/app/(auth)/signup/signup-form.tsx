'use client';

import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { signUp } from '../actions';

export function SignupForm() {
  const [state, action] = useActionState(signUp, undefined);
  if (state?.message) return <FormMessage message={state.message} />;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormField id="email" label="Work email" type="email" autoComplete="email" required />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={10}
        hint="At least 10 characters."
        required
      />
      <FormMessage error={state?.error} />
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
