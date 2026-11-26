'use client';

import { type DragEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { LeadAvatar, LeadName, MemberAvatar } from '@/components/avatar';
import { LostDialog } from '@/components/dialogs';
import { FilterMenu } from '@/components/filter-menu';
import { Icon } from '@/components/icons';
import { SOURCE_ICON } from '@/components/lead-bits';
import { type LeadsModel, useLeadsModel } from '@/components/models';
import { useShellActions } from '@/components/shell-actions';
import { StageMenu } from '@/components/stage-menu';
import { Tip } from '@/components/tip';
import { type Lead, type Stage, STAGE_LABEL, STAGES } from '@/lib/domain';
import { dayMonth, dueInfo, inr, inrCompact, waited } from '@/lib/format';
import { GROUP_LABEL, type LeadSignals, type SavedView } from '@/lib/selectors';
import { MEMBER_IDS, SERVICES, SOURCE_IDS, SOURCES, TEAM } from '@/lib/sample/scenario';
import { LeadPanelB } from './lead-panel';

const PILLS: { id: SavedView; label: string }[] = [
  { id: 'ready', label: 'Ready to book' },
  { id: 'reply', label: 'Needs reply' },
  { id: 'followup', label: 'Follow-ups' },
  { id: 'open', label: 'All open' },
  { id: 'booked', label: 'Booked' },
  { id: 'lost', label: 'Lost' },
  { id: 'all', label: 'Everyone' },
];

function Meter({ signals }: { signals: LeadSignals | undefined }) {
  const score = signals?.score ?? 0;
  const reasons = signals?.reasons ?? [];
  const label = reasons.length
    ? `Readiness ${score.toString()} of 3: ${reasons.join(', ')}`
    : 'No readiness signals yet';
  return (
    <Tip label={reasons.length ? reasons.join(' · ') : 'No signals yet'} side="top">
      <span className="b-meter" role="img" aria-label={label} tabIndex={0}>
        {[0, 1, 2].map((i) => (
          <i key={i} data-on={i < score ? 'true' : undefined} />
        ))}
      </span>
    </Tip>
  );
}

function NextChip({ lead, now, onOpen }: { lead: Lead; now: number; onOpen: () => void }) {
  if (lead.stage === 'lost')
    return <span className="text-[12.5px] text-ink-3">{lead.lostReason}</span>;
  const waiting =
    lead.awaitingReplySince !== undefined && (!lead.next || lead.next.kind === 'reply');
  if (!waiting && !lead.next) return <span className="text-[12.5px] text-ink-3">Nothing due</span>;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const label = lead.next?.label ?? 'Reply';
  const when =
    waiting && lead.awaitingReplySince !== undefined
      ? `Waiting ${waited(lead.awaitingReplySince, now)}`
      : (due?.label ?? '');
  const tone: 'overdue' | 'today' | 'calm' = waiting
    ? 'today'
    : due?.tone === 'overdue'
      ? 'overdue'
      : due?.tone === 'today'
        ? 'today'
        : 'calm';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className={cn(
        'flex w-full max-w-[360px] flex-col items-start rounded-xl px-3 py-1.5 text-left text-[12.5px] leading-snug font-semibold',
        tone === 'overdue'
          ? 'bg-critical-soft text-critical'
          : tone === 'today'
            ? 'bg-attention-soft text-attention'
            : 'bg-canvas text-ink-2',
      )}
    >
      <span className="line-clamp-2 text-ink">{label}</span>
      <span className="font-semibold">{when}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────── header pieces

function Spotlight({ m }: { m: LeadsModel }) {
  const ready = m.data.leads.filter((l) => l.stage === 'ready').sort((a, b) => b.value - a.value);
  if (ready.length === 0) return null;
  const total = ready.reduce((s, l) => s + l.value, 0);
  return (
    <section
      aria-labelledby="spotlight-heading"
      className="on-ink mt-5 flex flex-col gap-4 rounded-[22px] bg-ink px-5 py-5 text-on-ink sm:flex-row sm:items-center sm:px-6"
    >
      <span className="flex -space-x-2.5">
        {ready.slice(0, 4).map((lead) => (
          <LeadAvatar key={lead.id} lead={lead} size={40} className="ring-[3px] ring-ink" />
        ))}
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="spotlight-heading" className="b-heading text-[20px] leading-snug">
          {ready.length} {ready.length === 1 ? 'customer is' : 'customers are'} ready to book
        </h2>
        <p className="text-[14px] text-on-ink-2">
          {inr(total)} in quotations · collect the advances to lock their dates
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          m.setQuery({ saved: 'ready', view: 'list' });
        }}
        className="inline-flex h-11 items-center justify-center rounded-full bg-mint px-5 text-[14px] font-bold text-ink hover:bg-[#93dcae]"
      >
        Show them
      </button>
    </section>
  );
}

function Controls({
  m,
  searchRef,
}: {
  m: LeadsModel;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const [text, setText] = useState(m.query.q);
  return (
    <div className="mt-5 grid gap-3">
      <nav aria-label="Smart views" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {PILLS.map((pill) => {
          const active = m.query.saved === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                m.setQuery({ saved: pill.id });
              }}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold whitespace-nowrap',
                active
                  ? 'bg-ink text-white'
                  : 'bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line)] hover:text-ink',
              )}
            >
              {pill.label}
              <span
                className={cn(
                  'tnum rounded-full px-1.5 text-[12px]',
                  active ? 'bg-white/15 text-mint' : 'bg-canvas text-ink-3',
                )}
              >
                {m.counts[pill.id]}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3"
          />
          <label htmlFor="lead-search-b" className="sr-only">
            Search leads
          </label>
          <input
            id="lead-search-b"
            ref={searchRef}
            type="search"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              m.setQuery({ q: e.target.value });
            }}
            placeholder="Search by name, phone or area"
            className="h-10 w-full rounded-full bg-surface pr-4 pl-10 text-[14px] text-ink shadow-[0_0_0_1px_var(--line)] placeholder:text-ink-3 focus-visible:shadow-[0_0_0_2px_var(--ink)] focus-visible:outline-none"
          />
        </div>
        <FilterMenu
          label="Source"
          triggerClassName="h-10 rounded-full px-4"
          options={SOURCE_IDS.map((s) => ({
            value: s,
            label: SOURCES[s].label,
            count: m.data.leads.filter((l) => l.source === s).length,
          }))}
          selected={m.query.sources}
          onChange={(sources) => {
            m.setQuery({ sources });
          }}
        />
        <FilterMenu
          label="Owner"
          triggerClassName="h-10 rounded-full px-4"
          options={MEMBER_IDS.map((id) => ({
            value: id,
            label: TEAM[id].name,
            count: m.data.leads.filter((l) => l.owner === id).length,
          }))}
          selected={m.query.owners}
          onChange={(owners) => {
            m.setQuery({ owners });
          }}
        />
        <FilterMenu
          label="Stage"
          triggerClassName="h-10 rounded-full px-4"
          options={STAGES.map((s) => ({
            value: s,
            label: STAGE_LABEL[s],
            count: m.data.leads.filter((l) => l.stage === s).length,
          }))}
          selected={m.query.stages}
          onChange={(stages) => {
            m.setQuery({ stages });
          }}
        />
        {m.hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setText('');
              m.clearFilters();
            }}
            className="h-10 rounded-full px-3 text-[13.5px] font-semibold text-ink-2 hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── board

function Board({ m }: { m: LeadsModel }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  function drop(e: DragEvent, stage: Stage) {
    e.preventDefault();
    const lead = m.byId.get(e.dataTransfer.getData('text/plain'));
    setOver(null);
    setDragging(null);
    if (lead) m.changeStage(lead, stage);
  }

  return (
    <div
      className="mt-6 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:snap-none lg:px-8"
      data-testid="board"
    >
      {m.columns.map((col) => {
        const total = col.leads.reduce((s, l) => s + l.value, 0);
        return (
          <section
            key={col.stage}
            aria-label={`${STAGE_LABEL[col.stage]}, ${col.leads.length.toString()} leads`}
            data-over={over === col.stage ? 'true' : undefined}
            onDragOver={(e) => {
              e.preventDefault();
              if (over !== col.stage) setOver(col.stage);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
            }}
            onDrop={(e) => {
              drop(e, col.stage);
            }}
            className="b-column flex w-[82vw] max-w-[320px] shrink-0 snap-start flex-col sm:w-auto sm:min-w-[214px] sm:flex-1"
            data-stage={col.stage}
          >
            <header
              data-stage-tone={col.stage}
              className="b-tone flex items-center justify-between gap-2 rounded-2xl px-4 py-3"
            >
              <h2 className="b-heading text-[15px]">{STAGE_LABEL[col.stage]}</h2>
              <span className="text-right text-[12px] leading-tight font-semibold opacity-85">
                <span className="tnum block text-[15px]">{col.leads.length}</span>
                {total ? inrCompact(total) : ''}
              </span>
            </header>
            <ul className="b-dropzone mt-2 flex min-h-[120px] flex-col gap-2 rounded-2xl p-0.5">
              {col.leads.map((lead) => (
                <li
                  key={lead.id}
                  draggable
                  data-dragging={dragging === lead.id ? 'true' : undefined}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragging(lead.id);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  className="b-card rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)]"
                  data-lead={lead.id}
                >
                  <div className="flex items-start gap-2.5">
                    <LeadAvatar lead={lead} size={32} />
                    <button
                      type="button"
                      onClick={() => {
                        m.openLead(lead.id);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-[14px] font-bold text-ink">
                        <LeadName lead={lead} subClassName="text-[12px] font-medium" />
                      </span>
                      <span className="block truncate text-[12.5px] text-ink-3">
                        {SERVICES[lead.service].short}
                        {lead.eventDate !== undefined ? ` · ${dayMonth(lead.eventDate)}` : ''}
                      </span>
                    </button>
                    <StageMenu
                      value={lead.stage}
                      onSelect={(stage) => {
                        m.changeStage(lead, stage);
                      }}
                      onLost={() => {
                        m.setLostLead(lead);
                      }}
                      align="end"
                      label={`Move ${lead.latinName ?? lead.name}`}
                    >
                      <button
                        type="button"
                        aria-label={`Move ${lead.latinName ?? lead.name} to another stage`}
                        className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-canvas hover:text-ink"
                      >
                        <Icon name="more" size={16} />
                      </button>
                    </StageMenu>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="b-display text-[18px] leading-none">
                      {lead.value ? inr(lead.value) : '—'}
                    </span>
                    <span className="flex items-center gap-2">
                      {col.stage !== 'booked' ? <Meter signals={m.signals.get(lead.id)} /> : null}
                      <MemberAvatar id={lead.owner} size={22} />
                    </span>
                  </div>
                  {col.stage !== 'booked' &&
                  (lead.next ?? lead.awaitingReplySince !== undefined) ? (
                    <div className="mt-3">
                      <NextChip
                        lead={lead}
                        now={m.now}
                        onOpen={() => {
                          m.openLead(lead.id);
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
              {col.leads.length === 0 ? (
                <li className="grid min-h-[110px] place-items-center rounded-2xl border-2 border-dashed border-line text-[12.5px] font-semibold text-ink-3">
                  Drop here
                </li>
              ) : null}
            </ul>
            {col.hidden > 0 ? (
              <p className="px-2 pt-2 text-[12px] text-ink-3">+{col.hidden} booked earlier</p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── list

function List({ m }: { m: LeadsModel }) {
  if (m.filtered.length === 0) {
    return (
      <div className="mt-8 rounded-[22px] bg-surface px-6 py-12 text-center shadow-[0_0_0_1px_var(--line)]">
        <p className="b-heading text-[18px]">No leads here</p>
        <p className="mt-1 text-sm text-ink-3">
          Try another view, or clear the search and filters.
        </p>
        {m.hasFilters ? (
          <button
            type="button"
            onClick={m.clearFilters}
            className="mt-4 h-10 rounded-full bg-ink px-4 text-sm font-bold text-white"
          >
            Clear search and filters
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-7" data-testid="lead-tiles">
      {m.groups.map(({ group, leads }) => (
        <section key={group} aria-labelledby={`b-group-${group}`}>
          <h2 id={`b-group-${group}`} className="mb-2.5 flex items-baseline gap-2 px-1">
            <span className="b-heading text-[17px]">{GROUP_LABEL[group]}</span>
            <span className="tnum text-[13px] font-semibold text-ink-3">
              {leads.length} · {inrCompact(leads.reduce((s, l) => s + l.value, 0))}
            </span>
          </h2>
          <ul className="grid gap-2">
            {leads.map((lead) => (
              <li key={lead.id}>
                <div
                  onClick={() => {
                    m.openLead(lead.id);
                  }}
                  className="group grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-3),0_10px_24px_-16px_rgb(17_28_45/0.35)] md:grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.6fr)_auto_auto]"
                  data-lead={lead.id}
                >
                  <LeadAvatar lead={lead} size={42} />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        m.openLead(lead.id);
                      }}
                      className="block max-w-full truncate text-left text-[15px] font-bold text-ink group-hover:underline"
                    >
                      <LeadName lead={lead} subClassName="text-[13px] font-medium" />
                    </button>
                    <p className="truncate text-[13px] text-ink-3">
                      <Icon
                        name={SOURCE_ICON[lead.source]}
                        size={13}
                        className="mr-1 inline -translate-y-px"
                      />
                      {SOURCES[lead.source].label} · {SERVICES[lead.service].short}
                      {lead.eventDate !== undefined
                        ? ` · ${lead.eventLabel} ${dayMonth(lead.eventDate)}`
                        : ''}
                    </p>
                  </div>
                  <span className="b-display text-right text-[17px] md:hidden">
                    {lead.value ? inrCompact(lead.value) : ''}
                  </span>
                  <span className="hidden md:block">
                    <span
                      data-stage-tone={lead.stage}
                      className="b-tone inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold"
                    >
                      {STAGE_LABEL[lead.stage]}
                    </span>
                  </span>
                  <div className="col-span-3 min-w-0 md:col-span-1">
                    <NextChip
                      lead={lead}
                      now={m.now}
                      onOpen={() => {
                        m.openLead(lead.id);
                      }}
                    />
                  </div>
                  <span className="hidden items-center gap-3 md:flex">
                    <Meter signals={m.signals.get(lead.id)} />
                    <MemberAvatar id={lead.owner} size={26} />
                  </span>
                  <span className="b-display hidden w-24 text-right text-[18px] md:block">
                    {lead.value ? inr(lead.value) : '—'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── page

export function LeadsB() {
  const m = useLeadsModel('board');
  const actions = useShellActions();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      )
        return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="px-4 py-4 md:px-6 md:py-5 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="b-heading text-[30px] leading-tight">Leads</h1>
          <p className="text-[14px] text-ink-3">
            {m.openCount} open · {inrCompact(m.openValue)} in play
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Layout"
            className="inline-flex rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]"
          >
            {(['board', 'list'] as const).map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={m.query.view === view}
                onClick={() => {
                  m.setQuery({ view });
                }}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-bold',
                  m.query.view === view ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink',
                )}
              >
                <Icon name={view} size={15} />
                {view === 'board' ? 'Pipeline' : 'List'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={actions.openNewLead}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-mint px-5 text-[14px] font-bold text-ink hover:bg-[#93dcae]"
          >
            <Icon name="plus" size={17} />
            New lead
          </button>
        </div>
      </header>

      <Spotlight m={m} />
      <Controls m={m} searchRef={searchRef} />
      {m.query.view === 'board' ? <Board m={m} /> : <List m={m} />}

      <LeadPanelB m={m} />
      <LostDialog
        lead={m.lostLead}
        onOpenChange={(open) => {
          if (!open) m.setLostLead(null);
        }}
      />
    </div>
  );
}
