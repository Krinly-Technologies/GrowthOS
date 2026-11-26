'use client';

import { type ReactNode, useState } from 'react';
import { Icon, type IconName } from '../components/icon';
import { cn } from '../lib/utils';

const DEPTH = [
  'z-[3] translate-y-0 scale-100 opacity-100',
  'z-[2] -translate-y-3 scale-[0.955] opacity-90',
  'z-[1] -translate-y-6 scale-[0.91] opacity-75',
] as const;
const HIDDEN = 'z-0 -translate-y-6 scale-90 opacity-0 pointer-events-none';

/**
 * "Up next": one card in focus with the next two peeking behind. Cards behind the top one are
 * inert and hidden from assistive tech; arrow keys and the buttons move through the stack.
 * Always pair with a full list (ActionList) — a stack hides everything but one item.
 */
function CardStack<T>({
  items,
  getKey,
  renderCard,
  heading,
  empty,
  tone = 'surface',
  className,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  /** Render the card body. `next()` moves to the following card (e.g. a "Later" button). */
  renderCard: (item: T, controls: { next: () => void; isTop: boolean }) => ReactNode;
  heading: string;
  empty?: ReactNode;
  tone?: 'surface' | 'on-brand';
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const onBrand = tone === 'on-brand';
  if (count === 0) return <div className={className}>{empty}</div>;
  const safe = index % count;
  const go = (step: number) => {
    setIndex((i) => (i + step + count) % count);
  };
  const navClass = cn(
    'grid size-8 place-items-center rounded-full',
    onBrand
      ? 'bg-brand-raised text-on-brand hover:bg-brand-line'
      : 'bg-surface text-ink shadow-ring hover:bg-canvas-2',
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label={heading}
      className={className}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          go(e.key === 'ArrowRight' ? 1 : -1);
        }
      }}
    >
      <div
        className={cn(
          'mb-3 flex items-center justify-between',
          onBrand ? 'text-on-brand' : 'text-ink',
        )}
      >
        <h2 className="font-display text-base font-semibold">{heading}</h2>
        {count > 1 ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn('tnum mr-1 text-[12.5px]', onBrand ? 'text-on-brand-2' : 'text-ink-3')}
              aria-live="polite"
            >
              {safe + 1} of {count}
            </span>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => {
                go(-1);
              }}
              className={navClass}
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => {
                go(1);
              }}
              className={navClass}
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        ) : null}
      </div>
      <div className={cn('relative grid', count > 1 && 'mt-7')}>
        {items.map((item, i) => {
          const depth = (i - safe + count) % count;
          const isTop = depth === 0;
          return (
            <article
              key={getKey(item)}
              aria-hidden={isTop ? undefined : true}
              inert={!isTop}
              className={cn(
                'col-start-1 row-start-1 flex origin-top flex-col rounded-[18px] bg-surface p-4 text-ink shadow-floating transition-[transform,opacity] duration-[260ms] ease-[var(--ease-out)] sm:p-5',
                DEPTH[depth] ?? HIDDEN,
              )}
            >
              {renderCard(item, {
                next: () => {
                  go(1);
                },
                isTop,
              })}
            </article>
          );
        })}
      </div>
    </section>
  );
}

type QueueTone = 'neutral' | 'attention' | 'critical' | 'verified' | 'info';

const TONE: Record<QueueTone, string> = {
  neutral: 'bg-canvas-2 text-ink-2',
  attention: 'bg-attention-soft text-attention',
  critical: 'bg-critical-soft text-critical',
  verified: 'bg-verified-soft text-verified',
  info: 'bg-info-soft text-info',
};

interface QueueItem {
  key: string;
  icon: IconName;
  tone?: QueueTone;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}

/** An ordered work queue: icon, what, why, and one inline action per row. */
function ActionList({
  items,
  label,
  className,
}: {
  items: readonly QueueItem[];
  label: string;
  className?: string;
}) {
  return (
    <ol aria-label={label} className={cn('divide-y divide-line-soft', className)}>
      {items.map((item) => (
        <li key={item.key} className="flex min-w-0 items-center gap-3 py-3">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-xl',
              TONE[item.tone ?? 'neutral'],
            )}
          >
            <Icon name={item.icon} size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
            {item.meta ? <p className="truncate text-[13px] text-ink-3">{item.meta}</p> : null}
          </div>
          {item.action ? <div className="shrink-0">{item.action}</div> : null}
        </li>
      ))}
    </ol>
  );
}

/** Rounded icon tile used at the start of queue rows and stack cards. */
function ToneIcon({
  icon,
  tone = 'neutral',
  className,
}: {
  icon: IconName;
  tone?: QueueTone;
  className?: string;
}) {
  return (
    <span
      className={cn('grid size-10 shrink-0 place-items-center rounded-xl', TONE[tone], className)}
    >
      <Icon name={icon} size={19} />
    </span>
  );
}

export { ActionList, CardStack, ToneIcon };
export type { QueueItem, QueueTone };
