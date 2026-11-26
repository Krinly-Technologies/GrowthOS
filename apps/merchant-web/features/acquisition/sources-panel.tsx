'use client';

import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Field } from '@krinly/ui/components/field';
import { EmptyState } from '@krinly/ui/components/feedback';
import { Icon } from '@krinly/ui/components/icon';
import { Input, SearchField } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { SegmentedControl } from '@krinly/ui/components/tabs';
import { useToast } from '@krinly/ui/components/toast';
import { FilterToolbar } from '@krinly/ui/patterns/filter-toolbar';
import { useState } from 'react';
import { type SourceState, SOURCE_STATE_LABEL } from '@/lib/preview/acquisition';
import type { AcquisitionModel, SourceStat } from '@/lib/preview/acquisition-model';
import { inr, plural } from '@/lib/preview/format';
import { SourceDetailSheet } from './source-detail';
import { SourceStateBadge, SourceStateNote } from './source-state';

type Filter = 'all' | SourceState;

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'configured', label: SOURCE_STATE_LABEL.configured },
  { value: 'manual', label: SOURCE_STATE_LABEL.manual },
  { value: 'needs-integration', label: SOURCE_STATE_LABEL['needs-integration'] },
];

/**
 * Source management: every place customers come from, and an honest statement of how each one is
 * recorded. Turning a source off stops it being offered when recording an enquiry; it never
 * pretends to disconnect something that was never connected.
 */
export function SourcesPanel({
  model,
  onToggle,
  onAdd,
}: {
  model: AcquisitionModel;
  onToggle: (sourceId: string) => void;
  onAdd: (label: string) => void;
}) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [drill, setDrill] = useState<SourceStat | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const needle = query.trim().toLowerCase();
  const rows = model.stats.filter(
    (stat) =>
      (filter === 'all' || stat.source.state === filter) &&
      (needle === '' || stat.source.label.toLowerCase().includes(needle)),
  );
  const counts = {
    configured: model.stats.filter((s) => s.source.state === 'configured').length,
    manual: model.stats.filter((s) => s.source.state === 'manual').length,
    waiting: model.stats.filter((s) => s.source.state === 'needs-integration').length,
  };

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <Card padding="lg" aria-labelledby="sources-panel-heading" className="min-w-0">
        <CardTitle id="sources-panel-heading" className="text-xl">
          Where enquiries can come from
        </CardTitle>
        <p className="mt-1 max-w-[76ch] text-sm leading-relaxed text-ink-2">
          Krinly captures {counts.configured} of these by itself. {counts.manual} are typed in by
          you or your team, and {counts.waiting} would need a channel integration that has not been
          built — nothing on this page connects an outside account.
        </p>

        <FilterToolbar
          className="mt-5"
          start={
            <SearchField
              label="Search sources"
              placeholder="Search sources"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
          }
          filters={
            <SegmentedControl
              label="Filter by how the source is captured"
              value={filter}
              onValueChange={setFilter}
              options={FILTERS}
            />
          }
          end={
            <Button
              variant="brand"
              size="sm"
              shape="pill"
              onClick={() => {
                setAdding(true);
              }}
            >
              <Icon name="plus" size={15} />
              Add a source
            </Button>
          }
          resultSummary={plural(rows.length, 'source')}
          active={
            needle === ''
              ? []
              : [
                  {
                    key: 'q',
                    label: `“${query}”`,
                    removeLabel: 'Clear the search',
                    onRemove: () => {
                      setQuery('');
                    },
                  },
                ]
          }
          onClearAll={() => {
            setQuery('');
            setFilter('all');
          }}
        />

        {rows.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon="search"
            title="No source matches that"
            description="Clear the search or choose a different capture method."
          />
        ) : (
          <ul className="mt-5 grid gap-3">
            {rows.map((stat) => (
              <li
                key={stat.source.id}
                className="grid min-w-0 gap-3 rounded-xl bg-canvas p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <Icon name={stat.source.icon} size={18} className="shrink-0 text-ink-3" />
                    <button
                      type="button"
                      onClick={() => {
                        setDrill(stat);
                      }}
                      className="rounded-md text-left text-[15px] font-bold text-ink hover:underline"
                    >
                      {stat.source.label}
                    </button>
                    <SourceStateBadge source={stat.source} />
                    {stat.source.custom ? (
                      <span className="text-[12px] text-ink-3">added by you</span>
                    ) : null}
                    {stat.source.active ? null : (
                      <span className="text-[12px] font-semibold text-ink-3">
                        Off — not offered when recording an enquiry
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-[80ch] text-[13.5px] leading-relaxed text-ink-2">
                    <SourceStateNote source={stat.source} />
                  </p>
                  <p className="tnum mt-2 text-[12.5px] text-ink-3">
                    {plural(stat.enquiries, 'new enquiry', 'new enquiries')} {model.range.phrase} ·{' '}
                    {inr(stat.revenue)} verified · {plural(stat.customers, 'paying customer')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    shape="pill"
                    onClick={() => {
                      setDrill(stat);
                    }}
                  >
                    Details
                    <span className="sr-only">: {stat.source.label}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    shape="pill"
                    onClick={() => {
                      onToggle(stat.source.id);
                    }}
                  >
                    {stat.source.active ? 'Turn off' : 'Turn on'}
                    <span className="sr-only">: {stat.source.label}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent
          title="Add a source"
          description="For a place customers come from that is not listed. You will be able to pick it when you record an enquiry by hand."
          footer={
            <>
              <Button
                variant="ghost"
                shape="pill"
                onClick={() => {
                  setAdding(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                shape="pill"
                disabled={draft.trim() === ''}
                onClick={() => {
                  const label = draft.trim();
                  onAdd(label);
                  setDraft('');
                  setAdding(false);
                  toast({ title: `${label} added`, description: 'It is recorded by hand.' });
                }}
              >
                Add source
              </Button>
            </>
          }
        >
          <Field
            label="What do you call it?"
            hint="For example “Bridal magazine feature” or “Partner salon”."
          >
            <Input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
            />
          </Field>
        </DialogContent>
      </Dialog>

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
