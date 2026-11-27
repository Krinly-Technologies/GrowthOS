'use client';

import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
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
import type { GrowthModel } from '@/lib/preview/growth-model';
import { inr, percent, plural } from '@/lib/preview/format';
import { SOURCES } from '@/lib/preview/sample/scenario';
import { FilterMenu } from '@/features/common/filter-menu';
import { downloadCsv } from './csv-export';

const COLUMNS = [
  'Source',
  'Enquiries',
  'Qualified',
  'Bookings',
  'Verified revenue',
  'Enquiry → booking',
] as const;

/**
 * Source performance: enquiries, qualified leads, bookings and verified revenue per source for
 * the chosen period, with a source filter and a CSV export of exactly what's on screen.
 */
export function SourcePerformance({ model }: { model: GrowthModel }) {
  const { sources, allSources, source, setSource, sourceOptions, range } = model;
  const maxRevenue = Math.max(1, ...sources.map((r) => r.revenue));

  const exportCsv = () => {
    downloadCsv(
      `krinly-source-performance-${range.id}.csv`,
      [...COLUMNS],
      sources.map((row) => [
        SOURCES[row.source].label,
        row.enquiries,
        row.qualified,
        row.booked,
        row.revenue,
        row.enquiries > 0 ? `${Math.round((row.booked / row.enquiries) * 100)}%` : '–',
      ]),
    );
  };

  return (
    <Card padding="lg" aria-labelledby="growth-source-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="growth-source-heading" className="text-xl">
          Source performance
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <FilterMenu
            label="Source"
            options={sourceOptions.map((o) => ({
              ...o,
              count: allSources.find((r) => r.source === o.value)?.enquiries,
            }))}
            selected={source ? [source] : []}
            onChange={(next) => {
              setSource(next[0] ?? null);
            }}
          />
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={sources.length === 0}>
            Export CSV
          </Button>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-2">
        Where{' '}
        {plural(
          sources.reduce((s, r) => s + r.enquiries, 0),
          'enquiry',
          'enquiries',
        )}{' '}
        came from {range.phrase}, and what each source became.
      </p>

      <div className="mt-5 hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c, i) => (
                <TableHead key={c} numeric={i > 0}>
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((row) => (
              <TableRow key={row.source}>
                <TableCell className="font-semibold text-ink">
                  {SOURCES[row.source].label}
                </TableCell>
                <TableCell numeric>{row.enquiries}</TableCell>
                <TableCell numeric>{row.qualified}</TableCell>
                <TableCell numeric>{row.booked}</TableCell>
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
                <TableCell numeric>
                  {row.enquiries > 0 ? percent(row.booked, row.enquiries) : '–'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="mt-5 divide-y divide-line-soft lg:hidden">
        {sources.map((row) => (
          <li key={row.source}>
            <ListRow
              className="px-0"
              title={SOURCES[row.source].label}
              subtitle={`${plural(row.enquiries, 'enquiry', 'enquiries')} · ${row.qualified} qualified · ${row.booked} booked`}
              trailing={
                <span className="tnum text-sm font-semibold text-ink">{inr(row.revenue)}</span>
              }
            />
          </li>
        ))}
      </ul>

      {sources.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon="growth"
          title="Nothing to compare"
          description="No source had an enquiry in this period."
        />
      ) : null}
    </Card>
  );
}
