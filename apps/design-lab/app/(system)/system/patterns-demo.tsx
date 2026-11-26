'use client';

import { AvatarGroup } from '@krinly/ui/components/avatar';
import { Button } from '@krinly/ui/components/button';
import { Card } from '@krinly/ui/components/card';
import { SearchField } from '@krinly/ui/components/input';
import { SegmentedControl } from '@krinly/ui/components/tabs';
import { useToast } from '@krinly/ui/components/toast';
import { formatINR, formatINRCompact, pluralize } from '@krinly/ui/lib/format';
import { ActionList, CardStack, ToneIcon, type QueueItem } from '@krinly/ui/patterns/card-stack';
import { ComparisonChart } from '@krinly/ui/patterns/comparison-chart';
import { FilterToolbar } from '@krinly/ui/patterns/filter-toolbar';
import { FlowChart } from '@krinly/ui/patterns/flow-chart';
import { Metric } from '@krinly/ui/patterns/metric';
import { Delta, Money, VerificationStatus } from '@krinly/ui/patterns/money';
import { PipelineBoard, PipelineCard, PipelineColumn } from '@krinly/ui/patterns/pipeline';
import { InfoGrid, NextAction, PriorityIndicator } from '@krinly/ui/patterns/signals';
import { StagePill, ThreadIndicator, ThreadStepper } from '@krinly/ui/patterns/thread';
import { DayTimeline } from '@krinly/ui/patterns/timeline';
import { useState } from 'react';
import {
  at,
  CURRENT,
  DAY_START,
  FLOW_LINKS,
  FLOW_SOURCES,
  FLOW_TARGETS,
  formatTime,
  NOW,
  PEOPLE,
  PREVIOUS,
  SAME_POINT_LAST_MONTH,
  STEPS,
} from './sample';
import { Section, Specimen } from './parts';

const QUEUE: (QueueItem & { people: { name: string }[] })[] = [
  {
    key: 'reply',
    icon: 'message',
    tone: 'attention',
    title: '3 customers are waiting for a reply',
    meta: 'Oldest: 5 hours ago',
    people: PEOPLE.slice(0, 3),
  },
  {
    key: 'verify',
    icon: 'seal',
    tone: 'info',
    title: 'Verify 2 payments',
    meta: `${formatINR(27000)} recorded, not yet counted`,
    people: PEOPLE.slice(3, 5),
  },
  {
    key: 'follow',
    icon: 'clock',
    tone: 'critical',
    title: '1 follow-up is overdue',
    meta: 'Due yesterday',
    people: PEOPLE.slice(5),
  },
];

export function PatternsDemo() {
  const toast = useToast();
  const [current, setCurrent] = useState(2);
  const [view, setView] = useState<'list' | 'board'>('board');
  const [filters, setFilters] = useState(['Owner: Me', 'Source: Referral']);
  const delta = (CURRENT.at(-1)?.value ?? 0) - SAME_POINT_LAST_MONTH;

  return (
    <>
      <Section
        id="patterns"
        title="Krinly patterns"
        intro="Generic and data-driven: stages, sources and rules are passed in by the app, never defined in the shared package."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card variant="brand" padding="lg" className="lg:col-span-7">
            <Metric
              tone="on-brand"
              size="hero"
              label="Verified this month"
              value={<Money amount={CURRENT.at(-1)?.value ?? 0} />}
              context={
                <div className="flex flex-wrap items-center gap-2">
                  <VerificationStatus
                    verified
                    tone="on-brand"
                    verifiedLabel="Counted after verification"
                  />
                  <Delta tone="on-brand" value={delta} comparisonLabel="this time last month" />
                </div>
              }
            />
          </Card>
          <div className="lg:col-span-5">
            <Card variant="brand" padding="md" className="h-full">
              <CardStack
                tone="on-brand"
                heading="Up next"
                items={QUEUE}
                getKey={(item) => item.key}
                renderCard={(item, { next }) => (
                  <>
                    <div className="flex items-start gap-3">
                      <ToneIcon icon={item.icon} tone={item.tone} />
                      <div className="min-w-0">
                        <h3 className="font-display text-lg leading-snug font-semibold">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-[13.5px] text-ink-3">{item.meta}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <AvatarGroup
                        people={item.people}
                        label={item.people.map((p) => p.name).join(', ')}
                        size={28}
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" shape="pill" onClick={next}>
                          Later
                        </Button>
                        <Button size="sm" shape="pill">
                          Open
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              />
            </Card>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Specimen label="Action queue">
            <ActionList
              label="Needs you"
              items={QUEUE.map((q) => ({
                ...q,
                action: (
                  <Button size="sm" variant="outline" shape="pill">
                    Open
                  </Button>
                ),
              }))}
            />
          </Specimen>
          <Specimen label="Money · verification">
            <div className="grid gap-3 text-sm">
              <p className="flex flex-wrap items-center justify-between gap-2">
                <Money amount={301000} className="display-figure text-3xl" />
                <VerificationStatus verified />
              </p>
              <p className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <Money amount={27000} className="font-semibold" /> recorded
                </span>
                <VerificationStatus verified={false} />
              </p>
              <p className="text-ink-3">
                Compact for charts:{' '}
                <Money amount={1234567} compact className="font-semibold text-ink" /> (announced
                exactly)
              </p>
              <Delta value={-14500} comparisonLabel="last week" className="justify-self-start" />
            </div>
          </Specimen>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Specimen label="Thread · stage">
            <div className="grid gap-5">
              <ThreadStepper
                label="Stage"
                steps={STEPS}
                current={current}
                onSelect={(step, index) => {
                  const before = current;
                  setCurrent(index);
                  toast({
                    title: `Moved to ${step.label}`,
                    action: {
                      label: 'Undo',
                      onClick: () => {
                        setCurrent(before);
                      },
                    },
                  });
                }}
              />
              <div className="flex flex-wrap items-center gap-4">
                {STEPS.map((s, i) => (
                  <span key={s.id} className="flex items-center gap-2">
                    <ThreadIndicator steps={STEPS} current={i} />
                    <StagePill label={s.label} tone={i as 0 | 1 | 2 | 3 | 4} />
                  </span>
                ))}
                <span className="flex items-center gap-2">
                  <ThreadIndicator steps={STEPS} current={1} muted />
                  <StagePill label="Lost" tone="lost" />
                </span>
              </div>
            </div>
          </Specimen>
          <Specimen label="Priority · next action · info grid">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-4">
                <PriorityIndicator level="high" />
                <PriorityIndicator level="medium" />
                <PriorityIndicator level="low" />
              </div>
              <div className="flex flex-wrap gap-2">
                <NextAction
                  label="Call back"
                  due="Overdue 1 day"
                  state="overdue"
                  onAction={() => undefined}
                />
                <NextAction
                  label="Send quotation"
                  due="Today 4 pm"
                  state="today"
                  onAction={() => undefined}
                />
                <NextAction label="Trial" due="Sat 10 am" />
              </div>
              <InfoGrid
                columns={3}
                items={[
                  { label: 'Event', value: 'Sat 19 Dec' },
                  { label: 'Quoted', value: <Money amount={85000} /> },
                  { label: 'Owner', value: 'Rahul' },
                ]}
              />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section
        id="charts"
        title="Charts"
        intro="2px lines, hairline grid, legend plus selective direct labels, keyboard crosshair and a table view. The comparison marker is the exact value the headline compares with."
      >
        <Specimen label="Comparison chart">
          <p className="text-sm text-ink-2">
            <Money amount={CURRENT.at(-1)?.value ?? 0} className="font-semibold text-ink" /> so far
            this month — <Money amount={delta} className="font-semibold text-ink" /> more than{' '}
            <Money amount={SAME_POINT_LAST_MONTH} /> by this time last month.
          </p>
          <ComparisonChart
            className="mt-4"
            title="Verified revenue, adding up day by day"
            current={CURRENT}
            previous={PREVIOUS}
            currentLabel="November"
            previousLabel="October"
            comparison={{ value: SAME_POINT_LAST_MONTH, label: 'by this time in October' }}
            formatValue={(v) => formatINR(v)}
            formatAxis={(v) => (v === 0 ? '₹0' : formatINRCompact(v))}
            tickIndices={[0, 6, 13, 20, 27, 30]}
            tickLabel={(i) => String(i + 1)}
          />
        </Specimen>
        <Specimen label="Flow">
          <FlowChart
            title="Where enquiries came from, and where they are now"
            description={`${pluralize(41, 'person', 'people')} who first enquired 1–25 Nov. Hover or tab to a source to trace it.`}
            sources={FLOW_SOURCES}
            targets={FLOW_TARGETS}
            links={FLOW_LINKS}
            targetExtra={(id) => (id === 'booked' ? formatINR(214000) : undefined)}
            note="Counts people by first source. Stage names here are sample data."
          />
        </Specimen>
        <Specimen label="Day timeline">
          <DayTimeline
            dayStart={DAY_START}
            now={NOW}
            startHour={9}
            endHour={20}
            formatTime={formatTime}
            markersLabel="New enquiries"
            markers={[
              { id: 'e1', at: at(9, 10), label: 'Asha Menon · 9:10 am' },
              { id: 'e2', at: at(9, 55), label: 'Imran Shaikh · 9:55 am' },
            ]}
            blocks={[
              {
                id: 'b1',
                start: at(9, 30),
                end: at(10, 15),
                title: 'Neha',
                subtitle: 'Consultation',
              },
              { id: 'b2', start: at(11), end: at(13), title: 'अनन्या', subtitle: 'Trial' },
              {
                id: 'b3',
                start: at(15, 30),
                end: at(16, 30),
                title: 'Rahul',
                subtitle: 'Quotation call',
              },
              { id: 'b4', start: at(17, 30), end: at(19, 30), title: 'செல்வி', subtitle: 'Trial' },
            ]}
          />
        </Specimen>
      </Section>

      <Section
        id="records"
        title="Collections"
        intro="Filter toolbar above a pipeline. Dragging is optional; every card also needs a non-drag way to change stage."
      >
        <Card padding="md">
          <FilterToolbar
            start={<SearchField label="Search leads" placeholder="Search leads" shortcut="/" />}
            filters={
              <Button variant="outline" shape="pill" size="sm">
                Filters
              </Button>
            }
            end={
              <SegmentedControl
                label="View"
                value={view}
                onValueChange={setView}
                options={[
                  { value: 'list', label: 'List' },
                  { value: 'board', label: 'Pipeline' },
                ]}
              />
            }
            resultSummary="12 leads"
            active={filters.map((f) => ({
              key: f,
              label: f,
              removeLabel: `Remove filter ${f}`,
              onRemove: () => {
                setFilters((all) => all.filter((x) => x !== f));
              },
            }))}
            onClearAll={() => {
              setFilters([]);
            }}
          />
          <PipelineBoard label="Pipeline" className="mt-2">
            {STEPS.slice(0, 4).map((s, i) => (
              <PipelineColumn
                key={s.id}
                title={s.label}
                count={2}
                tone={i as 0 | 1 | 2 | 3}
                summary={formatINRCompact(85000 * (i + 1))}
              >
                {[0, 1].map((k) => {
                  const person = PEOPLE[(i * 2 + k) % PEOPLE.length]?.name ?? '';
                  return (
                    <PipelineCard
                      key={k}
                      title={person}
                      subtitle="Instagram ads · 2d"
                      value={<Money amount={42000 + i * 21000 + k * 9000} compact />}
                      onOpen={() => undefined}
                      footer={
                        <>
                          <ThreadIndicator steps={STEPS} current={i} />
                          <NextAction
                            label="Follow up"
                            due={k ? 'Tomorrow' : 'Today'}
                            state={k ? 'upcoming' : 'today'}
                          />
                        </>
                      }
                    />
                  );
                })}
              </PipelineColumn>
            ))}
          </PipelineBoard>
        </Card>
      </Section>
    </>
  );
}
