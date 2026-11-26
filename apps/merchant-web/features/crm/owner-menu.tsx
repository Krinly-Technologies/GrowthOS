'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Icon } from '@krinly/ui/components/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@krinly/ui/components/overlay';
import { cn } from '@krinly/ui/lib/utils';
import type { MemberId } from '@/lib/preview/domain';
import { MEMBER_IDS, TEAM } from '@/lib/preview/sample/scenario';

export function OwnerMenu({
  owner,
  onAssign,
  triggerClassName,
}: {
  owner: MemberId;
  onAssign: (owner: MemberId) => void;
  triggerClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-lg border border-line px-2 text-[13px] text-ink-2 hover:border-ink-3',
          triggerClassName,
        )}
      >
        <Avatar name={TEAM[owner].name} seed={owner} size={20} />
        {TEAM[owner].firstName}
        <Icon name="chevron-down" size={13} className="opacity-70" />
        <span className="sr-only">is the owner. Change owner</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Owner</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={owner}
          onValueChange={(value) => {
            const next = MEMBER_IDS.find((id) => id === value);
            if (next) onAssign(next);
          }}
        >
          {MEMBER_IDS.map((id) => (
            <DropdownMenuRadioItem key={id} value={id}>
              <Avatar name={TEAM[id].name} seed={id} size={22} />
              <span className="flex-1">
                {TEAM[id].name}
                <span className="block text-[12px] text-ink-3">{TEAM[id].role}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
