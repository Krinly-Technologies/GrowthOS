import type { IconName } from '@krinly/ui/components/icon';

export interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  href: (orgId: string) => string;
}

// Only workspace-scoped sections that are actually implemented **and** backed by real APIs.
// Today, Inbox, Leads, Bookings, Payments and Growth belong to later phases — append them here
// once their screens have a supported contract behind them; the shell (sidebar, mobile header,
// bottom nav) renders whatever list it is given, so adding a module later does not require
// touching the shell itself.
//
// Screens built against provisional models are reachable only from the development preview,
// which passes its own list (`lib/preview/nav.ts`) to the same shell. Nothing provisional
// appears here, so no merchant can navigate to a screen that has no backend.
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'overview', label: 'Workspace', icon: 'store', href: (orgId) => `/o/${orgId}` },
  { key: 'members', label: 'Team', icon: 'user', href: (orgId) => `/o/${orgId}/members` },
];
