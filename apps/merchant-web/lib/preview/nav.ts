import type { NavItem } from '@/components/shell/nav-items';

/**
 * Navigation for the development preview only. These sections are built against provisional
 * models, so they must never appear in `components/shell/nav-items.ts` (the production list).
 * The preview has no workspace, so the `orgId` argument is ignored.
 */
export const PREVIEW_NAV_ITEMS: readonly NavItem[] = [
  { key: 'today', label: 'Today', icon: 'today', href: () => '/preview/today' },
  { key: 'inbox', label: 'Inbox', icon: 'inbox', href: () => '/preview/inbox' },
  { key: 'crm', label: 'Leads', icon: 'leads', href: () => '/preview/crm' },
  { key: 'acquisition', label: 'Acquisition', icon: 'growth', href: () => '/preview/acquisition' },
];
