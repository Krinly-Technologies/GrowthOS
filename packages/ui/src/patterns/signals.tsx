import type { ReactNode } from 'react';
import { Icon } from '../components/icon';
import { cn } from '../lib/utils';

type Priority = 'high' | 'medium' | 'low';

const BARS: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

/**
 * Priority as bars + a word. Use only where a person has set or can see the reason for the
 * priority; never as an unexplained score.
 */
function PriorityIndicator({
  level,
  label,
  className,
}: {
  level: Priority;
  label?: string;
  className?: string;
}) {
  const filled = BARS[level];
  const text = label ?? `${level[0]?.toUpperCase() ?? ''}${level.slice(1)} priority`;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-ink-2', className)}>
      <span aria-hidden="true" className="flex items-end gap-[2px]">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn(
              'w-[3px] rounded-[1px]',
              bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2.5' : 'h-3.5',
              bar <= filled ? (level === 'high' ? 'bg-attention-dot' : 'bg-ink-2') : 'bg-line',
            )}
          />
        ))}
      </span>
      {text}
    </span>
  );
}

type DueState = 'overdue' | 'today' | 'upcoming' | 'none';

/**
 * The single next step for a record: what, and when. `due` is pre-formatted by the caller
 * ("Overdue 2 days", "Today 4 pm"). With `onAction` it renders as a button.
 */
function NextAction({
  label,
  due,
  state = 'upcoming',
  onAction,
  className,
}: {
  label: ReactNode;
  due?: ReactNode;
  state?: DueState;
  onAction?: () => void;
  className?: string;
}) {
  const dueClass =
    state === 'overdue' ? 'text-critical' : state === 'today' ? 'text-attention' : 'text-ink-3';
  const content = (
    <>
      <Icon
        name={state === 'overdue' ? 'alert' : 'clock'}
        size={15}
        className={cn('shrink-0', state === 'none' ? 'text-ink-3' : dueClass)}
      />
      <span className="min-w-0 truncate">
        <span className="font-semibold text-ink">{label}</span>
        {due ? <span className={cn('font-semibold', dueClass)}> · {due}</span> : null}
      </span>
    </>
  );
  return onAction ? (
    <button
      type="button"
      onClick={onAction}
      className={cn(
        'inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full bg-canvas px-3 text-[13px] hover:bg-canvas-2',
        className,
      )}
    >
      {content}
    </button>
  ) : (
    <span
      className={cn('inline-flex max-w-full min-w-0 items-center gap-1.5 text-[13px]', className)}
    >
      {content}
    </span>
  );
}

/** Label/value pairs as a description list (record details). */
function InfoGrid({
  items,
  columns = 2,
  className,
}: {
  items: readonly { label: ReactNode; value: ReactNode; key?: string }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : '',
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={item.key ?? i} className="min-w-0">
          <dt className="text-xs font-semibold text-ink-3">{item.label}</dt>
          <dd className="mt-1 text-sm break-words text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export { InfoGrid, NextAction, PriorityIndicator };
export type { DueState, Priority };
