import { cn } from '@krinly/ui/lib/utils';
import type { Lead, MemberId } from '@/lib/domain';
import { initials } from '@/lib/format';
import { TEAM } from '@/lib/sample/scenario';

function hueFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function MemberAvatar({
  id,
  size = 24,
  className,
  withName = false,
}: {
  id: MemberId;
  size?: number;
  className?: string;
  withName?: boolean;
}) {
  const member = TEAM[id];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.38)),
        background: `oklch(0.93 0.035 ${member.hue.toString()})`,
        color: `oklch(0.36 0.07 ${member.hue.toString()})`,
      }}
      title={withName ? undefined : member.name}
      aria-hidden={withName ? true : undefined}
    >
      {member.initials}
    </span>
  );
}

export function LeadAvatar({
  lead,
  size = 32,
  className,
}: {
  lead: Lead;
  size?: number;
  className?: string;
}) {
  const hue = hueFor(lead.id);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        background: `oklch(0.95 0.02 ${hue.toString()})`,
        color: `oklch(0.4 0.05 ${hue.toString()})`,
      }}
    >
      {initials(lead.name)}
    </span>
  );
}

/** Display name plus transliteration when the customer wrote their name in an Indic script. */
export function LeadName({
  lead,
  className,
  subClassName,
}: {
  lead: Lead;
  className?: string;
  subClassName?: string;
}) {
  return (
    <span className={cn('min-w-0', className)}>
      <span lang={lead.latinName ? 'mul' : undefined}>{lead.name}</span>
      {lead.latinName ? (
        <span className={cn('ml-1.5 font-normal text-ink-3', subClassName)}>{lead.latinName}</span>
      ) : null}
    </span>
  );
}
