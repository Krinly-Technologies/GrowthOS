import type * as React from 'react';
import { cn } from '../lib/utils';
import { Icon, type IconName } from './icon';

/** Loading placeholder that matches the shape of the content it replaces. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-canvas-2 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

/** What will appear here, and one action to get there. No illustrations, no jokes. */
function EmptyState({
  icon = 'layers',
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-canvas-2 text-ink-3">
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-3 font-display text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** What went wrong, what to do, and the request reference from the API error contract. */
function ErrorState({
  title = 'We couldn’t load this',
  description = 'Please try again in a moment.',
  reference,
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  reference?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl bg-critical-soft px-5 py-4 text-sm',
        className,
      )}
    >
      <p className="flex items-center gap-2 font-semibold text-critical">
        <Icon name="alert" size={16} />
        {title}
      </p>
      <p className="text-ink-2">{description}</p>
      {reference ? <p className="tnum text-xs text-ink-3">Ref: {reference}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Keyboard key hint. */
function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-2',
        className,
      )}
      {...props}
    />
  );
}

/** First focusable element of every shell. Lives in a navigation landmark (axe "region"). */
function SkipLink({
  href = '#main',
  children = 'Skip to content',
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <nav aria-label="Skip links">
      <a
        href={href}
        className="fixed top-[-48px] left-3 z-[100] rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-on-brand focus-visible:top-3"
      >
        {children}
      </a>
    </nav>
  );
}

export { EmptyState, ErrorState, Kbd, Skeleton, SkipLink };
