'use client';

import { IconButton } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { SkipLink } from '@krinly/ui/components/feedback';
import { Tooltip } from '@krinly/ui/components/overlay';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { Wordmark } from '@/components/wordmark';
import { AccountMenu } from './account-menu';
import { CommandSearch, type Destination } from './command-search';
import { NAV_ITEMS } from './nav-items';
import { Notifications } from './notifications';
import { WorkspaceSwitcher } from './workspace-switcher';

export interface Workspace {
  id: string;
  name: string;
}

export function AppShell({
  org,
  role,
  organizations,
  name,
  email,
  children,
}: {
  org: Workspace;
  role: string;
  organizations: Workspace[];
  name: string;
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (href: string) => pathname === href;
  const currentItem = NAV_ITEMS.find((item) => isActive(item.href(org.id)));

  const destinations: Destination[] = [
    ...NAV_ITEMS.map((item) => ({
      key: `nav-${item.key}`,
      label: item.label,
      group: 'Go to' as const,
      icon: item.icon,
      href: item.href(org.id),
    })),
    ...organizations
      .filter((o) => o.id !== org.id)
      .map((o) => ({
        key: `org-${o.id}`,
        label: o.name,
        group: 'Switch workspace' as const,
        icon: 'store' as const,
        href: `/o/${o.id}`,
      })),
  ];

  return (
    <div className="flex min-h-svh bg-canvas">
      <SkipLink />

      {/* Desktop sidebar */}
      <aside
        aria-label="Main navigation"
        className={`sticky top-0 hidden h-svh shrink-0 flex-col bg-brand px-3 pt-4 pb-3 text-on-brand md:flex ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        <div
          className={`flex items-center px-1.5 ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          <Wordmark tone="on-brand" compact={collapsed} />
          {!collapsed ? (
            <IconButton
              label="Collapse navigation"
              variant="on-brand"
              size="icon-sm"
              onClick={() => {
                setCollapsed(true);
              }}
              className="hidden lg:inline-flex"
            >
              <Icon name="panel" size={16} />
            </IconButton>
          ) : null}
        </div>

        {!collapsed ? (
          <WorkspaceSwitcher
            currentId={org.id}
            organizations={organizations}
            className="mt-5 px-1.5 [&_select]:border-brand-line [&_select]:bg-brand-raised [&_select]:text-on-brand [&_select]:shadow-none"
          />
        ) : (
          <div className="mt-5 flex justify-center">
            <Tooltip content={org.name}>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-raised font-display text-sm font-semibold text-on-brand">
                {org.name.slice(0, 1).toUpperCase()}
              </span>
            </Tooltip>
          </div>
        )}

        <nav aria-label="Workspace" className="mt-6 flex-1">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const href = item.href(org.id);
              const active = isActive(href);
              const link = (
                <Link
                  key={item.key}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-on-brand-2 hover:bg-brand-raised hover:text-on-brand aria-[current=page]:bg-brand-raised aria-[current=page]:text-on-brand ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  {!collapsed ? item.label : null}
                </Link>
              );
              return (
                <li key={item.key}>
                  {collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-1 border-t border-brand-line pt-3">
          {collapsed ? (
            <div className="flex justify-center pb-1">
              <IconButton
                label="Expand navigation"
                variant="on-brand"
                size="icon-sm"
                onClick={() => {
                  setCollapsed(false);
                }}
                className="hidden lg:inline-flex"
              >
                <Icon name="panel" size={16} />
              </IconButton>
            </div>
          ) : null}
          <AccountMenu name={name} email={email} role={role} onBrand />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: one set of controls, laid out differently per breakpoint. */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-surface px-3 md:static md:h-auto md:border-0 md:bg-transparent md:px-6 md:pt-5">
          <div className="flex items-center gap-2 md:hidden">
            <Wordmark compact />
            <span className="truncate font-display text-[15px] font-semibold text-ink">
              {currentItem?.label ?? org.name}
            </span>
          </div>
          <CommandSearch destinations={destinations} />
          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <Notifications />
            <span className="md:hidden">
              <AccountMenu name={name} email={email} role={role} />
            </span>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 pb-[calc(84px+env(safe-area-inset-bottom))] outline-none md:px-6 md:pb-10 lg:px-8"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const href = item.href(org.id);
          const active = isActive(href);
          return (
            <Link
              key={item.key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink-3 aria-[current=page]:text-ink"
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
