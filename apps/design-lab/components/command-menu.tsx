'use client';

import { Dialog } from 'radix-ui';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { STAGE_LABEL } from '@/lib/domain';
import { MODULES, type ModuleSlug } from '@/lib/modules';
import { needsReply, readyToBook } from '@/lib/selectors';
import { SERVICES } from '@/lib/sample/scenario';
import { type Concept, useLab } from '@/lib/store';
import { useConceptScope } from './concept';
import { Icon, type IconName } from './icons';

export type CommandAction = 'new-lead' | 'record-payment' | 'toggle-nav' | 'shortcuts';

interface Item {
  id: string;
  group: 'Leads' | 'Go to' | 'Actions';
  label: string;
  hint?: string;
  keywords: string;
  icon: IconName;
  run: () => void;
}

const NAV: { slug: ModuleSlug; icon: IconName }[] = [
  { slug: 'today', icon: 'today' },
  { slug: 'inbox', icon: 'inbox' },
  { slug: 'leads', icon: 'leads' },
  { slug: 'bookings', icon: 'bookings' },
  { slug: 'payments', icon: 'payments' },
  { slug: 'growth', icon: 'growth' },
  { slug: 'assistant', icon: 'assistant' },
  { slug: 'automation', icon: 'automation' },
  { slug: 'knowledge', icon: 'knowledge' },
  { slug: 'integrations', icon: 'integrations' },
  { slug: 'settings', icon: 'settings' },
];

export function CommandMenu({
  open,
  onOpenChange,
  concept,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concept: Concept;
  onAction: (action: CommandAction) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, dispatch } = useLab();
  const scope = useConceptScope();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();

  const close = () => {
    onOpenChange(false);
    setQuery('');
    setActive(0);
  };

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const leadsBase = q
      ? state.data.leads.filter((l) =>
          [l.name, l.latinName ?? '', l.area, SERVICES[l.service].label, l.phone.replace(/\D/g, '')]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : [...readyToBook(state.data), ...needsReply(state.data)];
    const leadItems: Item[] = leadsBase.slice(0, q ? 8 : 6).map((lead) => ({
      id: `lead-${lead.id}`,
      group: 'Leads',
      label: lead.latinName ? `${lead.name} (${lead.latinName})` : lead.name,
      hint: `${STAGE_LABEL[lead.stage]} · ${SERVICES[lead.service].short}`,
      keywords: '',
      icon: 'user',
      run: () => {
        router.push(`/${concept}/leads?lead=${lead.id}`);
      },
    }));
    const go: Item[] = NAV.map(({ slug, icon }) => ({
      id: `go-${slug}`,
      group: 'Go to',
      label: MODULES[slug].label,
      keywords: slug,
      icon,
      run: () => {
        router.push(`/${concept}/${slug}`);
      },
    }));
    go.splice(3, 0, {
      id: 'go-pipeline',
      group: 'Go to',
      label: 'Pipeline',
      hint: 'Leads by stage',
      keywords: 'board kanban stages',
      icon: 'board',
      run: () => {
        router.push(`/${concept}/leads?view=board`);
      },
    });
    const other: Concept = concept === 'a' ? 'g' : 'a';
    const actions: Item[] = [
      {
        id: 'act-new-lead',
        group: 'Actions',
        label: 'New lead',
        keywords: 'add create enquiry',
        icon: 'plus',
        run: () => {
          onAction('new-lead');
        },
      },
      {
        id: 'act-payment',
        group: 'Actions',
        label: 'Record a payment',
        keywords: 'money paid upi cash advance',
        icon: 'payments',
        run: () => {
          onAction('record-payment');
        },
      },
      {
        id: 'act-nav',
        group: 'Actions',
        label: 'Collapse or expand navigation',
        keywords: 'sidebar rail',
        icon: 'panel',
        run: () => {
          onAction('toggle-nav');
        },
      },
      {
        id: 'act-shortcuts',
        group: 'Actions',
        label: 'Keyboard shortcuts',
        keywords: 'help keys',
        icon: 'keyboard',
        run: () => {
          onAction('shortcuts');
        },
      },
      {
        id: 'act-concept',
        group: 'Actions',
        label: `Switch to Concept ${other.toUpperCase()}`,
        keywords: 'design concept compare',
        icon: 'layers',
        run: () => {
          router.push(`${pathname.replace(/^\/(a|b|g)/, `/${other}`)}${window.location.search}`);
        },
      },
      {
        id: 'act-reset',
        group: 'Actions',
        label: 'Reset sample data',
        keywords: 'restart demo',
        icon: 'undo',
        run: () => {
          dispatch({ type: 'reset' });
        },
      },
    ];
    const match = (item: Item) => !q || `${item.label} ${item.keywords}`.toLowerCase().includes(q);
    return [...leadItems, ...go.filter(match), ...actions.filter(match)];
  }, [query, state.data, concept, router, pathname, onAction, dispatch]);

  const current = items[Math.min(active, items.length - 1)];
  const groups = (['Leads', 'Go to', 'Actions'] as const)
    .map((group) => ({ group, items: items.filter((i) => i.group === group) }))
    .filter((g) => g.items.length > 0);

  function run(item: Item | undefined) {
    if (!item) return;
    close();
    item.run();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          {...scope}
          className="lab-overlay fixed inset-0 z-50 bg-[rgb(17_28_45/0.32)]"
        />
        <Dialog.Content
          {...scope}
          aria-describedby={undefined}
          className="lab-pop lab-command fixed top-[12vh] left-1/2 z-50 w-[min(600px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-[0_32px_80px_-24px_rgb(17_28_45/0.5)] outline-none"
        >
          <Dialog.Title className="sr-only">Search and commands</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Icon name="search" size={18} className="text-ink-3" />
            <input
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={current ? `${listId}-${current.id}` : undefined}
              aria-autocomplete="list"
              aria-label="Search leads, pages and actions"
              autoFocus
              value={query}
              placeholder="Search leads, pages and actions…"
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((i) => (items.length ? (i + 1) % items.length : 0));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  run(current);
                }
              }}
              className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
            <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-3 sm:inline">
              Esc
            </kbd>
          </div>
          <div
            id={listId}
            role="listbox"
            aria-label="Results"
            className="max-h-[min(60vh,440px)] overflow-y-auto p-2"
          >
            {groups.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-ink-3">
                No leads, pages or actions match “{query}”.
              </p>
            ) : (
              groups.map(({ group, items: groupItems }) => (
                <div key={group} role="group" aria-label={group} className="pb-1">
                  <p aria-hidden="true" className="px-3 pt-2 pb-1 text-xs text-ink-3">
                    {group === 'Leads' && !query ? 'Ready to book and waiting for a reply' : group}
                  </p>
                  {groupItems.map((item) => {
                    const index = items.indexOf(item);
                    const selected = index === Math.min(active, items.length - 1);
                    return (
                      <div
                        key={item.id}
                        id={`${listId}-${item.id}`}
                        role="option"
                        aria-selected={selected}
                        tabIndex={-1}
                        onMouseMove={() => {
                          if (!selected) setActive(index);
                        }}
                        onClick={() => {
                          run(item);
                        }}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                          selected ? 'bg-canvas-2' : '',
                        )}
                      >
                        <Icon name={item.icon} size={16} className="text-ink-3" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="shrink-0 text-xs text-ink-3">{item.hint}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
