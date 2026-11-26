'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { EmptyState } from '@krinly/ui/components/feedback';
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
import { StagePill } from '@krinly/ui/patterns/thread';
import { useMemo, useState } from 'react';
import { type Lead, STAGE_LABEL } from '@/lib/preview/domain';
import { dayMonth, inr, inrCompact } from '@/lib/preview/format';
import type { CrmModel } from '@/lib/preview/crm-model';
import { groupLeads, GROUP_LABEL, type Group } from '@/lib/preview/selectors';
import { SERVICES, SOURCES, TEAM } from '@/lib/preview/sample/scenario';
import { NextText } from './next-text';
import { SOURCE_ICON } from './lead-bits';

const PAGE_SIZE = 20;
const STAGE_TONE: Record<string, 0 | 1 | 2 | 3 | 4 | 'lost'> = {
  new: 0,
  contacted: 1,
  interested: 2,
  ready: 3,
  booked: 4,
  lost: 'lost',
};

export function LeadsList({
  model,
  onOpenLead,
  onClearFilters,
}: {
  model: CrmModel;
  onOpenLead: (leadId: string) => void;
  onClearFilters: () => void;
}) {
  const [page, setPage] = useState(1);
  const total = model.filtered.length;
  const pageLeads = useMemo(
    () => model.filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [model.filtered, page],
  );
  const groups = useMemo(() => groupLeads(pageLeads, model.now), [pageLeads, model.now]);

  if (total === 0) {
    return (
      <EmptyState
        className="mt-5"
        icon="leads"
        title="No leads here"
        description="Try another view, or clear the search and filters."
        action={
          model.hasFilters ? (
            <Button variant="outline" size="sm" shape="pill" onClick={onClearFilters}>
              Clear search and filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="mt-5 grid gap-4">
      <div className="hidden overflow-hidden rounded-2xl bg-surface shadow-ring lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Came from</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Next action</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead numeric>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(({ group, leads }) => (
              <GroupRows
                key={group}
                group={group}
                leads={leads}
                now={model.now}
                onOpenLead={onOpenLead}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-5 lg:hidden">
        {groups.map(({ group, leads }) => (
          <section key={group} aria-labelledby={`crm-group-${group}`}>
            <h2
              id={`crm-group-${group}`}
              className="flex items-baseline gap-2 px-1 pb-2 text-[13px] font-bold text-ink-3"
            >
              {GROUP_LABEL[group]}
              <span className="tnum font-semibold text-ink-3">{leads.length}</span>
            </h2>
            <div className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface shadow-ring">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => {
                    onOpenLead(lead.id);
                  }}
                  className="block w-full text-left"
                >
                  <ListRow
                    leading={<Avatar name={lead.latinName ?? lead.name} seed={lead.id} />}
                    title={lead.latinName ?? lead.name}
                    subtitle={`${SERVICES[lead.service].short} · ${SOURCES[lead.source].label} · ${STAGE_LABEL[lead.stage]}`}
                    trailing={
                      <span className="tnum text-sm font-semibold text-ink">
                        {lead.value ? inrCompact(lead.value) : '—'}
                      </span>
                    }
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {total > PAGE_SIZE ? (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      ) : null}
    </div>
  );
}

function GroupRows({
  group,
  leads,
  now,
  onOpenLead,
}: {
  group: Group;
  leads: Lead[];
  now: number;
  onOpenLead: (leadId: string) => void;
}) {
  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={6} className="bg-canvas/60 py-2 text-xs font-bold text-ink-3">
          {GROUP_LABEL[group]} · {leads.length} ·{' '}
          {inrCompact(leads.reduce((sum, l) => sum + l.value, 0))}
        </TableCell>
      </TableRow>
      {leads.map((lead) => (
        <TableRow key={lead.id} className="cursor-pointer">
          <TableCell>
            <button
              type="button"
              onClick={() => {
                onOpenLead(lead.id);
              }}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <Avatar name={lead.latinName ?? lead.name} seed={lead.id} size={34} />
              <span className="min-w-0">
                <span className="block max-w-[220px] truncate font-semibold text-ink hover:underline">
                  {lead.latinName ?? lead.name}
                </span>
                <span className="block max-w-[220px] truncate text-[12.5px] text-ink-3">
                  {SERVICES[lead.service].short}
                  {lead.eventDate !== undefined ? ` · ${dayMonth(lead.eventDate)}` : ''}
                </span>
              </span>
            </button>
          </TableCell>
          <TableCell>
            <Icon
              name={SOURCE_ICON[lead.source]}
              size={13}
              className="mr-1.5 inline -translate-y-px text-ink-3"
            />
            {SOURCES[lead.source].label}
          </TableCell>
          <TableCell>
            <StagePill label={STAGE_LABEL[lead.stage]} tone={STAGE_TONE[lead.stage] ?? 0} />
          </TableCell>
          <TableCell className="max-w-[220px]">
            <NextText lead={lead} now={now} />
          </TableCell>
          <TableCell>
            <Avatar name={TEAM[lead.owner].name} seed={lead.owner} size={24} />
            <span className="sr-only">Owner: {TEAM[lead.owner].name}</span>
          </TableCell>
          <TableCell numeric>{lead.value ? inr(lead.value) : '—'}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
