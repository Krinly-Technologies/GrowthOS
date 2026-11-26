'use client';

import { Dialog, DropdownMenu } from 'radix-ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type CSSProperties, type ReactNode, Suspense, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { MemberAvatar } from '@/components/avatar';
import { useConceptScope } from '@/components/concept';
import { Icon, type IconName } from '@/components/icons';
import { LabBar } from '@/components/lab-bar';
import { ShellActionsProvider, useShellActions } from '@/components/shell-actions';
import { Tip } from '@/components/tip';
import { useToast } from '@/components/toast';
import { MODULES, type ModuleSlug } from '@/lib/modules';
import { appointmentsOn, awaitingVerification, needsReply } from '@/lib/selectors';
import { BUSINESS, TEAM, VIEWER } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';

interface NavItem {
  slug: ModuleSlug;
  icon: IconName;
  count?: number;
  countLabel?: string;
  tone?: 'attention' | 'neutral';
}

function useNav() {
  const { state } = useLab();
  const replies = needsReply(state.data).length;
  const today = appointmentsOn(state.data, state.now).length;
  const verify = awaitingVerification(state.data).length;
  const journey: NavItem[] = [
    {
      slug: 'inbox',
      icon: 'inbox',
      count: replies,
      countLabel: `${replies.toString()} waiting for a reply`,
      tone: 'attention',
    },
    { slug: 'leads', icon: 'leads' },
    {
      slug: 'bookings',
      icon: 'bookings',
      count: today,
      countLabel: `${today.toString()} today`,
      tone: 'neutral',
    },
    {
      slug: 'payments',
      icon: 'payments',
      count: verify,
      countLabel: `${verify.toString()} to verify`,
      tone: 'attention',
    },
  ];
  const automate: NavItem[] = [
    { slug: 'assistant', icon: 'assistant' },
    { slug: 'automation', icon: 'automation' },
    { slug: 'knowledge', icon: 'knowledge' },
  ];
  return { journey, automate };
}

function useActive() {
  const pathname = usePathname();
  return (slug: string) => pathname === `/a/${slug}` || pathname.startsWith(`/a/${slug}/`);
}

// ─────────────────────────────────────────────────────────────── menus

function WorkspaceMenu({ children }: { children: ReactNode }) {
  const scope = useConceptScope();
  const router = useRouter();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          {...scope}
          align="start"
          sideOffset={6}
          className="lab-pop z-50 w-72 rounded-xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <p className="font-semibold">{BUSINESS.name}</p>
            <p className="mt-0.5 text-[13px] text-ink-3">{BUSINESS.area}</p>
            <p className="mt-2 text-[12px] text-ink-3">
              You are the owner · India Standard Time · Indian rupee
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          {(
            [
              ['Workspace settings', '/a/settings', 'settings'],
              ['Invite your team', '/a/settings', 'leads'],
              ['Integrations', '/a/integrations', 'integrations'],
            ] as const
          ).map(([label, href, icon]) => (
            <DropdownMenu.Item
              key={label}
              onSelect={() => {
                router.push(href);
              }}
              className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-canvas-2"
            >
              <Icon name={icon} size={16} className="text-ink-3" />
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function CreateMenu({
  children,
  side = 'bottom',
}: {
  children: ReactNode;
  side?: 'bottom' | 'right' | 'top';
}) {
  const scope = useConceptScope();
  const actions = useShellActions();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          {...scope}
          side={side}
          align="start"
          sideOffset={6}
          className="lab-pop z-50 w-56 rounded-xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <DropdownMenu.Label className="px-2.5 pt-1 pb-1.5 text-xs text-ink-3">
            Quick create
          </DropdownMenu.Label>
          <DropdownMenu.Item
            onSelect={actions.openNewLead}
            className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-canvas-2"
          >
            <Icon name="user" size={16} className="text-ink-3" />
            New lead
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              actions.openRecordPayment();
            }}
            className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-canvas-2"
          >
            <Icon name="payments" size={16} className="text-ink-3" />
            Record a payment
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ProfileMenu({ children }: { children: ReactNode }) {
  const scope = useConceptScope();
  const actions = useShellActions();
  const router = useRouter();
  const { dispatch } = useLab();
  const notify = useToast();
  const me = TEAM[VIEWER];
  const item =
    'flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-canvas-2';
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          {...scope}
          side="top"
          align="start"
          sideOffset={8}
          className="lab-pop z-50 w-64 rounded-xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <p className="font-semibold">{me.name}</p>
            <p className="text-[13px] text-ink-3">
              {me.role} · {BUSINESS.name}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item onSelect={actions.openShortcuts} className={item}>
            <Icon name="keyboard" size={16} className="text-ink-3" />
            <span className="flex-1">Keyboard shortcuts</span>
            <kbd className="text-xs text-ink-3">?</kbd>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              dispatch({ type: 'reset' });
              notify({ title: 'Sample data reset' });
            }}
            className={item}
          >
            <Icon name="undo" size={16} className="text-ink-3" />
            Reset sample data
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              router.push('/');
            }}
            className={item}
          >
            <Icon name="exit" size={16} className="text-ink-3" />
            Leave the prototype
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─────────────────────────────────────────────────────────────── sidebar

function Monogram({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="a-figure grid shrink-0 place-items-center rounded-lg bg-ink text-mint"
      style={{ width: size, height: size, fontSize: size * 0.56 }}
    >
      {BUSINESS.monogram}
    </span>
  );
}

function ExpandedItem({ item, active }: { item: NavItem; active: boolean }) {
  const label = MODULES[item.slug].label;
  return (
    <Link
      href={`/a/${item.slug}`}
      aria-current={active ? 'page' : undefined}
      className="a-nav-item"
    >
      <span
        className="a-node"
        data-tone={item.tone === 'attention' && item.count ? 'attention' : undefined}
        aria-hidden="true"
      />
      <span className="flex-1">{label}</span>
      {item.count ? (
        <span
          aria-hidden="true"
          className={cn(
            'tnum text-[12.5px]',
            item.tone === 'attention' ? 'font-semibold text-attention' : 'text-ink-3',
          )}
        >
          {item.count}
        </span>
      ) : null}
      {item.count ? <span className="sr-only">, {item.countLabel}</span> : null}
    </Link>
  );
}

function RailItem({ item, active }: { item: NavItem; active: boolean }) {
  const label = MODULES[item.slug].label;
  return (
    <Tip label={item.count ? `${label} · ${item.countLabel ?? ''}` : label}>
      <Link
        href={`/a/${item.slug}`}
        aria-current={active ? 'page' : undefined}
        aria-label={item.count ? `${label}, ${item.countLabel ?? ''}` : label}
        className="a-rail-item"
      >
        <Icon name={item.icon} size={18} />
        {item.count && item.tone === 'attention' ? (
          <span className="a-rail-badge tnum" aria-hidden="true">
            {item.count}
          </span>
        ) : null}
      </Link>
    </Tip>
  );
}

function SidebarA() {
  const { state, dispatch } = useLab();
  const actions = useShellActions();
  const isActive = useActive();
  const { journey, automate } = useNav();
  const collapsed = state.collapsed.a;
  const [automateOpen, setAutomateOpen] = useState(true);
  const today: NavItem = { slug: 'today', icon: 'today' };
  const growth: NavItem = { slug: 'growth', icon: 'growth' };
  const settings: NavItem = { slug: 'settings', icon: 'settings' };
  const me = TEAM[VIEWER];

  return (
    <aside
      aria-label="Main navigation"
      data-collapsed={collapsed ? 'true' : 'false'}
      className="a-sidebar sticky top-0 hidden h-svh shrink-0 flex-col bg-canvas md:flex"
    >
      {/* Workspace */}
      <div className="px-3 pt-4">
        <WorkspaceMenu>
          <button
            type="button"
            className="a-when-expanded w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-canvas-2"
          >
            <Monogram />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold leading-tight">
                {BUSINESS.name}
              </span>
              <span className="block truncate text-[12px] text-ink-3">Jayanagar · {me.role}</span>
            </span>
            <Icon name="chevron-down" size={15} className="text-ink-3" />
          </button>
        </WorkspaceMenu>
        <div className="a-when-collapsed justify-center">
          <WorkspaceMenu>
            <button
              type="button"
              aria-label={`${BUSINESS.name} workspace menu`}
              className="rounded-lg p-1 hover:bg-canvas-2"
            >
              <Monogram size={32} />
            </button>
          </WorkspaceMenu>
        </div>
      </div>

      {/* Search and create */}
      <div className="a-when-expanded mt-4 gap-2 px-3">
        <button
          type="button"
          onClick={actions.openCommand}
          className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13.5px] text-ink-3 hover:border-ink-3 hover:text-ink"
        >
          <Icon name="search" size={15} />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded border border-line px-1 text-[10.5px]">Ctrl K</kbd>
        </button>
        <CreateMenu>
          <button
            type="button"
            aria-label="Quick create"
            className="grid size-9 place-items-center rounded-lg bg-ink text-white hover:bg-ink-2"
          >
            <Icon name="plus" size={17} />
          </button>
        </CreateMenu>
      </div>
      <div className="a-when-collapsed mt-4 flex-col items-center gap-2">
        <Tip label="Search" shortcut="Ctrl K">
          <button
            type="button"
            aria-label="Search"
            onClick={actions.openCommand}
            className="grid size-10 place-items-center rounded-lg text-ink-2 hover:bg-canvas-2"
          >
            <Icon name="search" size={18} />
          </button>
        </Tip>
        <CreateMenu side="right">
          <button
            type="button"
            aria-label="Quick create"
            className="grid size-10 place-items-center rounded-lg bg-ink text-white hover:bg-ink-2"
          >
            <Icon name="plus" size={18} />
          </button>
        </CreateMenu>
      </div>

      {/* The Thread: Today → journey modules → Growth */}
      <nav aria-label="Workspace" className="mt-6 flex-1 overflow-y-auto px-3 pb-3">
        <div className="a-when-expanded flex-col">
          <ul
            className="a-thread-nav flex flex-col gap-1"
            style={{ '--thread-x': '21px' } as CSSProperties}
          >
            {[today, ...journey, growth].map((item) => (
              <li key={item.slug}>
                <ExpandedItem item={item} active={isActive(item.slug)} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-expanded={automateOpen}
            onClick={() => {
              setAutomateOpen((o) => !o);
            }}
            className="mt-6 flex items-center gap-1.5 px-2 pb-1 text-left text-[12.5px] text-ink-3 hover:text-ink"
          >
            <Icon name={automateOpen ? 'chevron-down' : 'chevron-right'} size={13} />
            Automate
          </button>
          {automateOpen ? (
            <ul className="flex flex-col gap-0.5">
              {automate.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/a/${item.slug}`}
                    aria-current={isActive(item.slug) ? 'page' : undefined}
                    className="a-nav-item"
                  >
                    <Icon name={item.icon} size={16} className="text-ink-3" />
                    <span className="flex-1">{MODULES[item.slug].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="a-when-collapsed flex-col items-center">
          <ul
            className="a-thread-nav flex flex-col items-center gap-3"
            style={{ '--thread-x': '23.25px', '--thread-inset': '20px' } as CSSProperties}
          >
            {[today, ...journey, growth].map((item) => (
              <li key={item.slug}>
                <RailItem item={item} active={isActive(item.slug)} />
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="my-4 h-px w-6 bg-line" />
          <ul className="flex flex-col items-center gap-2">
            {automate.map((item) => (
              <li key={item.slug}>
                <Tip label={MODULES[item.slug].label}>
                  <Link
                    href={`/a/${item.slug}`}
                    aria-current={isActive(item.slug) ? 'page' : undefined}
                    aria-label={MODULES[item.slug].label}
                    className="grid size-10 place-items-center rounded-lg text-ink-3 hover:bg-canvas-2 hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink"
                  >
                    <Icon name={item.icon} size={18} />
                  </Link>
                </Tip>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Settings, profile, collapse */}
      <div className="border-t border-line px-3 py-3">
        <div className="a-when-expanded flex-col gap-1">
          <Link
            href="/a/settings"
            aria-current={isActive('settings') ? 'page' : undefined}
            className="a-nav-item"
          >
            <Icon name={settings.icon} size={16} className="text-ink-3" />
            Settings
          </Link>
          <div className="flex items-center gap-1">
            <ProfileMenu>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-canvas-2"
              >
                <MemberAvatar id={VIEWER} size={28} withName />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium leading-tight">
                    {me.name}
                  </span>
                  <span className="block text-[12px] text-ink-3">{me.role}</span>
                </span>
              </button>
            </ProfileMenu>
            <Tip label="Collapse navigation" shortcut="[" side="top">
              <button
                type="button"
                aria-label="Collapse navigation"
                onClick={() => {
                  dispatch({ type: 'toggleCollapsed', concept: 'a' });
                }}
                className="hidden size-9 place-items-center rounded-lg text-ink-3 hover:bg-canvas-2 hover:text-ink lg:grid"
              >
                <Icon name="panel" size={17} />
              </button>
            </Tip>
          </div>
        </div>
        <div className="a-when-collapsed flex-col items-center gap-2">
          <Tip label="Settings">
            <Link
              href="/a/settings"
              aria-label="Settings"
              aria-current={isActive('settings') ? 'page' : undefined}
              className="grid size-10 place-items-center rounded-lg text-ink-3 hover:bg-canvas-2 hover:text-ink"
            >
              <Icon name="settings" size={18} />
            </Link>
          </Tip>
          <ProfileMenu>
            <button
              type="button"
              aria-label={`${me.name}, profile menu`}
              className="rounded-full p-1 hover:bg-canvas-2"
            >
              <MemberAvatar id={VIEWER} size={30} withName />
            </button>
          </ProfileMenu>
          <Tip label="Expand navigation" shortcut="[">
            <button
              type="button"
              aria-label="Expand navigation"
              onClick={() => {
                dispatch({ type: 'toggleCollapsed', concept: 'a' });
              }}
              className="hidden size-10 place-items-center rounded-lg text-ink-3 hover:bg-canvas-2 hover:text-ink lg:grid"
            >
              <Icon name="panel" size={18} />
            </button>
          </Tip>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────── mobile

function titleFor(pathname: string): string {
  const slug = pathname.split('/')[2] ?? 'today';
  return Object.values(MODULES).find((m) => m.slug === slug)?.label ?? 'Today';
}

function MobileTopBarA() {
  const pathname = usePathname();
  const actions = useShellActions();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-canvas/95 px-3 backdrop-blur md:hidden">
      <WorkspaceMenu>
        <button
          type="button"
          aria-label={`${BUSINESS.name} workspace menu`}
          className="rounded-lg p-1"
        >
          <Monogram size={30} />
        </button>
      </WorkspaceMenu>
      <p className="a-title flex-1 truncate text-[17px]">{titleFor(pathname)}</p>
      <button
        type="button"
        aria-label="Search"
        onClick={actions.openCommand}
        className="grid size-11 place-items-center rounded-lg text-ink-2"
      >
        <Icon name="search" size={20} />
      </button>
      <CreateMenu>
        <button
          type="button"
          aria-label="Quick create"
          className="grid size-11 place-items-center rounded-full bg-ink text-white"
        >
          <Icon name="plus" size={20} />
        </button>
      </CreateMenu>
    </header>
  );
}

function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const scope = useConceptScope();
  const isActive = useActive();
  const { state } = useLab();
  const verify = awaitingVerification(state.data).length;
  const items: { slug: ModuleSlug; icon: IconName; hint?: string }[] = [
    {
      slug: 'payments',
      icon: 'payments',
      ...(verify ? { hint: `${verify.toString()} to verify` } : {}),
    },
    { slug: 'growth', icon: 'growth' },
    { slug: 'assistant', icon: 'assistant' },
    { slug: 'automation', icon: 'automation' },
    { slug: 'knowledge', icon: 'knowledge' },
    { slug: 'integrations', icon: 'integrations' },
    { slug: 'settings', icon: 'settings' },
  ];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          {...scope}
          className="lab-overlay fixed inset-0 z-50 bg-[rgb(17_28_45/0.32)]"
        />
        <Dialog.Content
          {...scope}
          aria-describedby={undefined}
          className="lab-sheet fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface px-3 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] text-ink outline-none"
        >
          <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line" />
          <Dialog.Title className="a-title px-3 pb-2 text-[17px]">More</Dialog.Title>
          <ul className="grid gap-0.5">
            {items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/a/${item.slug}`}
                  onClick={() => {
                    onOpenChange(false);
                  }}
                  aria-current={isActive(item.slug) ? 'page' : undefined}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] hover:bg-canvas aria-[current=page]:bg-canvas aria-[current=page]:font-semibold"
                >
                  <Icon name={item.icon} size={20} className="text-ink-3" />
                  <span className="flex-1">{MODULES[item.slug].label}</span>
                  {item.hint ? (
                    <span className="text-[13px] font-medium text-attention">{item.hint}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MobileTabsA() {
  const isActive = useActive();
  const { journey } = useNav();
  const [more, setMore] = useState(false);
  const inbox = journey[0];
  const bookings = journey[2];
  const tabs: { slug: ModuleSlug; icon: IconName; label: string; count?: number }[] = [
    { slug: 'today', icon: 'today', label: 'Today' },
    {
      slug: 'inbox',
      icon: 'inbox',
      label: 'Inbox',
      ...(inbox?.count ? { count: inbox.count } : {}),
    },
    { slug: 'leads', icon: 'leads', label: 'Leads' },
    {
      slug: 'bookings',
      icon: 'bookings',
      label: 'Bookings',
      ...(bookings?.count ? { count: bookings.count } : {}),
    },
  ];
  const moreActive = !tabs.some((t) => isActive(t.slug));
  return (
    <nav
      aria-label="Main"
      className="a-tabbar fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-canvas/97 backdrop-blur md:hidden"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.slug}
          href={`/a/${tab.slug}`}
          aria-current={isActive(tab.slug) ? 'page' : undefined}
          className="a-tab relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-3"
        >
          <span className="relative">
            <Icon name={tab.icon} size={21} />
            {tab.count ? (
              <span
                className="a-rail-badge tnum"
                aria-hidden="true"
                style={{ top: -6, right: -10 }}
              >
                {tab.count}
              </span>
            ) : null}
          </span>
          {tab.label}
          {tab.count ? <span className="sr-only">, {tab.count}</span> : null}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => {
          setMore(true);
        }}
        aria-current={moreActive ? 'page' : undefined}
        className="a-tab relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-3"
      >
        <Icon name="more" size={21} />
        More
      </button>
      <MoreSheet open={more} onOpenChange={setMore} />
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────── shell

export function ShellA({ children }: { children: ReactNode }) {
  return (
    <ShellActionsProvider concept="a">
      <div data-concept="a" className="flex min-h-svh flex-col bg-canvas text-[14px] text-ink">
        <Suspense>
          <LabBar concept="a" />
        </Suspense>
        <nav aria-label="Skip links">
          <a href="#main" className="skip-link">
            Skip to content
          </a>
        </nav>
        <div className="flex flex-1">
          <SidebarA />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileTopBarA />
            <main
              id="main"
              tabIndex={-1}
              className="min-w-0 flex-1 bg-surface pb-24 outline-none md:border-l md:border-line md:pb-0"
            >
              {children}
            </main>
          </div>
        </div>
        <MobileTabsA />
      </div>
    </ShellActionsProvider>
  );
}
