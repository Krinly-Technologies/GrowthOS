import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/utils';
import type { StageTone } from './thread';

const HEADER_TONE: Record<string, string> = {
  '0': 'bg-canvas-2',
  '1': 'bg-[color-mix(in_oklab,var(--step-1)_22%,var(--surface))]',
  '2': 'bg-[color-mix(in_oklab,var(--step-2)_24%,var(--surface))]',
  '3': 'bg-[color-mix(in_oklab,var(--step-3)_24%,var(--surface))]',
  '4': 'bg-[color-mix(in_oklab,var(--step-4)_26%,var(--surface))]',
  lost: 'bg-lost/50',
};

/**
 * A board column. Pass native drag-and-drop handlers through `listProps` if the board supports
 * dragging, and always offer a non-drag alternative (e.g. a stage menu on each card).
 */
function PipelineColumn({
  title,
  count,
  summary,
  tone = 0,
  active = false,
  children,
  listProps,
  className,
}: {
  title: string;
  count: number;
  /** Secondary figure, e.g. a formatted column total. */
  summary?: ReactNode;
  tone?: StageTone;
  /** Highlight as a drop target. */
  active?: boolean;
  children: ReactNode;
  listProps?: ComponentProps<'ol'>;
  className?: string;
}) {
  return (
    <section
      aria-label={`${title}, ${String(count)}`}
      className={cn(
        'flex w-[272px] shrink-0 snap-start flex-col rounded-2xl bg-canvas p-2 transition-shadow',
        active && 'shadow-[inset_0_0_0_2px_var(--accent-strong)]',
        className,
      )}
    >
      <header
        className={cn(
          'flex items-center justify-between gap-2 rounded-xl px-3 py-2',
          HEADER_TONE[String(tone)],
        )}
      >
        <h3 className="truncate text-[13px] font-bold text-ink">
          {title} <span className="tnum font-semibold text-ink-3">{count}</span>
        </h3>
        {summary ? (
          <span className="tnum shrink-0 text-xs font-semibold text-ink-2">{summary}</span>
        ) : null}
      </header>
      <ol
        {...listProps}
        className={cn('mt-2 grid min-h-16 content-start gap-2', listProps?.className)}
      >
        {children}
      </ol>
    </section>
  );
}

/** A record on a board. `onOpen` makes the title a button that opens the record. */
function PipelineCard({
  title,
  subtitle,
  value,
  meta,
  footer,
  onOpen,
  dragging = false,
  className,
  ...props
}: Omit<ComponentProps<'li'>, 'title' | 'value'> & {
  title: string;
  subtitle?: ReactNode;
  value?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  onOpen?: () => void;
  dragging?: boolean;
}) {
  return (
    <li
      className={cn(
        'group/card relative rounded-xl bg-surface p-3 shadow-ring transition-[box-shadow,transform,opacity] hover:shadow-raised',
        dragging && 'scale-[1.02] opacity-60 shadow-floating',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="block max-w-full truncate text-left text-sm font-semibold text-ink after:absolute after:inset-0 after:rounded-xl"
            >
              {title}
            </button>
          ) : (
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
          )}
          {subtitle ? <p className="mt-0.5 truncate text-[12.5px] text-ink-3">{subtitle}</p> : null}
        </div>
        {value ? (
          <span className="tnum shrink-0 text-[13px] font-semibold text-ink">{value}</span>
        ) : null}
      </div>
      {meta ? <div className="mt-2.5 min-w-0 text-[12.5px] text-ink-2">{meta}</div> : null}
      {footer ? (
        <div className="relative z-[1] mt-2.5 flex items-center justify-between gap-2">
          {footer}
        </div>
      ) : null}
    </li>
  );
}

/** Horizontal, scroll-snapping container for columns. */
function PipelineBoard({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn('flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3', className)}
    >
      {children}
    </div>
  );
}

export { PipelineBoard, PipelineCard, PipelineColumn };
