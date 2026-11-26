import type * as React from 'react';
import { cn } from '../lib/utils';
import { Icon } from './icon';

const fieldBase =
  'flex h-10 w-full min-w-0 rounded-lg border border-input bg-surface px-3 text-[15px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn(fieldBase, className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'h-auto min-h-20 py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
}

/** Search input with a leading icon and an optional keyboard hint (e.g. "/"). */
function SearchField({
  className,
  shortcut,
  label,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { label: string; shortcut?: string }) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <Icon
        name="search"
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
      />
      <input
        type="search"
        aria-label={label}
        data-slot="search"
        className={cn(fieldBase, 'pl-9', shortcut ? 'pr-9' : '')}
        {...props}
      />
      {shortcut ? (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line px-1 text-[10.5px] text-ink-3 sm:block"
        >
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
}

/** Native select, styled. Native keeps mobile pickers and accessibility for free. */
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select data-slot="select" className={cn(fieldBase, 'appearance-none pr-9')} {...props}>
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}

/** Text input with a fixed prefix such as ₹ or +91. */
function InputGroup({
  prefix,
  className,
  ...props
}: React.ComponentProps<'input'> & { prefix: React.ReactNode }) {
  return (
    <div className={cn('flex min-w-0', className)}>
      <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-canvas px-3 text-sm text-ink-3">
        {prefix}
      </span>
      <input data-slot="input" className={cn(fieldBase, 'rounded-l-none')} {...props} />
    </div>
  );
}

export { Input, InputGroup, SearchField, Select, Textarea };
