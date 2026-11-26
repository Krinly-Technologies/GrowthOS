import type { Activity, Channel, Lead, SourceId } from '@/lib/domain';
import { CHANNEL_LABEL, SOURCES, TEAM } from '@/lib/sample/scenario';
import { Icon, type IconName } from './icons';

export const SOURCE_ICON: Record<SourceId, IconName> = {
  instagram_ads: 'megaphone',
  instagram: 'camera',
  google: 'search',
  referral: 'referral',
  wedding_fair: 'ticket',
  website: 'globe',
  walk_in: 'store',
};

export const CHANNEL_ICON: Record<Channel, IconName> = {
  whatsapp: 'message',
  instagram: 'camera',
  call: 'phone',
  email: 'message',
  visit: 'store',
  web: 'globe',
};

export function activityIcon(activity: Activity): IconName {
  switch (activity.kind) {
    case 'enquiry':
    case 'message_in':
    case 'message_out':
      return activity.channel ? CHANNEL_ICON[activity.channel] : 'message';
    case 'call':
      return 'phone';
    case 'visit':
      return 'store';
    case 'note':
      return 'note';
    case 'stage':
      return 'growth';
    case 'trial':
      return 'calendar';
    case 'quotation':
      return 'payments';
    case 'payment':
      return activity.text.startsWith('Verified') ? 'seal' : 'payments';
    case 'suggestion':
      return 'assistant';
  }
}

export function actorName(activity: Activity, lead: Lead): string {
  if (activity.by === 'customer') return (lead.latinName ?? lead.name).split(' ')[0] ?? 'Customer';
  if (activity.by === 'assistant') return 'Assistant';
  return TEAM[activity.by].firstName;
}

export function channelText(activity: Activity | undefined): string {
  if (!activity) return '';
  if (activity.channel) return CHANNEL_LABEL[activity.channel];
  if (activity.kind === 'note') return 'Note';
  if (activity.kind === 'trial') return 'Trial';
  if (activity.kind === 'quotation') return 'Quotation';
  if (activity.kind === 'call') return 'Call';
  return 'Update';
}

export function SourceLabel({ source, className }: { source: SourceId; className?: string }) {
  return (
    <span className={className}>
      <Icon
        name={SOURCE_ICON[source]}
        size={14}
        className="mr-1.5 inline -translate-y-px text-ink-3"
      />
      {SOURCES[source].label}
    </span>
  );
}
