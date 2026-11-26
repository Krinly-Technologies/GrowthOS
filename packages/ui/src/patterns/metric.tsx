import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * A labelled figure. Use `hero` once per screen for the number the screen is about; use the
 * default size for supporting figures. Don't line up rows of identical metric cards — a metric
 * should sit next to the explanation or action it supports.
 */
function Metric({
  label,
  value,
  context,
  size = 'default',
  tone = 'surface',
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** Comparison, status or explanation shown under the figure. */
  context?: ReactNode;
  size?: 'default' | 'hero';
  tone?: 'surface' | 'on-brand';
  className?: string;
}) {
  const onBrand = tone === 'on-brand';
  return (
    <div className={cn('min-w-0', className)}>
      <p className={cn('text-[13px] font-semibold', onBrand ? 'text-on-brand-2' : 'text-ink-3')}>
        {label}
      </p>
      <p
        className={cn(
          'display-figure mt-1 truncate',
          size === 'hero'
            ? 'text-[44px] leading-[0.95] sm:text-[68px]'
            : 'text-[28px] leading-tight',
          onBrand ? 'text-on-brand' : 'text-ink',
        )}
      >
        {value}
      </p>
      {context ? (
        <div className={cn('mt-2 text-[13.5px]', onBrand ? 'text-on-brand-2' : 'text-ink-2')}>
          {context}
        </div>
      ) : null}
    </div>
  );
}

export { Metric };
