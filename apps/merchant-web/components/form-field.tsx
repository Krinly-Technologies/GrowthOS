import { Field } from '@krinly/ui/components/field';
import { Input } from '@krinly/ui/components/input';
import type { ComponentProps } from 'react';

export function FormField({
  label,
  id,
  hint,
  ...input
}: ComponentProps<'input'> & { id: string; label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input name={id} {...input} />
    </Field>
  );
}
