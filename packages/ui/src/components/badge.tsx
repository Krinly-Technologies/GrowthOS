import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../lib/utils';

// Use badges sparingly: for a status a person acts on, not for decoration. A badge always has a
// text label, so meaning never depends on colour alone.

const badgeVariants = cva(
  'inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-canvas-2 text-ink-2',
        verified: 'bg-verified-soft text-verified',
        attention: 'bg-attention-soft text-attention',
        critical: 'bg-critical-soft text-critical',
        info: 'bg-info-soft text-info',
        brand: 'bg-accent text-brand',
        outline: 'text-ink-2 shadow-ring',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const DOT: Record<NonNullable<StatusTone>, string> = {
  neutral: 'bg-ink-3',
  verified: 'bg-verified',
  attention: 'bg-attention-dot',
  critical: 'bg-critical',
  info: 'bg-info',
};
type StatusTone = 'neutral' | 'verified' | 'attention' | 'critical' | 'info' | null | undefined;

/** Dot + label status, for dense rows where a full badge is too heavy. */
function StatusIndicator({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1.5 text-[13px] text-ink-2', className)}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 shrink-0 rounded-full', DOT[tone ?? 'neutral'])}
      />
      <span className="truncate">{children}</span>
    </span>
  );
}

export { Badge, badgeVariants, StatusIndicator };
