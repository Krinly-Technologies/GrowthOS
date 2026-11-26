'use client';

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../components/icon';
import { cn } from '../lib/utils';

/* ── Activity timeline ───────────────────────────────────────────────────── */

interface ActivityItem {
  id: string;
  icon: IconName;
  title: ReactNode;
  /** Who and when, pre-formatted. */
  meta?: ReactNode;
  body?: ReactNode;
  /** Emphasise items that need a decision (e.g. a proposal awaiting review). */
  highlight?: boolean;
}

/** Chronological record hanging off a single vertical line. Newest first is the caller's choice. */
function ActivityTimeline({
  items,
  label,
  className,
}: {
  items: readonly ActivityItem[];
  label: string;
  className?: string;
}) {
  return (
    <ol aria-label={label} className={cn('relative grid gap-4', className)}>
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-[15px] w-[1.5px] bg-line" />
      {items.map((item) => (
        <li key={item.id} className="relative flex gap-3">
          <span
            className={cn(
              'relative z-[1] grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-surface',
              item.highlight ? 'bg-accent text-brand' : 'bg-canvas-2 text-ink-2',
            )}
          >
            <Icon name={item.icon} size={15} />
          </span>
          <div
            className={cn(
              'min-w-0 flex-1 pt-1',
              item.highlight && 'rounded-xl bg-canvas p-3 pt-2.5',
            )}
          >
            <p className="text-sm text-ink">{item.title}</p>
            {item.meta ? <p className="mt-0.5 text-xs text-ink-3">{item.meta}</p> : null}
            {item.body ? (
              <div className="mt-2 text-sm leading-relaxed text-ink-2">{item.body}</div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Day timeline ────────────────────────────────────────────────────────── */

interface DayBlock {
  id: string;
  start: number;
  end: number;
  title: string;
  subtitle?: string;
  onSelect?: () => void;
}

interface DayMarker {
  id: string;
  at: number;
  /** Accessible and tooltip text. */
  label: string;
  onSelect?: () => void;
}

const HOUR = 3_600_000;

function hourLabel(h: number): string {
  if (h === 0 || h === 24) return '12 am';
  if (h === 12) return '12 pm';
  return h > 12 ? `${String(h - 12)} pm` : `${String(h)} am`;
}

/**
 * Appointments as blocks on a working-day axis, point events as markers, and a now line.
 * Times are epoch ms; `dayStart` is local midnight in the business's time zone (the caller owns
 * time zones). Below 640px it becomes an agenda list.
 */
function DayTimeline({
  dayStart,
  now,
  startHour = 9,
  endHour = 20,
  blocks,
  markers = [],
  markersLabel = 'Events',
  formatTime,
  emptyText = 'Nothing scheduled.',
  className,
}: {
  dayStart: number;
  now?: number;
  startHour?: number;
  endHour?: number;
  blocks: readonly DayBlock[];
  markers?: readonly DayMarker[];
  markersLabel?: string;
  formatTime: (t: number) => string;
  emptyText?: string;
  className?: string;
}) {
  const span = (endHour - startHour) * HOUR;
  const origin = dayStart + startHour * HOUR;
  const pos = (t: number) => Math.max(0, Math.min(100, ((t - origin) / span) * 100));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const nowPct = now !== undefined && now >= origin && now <= origin + span ? pos(now) : null;

  return (
    <div className={className}>
      <div className="relative hidden h-[132px] sm:block">
        <p className="absolute top-0 left-0 text-[11.5px] font-semibold text-ink-3">
          {markersLabel}
        </p>
        <div className="absolute inset-x-0 top-[46px] h-16 rounded-2xl bg-canvas" />
        {nowPct !== null ? (
          <div
            aria-hidden="true"
            className="absolute top-[46px] left-0 h-16 rounded-l-2xl bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklab,var(--ink)_5%,transparent)_6px_7px)]"
            style={{ width: `${String(nowPct)}%` }}
          />
        ) : null}
        {hours.map((h, i) => (
          <span
            key={h}
            aria-hidden="true"
            className={cn(
              'absolute top-[114px] text-[11.5px] whitespace-nowrap text-ink-3',
              i === hours.length - 1 ? '-translate-x-full' : i === 0 ? '' : '-translate-x-1/2',
              i % 2 === 1 && hours.length > 9 ? 'hidden lg:block' : '',
            )}
            style={{ left: `${String((i / (hours.length - 1)) * 100)}%` }}
          >
            {hourLabel(h)}
          </span>
        ))}
        {markers.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={m.onSelect}
            aria-label={m.label}
            className="group absolute top-3.5 -translate-x-1/2 rounded-full"
            style={{ left: `${String(pos(m.at))}%` }}
          >
            <span className="block size-3 rounded-full bg-step-2 ring-[3px] ring-surface" />
            <span className="pointer-events-none absolute top-5 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-[11.5px] font-semibold whitespace-nowrap text-surface group-hover:block group-focus-visible:block">
              {m.label}
            </span>
          </button>
        ))}
        {blocks.map((b) => {
          const left = pos(b.start);
          const width = Math.max(pos(b.end) - left, 9);
          const done = now !== undefined && b.end < now;
          return (
            <button
              key={b.id}
              type="button"
              onClick={b.onSelect}
              className={cn(
                'absolute top-[54px] flex h-12 flex-col justify-center overflow-hidden rounded-xl px-2.5 text-left',
                done ? 'bg-canvas-2 text-ink-3' : 'bg-ink text-surface hover:bg-ink-2',
              )}
              style={{
                left: `${String(Math.min(left, 100 - width))}%`,
                width: `${String(width)}%`,
              }}
            >
              <span className="truncate text-[12.5px] font-bold">{b.title}</span>
              <span className={cn('truncate text-[11.5px]', done ? '' : 'opacity-85')}>
                {formatTime(b.start)}
                <span className="sr-only">–{formatTime(b.end)}</span>
                {b.subtitle ? ` · ${b.subtitle}` : ''}
                {done ? <span className="sr-only"> (finished)</span> : null}
              </span>
            </button>
          );
        })}
        {nowPct !== null ? (
          <div
            aria-hidden="true"
            className="absolute top-[38px] bottom-[22px] w-0.5 rounded bg-accent-strong"
            style={{ left: `${String(nowPct)}%` }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-accent-strong px-1.5 text-[10.5px] font-bold text-canvas">
              Now
            </span>
          </div>
        ) : null}
      </div>

      <ol className="grid gap-2 sm:hidden">
        {blocks.length === 0 ? <li className="text-sm text-ink-3">{emptyText}</li> : null}
        {blocks.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={b.onSelect}
              className="flex w-full items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-left"
            >
              <span className="tnum w-16 shrink-0 text-[13px] font-bold">
                {formatTime(b.start)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{b.title}</span>
                {b.subtitle ? (
                  <span className="block truncate text-[12.5px] text-ink-3">{b.subtitle}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { ActivityTimeline, DayTimeline };
export type { ActivityItem, DayBlock, DayMarker };
