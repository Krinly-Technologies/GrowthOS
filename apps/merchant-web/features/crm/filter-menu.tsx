'use client';

import { Icon } from '@krinly/ui/components/icon';
import { Choice } from '@krinly/ui/components/field';
import { Popover, PopoverContent, PopoverTrigger } from '@krinly/ui/components/overlay';
import { cn } from '@krinly/ui/lib/utils';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** A multi-select filter: Source, Owner, Stage. Shows the count in the trigger once something is picked. */
export function FilterMenu<T extends string>({
  label,
  options,
  selected,
  onChange,
  triggerClassName,
}: {
  label: string;
  options: readonly FilterOption<T>[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
  triggerClassName?: string;
}) {
  const active = selected.length > 0;
  const summary = active
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${label} · ${selected.length.toString()}`
    : label;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={active ? `${label} filter: ${summary}` : `Filter by ${label.toLowerCase()}`}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm whitespace-nowrap',
          active
            ? 'border-ink bg-ink text-white'
            : 'border-line bg-surface text-ink hover:bg-canvas-2',
          triggerClassName,
        )}
      >
        {summary}
        <Icon name="chevron-down" size={14} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <fieldset>
          <legend className="px-1 pb-2 text-xs text-ink-3">Filter by {label.toLowerCase()}</legend>
          <div className="grid gap-0.5">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <Choice
                  key={option.value}
                  checked={checked}
                  onChange={() => {
                    onChange(
                      checked
                        ? selected.filter((v) => v !== option.value)
                        : [...selected, option.value],
                    );
                  }}
                  label={
                    <span className="flex items-center gap-2">
                      <span className="flex-1">{option.label}</span>
                      {option.count !== undefined ? (
                        <span className="tnum text-xs text-ink-3">{option.count}</span>
                      ) : null}
                    </span>
                  }
                />
              );
            })}
          </div>
        </fieldset>
        {active ? (
          <button
            type="button"
            onClick={() => {
              onChange([]);
            }}
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink-2 hover:bg-canvas-2"
          >
            Clear {label.toLowerCase()} filter
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
