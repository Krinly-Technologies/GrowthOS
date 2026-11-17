'use client';

import { useActionState } from 'react';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { acceptInvitation } from './actions';

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvitation, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage error={state?.error} />
      <SubmitButton pendingLabel="Joining…">Accept invitation</SubmitButton>
    </form>
  );
}
