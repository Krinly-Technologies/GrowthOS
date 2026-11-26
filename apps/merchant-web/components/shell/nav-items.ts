import type { IconName } from '@krinly/ui/components/icon';

export interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  href: (orgId: string) => string;
}

// Only workspace-scoped sections that are actually implemented. Today, Inbox, Leads, Bookings,
// Payments and Growth belong to later phases — append them here once their screens exist; the
// shell (sidebar, mobile header, bottom nav) already renders this list generically, so adding a
// module later does not require touching the shell itself.
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'overview', label: 'Workspace', icon: 'store', href: (orgId) => `/o/${orgId}` },
  { key: 'members', label: 'Team', icon: 'user', href: (orgId) => `/o/${orgId}/members` },
];
