'use client';

import { Avatar, AvatarGroup } from '@krinly/ui/components/avatar';
import { Badge, StatusIndicator } from '@krinly/ui/components/badge';
import { Button, IconButton } from '@krinly/ui/components/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@krinly/ui/components/card';
import { EmptyState, ErrorState, Kbd, Skeleton, SkipLink } from '@krinly/ui/components/feedback';
import { Choice, Field } from '@krinly/ui/components/field';
import { Icon, type IconName } from '@krinly/ui/components/icon';
import { Input, InputGroup, SearchField, Select, Textarea } from '@krinly/ui/components/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipProvider,
} from '@krinly/ui/components/overlay';
import {
  ListRow,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@krinly/ui/components/table';
import {
  SegmentedControl,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@krinly/ui/components/tabs';
import { ToastProvider, useToast } from '@krinly/ui/components/toast';
import { formatINR, formatINRCompact } from '@krinly/ui/lib/format';
import { Money } from '@krinly/ui/patterns/money';
import { useEffect, useState } from 'react';
import { Section, Specimen } from './parts';
import { PatternsDemo } from './patterns-demo';
import { SheetDemo } from './sheet-demo';

type Theme = 'light' | 'dark';

export function Showcase({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    // On <html> so portalled overlays (dialogs, menus, toasts) follow the theme too.
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ToastProvider>
      <TooltipProvider delayDuration={300}>
        <SkipLink />
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <h1 className="font-display text-lg font-semibold">Krinly design system</h1>
              <p className="text-xs text-ink-3">
                @krinly/ui · development-only showcase · fictional sample data
              </p>
            </div>
            <SegmentedControl
              label="Theme"
              value={theme}
              onValueChange={setTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
          <nav
            aria-label="Sections"
            className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2 sm:px-6"
          >
            <ul className="flex gap-4 text-[13px] font-semibold whitespace-nowrap text-ink-2">
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="hover:text-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-14 px-4 py-10 outline-none sm:px-6"
        >
          <Foundations />
          <Components />
          <PatternsDemo />
        </main>
      </TooltipProvider>
    </ToastProvider>
  );
}

const SECTIONS = [
  ['foundations', 'Foundations'],
  ['actions', 'Actions'],
  ['inputs', 'Inputs'],
  ['navigation', 'Tabs'],
  ['status', 'Status'],
  ['surfaces', 'Surfaces'],
  ['overlays', 'Overlays'],
  ['data', 'Tables'],
  ['states', 'States'],
  ['patterns', 'Patterns'],
  ['charts', 'Charts'],
  ['records', 'Records'],
] as const;

/* ── Foundations ───────────────────────────────────────────────────────── */

const SWATCHES: [string, string][] = [
  ['brand', 'Navy shell'],
  ['accent', 'Mint · brand action'],
  ['accent-strong', 'Growth green'],
  ['canvas', 'Canvas'],
  ['surface', 'Surface'],
  ['line', 'Line'],
  ['ink', 'Ink'],
  ['ink-2', 'Ink 2'],
  ['ink-3', 'Ink 3'],
  ['verified', 'Verified'],
  ['attention', 'Attention'],
  ['critical', 'Critical'],
  ['info', 'Info'],
  ['step-1', 'Ramp 1'],
  ['step-2', 'Ramp 2'],
  ['step-3', 'Ramp 3'],
  ['step-4', 'Ramp 4'],
  ['lost', 'Lost'],
];

const ICONS: IconName[] = [
  'today',
  'inbox',
  'leads',
  'bookings',
  'payments',
  'growth',
  'assistant',
  'automation',
  'knowledge',
  'settings',
  'integrations',
  'search',
  'plus',
  'filter',
  'list',
  'board',
  'phone',
  'note',
  'message',
  'clock',
  'calendar',
  'bell',
  'undo',
  'seal',
  'alert',
  'info',
  'check',
  'close',
  'more',
  'arrow-up',
  'arrow-down',
  'arrow-right',
  'user',
  'layers',
  'grip',
];

function Foundations() {
  return (
    <Section
      id="foundations"
      title="Foundations"
      intro="Semantic tokens only — components never hard-code colours. Brand colours (navy, mint, green) never mean status; status always pairs colour with an icon or words."
    >
      <Specimen label="Colour">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SWATCHES.map(([token, label]) => (
            <li key={token} className="min-w-0">
              <span
                className="block h-12 rounded-lg shadow-ring"
                style={{ background: `var(--${token})` }}
              />
              <span className="mt-1.5 block truncate text-[13px] font-semibold">{label}</span>
              <code className="block truncate text-[11.5px] text-ink-3">--{token}</code>
            </li>
          ))}
        </ul>
      </Specimen>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Specimen label="Type">
          <div className="grid gap-3">
            <p className="display-figure text-[56px] leading-none">{formatINR(301000)}</p>
            <p className="font-display text-2xl font-semibold">Display · Bricolage Grotesque</p>
            <p className="text-[15px]">Body · Manrope 15/14px — readable at small sizes.</p>
            <p className="text-[13px] text-ink-3">
              Supporting · 13px · ink-3 on surface passes AA.
            </p>
            <p className="text-[15px]">अनन्या मिश्रा · செல்வி ராஜன் — Indic names fall back to Noto.</p>
          </div>
        </Specimen>
        <Specimen label="Numbers · Indian formatting · tabular figures">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead numeric>Exact</TableHead>
                <TableHead numeric>Compact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1250.5, 89000, 301000, 1234567, 25000000].map((n) => (
                <TableRow key={n}>
                  <TableCell className="text-ink-3">{n}</TableCell>
                  <TableCell numeric>
                    <Money amount={n} paise={n % 1 !== 0} />
                  </TableCell>
                  <TableCell numeric>{formatINRCompact(n)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Specimen>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Specimen label="Radius">
          <div className="flex flex-wrap items-end gap-3">
            {[
              'rounded-sm',
              'rounded-md',
              'rounded-lg',
              'rounded-xl',
              'rounded-2xl',
              'rounded-full',
            ].map((r) => (
              <span key={r} className="grid gap-1 text-center text-[11px] text-ink-3">
                <span className={`block size-12 bg-canvas-2 shadow-ring ${r}`} />
                {r.replace('rounded-', '')}
              </span>
            ))}
          </div>
        </Specimen>
        <Specimen label="Elevation">
          <div className="flex flex-wrap gap-3">
            {['shadow-ring', 'shadow-card', 'shadow-raised', 'shadow-floating'].map((s) => (
              <span
                key={s}
                className={`grid size-16 place-items-center rounded-xl bg-surface text-[11px] text-ink-3 ${s}`}
              >
                {s.replace('shadow-', '')}
              </span>
            ))}
          </div>
        </Specimen>
        <Specimen label="Spacing (4px base)">
          <div className="grid gap-1.5">
            {[1, 2, 3, 4, 6, 8, 12].map((n) => (
              <span key={n} className="flex items-center gap-2 text-[11.5px] text-ink-3">
                <span className="tnum w-6">{n}</span>
                <span className="h-2.5 rounded-sm bg-accent-strong" style={{ width: n * 4 }} />
                {n * 4}px
              </span>
            ))}
          </div>
        </Specimen>
      </div>
      <Specimen label="Icons · 24px grid · 1.5px stroke">
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-9 lg:grid-cols-12">
          {ICONS.map((name) => (
            <li key={name} className="grid place-items-center gap-1 rounded-lg py-2 text-ink-2">
              <Icon name={name} size={20} />
              <span className="max-w-full truncate text-[10.5px] text-ink-3">{name}</span>
            </li>
          ))}
        </ul>
      </Specimen>
      <Specimen label="Focus · motion · breakpoints">
        <ul className="grid gap-2 text-sm text-ink-2 sm:grid-cols-3">
          <li>
            <Button variant="outline">Tab to me</Button>
            <p className="mt-2 text-[13px] text-ink-3">
              2px green ring, 2px offset, on every interactive element.
            </p>
          </li>
          <li className="text-[13px] text-ink-3">
            Motion: 140 / 200 / 320ms with one ease-out curve. Under “reduce motion” everything is
            instant.
          </li>
          <li className="text-[13px] text-ink-3">
            Breakpoints: Tailwind defaults — 640 (sheet → full-screen), 768, 1024 (rail + table),
            1280.
          </li>
        </ul>
      </Specimen>
    </Section>
  );
}

/* ── Components ────────────────────────────────────────────────────────── */

function Components() {
  const [view, setView] = useState<'list' | 'board'>('list');
  const [range, setRange] = useState('month');
  const [page, setPage] = useState(1);
  return (
    <>
      <Section
        id="actions"
        title="Actions"
        intro="One primary action per area. Mint is the brand action; navy is the default primary on light surfaces."
      >
        <Specimen label="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button variant="brand">
              <Icon name="plus" />
              Create
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Delete</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" shape="pill">
              Small pill
            </Button>
            <Button shape="pill" variant="outline">
              Pill
            </Button>
            <Button size="lg" variant="brand" shape="pill">
              Large pill
            </Button>
            <IconButton label="Search" variant="outline" shape="pill">
              <Icon name="search" />
            </IconButton>
            <Tooltip content="More actions">
              <IconButton label="More actions" variant="ghost" size="icon-sm">
                <Icon name="more" />
              </IconButton>
            </Tooltip>
          </div>
          <div className="on-brand mt-4 flex flex-wrap gap-2 rounded-xl bg-brand p-3">
            <Button variant="brand" shape="pill">
              On navy
            </Button>
            <Button variant="on-brand" shape="pill">
              Quiet on navy
            </Button>
          </div>
        </Specimen>
      </Section>

      <Section
        id="inputs"
        title="Inputs"
        intro="Native controls styled; Field wires label, hint and error for assistive tech."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Specimen label="Fields">
            <div className="grid gap-4">
              <Field label="Customer name" hint="As they’d like to be addressed.">
                <Input placeholder="e.g. Asha Menon" />
              </Field>
              <Field label="Phone" error="Enter a 10-digit mobile number.">
                <InputGroup prefix="+91" inputMode="tel" defaultValue="98450" />
              </Field>
              <Field label="Advance received">
                <InputGroup prefix="₹" inputMode="numeric" placeholder="0" className="tnum" />
              </Field>
              <Field label="Source">
                <Select defaultValue="search">
                  <option value="ads">Instagram ads</option>
                  <option value="search">Google search</option>
                  <option value="referral">Referral</option>
                </Select>
              </Field>
              <Field label="Note">
                <Textarea placeholder="What did they ask about?" />
              </Field>
            </div>
          </Specimen>
          <Specimen label="Search · choices">
            <div className="grid gap-4">
              <SearchField
                label="Search leads"
                placeholder="Search name, phone or note"
                shortcut="/"
              />
              <fieldset className="grid gap-1">
                <legend className="mb-1 text-sm font-medium">Notify me about</legend>
                <Choice label="New enquiries" description="As they arrive" defaultChecked />
                <Choice label="Payments to verify" defaultChecked />
                <Choice label="Weekly summary" disabled />
              </fieldset>
              <fieldset className="grid gap-1">
                <legend className="mb-1 text-sm font-medium">Owner</legend>
                <Choice type="radio" name="owner" label="Me" defaultChecked />
                <Choice type="radio" name="owner" label="Anyone on the team" />
              </fieldset>
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="navigation"
        title="Tabs & segmented controls"
        intro="Tabs switch between different content; a segmented control switches the view of the same content."
      >
        <Specimen label="Tabs">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="pt-3 text-sm text-ink-2">
              Activity panel.
            </TabsContent>
            <TabsContent value="details" className="pt-3 text-sm text-ink-2">
              Details panel.
            </TabsContent>
            <TabsContent value="payments" className="pt-3 text-sm text-ink-2">
              Payments panel.
            </TabsContent>
          </Tabs>
        </Specimen>
        <Specimen label="Segmented control">
          <div className="flex flex-wrap gap-3">
            <SegmentedControl
              label="View"
              value={view}
              onValueChange={setView}
              options={[
                {
                  value: 'list',
                  label: (
                    <>
                      <Icon name="list" />
                      List
                    </>
                  ),
                },
                {
                  value: 'board',
                  label: (
                    <>
                      <Icon name="board" />
                      Pipeline
                    </>
                  ),
                },
              ]}
            />
            <SegmentedControl
              label="Date range"
              value={range}
              onValueChange={setRange}
              options={[
                { value: 'today', label: 'Today' },
                { value: '7d', label: '7 days' },
                { value: 'month', label: 'This month' },
                { value: 'last', label: 'Last month' },
              ]}
            />
          </div>
        </Specimen>
      </Section>

      <Section id="status" title="Badges & status">
        <Specimen label="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="verified">
              <Icon name="seal" />
              Verified
            </Badge>
            <Badge tone="attention">Needs reply</Badge>
            <Badge tone="critical">Overdue</Badge>
            <Badge tone="info">New</Badge>
            <Badge tone="brand">Mint</Badge>
            <Badge tone="outline">Outline</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <StatusIndicator tone="verified">Confirmed</StatusIndicator>
            <StatusIndicator tone="attention">Waiting on customer</StatusIndicator>
            <StatusIndicator tone="critical">Payment failed</StatusIndicator>
            <StatusIndicator>Draft</StatusIndicator>
          </div>
        </Specimen>
        <Specimen label="Avatars">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="Asha Menon" size={40} decorative={false} />
            <Avatar name="अनन्या मिश्रा" size={32} decorative={false} />
            <Avatar name="செல்வி ராஜன்" size={28} decorative={false} />
            <AvatarGroup
              label="6 people: Asha, Rahul, Ananya, Selvi, Imran and Neha"
              people={[
                { name: 'Asha Menon' },
                { name: 'Rahul Verma' },
                { name: 'अनन्या मिश्रा' },
                { name: 'செல்வி ராஜன்' },
                { name: 'Imran Shaikh' },
                { name: 'Neha Kulkarni' },
              ]}
            />
          </div>
        </Specimen>
      </Section>

      <Section
        id="surfaces"
        title="Cards & surfaces"
        intro="Navy shell → canvas → surface. One surface per section; no cards inside cards."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Surface</CardTitle>
              <CardDescription>Default section container.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="raised">
            <CardHeader>
              <CardTitle>Raised</CardTitle>
              <CardDescription>Floats above the canvas.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="brand">
            <CardHeader>
              <CardTitle>Brand</CardTitle>
              <p className="text-sm text-on-brand-2">Hero panels on navy.</p>
            </CardHeader>
          </Card>
          <Card variant="inset">
            <CardHeader>
              <CardTitle>Inset</CardTitle>
              <CardDescription>Quiet grouping on a surface.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Section>

      <Overlays />

      <Section
        id="data"
        title="Tables, lists & pagination"
        intro="A real table on desktop; the same rows as a list below 1024px."
      >
        <Card padding="none" className="overflow-hidden">
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Customer</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead numeric className="pr-5">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="pl-5">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={r.name} size={28} />
                        <span className="truncate font-semibold">{r.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-2">{r.source}</TableCell>
                    <TableCell>
                      <StatusIndicator tone={r.tone}>{r.status}</StatusIndicator>
                    </TableCell>
                    <TableCell numeric className="pr-5">
                      <Money amount={r.value} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-y divide-line-soft lg:hidden">
            {ROWS.map((r) => (
              <li key={r.name}>
                <ListRow
                  leading={<Avatar name={r.name} size={32} />}
                  title={r.name}
                  subtitle={`${r.source} · ${r.status}`}
                  trailing={<Money amount={r.value} className="text-sm font-semibold" />}
                />
              </li>
            ))}
          </ul>
          <Pagination
            className="border-t border-line px-5 py-3"
            page={page}
            pageSize={4}
            total={23}
            onPageChange={setPage}
          />
        </Card>
      </Section>

      <Section id="states" title="Loading, empty & error states">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Specimen label="Skeleton">
            <div className="grid gap-3" role="status" aria-label="Loading leads">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="grid flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen label="Empty">
            <EmptyState
              icon="leads"
              title="No leads match these filters"
              description="Try clearing a filter, or add a lead you met offline."
              action={
                <Button variant="outline" size="sm" shape="pill">
                  Clear filters
                </Button>
              }
            />
          </Specimen>
          <Specimen label="Error">
            <ErrorState
              description="Leads didn’t load. Your data is safe — try again."
              reference="req_8f2a91c4"
              action={
                <Button variant="outline" size="sm" shape="pill">
                  Try again
                </Button>
              }
            />
          </Specimen>
        </div>
      </Section>
    </>
  );
}

const ROWS = [
  {
    name: 'Asha Menon',
    source: 'Instagram ads',
    status: 'Ready to book',
    tone: 'verified',
    value: 85000,
  },
  {
    name: 'अनन्या मिश्रा',
    source: 'Referral',
    status: 'Waiting for reply',
    tone: 'attention',
    value: 120000,
  },
  {
    name: 'Imran Shaikh',
    source: 'Google search',
    status: 'Follow-up overdue',
    tone: 'critical',
    value: 42000,
  },
  {
    name: 'Neha Kulkarni with a very long display name for truncation',
    source: 'Walk-in',
    status: 'New',
    tone: 'neutral',
    value: 18500,
  },
] as const;

/* ── Overlays ──────────────────────────────────────────────────────────── */

function Overlays() {
  const toast = useToast();
  const [stage, setStage] = useState('Interested');
  const [owner, setOwner] = useState('me');
  return (
    <Section
      id="overlays"
      title="Dialogs, sheets, menus & toasts"
      intro="Toasts raised inside a dialog render inside it, so Undo is reachable by keyboard and announced while the dialog is open."
    >
      <Specimen label="Overlays">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" shape="pill">
                Open dialog
              </Button>
            </DialogTrigger>
            <DialogContent
              title="Move to a new stage"
              description={`Currently: ${stage}. You can undo this from the confirmation.`}
              footer={
                <DialogClose asChild>
                  <Button variant="ghost" shape="pill">
                    Done
                  </Button>
                </DialogClose>
              }
            >
              <div className="flex flex-wrap gap-2">
                {['Contacted', 'Interested', 'Ready'].map((next) => (
                  <Button
                    key={next}
                    variant={next === stage ? 'default' : 'outline'}
                    shape="pill"
                    size="sm"
                    data-testid={`stage-${next}`}
                    onClick={() => {
                      const before = stage;
                      setStage(next);
                      toast({
                        title: `Moved to ${next}`,
                        action: {
                          label: 'Undo',
                          onClick: () => {
                            setStage(before);
                          },
                        },
                      });
                    }}
                  >
                    {next}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <SheetDemo />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" shape="pill">
                <Icon name="filter" />
                Popover
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <p className="font-semibold">Why is this lead here?</p>
              <p className="mt-1 text-ink-3">
                Replied within 48 hours and the event is within 90 days.
              </p>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" shape="pill">
                Menu
                <Icon name="chevron-down" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Owner</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={owner} onValueChange={setOwner}>
                <DropdownMenuRadioItem value="me">Me</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="team">Anyone</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Icon name="phone" size={16} />
                Log a call
              </DropdownMenuItem>
              <DropdownMenuItem tone="critical">
                <Icon name="close" size={16} />
                Mark as lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            shape="pill"
            onClick={() => {
              toast({ title: 'Note added', description: 'Visible to your team.' });
            }}
          >
            Show toast
          </Button>
          <Button
            variant="outline"
            shape="pill"
            onClick={() => {
              toast({
                tone: 'critical',
                title: 'Couldn’t save',
                description: 'Check your connection and try again.',
              });
            }}
          >
            Error toast
          </Button>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">
          Keyboard: <Kbd>Tab</Kbd> moves, <Kbd>Esc</Kbd> closes the top layer, focus returns to the
          opener. Stage now: <span className="font-semibold text-ink">{stage}</span>
        </p>
      </Specimen>
    </Section>
  );
}
