'use client';

import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@krinly/ui/components/overlay';
import { RANGE_IDS, type RangeId, resolveRange } from '@/lib/preview/ranges';

/** Which reporting period every figure on the screen is for. */
export function RangePicker({
  value,
  now,
  onChange,
  tone = 'on-brand',
}: {
  value: RangeId;
  now: number;
  onChange: (range: RangeId) => void;
  tone?: 'on-brand' | 'surface';
}) {
  const current = resolveRange(value, now);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={tone === 'on-brand' ? 'on-brand' : 'outline'}
          size="sm"
          shape="pill"
          className="gap-2"
        >
          <Icon name="calendar" size={15} />
          {current.label}
          <Icon name="chevron-down" size={14} />
          <span className="sr-only">: change the reporting period</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const match = RANGE_IDS.find((id) => id === next);
            if (match) onChange(match);
          }}
        >
          {RANGE_IDS.map((id) => {
            const range = resolveRange(id, now);
            return (
              <DropdownMenuRadioItem key={id} value={id}>
                <span className="flex-1">{range.label}</span>
                <span className="mr-2 text-[12px] text-ink-3">
                  vs {comparisonName(range.compareLabel)}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "October by this date" → "October": the period name without the cut-off clause. */
export function comparisonName(compareLabel: string): string {
  return compareLabel.replace(/ by this (date|time)$/, '');
}
