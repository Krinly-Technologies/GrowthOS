'use client';

import { Icon } from '@krinly/ui/components/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@krinly/ui/components/overlay';
import type { ReactNode } from 'react';
import { PIPELINE, type Stage, STAGE_LABEL } from '@/lib/preview/domain';

/**
 * Stage picker — the keyboard- and touch-reachable alternative to dragging a pipeline card
 * (WCAG 2.5.7). Choosing "Mark as lost" asks for a reason via `onLost` rather than changing the
 * stage directly.
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} aria-label={label}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const stage = PIPELINE.find((s) => s === next);
            if (stage) onSelect(stage);
          }}
        >
          {PIPELINE.map((stage) => (
            <DropdownMenuRadioItem key={stage} value={stage}>
              {STAGE_LABEL[stage]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="critical" disabled={value === 'lost'} onSelect={onLost}>
          <Icon name="close" size={15} />
          Mark as lost…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
