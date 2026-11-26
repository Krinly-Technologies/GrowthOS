'use client';

import { Tooltip } from 'radix-ui';
import type { ReactNode } from 'react';
import { useConceptScope } from './concept';

/** Tooltip for icon-only controls. The control must still carry its own accessible name. */
export function Tip({
  label,
  shortcut,
  side = 'right',
  children,
}: {
  label: string;
  shortcut?: string;
  side?: 'right' | 'top' | 'bottom' | 'left';
  children: ReactNode;
}) {
  const scope = useConceptScope();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          {...scope}
          side={side}
          sideOffset={8}
          className="lab-pop z-[70] flex items-center gap-2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          {label}
          {shortcut ? (
            <kbd className="rounded bg-white/15 px-1 text-[10.5px]">{shortcut}</kbd>
          ) : null}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
