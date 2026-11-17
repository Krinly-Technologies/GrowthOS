import { Input } from '@krinly/ui/components/input';
import { Label } from '@krinly/ui/components/label';
import type { ComponentProps } from 'react';

export function FormField({
  label,
  id,
  hint,
  ...input
}: ComponentProps<'input'> & { id: string; label: string; hint?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-describedby={hint ? `${id}-hint` : undefined} {...input} />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
