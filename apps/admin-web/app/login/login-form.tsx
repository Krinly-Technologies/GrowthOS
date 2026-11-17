'use client';

import { Alert } from '@krinly/ui/components/alert';
import { Button } from '@krinly/ui/components/button';
import { Input } from '@krinly/ui/components/input';
import { Label } from '@krinly/ui/components/label';
import { signInWithPassword } from '@krinly/web-auth/actions';
import { useActionState } from 'react';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error ? <Alert variant="destructive">{state.error}</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
