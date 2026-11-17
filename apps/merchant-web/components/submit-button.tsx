'use client';

import { Button } from '@krinly/ui/components/button';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
