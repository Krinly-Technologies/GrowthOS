'use client';

import { Popover } from 'radix-ui';
import { cn } from '@krinly/ui/lib/utils';
import { useConceptScope } from './concept';
import { Icon } from './icons';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function FilterMenu<T extends string>({
  label,
  options,
  selected,
  onChange,
  triggerClassName,
}: {
  label: string;
  options: FilterOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  triggerClassName?: string;
}) {
  const scope = useConceptScope();
  const active = selected.length > 0;
  const summary = active
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${label} · ${selected.length.toString()}`
    : label;

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          'filter-trigger inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm whitespace-nowrap',
          active
            ? 'border-ink bg-ink text-white'
            : 'border-line bg-surface text-ink hover:bg-canvas-2',
          triggerClassName,
        )}
        aria-label={active ? `${label} filter: ${summary}` : `Filter by ${label.toLowerCase()}`}
      >
        {summary}
        <Icon name="chevron-down" size={14} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          {...scope}
          align="start"
          sideOffset={6}
          className="lab-pop lab-menu z-50 w-64 rounded-xl border border-line bg-surface p-2 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <fieldset>
            <legend className="px-2 pt-1 pb-2 text-xs text-ink-3">
              Filter by {label.toLowerCase()}
            </legend>
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas-2"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      onChange(
                        checked
                          ? selected.filter((v) => v !== option.value)
                          : [...selected, option.value],
                      );
                    }}
                    className="size-4 accent-[var(--ink)]"
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.count !== undefined ? (
                    <span className="tnum text-xs text-ink-3">{option.count}</span>
                  ) : null}
                </label>
              );
            })}
          </fieldset>
          {active ? (
            <button
              type="button"
              onClick={() => {
                onChange([]);
              }}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-ink-2 hover:bg-canvas-2"
            >
              Clear {label.toLowerCase()} filter
            </button>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
