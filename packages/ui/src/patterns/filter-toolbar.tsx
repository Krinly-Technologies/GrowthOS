import type { ReactNode } from 'react';
import { Icon } from '../components/icon';
import { cn } from '../lib/utils';

/**
 * Search, filters and view controls above a collection. Slots keep it data-agnostic:
 * `start` (search), `filters` (menus/segmented controls), `end` (view switch, primary action).
 * Active filters render as removable chips with a single "Clear all".
 */
function FilterToolbar({
  start,
  filters,
  end,
  active = [],
  onClearAll,
  resultSummary,
  className,
}: {
  start?: ReactNode;
  filters?: ReactNode;
  end?: ReactNode;
  active?: readonly { key: string; label: ReactNode; onRemove: () => void; removeLabel: string }[];
  onClearAll?: () => void;
  /** e.g. "12 leads" — announced politely when it changes. */
  resultSummary?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {start ? <div className="min-w-0 flex-1 basis-56">{start}</div> : null}
        {filters ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">{filters}</div>
        ) : null}
        {end ? <div className="ml-auto flex items-center gap-2">{end}</div> : null}
      </div>
      {active.length > 0 || resultSummary ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]">
          {resultSummary ? (
            <p aria-live="polite" className="tnum mr-1 text-ink-3">
              {resultSummary}
            </p>
          ) : null}
          {active.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex h-7 max-w-full items-center gap-1 rounded-full bg-ink pr-1 pl-3 font-semibold text-surface"
            >
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                aria-label={chip.removeLabel}
                onClick={chip.onRemove}
                className="grid size-5 place-items-center rounded-full hover:bg-ink-2"
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
          {active.length > 0 && onClearAll ? (
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-md px-1.5 font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { FilterToolbar };
