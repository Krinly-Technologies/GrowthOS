'use client';

import { type DragEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { LeadAvatar, LeadName, MemberAvatar } from '@/components/avatar';
import { LostDialog } from '@/components/dialogs';
import { FilterMenu } from '@/components/filter-menu';
import { Icon } from '@/components/icons';
import { channelText, SOURCE_ICON } from '@/components/lead-bits';
import { type LeadsModel, useLeadsModel } from '@/components/models';
import { useShellActions } from '@/components/shell-actions';
import { StageMenu } from '@/components/stage-menu';
import { Tip } from '@/components/tip';
import { type Lead, PIPELINE, type Stage, STAGE_LABEL, STAGES, stageIndex } from '@/lib/domain';
import { ago, dayMonth, dueInfo, inr, inrCompact, waited } from '@/lib/format';
import { GROUP_LABEL, type LeadSignals, type SavedView } from '@/lib/selectors';
import { MEMBER_IDS, SERVICES, SOURCE_IDS, SOURCES, TEAM } from '@/lib/sample/scenario';
import { LeadPanelG } from './lead-panel';

const PILLS: { id: SavedView; label: string }[] = [
  { id: 'ready', label: 'Ready to book' },
  { id: 'reply', label: 'Needs reply' },
  { id: 'followup', label: 'Follow-ups' },
  { id: 'open', label: 'All open' },
  { id: 'booked', label: 'Booked' },
  { id: 'lost', label: 'Lost' },
  { id: 'all', label: 'Everyone' },
];

/**
 * Why a lead looks promising, in words. (Replaces the 3-dot readiness meter, which read as an
 * unexplained score.) Shows the first reason; the full list is in the tooltip and the label.
 */
function Reasons({ signals }: { signals: LeadSignals | undefined }) {
  const reasons = signals?.reasons ?? [];
  const [first, ...rest] = reasons;
  if (!first) return null;
  return (
    <Tip label={reasons.join(' · ')} side="top">
      <span
        tabIndex={0}
        aria-label={`Why it looks promising: ${reasons.join(', ')}`}
        className="inline-flex min-w-0 items-center gap-1 text-[12px] font-semibold text-[var(--step-4)]"
      >
        <span className="truncate">{first}</span>
        {rest.length ? (
          <span className="shrink-0 text-ink-3">+{rest.length.toString()}</span>
        ) : null}
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
      className="on-ink mt-4 flex items-center gap-3 rounded-[18px] bg-ink px-4 py-3 text-on-ink sm:gap-4 sm:px-5"
    >
      <span className="hidden -space-x-2 sm:flex">
        {ready.slice(0, 4).map((lead) => (
          <LeadAvatar key={lead.id} lead={lead} size={32} className="ring-[3px] ring-ink" />
        ))}
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="spotlight-heading" className="b-heading text-[16px] leading-snug sm:text-[17px]">
          {ready.length} {ready.length === 1 ? 'customer is' : 'customers are'} ready to book
        </h2>
        <p className="truncate text-[13px] text-on-ink-2">
          {inr(total)} in quotations
          <span className="hidden sm:inline"> · collect the advances to lock their dates</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          m.setQuery({ saved: 'ready', view: 'list' });
        }}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-mint px-4 text-[13.5px] font-bold text-ink hover:bg-[#93dcae]"
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
      {m.viewColumns.map((col) => {
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
                    <span className="flex min-w-0 items-center gap-2">
                      {col.stage !== 'booked' ? <Reasons signals={m.signals.get(lead.id)} /> : null}
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
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── list

/** Concept A's Thread, adapted to B's ramp: where a lead is on the journey, at a glance. */
function StageThread({ stage }: { stage: Stage }) {
  const lost = stage === 'lost';
  const idx = lost ? -1 : stageIndex(stage);
  return (
    <span className="g-thread" data-lost={lost ? 'true' : undefined} aria-hidden="true">
      {PIPELINE.map((s, i) => (
        <span key={s} className="contents">
          {i > 0 ? <b data-on={i <= idx ? 'true' : undefined} /> : null}
          <i data-on={i < idx ? 'true' : undefined} data-current={i === idx ? 'true' : undefined} />
        </span>
      ))}
    </span>
  );
}

function NextText({ lead, now }: { lead: Lead; now: number }) {
  if (lead.stage === 'lost') return <span className="text-ink-3">{lead.lostReason}</span>;
  const waiting =
    lead.awaitingReplySince !== undefined && (!lead.next || lead.next.kind === 'reply');
  if (!waiting && !lead.next) return <span className="text-ink-3">Nothing due</span>;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const when =
    waiting && lead.awaitingReplySince !== undefined
      ? `Waiting ${waited(lead.awaitingReplySince, now)}`
      : (due?.label ?? '');
  const tone =
    waiting || due?.tone === 'today'
      ? 'text-attention'
      : due?.tone === 'overdue'
        ? 'text-critical'
        : 'text-ink-3';
  return (
    <span className="block min-w-0">
      <span className="block truncate text-ink">{lead.next?.label ?? 'Reply'}</span>
      <span className={cn('block text-[12.5px] font-semibold', tone)}>{when}</span>
    </span>
  );
}

function List({ m }: { m: LeadsModel }) {
  if (m.filtered.length === 0) {
    return (
      <div className="mt-6 rounded-[22px] bg-surface px-6 py-10 text-center shadow-[0_0_0_1px_var(--line)]">
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
    <div
      className="mt-5 overflow-hidden rounded-[22px] bg-surface shadow-[0_0_0_1px_var(--line)]"
      data-testid="lead-tiles"
    >
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.6fr)_28px_88px] gap-x-4 border-b border-line px-5 py-2.5 text-[12px] font-bold text-ink-3 lg:grid"
      >
        <span>Lead</span>
        <span>Came from</span>
        <span>Stage</span>
        <span>Last interaction</span>
        <span>Next action</span>
        <span />
        <span className="text-right">Value</span>
      </div>
      {m.groups.map(({ group, leads }) => (
        <section key={group} aria-labelledby={`g-group-${group}`}>
          <h2
            id={`g-group-${group}`}
            className="flex items-baseline gap-2 border-b border-line-soft bg-canvas/60 px-5 py-2"
          >
            <span className="b-heading text-[14.5px]">{GROUP_LABEL[group]}</span>
            <span className="tnum text-[12.5px] font-semibold text-ink-3">
              {leads.length} · {inrCompact(leads.reduce((s, l) => s + l.value, 0))}
            </span>
          </h2>
          <ul className="divide-y divide-line-soft">
            {leads.map((lead) => {
              const last = m.last.get(lead.id);
              return (
                <li key={lead.id}>
                  <div
                    onClick={() => {
                      m.openLead(lead.id);
                    }}
                    className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2.5 hover:bg-canvas/70 sm:px-5 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1.6fr)_28px_88px] lg:gap-x-4"
                    data-lead={lead.id}
                  >
                    <div className="flex min-w-0 items-center gap-3 max-lg:contents">
                      <LeadAvatar lead={lead} size={34} />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            m.openLead(lead.id);
                          }}
                          className="block max-w-full truncate text-left text-[14.5px] font-bold text-ink group-hover:underline"
                        >
                          <LeadName lead={lead} subClassName="text-[12.5px] font-medium" />
                        </button>
                        <p className="truncate text-[12.5px] text-ink-3">
                          {SERVICES[lead.service].short}
                          {lead.eventDate !== undefined
                            ? ` · ${lead.eventLabel} ${dayMonth(lead.eventDate)}`
                            : ''}
                          <span className="lg:hidden">
                            {' '}
                            · {SOURCES[lead.source].short} · {STAGE_LABEL[lead.stage]}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[12.5px] lg:hidden">
                          <NextText lead={lead} now={m.now} />
                        </p>
                      </div>
                    </div>
                    <span className="hidden truncate text-[13px] text-ink-2 lg:block">
                      <Icon
                        name={SOURCE_ICON[lead.source]}
                        size={13}
                        className="mr-1.5 inline -translate-y-px text-ink-3"
                      />
                      {SOURCES[lead.source].label}
                    </span>
                    <span className="hidden items-center gap-2 text-[13px] text-ink-2 lg:flex">
                      <StageThread stage={lead.stage} />
                      <span className="truncate">{STAGE_LABEL[lead.stage]}</span>
                    </span>
                    <span className="hidden min-w-0 text-[13px] lg:block">
                      <span className="block text-ink-2">
                        {channelText(last)} · {last ? ago(last.at, m.now) : '—'}
                      </span>
                      <span className="block truncate text-[12px] text-ink-3">{last?.text}</span>
                    </span>
                    <span className="hidden text-[13px] lg:block">
                      <NextText lead={lead} now={m.now} />
                    </span>
                    <span className="hidden lg:block">
                      <MemberAvatar id={lead.owner} size={24} />
                      <span className="sr-only">Owner: {TEAM[lead.owner].name}</span>
                    </span>
                    <span className="b-display text-right text-[15.5px] lg:text-[16.5px]">
                      {lead.value ? (
                        <>
                          <span className="lg:hidden">{inrCompact(lead.value)}</span>
                          <span className="hidden lg:inline">{inr(lead.value)}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── page

export function LeadsG() {
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
          <h1 className="b-heading hidden text-[30px] leading-tight md:block">Leads</h1>
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

      <LeadPanelG m={m} />
      <LostDialog
        lead={m.lostLead}
        onOpenChange={(open) => {
          if (!open) m.setLostLead(null);
        }}
      />
    </div>
  );
}
