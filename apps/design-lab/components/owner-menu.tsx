'use client';

import { DropdownMenu } from 'radix-ui';
import { cn } from '@krinly/ui/lib/utils';
import type { Lead } from '@/lib/domain';
import { MEMBER_IDS, TEAM } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';
import { MemberAvatar } from './avatar';
import { useConceptScope } from './concept';
import { Icon } from './icons';
import { useToast } from './toast';

export function OwnerMenu({ lead, triggerClassName }: { lead: Lead; triggerClassName?: string }) {
  const scope = useConceptScope();
  const { dispatch } = useLab();
  const notify = useToast();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-lg border border-line px-2 text-[13px] text-ink-2 hover:border-ink-3',
          triggerClassName,
        )}
      >
        <MemberAvatar id={lead.owner} size={20} withName />
        {TEAM[lead.owner].firstName}
        <Icon name="chevron-down" size={13} className="opacity-70" />
        <span className="sr-only">is the owner. Change owner</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          {...scope}
          align="end"
          sideOffset={6}
          className="lab-pop z-[60] w-56 rounded-xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <DropdownMenu.Label className="px-2.5 pt-1 pb-1.5 text-xs text-ink-3">
            Owner
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={lead.owner}
            onValueChange={(value) => {
              const owner = MEMBER_IDS.find((id) => id === value);
              if (!owner) return;
              dispatch({ type: 'assignOwner', leadId: lead.id, owner });
              notify({ title: `Assigned to ${TEAM[owner].firstName}` });
            }}
          >
            {MEMBER_IDS.map((id) => (
              <DropdownMenu.RadioItem
                key={id}
                value={id}
                className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-canvas-2"
              >
                <MemberAvatar id={id} size={22} withName />
                <span className="flex-1">
                  {TEAM[id].name}
                  <span className="block text-[12px] text-ink-3">{TEAM[id].role}</span>
                </span>
                <DropdownMenu.ItemIndicator>
                  <Icon name="check" size={15} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
