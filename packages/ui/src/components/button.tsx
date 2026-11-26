import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors duration-[var(--duration-fast)] outline-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Primary action on light surfaces (navy). */
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        /** Brand action (mint) — Create, Show them, Apply. */
        brand: 'bg-accent text-brand hover:bg-accent-hover',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'bg-surface text-ink shadow-ring hover:shadow-[0_0_0_1.5px_var(--ink)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-canvas-2/80',
        ghost: 'text-ink-2 hover:bg-canvas-2 hover:text-ink',
        /** Quiet action on the navy shell. */
        'on-brand': 'bg-brand-raised text-on-brand hover:bg-brand-line',
        link: 'text-accent-strong underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3 text-[13px] [&_svg]:size-3.5',
        default: 'h-9 px-4 text-sm [&_svg]:size-4',
        lg: 'h-11 px-5 text-[15px] [&_svg]:size-[18px]',
        icon: 'size-9 [&_svg]:size-[18px]',
        'icon-sm': 'size-8 [&_svg]:size-4',
        'icon-lg': 'size-11 [&_svg]:size-5',
      },
      shape: {
        rounded: 'rounded-lg',
        pill: 'rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default', shape: 'rounded' },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, shape, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

/** Icon-only button. `label` is required: it becomes the accessible name. */
function IconButton({
  label,
  size = 'icon',
  ...props
}: Omit<ButtonProps, 'size' | 'aria-label'> & {
  label: string;
  size?: 'icon' | 'icon-sm' | 'icon-lg';
}) {
  return <Button aria-label={label} size={size} {...props} />;
}

export { Button, buttonVariants, IconButton };
