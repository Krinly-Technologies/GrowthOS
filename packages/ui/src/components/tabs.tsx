'use client';

import { Tabs as TabsPrimitive, ToggleGroup } from 'radix-ui';
import type * as React from 'react';
import { cn } from '../lib/utils';

const Tabs = TabsPrimitive.Root;

/** Pill tab list. On the navy shell pass `tone="on-brand"`. */
function TabsList({
  className,
  tone = 'surface',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { tone?: 'surface' | 'on-brand' }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex max-w-full overflow-x-auto rounded-full p-1',
        tone === 'surface' ? 'bg-surface shadow-ring' : 'bg-brand-raised',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'h-8 shrink-0 rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap text-ink-2 transition-colors hover:text-ink data-[state=active]:bg-ink data-[state=active]:text-surface',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />;
}

/**
 * Single-choice segmented control (date ranges, list/pipeline). Use for switching a view of the
 * same content; use Tabs when the panels are different content.
 */
function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(next) => {
        const match = options.find((o) => o.value === next);
        if (match) onValueChange(match.value);
      }}
      className={cn(
        'inline-flex max-w-full overflow-x-auto rounded-full bg-surface p-1 shadow-ring',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap text-ink-2 hover:text-ink data-[state=on]:bg-ink data-[state=on]:text-surface [&_svg]:size-4"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

export { SegmentedControl, Tabs, TabsContent, TabsList, TabsTrigger };
