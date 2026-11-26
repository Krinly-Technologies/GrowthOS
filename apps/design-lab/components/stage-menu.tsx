'use client';

import { DropdownMenu } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { PIPELINE, type Stage, STAGE_LABEL } from '@/lib/domain';
import { useConceptScope } from './concept';
import { Icon } from './icons';

/**
 * Stage picker. Also the keyboard and touch alternative to dragging cards on the board
 * (WCAG 2.5.7). Choosing Lost asks for a reason via `onLost`.
 */
export function StageMenu({
  value,
  onSelect,
  onLost,
  children,
  align = 'start',
  label = 'Change stage',
}: {
  value: Stage;
  onSelect: (stage: Stage) => void;
  onLost: () => void;
  children: ReactNode;
  align?: 'start' | 'end';
  label?: string;
}) {
  const scope = useConceptScope();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          {...scope}
          align={align}
          sideOffset={6}
          aria-label={label}
          className="lab-pop lab-menu z-50 min-w-[210px] rounded-xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <DropdownMenu.Label className="px-2.5 pt-1 pb-1.5 text-xs text-ink-3">
            {label}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(next) => {
              const stage = PIPELINE.find((s) => s === next);
              if (stage) onSelect(stage);
            }}
          >
            {PIPELINE.map((stage, i) => (
              <DropdownMenu.RadioItem
                key={stage}
                value={stage}
                className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none select-none data-[highlighted]:bg-canvas-2"
              >
                <span className="stage-dot" data-stage={stage} data-index={i} aria-hidden="true" />
                <span className="flex-1">{STAGE_LABEL[stage]}</span>
                <DropdownMenu.ItemIndicator>
                  <Icon name="check" size={15} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            disabled={value === 'lost'}
            onSelect={onLost}
            className={cn(
              'flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-critical outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-critical-soft',
            )}
          >
            <Icon name="close" size={15} />
            Mark as lost…
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
