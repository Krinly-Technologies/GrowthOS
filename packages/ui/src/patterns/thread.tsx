'use client';

import { cn } from '../lib/utils';

// The Thread: progress through an ordered sequence of steps. Steps are data — the shared package
// knows nothing about which stages exist or what they mean.

interface ThreadStep {
  id: string;
  label: string;
}

/** Compact progress dots for rows and cards. Announces e.g. "<label>, step 3 of 5". */
function ThreadIndicator({
  steps,
  current,
  muted = false,
  className,
}: {
  steps: readonly ThreadStep[];
  /** Index of the current step; -1 for none. */
  current: number;
  /** Dim the whole thread (e.g. an item that left the sequence). */
  muted?: boolean;
  className?: string;
}) {
  const step = steps[current];
  return (
    <span
      role="img"
      aria-label={
        step
          ? `${step.label}, step ${String(current + 1)} of ${String(steps.length)}`
          : 'Not started'
      }
      className={cn('inline-flex items-center', muted && 'opacity-40', className)}
    >
      {steps.map((s, i) => (
        <span key={s.id} className="flex items-center">
          {i > 0 ? (
            <span
              className={cn('block h-[1.5px] w-[7px]', i <= current ? 'bg-step-3' : 'bg-step-off')}
            />
          ) : null}
          <span
            className={cn(
              'block rounded-full',
              i === current
                ? 'size-[9px] bg-accent shadow-[inset_0_0_0_2px_var(--step-4)]'
                : i < current
                  ? 'size-1.5 bg-step-3'
                  : 'size-1.5 bg-surface shadow-[inset_0_0_0_1.25px_var(--step-off)]',
            )}
          />
        </span>
      ))}
    </span>
  );
}

/**
 * Full stepper. With `onSelect` each step is a button (a radio group of steps) so the current
 * step can be changed from the keyboard; without it, it is a read-only progress display.
 */
function ThreadStepper({
  steps,
  current,
  onSelect,
  label,
  tone = 'surface',
  className,
}: {
  steps: readonly ThreadStep[];
  current: number;
  onSelect?: (step: ThreadStep, index: number) => void;
  label: string;
  tone?: 'surface' | 'on-brand';
  className?: string;
}) {
  const reached = steps.length > 1 ? (Math.max(0, current) / (steps.length - 1)) * 80 : 0;
  const onBrand = tone === 'on-brand';
  return (
    <ol
      aria-label={label}
      className={cn('relative grid', className)}
      style={{ gridTemplateColumns: `repeat(${String(steps.length)}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-[13px] right-[10%] left-[10%] h-0.5 rounded-sm',
          onBrand ? 'bg-brand-line' : 'bg-step-off',
        )}
      />
      <span
        aria-hidden="true"
        className="absolute top-[13px] left-[10%] h-0.5 rounded-sm bg-accent transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out)]"
        style={{ width: `${String(reached)}%` }}
      />
      {steps.map((step, i) => {
        const isCurrent = i === current;
        const node = (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'relative z-[1] mt-0.5 block size-4 rounded-full transition-[background,box-shadow,transform] duration-[var(--duration-base)]',
                isCurrent
                  ? cn(
                      'scale-115 bg-accent',
                      onBrand
                        ? 'shadow-[0_0_0_4px_rgb(168_230_191/0.25),inset_0_0_0_3px_var(--brand)]'
                        : 'shadow-[0_0_0_4px_rgb(168_230_191/0.35),inset_0_0_0_3px_var(--surface)]',
                    )
                  : i < current
                    ? 'bg-accent'
                    : onBrand
                      ? 'bg-brand shadow-[inset_0_0_0_2px_var(--brand-line)]'
                      : 'bg-surface shadow-[inset_0_0_0_2px_var(--step-off)]',
              )}
            />
            <span
              className={cn(
                'mt-2 block max-w-full truncate text-center text-[12px] leading-tight',
                isCurrent ? 'font-bold' : 'font-medium',
                onBrand
                  ? isCurrent
                    ? 'text-on-brand'
                    : 'text-on-brand-2'
                  : isCurrent
                    ? 'text-ink'
                    : 'text-ink-3',
              )}
            >
              {step.label}
            </span>
          </>
        );
        return (
          <li key={step.id} className="flex min-w-0 flex-col items-center">
            {onSelect ? (
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => {
                  onSelect(step, i);
                }}
                className="flex w-full min-w-0 flex-col items-center rounded-lg px-0.5 pt-1.5 pb-1"
              >
                {node}
                {isCurrent ? <span className="sr-only">(current)</span> : null}
              </button>
            ) : (
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className="flex w-full min-w-0 flex-col items-center pt-1.5 pb-1"
              >
                {node}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

type StageTone = 0 | 1 | 2 | 3 | 4 | 'lost';

const STAGE_TONE: Record<string, string> = {
  '0': 'bg-canvas-2 text-ink-2',
  '1': 'bg-[color-mix(in_oklab,var(--step-1)_22%,var(--surface))] text-ink',
  '2': 'bg-[color-mix(in_oklab,var(--step-2)_24%,var(--surface))] text-ink',
  '3': 'bg-[color-mix(in_oklab,var(--step-3)_24%,var(--surface))] text-ink',
  '4': 'bg-step-4 text-white',
  lost: 'bg-lost/60 text-ink-2',
};

/** Stage label tinted by position in the sequence (0 = start, 4 = end, or lost). */
function StagePill({
  label,
  tone,
  className,
}: {
  label: string;
  tone: StageTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        STAGE_TONE[String(tone)],
        className,
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

export { StagePill, ThreadIndicator, ThreadStepper };
export type { StageTone, ThreadStep };
