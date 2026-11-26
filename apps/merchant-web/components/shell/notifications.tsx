'use client';

import { IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@krinly/ui/components/overlay';

// No notification backend exists yet, so this is an honest empty state rather than a fabricated
// unread count. Wire it up once a notifications source exists (docs/frontend/phase-03-handoff.md).
export function Notifications({ onBrand = false }: { onBrand?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton label="Notifications" variant={onBrand ? 'on-brand' : 'outline'} shape="pill">
          <Icon name="bell" size={18} />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end">
        <p className="px-1 pt-1 pb-2 font-display text-sm font-semibold text-ink">Notifications</p>
        <p className="px-1 pb-1 text-sm text-ink-3">You&apos;re all caught up — nothing yet.</p>
      </PopoverContent>
    </Popover>
  );
}
