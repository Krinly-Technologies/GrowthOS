import { cn } from '@krinly/ui/lib/utils';
import type { Lead } from '@/lib/preview/domain';
import { dueInfo, waited } from '@/lib/preview/format';

/** What's next for this lead, and when — in words, never an unexplained score. */
export function NextText({ lead, now }: { lead: Lead; now: number }) {
  if (lead.stage === 'lost') return <span className="text-ink-3">{lead.lostReason}</span>;
  const waiting =
    lead.awaitingReplySince !== undefined && (!lead.next || lead.next.kind === 'reply');
  if (!waiting && !lead.next) return <span className="text-ink-3">Nothing due</span>;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const when =
    waiting && lead.awaitingReplySince !== undefined
      ? `Waiting ${waited(lead.awaitingReplySince, now)}`
      : (due?.label ?? '');
  const tone =
    waiting || due?.tone === 'today'
      ? 'text-attention'
      : due?.tone === 'overdue'
        ? 'text-critical'
        : 'text-ink-3';
  return (
    <span className="block min-w-0">
      <span className="block truncate text-ink">{lead.next?.label ?? 'Reply'}</span>
      <span className={cn('block text-[12.5px] font-semibold', tone)}>{when}</span>
    </span>
  );
}
