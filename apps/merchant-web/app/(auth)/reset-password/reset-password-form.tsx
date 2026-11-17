'use client';

import { useActionState } from 'react';
import { FormField } from '@/components/form-field';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { updatePassword } from '../actions';

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={10}
        required
      />
      <FormField
        id="confirm"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
      />
      <FormMessage error={state?.error} />
      <SubmitButton pendingLabel="Saving…">Save password</SubmitButton>
    </form>
  );
}
