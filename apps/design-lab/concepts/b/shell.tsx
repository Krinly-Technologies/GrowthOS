'use client';

import { Dialog, DropdownMenu, Popover } from 'radix-ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, Suspense, useMemo, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { MemberAvatar } from '@/components/avatar';
import { useConceptScope } from '@/components/concept';
import { Icon, type IconName } from '@/components/icons';
import { LabBar } from '@/components/lab-bar';
import { ShellActionsProvider, useShellActions } from '@/components/shell-actions';
import { Tip } from '@/components/tip';
import { useToast } from '@/components/toast';
import { startOfDay } from '@/lib/clock';
import { MODULES, type ModuleSlug } from '@/lib/modules';
import { ago, inr } from '@/lib/format';
import { appointmentsOn, awaitingVerification, leadsById, needsReply } from '@/lib/selectors';
import { BUSINESS, SOURCES, TEAM, VIEWER } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';

interface NavItem {
  slug: ModuleSlug;
  icon: IconName;
  count?: number;
  countLabel?: string;
}

function useNav(): NavItem[] {
  const { state } = useLab();
  const replies = needsReply(state.data).length;
  const today = appointmentsOn(state.data, state.now).length;
  const verify = awaitingVerification(state.data).length;
  return [
    { slug: 'today', icon: 'today' },
    {
      slug: 'inbox',
      icon: 'inbox',
      count: replies,
      countLabel: `${replies.toString()} waiting for a reply`,
    },
    { slug: 'leads', icon: 'leads' },
    { slug: 'bookings', icon: 'bookings', count: today, countLabel: `${today.toString()} today` },
    {
      slug: 'payments',
      icon: 'payments',
      count: verify,
      countLabel: `${verify.toString()} to verify`,
    },
    { slug: 'growth', icon: 'growth' },
  ];
}

const TOOLS: { slug: ModuleSlug; icon: IconName; blurb: string }[] = [
  { slug: 'assistant', icon: 'assistant', blurb: 'Suggested replies and stages you approve' },
  { slug: 'automation', icon: 'automation', blurb: 'Reminders and follow-ups that run themselves' },
  { slug: 'knowledge', icon: 'knowledge', blurb: 'Services, prices and policies' },
  { slug: 'integrations', icon: 'integrations', blurb: 'WhatsApp, Instagram and lead forms' },
];

function useActive() {
  const pathname = usePathname();
  return (slug: string) => pathname === `/b/${slug}` || pathname.startsWith(`/b/${slug}/`);
}

// ─────────────────────────────────────────────────────────────── brand

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-on-ink">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="8" fill="var(--mint)" />
        <path
          d="M6 18.5c3.5 0 4.5-7 8-7s3 3.5 6 3.5"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="15" r="2.2" fill="var(--ink)" />
      </svg>
      {compact ? (
        <span className="sr-only">Krinly</span>
      ) : (
        <span className="b-heading text-[19px] leading-none">krinly</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────── menus

const menuContent =
  'lab-pop z-50 rounded-2xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_24px_48px_-20px_rgb(17_28_45/0.45)]';
const menuItem =
  'flex cursor-default items-center gap-2.5 rounded-xl px-2.5 py-2 outline-none data-[highlighted]:bg-canvas';

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
          sideOffset={8}
          className={cn(menuContent, 'w-72')}
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <p className="b-heading text-[16px]">{BUSINESS.name}</p>
            <p className="text-[13px] text-ink-3">{BUSINESS.area}</p>
            <p className="mt-2 text-[12px] text-ink-3">
              You are the owner · India Standard Time · Indian rupee
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          {(
            [
              ['Workspace settings', '/b/settings', 'settings'],
              ['Invite your team', '/b/settings', 'leads'],
              ['Integrations', '/b/integrations', 'integrations'],
            ] as const
          ).map(([label, href, icon]) => (
            <DropdownMenu.Item
              key={label}
              onSelect={() => {
                router.push(href);
              }}
              className={menuItem}
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
  align = 'start',
}: {
  children: ReactNode;
  side?: 'bottom' | 'right' | 'top';
  align?: 'start' | 'center';
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
          align={align}
          sideOffset={8}
          className={cn(menuContent, 'w-64')}
        >
          <DropdownMenu.Item onSelect={actions.openNewLead} className={cn(menuItem, 'py-2.5')}>
            <span className="grid size-8 place-items-center rounded-lg bg-mint-soft text-growth">
              <Icon name="user" size={16} />
            </span>
            <span>
              <span className="block font-semibold">New lead</span>
              <span className="block text-[12px] text-ink-3">Someone who called or walked in</span>
            </span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              actions.openRecordPayment();
            }}
            className={cn(menuItem, 'py-2.5')}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-mint-soft text-growth">
              <Icon name="payments" size={16} />
            </span>
            <span>
              <span className="block font-semibold">Record a payment</span>
              <span className="block text-[12px] text-ink-3">Counts once it’s verified</span>
            </span>
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
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          {...scope}
          side="top"
          align="start"
          sideOffset={8}
          className={cn(menuContent, 'w-64')}
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <p className="font-semibold">{me.name}</p>
            <p className="text-[13px] text-ink-3">
              {me.role} · {BUSINESS.name}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item onSelect={actions.openShortcuts} className={menuItem}>
            <Icon name="keyboard" size={16} className="text-ink-3" />
            <span className="flex-1">Keyboard shortcuts</span>
            <kbd className="text-xs text-ink-3">?</kbd>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              dispatch({ type: 'reset' });
              notify({ title: 'Sample data reset' });
            }}
            className={menuItem}
          >
            <Icon name="undo" size={16} className="text-ink-3" />
            Reset sample data
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              router.push('/');
            }}
            className={menuItem}
          >
            <Icon name="exit" size={16} className="text-ink-3" />
            Leave the prototype
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ToolsPanel({ children, side = 'right' }: { children: ReactNode; side?: 'right' | 'top' }) {
  const scope = useConceptScope();
  const isActive = useActive();
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          {...scope}
          side={side}
          align="start"
          sideOffset={10}
          className={cn(menuContent, 'w-80 p-2')}
        >
          <p className="px-2.5 pt-1.5 pb-2 text-[12px] font-semibold text-ink-3">Studio tools</p>
          <ul className="grid gap-0.5">
            {TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Popover.Close asChild>
                  <Link
                    href={`/b/${tool.slug}`}
                    aria-current={isActive(tool.slug) ? 'page' : undefined}
                    className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-canvas aria-[current=page]:bg-mint-soft"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-mint">
                      <Icon name={tool.icon} size={17} />
                    </span>
                    <span>
                      <span className="block font-semibold">{MODULES[tool.slug].label}</span>
                      <span className="block text-[12.5px] text-ink-3">{tool.blurb}</span>
                    </span>
                  </Link>
                </Popover.Close>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Notifications() {
  const scope = useConceptScope();
  const { state } = useLab();
  const router = useRouter();
  const events = useMemo(() => {
    const byId = leadsById(state.data);
    const since = startOfDay(state.now) - 18 * 3600_000;
    return state.data.activities
      .filter(
        (a) =>
          a.at >= since &&
          (a.kind === 'enquiry' ||
            (a.kind === 'message_in' && a.by === 'customer') ||
            (a.kind === 'payment' && a.text.startsWith('Verified')) ||
            (a.kind === 'stage' && a.to === 'ready')),
      )
      .slice(0, 7)
      .map((a) => ({ activity: a, lead: byId.get(a.leadId) }));
  }, [state.data, state.now]);
  const today = events.filter((e) => e.activity.at >= startOfDay(state.now)).length;

  return (
    <Popover.Root>
      <Popover.Trigger
        className="relative grid size-10 place-items-center rounded-full bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line)] hover:text-ink"
        aria-label={`Notifications, ${today.toString()} new today`}
      >
        <Icon name="bell" size={18} />
        {today > 0 ? (
          <span className="tnum absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10.5px] font-bold text-mint">
            {today}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          {...scope}
          align="end"
          sideOffset={8}
          className={cn(menuContent, 'w-[min(360px,calc(100vw-2rem))] p-2')}
        >
          <p className="b-heading px-2.5 pt-1.5 pb-2 text-[15px]">What happened</p>
          <ul className="grid">
            {events.map(({ activity, lead }) => {
              const who = lead ? (lead.latinName ?? lead.name) : 'Someone';
              const text =
                activity.kind === 'payment'
                  ? `${inr(activity.amount ?? 0)} verified from ${who}`
                  : activity.kind === 'stage'
                    ? `${who} is ready to book`
                    : activity.kind === 'enquiry'
                      ? `New enquiry from ${who}${lead ? ` · ${SOURCES[lead.source].label}` : ''}`
                      : `${who} replied`;
              return (
                <li key={activity.id}>
                  <Popover.Close asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (lead) router.push(`/b/leads?lead=${lead.id}`);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-canvas"
                    >
                      <span
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          activity.at >= startOfDay(state.now) ? 'bg-growth' : 'bg-line',
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13.5px] text-ink">{text}</span>
                        <span className="block text-[12px] text-ink-3">
                          {ago(activity.at, state.now)}
                        </span>
                      </span>
                    </button>
                  </Popover.Close>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ─────────────────────────────────────────────────────────────── rail

function RailB() {
  const { state, dispatch } = useLab();
  const isActive = useActive();
  const nav = useNav();
  const collapsed = state.collapsed.b;
  const me = TEAM[VIEWER];
  const toolsActive = TOOLS.some((t) => isActive(t.slug));

  return (
    <aside
      aria-label="Main navigation"
      data-collapsed={collapsed ? 'true' : 'false'}
      className="b-rail on-ink sticky top-0 hidden h-svh shrink-0 flex-col px-3 pt-4 pb-3 text-on-ink md:flex"
    >
      <div className="b-when-expanded items-center justify-between px-1.5">
        <Wordmark />
        <Tip label="Collapse navigation" shortcut="[" side="bottom">
          <button
            type="button"
            aria-label="Collapse navigation"
            onClick={() => {
              dispatch({ type: 'toggleCollapsed', concept: 'b' });
            }}
            className="hidden size-8 place-items-center rounded-lg text-on-ink-2 hover:bg-ink-raised hover:text-on-ink lg:grid"
          >
            <Icon name="panel" size={17} />
          </button>
        </Tip>
      </div>
      <div className="b-when-collapsed justify-center">
        <Wordmark compact />
      </div>

      <WorkspaceMenu>
        <button
          type="button"
          className="b-when-expanded mt-5 items-center gap-2.5 rounded-xl bg-ink-raised px-3 py-2.5 text-left hover:bg-[#23334d]"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold">{BUSINESS.name}</span>
            <span className="block truncate text-[12px] text-on-ink-2">Jayanagar · {me.role}</span>
          </span>
          <Icon name="chevron-down" size={15} className="text-on-ink-2" />
        </button>
      </WorkspaceMenu>
      <div className="b-when-collapsed mt-5 justify-center">
        <WorkspaceMenu>
          <button
            type="button"
            aria-label={`${BUSINESS.name} workspace menu`}
            className="b-display grid size-11 place-items-center rounded-xl bg-ink-raised text-[17px] text-on-ink hover:bg-[#23334d]"
          >
            {BUSINESS.monogram}
          </button>
        </WorkspaceMenu>
      </div>

      <CreateMenu side="right">
        <button
          type="button"
          className="b-when-expanded mt-3 h-11 items-center justify-center gap-2 rounded-xl bg-mint text-[14px] font-bold text-ink hover:bg-[#93dcae]"
        >
          <Icon name="plus" size={18} />
          Create
        </button>
      </CreateMenu>
      <div className="b-when-collapsed mt-3 justify-center">
        <CreateMenu side="right">
          <button
            type="button"
            aria-label="Create"
            className="grid size-11 place-items-center rounded-xl bg-mint text-ink hover:bg-[#93dcae]"
          >
            <Icon name="plus" size={20} />
          </button>
        </CreateMenu>
      </div>

      <nav aria-label="Workspace" className="mt-6 flex-1 overflow-y-auto">
        <ul className="b-when-expanded flex-col gap-1">
          {nav.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/b/${item.slug}`}
                aria-current={isActive(item.slug) ? 'page' : undefined}
                className="b-nav-item"
              >
                <Icon name={item.icon} size={18} />
                {MODULES[item.slug].label}
                {item.count ? (
                  <span className="b-nav-count tnum" aria-hidden="true">
                    {item.count}
                  </span>
                ) : null}
                {item.count ? <span className="sr-only">, {item.countLabel}</span> : null}
              </Link>
            </li>
          ))}
          <li className="mt-2">
            <ToolsPanel>
              <button
                type="button"
                aria-current={toolsActive ? 'page' : undefined}
                className="b-nav-item w-full"
              >
                <Icon name="layers" size={18} />
                More tools
                <Icon name="chevron-right" size={15} className="ml-auto" />
              </button>
            </ToolsPanel>
          </li>
        </ul>
        <ul className="b-when-collapsed flex-col items-center gap-1.5">
          {nav.map((item) => (
            <li key={item.slug}>
              <Tip
                label={
                  item.count
                    ? `${MODULES[item.slug].label} · ${item.countLabel ?? ''}`
                    : MODULES[item.slug].label
                }
              >
                <Link
                  href={`/b/${item.slug}`}
                  aria-current={isActive(item.slug) ? 'page' : undefined}
                  aria-label={
                    item.count
                      ? `${MODULES[item.slug].label}, ${item.countLabel ?? ''}`
                      : MODULES[item.slug].label
                  }
                  className="b-rail-icon"
                >
                  <Icon name={item.icon} size={20} />
                  {item.count ? <span className="b-rail-dot" aria-hidden="true" /> : null}
                </Link>
              </Tip>
            </li>
          ))}
          <li className="mt-2">
            <ToolsPanel>
              <button
                type="button"
                aria-label="More tools"
                aria-current={toolsActive ? 'page' : undefined}
                className="b-rail-icon"
              >
                <Icon name="layers" size={20} />
              </button>
            </ToolsPanel>
          </li>
        </ul>
      </nav>

      <div className="b-when-expanded flex-col gap-1 border-t border-ink-line pt-3">
        <Link
          href="/b/settings"
          aria-current={isActive('settings') ? 'page' : undefined}
          className="b-nav-item"
        >
          <Icon name="settings" size={18} />
          Settings
        </Link>
        <ProfileMenu>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-ink-raised"
          >
            <MemberAvatar id={VIEWER} size={30} withName />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold">{me.name}</span>
              <span className="block text-[12px] text-on-ink-2">{me.role}</span>
            </span>
          </button>
        </ProfileMenu>
      </div>
      <div className="b-when-collapsed flex-col items-center gap-1.5 border-t border-ink-line pt-3">
        <Tip label="Settings">
          <Link
            href="/b/settings"
            aria-label="Settings"
            aria-current={isActive('settings') ? 'page' : undefined}
            className="b-rail-icon"
          >
            <Icon name="settings" size={20} />
          </Link>
        </Tip>
        <ProfileMenu>
          <button
            type="button"
            aria-label={`${me.name}, profile menu`}
            className="rounded-full p-1 hover:bg-ink-raised"
          >
            <MemberAvatar id={VIEWER} size={32} withName />
          </button>
        </ProfileMenu>
        <Tip label="Expand navigation" shortcut="[">
          <button
            type="button"
            aria-label="Expand navigation"
            onClick={() => {
              dispatch({ type: 'toggleCollapsed', concept: 'b' });
            }}
            className="hidden size-10 place-items-center rounded-xl text-on-ink-2 hover:bg-ink-raised hover:text-on-ink lg:grid"
          >
            <Icon name="panel" size={18} />
          </button>
        </Tip>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────── top bar & mobile

function TopBarB() {
  const actions = useShellActions();
  return (
    <div className="hidden items-center gap-3 px-6 pt-5 md:flex lg:px-8">
      <button
        type="button"
        onClick={actions.openCommand}
        className="flex h-11 w-full max-w-[460px] items-center gap-3 rounded-full bg-surface px-4 text-[14px] text-ink-3 shadow-[0_0_0_1px_var(--line)] hover:text-ink"
      >
        <Icon name="search" size={17} />
        <span className="flex-1 text-left">Search leads, pages and actions</span>
        <kbd className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">
          Ctrl K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Notifications />
      </div>
    </div>
  );
}

function titleFor(pathname: string): string {
  const slug = pathname.split('/')[2] ?? 'today';
  return Object.values(MODULES).find((m) => m.slug === slug)?.label ?? 'Today';
}

function MobileTopBarB() {
  const pathname = usePathname();
  const actions = useShellActions();
  return (
    <header className="on-ink sticky top-0 z-30 flex h-14 items-center gap-1 bg-[var(--backdrop)] px-3 text-on-ink md:hidden">
      <WorkspaceMenu>
        <button
          type="button"
          aria-label={`${BUSINESS.name} workspace menu`}
          className="flex items-center gap-2 rounded-xl px-1.5 py-1"
        >
          <Wordmark compact />
          <span className="b-heading text-[17px]">{titleFor(pathname)}</span>
          <Icon name="chevron-down" size={15} className="text-on-ink-2" />
        </button>
      </WorkspaceMenu>
      <span className="flex-1" />
      <button
        type="button"
        aria-label="Search"
        onClick={actions.openCommand}
        className="grid size-11 place-items-center rounded-full text-on-ink"
      >
        <Icon name="search" size={20} />
      </button>
      <div className="[&_button]:bg-ink-raised [&_button]:text-on-ink [&_button]:shadow-none">
        <Notifications />
      </div>
    </header>
  );
}

function MobileNavB() {
  const isActive = useActive();
  const [more, setMore] = useState(false);
  const scope = useConceptScope();
  const nav = useNav();
  const inbox = nav.find((n) => n.slug === 'inbox');
  const tab = (slug: ModuleSlug, icon: IconName, label: string, count?: number) => (
    <Link
      href={`/b/${slug}`}
      aria-current={isActive(slug) ? 'page' : undefined}
      className="relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink-3 aria-[current=page]:text-ink"
    >
      <span className="relative">
        <Icon name={icon} size={22} />
        {count ? (
          <span className="tnum absolute -top-1.5 -right-2.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-mint">
            {count}
          </span>
        ) : null}
      </span>
      {label}
      {count ? <span className="sr-only">, {count}</span> : null}
    </Link>
  );
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tab('today', 'today', 'Today')}
      {tab('leads', 'leads', 'Leads')}
      <div className="flex justify-center">
        <CreateMenu side="top" align="center">
          <button
            type="button"
            aria-label="Create"
            className="-mt-7 grid size-14 place-items-center rounded-full bg-mint text-ink shadow-[0_10px_24px_-8px_rgb(17_28_45/0.45)] ring-4 ring-surface"
          >
            <Icon name="plus" size={24} />
          </button>
        </CreateMenu>
      </div>
      {tab('inbox', 'inbox', 'Inbox', inbox?.count)}
      <button
        type="button"
        onClick={() => {
          setMore(true);
        }}
        className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink-3"
      >
        <Icon name="more" size={22} />
        More
      </button>
      <Dialog.Root open={more} onOpenChange={setMore}>
        <Dialog.Portal>
          <Dialog.Overlay
            {...scope}
            className="lab-overlay fixed inset-0 z-50 bg-[rgb(17_28_45/0.4)]"
          />
          <Dialog.Content
            {...scope}
            aria-describedby={undefined}
            className="lab-sheet on-ink fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] bg-[var(--backdrop)] px-3 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] text-on-ink outline-none"
          >
            <span
              aria-hidden="true"
              className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ink-line"
            />
            <Dialog.Title className="b-heading px-3 pb-2 text-[18px]">More</Dialog.Title>
            <ul className="grid grid-cols-2 gap-2">
              {(
                [
                  ['bookings', 'bookings'],
                  ['payments', 'payments'],
                  ['growth', 'growth'],
                  ...TOOLS.map((t) => [t.slug, t.icon] as const),
                  ['settings', 'settings'],
                ] as const
              ).map(([slug, icon]) => (
                <li key={slug}>
                  <Link
                    href={`/b/${slug}`}
                    onClick={() => {
                      setMore(false);
                    }}
                    aria-current={isActive(slug) ? 'page' : undefined}
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink-raised px-3.5 text-[14.5px] font-semibold aria-[current=page]:bg-mint aria-[current=page]:text-ink"
                  >
                    <Icon name={icon} size={19} />
                    {MODULES[slug].label}
                  </Link>
                </li>
              ))}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────── shell

export function ShellB({ children }: { children: ReactNode }) {
  return (
    <ShellActionsProvider concept="b">
      <div
        data-concept="b"
        className="flex min-h-svh flex-col bg-[var(--backdrop)] text-[14px] text-ink"
      >
        <Suspense>
          <LabBar concept="b" />
        </Suspense>
        <nav aria-label="Skip links">
          <a href="#main" className="skip-link">
            Skip to content
          </a>
        </nav>
        <div className="flex flex-1">
          <RailB />
          <div className="flex min-w-0 flex-1 flex-col md:py-2.5 md:pr-2.5">
            <MobileTopBarB />
            <div className="b-sheet flex min-w-0 flex-1 flex-col rounded-t-[22px] bg-canvas md:rounded-[22px]">
              <TopBarB />
              <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-24 outline-none md:pb-6">
                {children}
              </main>
            </div>
          </div>
        </div>
        <MobileNavB />
      </div>
    </ShellActionsProvider>
  );
}
