'use client';

import { ToggleGroup } from 'radix-ui';
import { type DragEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { LeadAvatar, LeadName, MemberAvatar } from '@/components/avatar';
import { LostDialog } from '@/components/dialogs';
import { FilterMenu } from '@/components/filter-menu';
import { Icon } from '@/components/icons';
import { channelText, SourceLabel } from '@/components/lead-bits';
import { type LeadsModel, useLeadsModel } from '@/components/models';
import { useShellActions } from '@/components/shell-actions';
import { StageMenu } from '@/components/stage-menu';
import { type Lead, PIPELINE, type Stage, STAGE_LABEL, STAGES, stageIndex } from '@/lib/domain';
import { ago, dayMonth, dueInfo, inr, inrCompact, waited } from '@/lib/format';
import { GROUP_LABEL, type Group, SAVED_VIEWS } from '@/lib/selectors';
import { MEMBER_IDS, SERVICES, SOURCE_IDS, SOURCES, TEAM } from '@/lib/sample/scenario';
import { LeadDrawerA } from './lead-drawer';

const GROUP_HINT: Record<Group, string> = {
  ready: 'They have said yes — collect the advance.',
  reply: 'Customers waiting on you, oldest first.',
  followup: 'Due today or overdue.',
  progress: 'Still deciding. Nothing due today.',
  booked: 'Booked in the last 60 days first.',
  lost: 'Most recent first.',
};

function MicroThread({ stage }: { stage: Stage }) {
  const lost = stage === 'lost';
  const idx = lost ? -1 : stageIndex(stage);
  return (
    <span className="a-micro" data-lost={lost ? 'true' : undefined} aria-hidden="true">
      {PIPELINE.map((s, i) => (
        <span key={s} className="contents">
          {i > 0 ? <b data-on={i <= idx ? 'true' : undefined} /> : null}
          <i data-on={i < idx ? 'true' : undefined} data-current={i === idx ? 'true' : undefined} />
        </span>
      ))}
    </span>
  );
}

function NextAction({
  lead,
  now,
  compact = false,
}: {
  lead: Lead;
  now: number;
  compact?: boolean;
}) {
  if (lead.stage === 'lost') return <span className="text-ink-3">{lead.lostReason ?? 'Lost'}</span>;
  if (lead.awaitingReplySince !== undefined && (!lead.next || lead.next.kind === 'reply')) {
    return (
      <span>
        <span className="block text-ink">{lead.next?.label ?? 'Reply'}</span>
        <span className="block text-[12.5px] font-medium text-attention">
          Waiting {waited(lead.awaitingReplySince, now)}
        </span>
      </span>
    );
  }
  if (!lead.next) return <span className="text-ink-3">—</span>;
  const due = dueInfo(lead.next.due, now);
  return (
    <span>
      <span className={cn('block text-ink', compact && 'truncate')}>{lead.next.label}</span>
      <span
        className={cn(
          'block text-[12.5px]',
          due.tone === 'overdue'
            ? 'font-medium text-critical'
            : due.tone === 'today'
              ? 'font-medium text-attention'
              : 'text-ink-3',
        )}
      >
        {due.label}
      </span>
    </span>
  );
}

function context(lead: Lead): string {
  const event =
    lead.eventDate !== undefined
      ? `${lead.eventLabel} ${dayMonth(lead.eventDate)}`
      : lead.eventLabel;
  return `${SERVICES[lead.service].label} · ${event}`;
}

// ─────────────────────────────────────────────────────────────── toolbar

function Toolbar({
  m,
  searchRef,
}: {
  m: LeadsModel;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const [text, setText] = useState(m.query.q);
  return (
    <div className="mt-5 flex flex-col gap-3">
      <nav aria-label="Saved views" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {SAVED_VIEWS.map((view) => {
          const active = m.query.saved === view.id;
          return (
            <button
              key={view.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                m.setQuery({ saved: view.id });
              }}
              className={cn(
                'h-8 shrink-0 rounded-lg px-2.5 text-[13.5px] whitespace-nowrap',
                active
                  ? 'bg-ink font-medium text-white'
                  : 'text-ink-2 hover:bg-canvas-2 hover:text-ink',
              )}
            >
              {view.label}
              <span
                className={cn('tnum ml-1.5 text-[12px]', active ? 'text-white/75' : 'text-ink-3')}
              >
                {m.counts[view.id]}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:w-auto sm:flex-none">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
          />
          <label htmlFor="lead-search" className="sr-only">
            Search leads
          </label>
          <input
            id="lead-search"
            ref={searchRef}
            type="search"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              m.setQuery({ q: e.target.value });
            }}
            placeholder="Name, phone, area…"
            className="h-9 w-full rounded-lg border border-line bg-surface pr-8 pl-9 text-[13.5px] text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none sm:w-60"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line px-1 text-[10.5px] text-ink-3 sm:block">
            /
          </kbd>
        </div>
        <FilterMenu
          label="Stage"
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
        <FilterMenu
          label="Source"
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
        {m.hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setText('');
              m.clearFilters();
            }}
            className="h-9 rounded-lg px-2.5 text-[13.5px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── list

function EmptyState({ m }: { m: LeadsModel }) {
  return (
    <div className="mt-10 rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-medium">No leads match</p>
      <p className="mt-1 text-sm text-ink-3">Try another view, or clear the search and filters.</p>
      {m.hasFilters ? (
        <button
          type="button"
          onClick={m.clearFilters}
          className="mt-4 h-9 rounded-lg border border-line px-3 text-sm font-medium hover:border-ink"
        >
          Clear search and filters
        </button>
      ) : null}
    </div>
  );
}

function LeadList({ m }: { m: LeadsModel }) {
  if (m.filtered.length === 0) return <EmptyState m={m} />;
  return (
    <>
      {/* Desktop: a real table, grouped by what to do next */}
      <table
        className="mt-4 hidden w-full table-fixed text-[14px] lg:table"
        data-testid="lead-table"
      >
        <caption className="sr-only">Leads, grouped by what to do next</caption>
        <colgroup>
          <col className="w-[27%]" />
          <col className="w-[13%]" />
          <col className="w-[15%]" />
          <col className="w-[15%]" />
          <col className="w-[18%]" />
          <col className="w-[4%]" />
          <col className="w-[8%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line text-left text-[12.5px] text-ink-3">
            <th scope="col" className="py-2 pr-3 pl-3 font-medium">
              Lead
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Came from
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Stage
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Last interaction
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Next action
            </th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Owner</span>
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Value
            </th>
          </tr>
        </thead>
        {m.groups.map(({ group, leads }) => (
          <tbody key={group} data-group={group}>
            <tr>
              <th colSpan={7} scope="rowgroup" className="pt-6 pb-2 pl-3 text-left font-normal">
                <span className="a-title text-[15px] text-ink">{GROUP_LABEL[group]}</span>
                <span className="tnum ml-2 text-[13px] text-ink-3">{leads.length}</span>
                <span className="ml-3 text-[13px] text-ink-3">
                  {inrCompact(leads.reduce((sum, l) => sum + l.value, 0))} · {GROUP_HINT[group]}
                </span>
              </th>
            </tr>
            {leads.map((lead) => {
              const last = m.last.get(lead.id);
              return (
                <tr
                  key={lead.id}
                  onClick={() => {
                    m.openLead(lead.id);
                  }}
                  className={cn(
                    'cursor-pointer border-t border-line-soft align-top hover:bg-canvas',
                    group === 'ready' &&
                      'bg-[linear-gradient(90deg,var(--mint-soft),transparent_40%)]',
                  )}
                  data-lead={lead.id}
                >
                  <td className="py-3 pr-3 pl-3">
                    <div className="flex items-center gap-3">
                      <LeadAvatar lead={lead} size={34} />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            m.openLead(lead.id);
                          }}
                          className="block max-w-full truncate text-left text-[14.5px] font-medium text-ink hover:underline"
                        >
                          <LeadName lead={lead} subClassName="text-[13px]" />
                        </button>
                        <p className="truncate text-[13px] text-ink-3">{context(lead)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 pt-[22px]">
                    <SourceLabel source={lead.source} className="text-[13.5px] text-ink-2" />
                  </td>
                  <td className="py-3 pr-3 pt-[21px]">
                    <span className="flex items-center gap-2.5">
                      <MicroThread stage={lead.stage} />
                      <span className="text-[13.5px] whitespace-nowrap text-ink-2">
                        {STAGE_LABEL[lead.stage]}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="block text-[13.5px] text-ink-2">
                      {channelText(last)} · {last ? ago(last.at, m.now) : '—'}
                    </span>
                    <span className="block truncate text-[12.5px] text-ink-3">{last?.text}</span>
                  </td>
                  <td className="py-3 pr-3 text-[13.5px]">
                    <NextAction lead={lead} now={m.now} compact />
                  </td>
                  <td className="py-3 pt-[19px]">
                    <MemberAvatar id={lead.owner} size={24} />
                    <span className="sr-only">Owner: {TEAM[lead.owner].name}</span>
                  </td>
                  <td className="tnum py-3 pr-3 pt-[21px] text-right font-medium">
                    {lead.value ? inr(lead.value) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>

      {/* Tablet and mobile: structured list */}
      <div className="mt-4 lg:hidden" data-testid="lead-list-mobile">
        {m.groups.map(({ group, leads }) => (
          <section key={group} aria-labelledby={`group-${group}`} className="mb-6">
            <h2 id={`group-${group}`} className="flex items-baseline gap-2 pb-2">
              <span className="a-title text-[15px]">{GROUP_LABEL[group]}</span>
              <span className="tnum text-[13px] text-ink-3">{leads.length}</span>
            </h2>
            <ul className="divide-y divide-line-soft border-y border-line">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => {
                      m.openLead(lead.id);
                    }}
                    className="flex w-full items-start gap-3 py-3 text-left"
                  >
                    <LeadAvatar lead={lead} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[15px] font-medium text-ink">
                          <LeadName lead={lead} subClassName="text-[13px]" />
                        </span>
                        <span className="tnum shrink-0 text-[14px] font-medium">
                          {lead.value ? inr(lead.value) : ''}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-3">
                        <MicroThread stage={lead.stage} />
                        {STAGE_LABEL[lead.stage]} · {SOURCES[lead.source].short}
                      </span>
                      <span className="mt-1.5 block text-[13.5px]">
                        <NextAction lead={lead} now={m.now} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────── board

function Board({ m }: { m: LeadsModel }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  function onDrop(e: DragEvent, stage: Stage) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const lead = m.byId.get(id);
    setOver(null);
    setDragging(null);
    if (lead) m.changeStage(lead, stage);
  }

  return (
    <div
      className="a-board-thread mt-6 -mx-5 flex gap-3 overflow-x-auto px-5 pb-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"
      data-testid="board"
    >
      {m.columns.map((col) => {
        const total = col.leads.reduce((sum, l) => sum + l.value, 0);
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
              onDrop(e, col.stage);
            }}
            className="a-column flex w-[78vw] max-w-[300px] shrink-0 flex-col rounded-xl p-1.5 transition-colors sm:w-auto sm:min-w-[208px] sm:flex-1"
            data-stage={col.stage}
          >
            <header className="px-1.5 pb-3">
              <span
                className="a-node relative block"
                aria-hidden="true"
                style={
                  col.stage === 'booked'
                    ? { background: 'var(--thread-reached)', boxShadow: 'none' }
                    : undefined
                }
              />
              <h2 className="mt-3 flex items-baseline justify-between gap-2">
                <span className="a-title text-[14.5px]">{STAGE_LABEL[col.stage]}</span>
                <span className="tnum text-[13px] text-ink-3">{col.leads.length}</span>
              </h2>
              <p className="tnum text-[12.5px] text-ink-3">{total ? inrCompact(total) : '—'}</p>
            </header>
            <ul className="flex flex-col gap-2">
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
                  className="a-card group rounded-lg border border-line bg-surface p-3 shadow-[0_1px_0_rgb(17_28_45/0.03)] hover:border-ink-3"
                  data-lead={lead.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        m.openLead(lead.id);
                      }}
                      className="min-w-0 text-left text-[14px] leading-snug font-medium text-ink hover:underline"
                    >
                      <LeadName
                        lead={lead}
                        className="block"
                        subClassName="block ml-0 text-[12.5px]"
                      />
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
                        className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-canvas-2 hover:text-ink"
                      >
                        <Icon name="more" size={16} />
                      </button>
                    </StageMenu>
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-3">{context(lead)}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="tnum text-[13.5px] font-medium">
                      {lead.value ? inr(lead.value) : '—'}
                    </span>
                    <MemberAvatar id={lead.owner} size={22} />
                  </div>
                  {lead.stage !== 'booked' &&
                  (lead.next ?? lead.awaitingReplySince !== undefined) ? (
                    <div className="mt-2.5 border-t border-line-soft pt-2 text-[12.5px]">
                      <NextAction lead={lead} now={m.now} compact />
                    </div>
                  ) : null}
                </li>
              ))}
              {col.leads.length === 0 ? (
                <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-ink-3">
                  Drop a lead here
                </li>
              ) : null}
            </ul>
            {col.hidden > 0 ? (
              <p className="px-1.5 pt-3 text-[12px] text-ink-3">
                +{col.hidden} booked more than 60 days ago
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── page

export function LeadsA() {
  const m = useLeadsModel('list');
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
    <div className="px-5 py-6 md:px-8 lg:px-10 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="a-title hidden text-[22px] leading-tight md:block">Leads</h1>
          <p className="text-[13.5px] text-ink-3">
            {m.openCount} open · {inrCompact(m.openValue)} in open quotations and estimates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup.Root
            type="single"
            value={m.query.view}
            onValueChange={(value) => {
              if (value === 'list' || value === 'board') m.setQuery({ view: value });
            }}
            aria-label="Layout"
            className="inline-flex rounded-lg bg-canvas-2 p-0.5"
          >
            {(['list', 'board'] as const).map((view) => (
              <ToggleGroup.Item
                key={view}
                value={view}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] text-ink-2 hover:text-ink data-[state=on]:bg-surface data-[state=on]:font-medium data-[state=on]:text-ink data-[state=on]:shadow-[0_0_0_1px_var(--line)]"
              >
                <Icon name={view} size={15} />
                {view === 'list' ? 'List' : 'Pipeline'}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
          <button
            type="button"
            onClick={actions.openNewLead}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13.5px] font-medium text-white hover:bg-ink-2"
          >
            <Icon name="plus" size={15} />
            New lead
          </button>
        </div>
      </header>

      <Toolbar m={m} searchRef={searchRef} />
      {m.query.view === 'list' ? <LeadList m={m} /> : <Board m={m} />}

      <LeadDrawerA m={m} />
      <LostDialog
        lead={m.lostLead}
        onOpenChange={(open) => {
          if (!open) m.setLostLead(null);
        }}
      />
    </div>
  );
}
