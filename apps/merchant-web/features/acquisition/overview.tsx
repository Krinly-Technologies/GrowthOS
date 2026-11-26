'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { EmptyState } from '@krinly/ui/components/feedback';
import {
  ListRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@krinly/ui/components/table';
import { Metric } from '@krinly/ui/patterns/metric';
import { cn } from '@krinly/ui/lib/utils';
import { useState } from 'react';
import { CohortProgression } from '@/features/common/cohort-progression';
import type { AcquisitionModel, SourceStat } from '@/lib/preview/acquisition-model';
import { dayMonth, inr, percent, plural } from '@/lib/preview/format';
import { RangePicker } from '@/features/today/range-picker';
import { SourceDetailSheet } from './source-detail';
import { SourceStateBadge } from './source-state';

type SortKey = 'label' | 'enquiries' | 'booked' | 'conversion' | 'customers' | 'revenue';

const COLUMNS: readonly { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'label', label: 'Source', numeric: false },
  { key: 'enquiries', label: 'New enquiries', numeric: true },
  { key: 'booked', label: 'Booked', numeric: true },
  { key: 'conversion', label: 'Enquiry → booking', numeric: true },
  { key: 'customers', label: 'Paying customers', numeric: true },
  { key: 'revenue', label: 'Verified revenue', numeric: true },
];

function compare(a: SourceStat, b: SourceStat, key: SortKey): number {
  if (key === 'label') return a.source.label.localeCompare(b.source.label);
  if (key === 'conversion') return (b.conversion ?? -1) - (a.conversion ?? -1);
  return b[key] - a[key];
}

/** The acquisition overview: what arrived, what it became, and which source did it. */
export function AcquisitionOverview({ model }: { model: AcquisitionModel }) {
  const [sort, setSort] = useState<SortKey>('revenue');
  const [drill, setDrill] = useState<SourceStat | null>(null);
  const { totals, range } = model;
  const rows = [...model.stats].sort((a, b) => compare(a, b, sort));
  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <Card padding="lg" aria-labelledby="acq-overview-heading" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle id="acq-overview-heading" className="text-xl">
            How customers found you
          </CardTitle>
          <RangePicker
            value={model.rangeId}
            now={model.now}
            onChange={model.setRange}
            tone="surface"
          />
        </div>
        <p className="mt-1 text-sm text-ink-2">
          Everyone who first enquired {range.phrase} ({dayMonth(range.start)} –{' '}
          {dayMonth(range.end)}), and the money verified in the same period.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Metric
            label="New enquiries"
            value={totals.enquiries}
            context={
              <>
                {totals.enquiryDelta === 0
                  ? 'the same as'
                  : `${Math.abs(totals.enquiryDelta)} ${totals.enquiryDelta > 0 ? 'more' : 'fewer'} than`}{' '}
                the {totals.previousEnquiries} in the period before
              </>
            }
          />
          <Metric
            label="Became bookings"
            value={totals.booked}
            context={
              totals.enquiries > 0
                ? `${percent(totals.booked, totals.enquiries)} of this period’s enquiries, so far`
                : 'nothing to measure yet'
            }
          />
          <Metric
            label="Verified revenue"
            value={inr(totals.revenue)}
            context={`from ${plural(totals.payingCustomers, 'paying customer')} — credited to where each one first came from`}
          />
        </div>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CohortProgression
          steps={model.flow.steps}
          headingId="acq-progression"
          label="What happened to this period’s enquiries"
        />
      </Card>

      <Card padding="lg" aria-labelledby="acq-compare-heading" className="min-w-0">
        <CardTitle id="acq-compare-heading" className="text-xl">
          Source performance
        </CardTitle>
        <p className="mt-1 text-sm text-ink-2">
          Sorted by {COLUMNS.find((c) => c.key === sort)?.label.toLowerCase()}. Choose a column
          heading to compare differently, or a source to see it in detail.
        </p>

        {/* Desktop: a real table, sortable by column. */}
        <div className="mt-5 hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead
                    key={column.key}
                    numeric={column.numeric}
                    aria-sort={sort === column.key ? 'descending' : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSort(column.key);
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md hover:text-ink',
                        sort === column.key && 'text-ink',
                      )}
                    >
                      {column.label}
                      {sort === column.key ? <Icon name="arrow-down" size={13} /> : null}
                    </button>
                  </TableHead>
                ))}
                <TableHead>Capture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.source.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => {
                        setDrill(row);
                      }}
                      className="inline-flex items-center gap-2 rounded-md text-left font-semibold text-ink hover:underline"
                    >
                      <Icon name={row.source.icon} size={16} className="text-ink-3" />
                      {row.source.label}
                      {row.source.active ? null : (
                        <span className="text-[12px] font-normal text-ink-3">(off)</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell numeric>{row.enquiries}</TableCell>
                  <TableCell numeric>{row.booked}</TableCell>
                  <TableCell numeric>
                    {row.conversion === null ? '–' : percent(row.booked, row.enquiries)}
                  </TableCell>
                  <TableCell numeric>{row.customers}</TableCell>
                  <TableCell numeric>
                    <span className="flex items-center justify-end gap-2">
                      {row.revenue > 0 ? (
                        <span
                          aria-hidden="true"
                          className="h-2 rounded-full bg-step-3"
                          style={{ width: `${(row.revenue / maxRevenue) * 56}px` }}
                        />
                      ) : null}
                      {inr(row.revenue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SourceStateBadge source={row.source} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Below lg: the same rows as a list. */}
        <ul className="mt-5 divide-y divide-line-soft lg:hidden">
          {rows.map((row) => (
            <li key={row.source.id}>
              <ListRow
                className="px-0"
                leading={<Icon name={row.source.icon} size={18} className="text-ink-3" />}
                title={
                  <button
                    type="button"
                    onClick={() => {
                      setDrill(row);
                    }}
                    className="rounded-md text-left hover:underline"
                  >
                    {row.source.label}
                  </button>
                }
                subtitle={`${plural(row.enquiries, 'new enquiry', 'new enquiries')} · ${row.booked} booked · ${plural(row.customers, 'paying customer')}`}
                trailing={
                  <span className="grid justify-items-end gap-1">
                    <span className="tnum text-sm font-semibold text-ink">{inr(row.revenue)}</span>
                    <SourceStateBadge source={row.source} />
                  </span>
                }
              />
            </li>
          ))}
        </ul>

        {rows.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon="growth"
            title="No sources yet"
            description="Add the places your customers come from to start comparing them."
          />
        ) : null}

        <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
          Revenue is credited to the source a customer first came from, which is a provisional
          product rule (issues #7–#12). Nothing here is attributed automatically yet: see Sources
          for how each one is recorded today.
        </p>
      </Card>

      <SourceDetailSheet
        stat={drill}
        model={model}
        onClose={() => {
          setDrill(null);
        }}
      />
    </div>
  );
}
