import type { IconName } from '@krinly/ui/components/icon';
import type { AiIntent, DeliveryStatus } from '@/lib/preview/domain';
import type { InboxTab } from '@/lib/preview/inbox';

// Small shared lookups for the Inbox feature, local here for the same reason
// `features/crm/lead-bits.tsx` keeps its own: the mapping is specific to this screen.

export const INBOX_TAB_LABEL: Record<InboxTab, string> = {
  all: 'All',
  mine: 'Mine',
  unassigned: 'Unassigned',
  needs_review: 'Needs review',
  closed: 'Closed',
};

export const INBOX_TABS: readonly InboxTab[] = [
  'all',
  'mine',
  'unassigned',
  'needs_review',
  'closed',
];

export const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
};

export const INTENT_ICON: Record<AiIntent, IconName> = {
  booking_request: 'calendar',
  price_enquiry: 'payments',
  support: 'info',
  complaint: 'alert',
  spam: 'alert',
  other: 'message',
};
