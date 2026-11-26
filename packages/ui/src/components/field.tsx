import {
  cloneElement,
  type ComponentProps,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from 'react';
import { cn } from '../lib/utils';
import { Label } from './label';

/**
 * Label + control + hint/error, wired for assistive tech. Pass the control as the single child;
 * Field sets its `id`, `aria-describedby` and `aria-invalid`.
 */
function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactElement<{
    id?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }>;
  className?: string;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true } : {}),
      })
    : children;
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {control}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Native checkbox or radio with a label; supports a secondary description line. */
function Choice({
  type = 'checkbox',
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
  type?: 'checkbox' | 'radio';
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-canvas-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
        className,
      )}
    >
      <input
        type={type}
        className="mt-0.5 size-4 shrink-0 accent-[var(--ink)] focus-visible:outline-offset-1"
        {...props}
      />
      <span className="min-w-0">
        <span className="block">{label}</span>
        {description ? <span className="block text-xs text-ink-3">{description}</span> : null}
      </span>
    </label>
  );
}

export { Choice, Field };
