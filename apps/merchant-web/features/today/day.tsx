'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { ListRow } from '@krinly/ui/components/table';
import { NextAction } from '@krinly/ui/patterns/signals';
import { DayTimeline } from '@krinly/ui/patterns/timeline';
import { startOfDay } from '@/lib/preview/clock';
import { dueInfo, plural, time } from '@/lib/preview/format';
import type { TodayModel } from '@/lib/preview/today-model';
import { TEAM } from '@/lib/preview/sample/scenario';

type Status = 'finished' | 'now' | 'upcoming';

function statusOf(start: number, end: number, now: number): Status {
  if (end < now) return 'finished';
  if (start <= now) return 'now';
  return 'upcoming';
}

const STATUS: Record<Status, { label: string; tone: 'neutral' | 'verified' | 'info' }> = {
  finished: { label: 'Finished', tone: 'neutral' },
  now: { label: 'Happening now', tone: 'verified' },
  upcoming: { label: 'Upcoming', tone: 'info' },
};

/** The working day: appointments as blocks, today's enquiries as markers, and what to do next. */
export function DaySection({
  model,
  onOpenLead,
}: {
  model: TodayModel;
  onOpenLead: (leadId: string) => void;
}) {
  const dayStart = startOfDay(model.now);
  const enquiries = [...model.byId.values()].filter(
    (lead) => lead.createdAt >= dayStart && lead.createdAt <= model.now,
  );

  return (
    <Card padding="lg" aria-labelledby="day-heading" className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <CardTitle id="day-heading" className="text-xl">
          Your day
        </CardTitle>
        <p className="text-sm text-ink-2">
          {plural(model.appointments.length, 'appointment')} ·{' '}
          {plural(enquiries.length, 'new enquiry', 'new enquiries')} so far
        </p>
      </div>

      <DayTimeline
        // Below sm the list underneath carries the day, with status and next steps;
        // the timeline's own agenda would just repeat it.
        className="mt-6 hidden sm:block"
        dayStart={dayStart}
        now={model.now}
        startHour={7}
        endHour={21}
        formatTime={time}
        markersLabel="Enquiries"
        emptyText="Nothing scheduled today."
        markers={enquiries.map((lead) => ({
          id: lead.id,
          at: lead.createdAt,
          label: `${lead.latinName ?? lead.name} enquired at ${time(lead.createdAt)}`,
          onSelect: () => {
            onOpenLead(lead.id);
          },
        }))}
        blocks={model.appointments.map(({ booking, lead }) => ({
          id: booking.id,
          start: booking.start,
          end: booking.start + booking.minutes * 60_000,
          title: (lead.latinName ?? lead.name).split(' ')[0] ?? lead.name,
          subtitle: booking.title,
          onSelect: () => {
            onOpenLead(lead.id);
          },
        }))}
      />

      {model.appointments.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon="calendar"
          title="No appointments today"
          description="Trials, consultations and event-day bookings will appear here."
        />
      ) : (
        <ul className="mt-5 divide-y divide-line-soft border-t border-line-soft">
          {model.appointments.map(({ booking, lead }) => {
            const end = booking.start + booking.minutes * 60_000;
            const status = STATUS[statusOf(booking.start, end, model.now)];
            const due = lead.next ? dueInfo(lead.next.due, model.now) : null;
            return (
              <li key={booking.id} className="min-w-0 py-1">
                <ListRow
                  className="px-0 py-2"
                  leading={
                    <span className="tnum w-16 shrink-0 text-[13px] font-bold text-ink">
                      {time(booking.start)}
                    </span>
                  }
                  title={lead.latinName ?? lead.name}
                  subtitle={`${booking.title} · with ${TEAM[booking.with].firstName}`}
                  trailing={<Badge tone={status.tone}>{status.label}</Badge>}
                />
                {/* The next step gets its own line: it is a sentence, and squeezing it into the
                    row's trailing slot leaves it nowhere to go on a phone. */}
                {lead.next && due ? (
                  <div className="min-w-0 pb-2 pl-16">
                    <NextAction
                      className="max-w-full"
                      label={lead.next.label}
                      due={due.label}
                      state={
                        due.tone === 'overdue'
                          ? 'overdue'
                          : due.tone === 'today'
                            ? 'today'
                            : 'upcoming'
                      }
                      onAction={() => {
                        onOpenLead(lead.id);
                      }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
