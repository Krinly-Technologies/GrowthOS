import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../lib/utils';

// Surface hierarchy: brand (navy shell) → canvas (raised workspace) → surface (cards, panels).
// Prefer one surface per section; don't nest cards inside cards.

const cardVariants = cva('flex min-w-0 flex-col text-card-foreground', {
  variants: {
    variant: {
      /** Default section surface on the canvas. */
      surface: 'rounded-xl bg-card shadow-ring',
      /** Floating content above the canvas (popovers of content, stacked cards). */
      raised: 'rounded-xl bg-card shadow-raised',
      /** Navy hero panel. Children should use on-brand text tokens. */
      brand:
        'on-brand rounded-2xl bg-brand text-on-brand dark:shadow-[0_0_0_1px_var(--brand-line)]',
      /** Quiet inset on a surface. */
      inset: 'rounded-lg bg-canvas',
    },
    padding: {
      none: '',
      sm: 'gap-3 p-4',
      md: 'gap-5 p-5 sm:p-6',
      lg: 'gap-6 p-6 sm:p-7',
    },
  },
  defaultVariants: { variant: 'surface', padding: 'md' },
});

function Card({
  className,
  variant,
  padding,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('grid gap-1', className)} {...props} />;
}

function CardTitle({
  as: Comp = 'h2',
  className,
  ...props
}: React.ComponentProps<'h2'> & { as?: 'h1' | 'h2' }) {
  return (
    <Comp
      data-slot="card-title"
      className={cn('font-display text-lg leading-snug font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
