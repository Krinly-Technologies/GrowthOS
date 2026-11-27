'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { SearchField } from '@krinly/ui/components/input';
import { SegmentedControl } from '@krinly/ui/components/tabs';
import {
  ListRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@krinly/ui/components/table';
import { FilterToolbar } from '@krinly/ui/patterns/filter-toolbar';
import { Money } from '@krinly/ui/patterns/money';
import { useState } from 'react';
import { FilterMenu } from '@/features/common/filter-menu';
import { ReasonDialog } from '@/features/common/reason-dialog';
import { BOOKING_STATUSES, type BookingsModel } from '@/lib/preview/bookings-model';
import { bookingStatus, type BookingStatus, type Lead } from '@/lib/preview/domain';
import { dayMonth, inr, plural, time } from '@/lib/preview/format';
import { dayKey, type Appointment } from '@/lib/preview/selectors';
import { TEAM } from '@/lib/preview/sample/scenario';
import type { BookingDraft } from '@/lib/preview/store';
import { BookingCalendar } from './booking-calendar';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE, BookingDetailSheet } from './booking-detail';
import { BookingFormDialog } from './booking-form-dialog';

export interface BookingsActions {
  createBooking: (leadId: string, draft: BookingDraft) => void;
  updateBooking: (bookingId: string, draft: BookingDraft) => void;
  confirmBooking: (bookingId: string) => void;
  completeBooking: (bookingId: string) => void;
  cancelBooking: (bookingId: string, reason: string) => void;
}

/**
 * Bookings: upcoming and today's appointments, a calendar or list view, and the workflow that
 * takes a scheduled booking to confirmed, completed, or cancelled with a reason.
 */
export function BookingsWorkspace({
  model,
  leads,
  actions,
}: {
  model: BookingsModel;
  leads: readonly Lead[];
  actions: BookingsActions;
}) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [month, setMonth] = useState(() => new Date(model.now));
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const rows = model.filtered;

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hidden font-display text-[28px] leading-tight md:block">Bookings</h1>
          <p className="text-sm text-ink-3">
            {plural(model.today.length, 'appointment')} today ·{' '}
            {plural(model.upcoming.length, 'upcoming booking')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            label="Layout"
            value={view}
            onValueChange={setView}
            options={[
              {
                value: 'list',
                label: (
                  <>
                    <Icon name="list" size={15} />
                    List
                  </>
                ),
              },
              {
                value: 'calendar',
                label: (
                  <>
                    <Icon name="calendar" size={15} />
                    Calendar
                  </>
                ),
              },
            ]}
          />
          <Button
            variant="brand"
            shape="pill"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Icon name="plus" size={16} />
            New booking
          </Button>
        </div>
      </header>

      {model.today.length > 0 ? (
        <Card padding="md" aria-labelledby="bookings-today">
          <CardTitle id="bookings-today" className="text-base">
            Today
          </CardTitle>
          <ul className="mt-2 divide-y divide-line-soft">
            {model.today.map((a) => (
              <li key={a.booking.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(a);
                  }}
                  className="w-full rounded-lg text-left hover:bg-canvas"
                >
                  <ListRow
                    leading={
                      <Avatar name={a.lead.latinName ?? a.lead.name} seed={a.lead.id} size={36} />
                    }
                    title={a.booking.title}
                    subtitle={`${a.lead.latinName ?? a.lead.name} · ${TEAM[a.booking.with].name}`}
                    trailing={
                      <span className="tnum text-sm font-semibold">{time(a.booking.start)}</span>
                    }
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <FilterToolbar
        start={
          <SearchField
            label="Search bookings"
            placeholder="Search by customer name, phone or area"
            value={model.q}
            onChange={(e) => {
              model.setQ(e.target.value);
            }}
          />
        }
        filters={
          <FilterMenu<BookingStatus>
            label="Status"
            options={BOOKING_STATUSES.map((s) => ({ value: s, label: BOOKING_STATUS_LABEL[s] }))}
            selected={model.statuses}
            onChange={model.setStatuses}
          />
        }
        resultSummary={plural(rows.length, 'booking')}
        active={
          model.selectedDay !== null
            ? [
                {
                  key: 'day',
                  label: `Showing ${dayMonth(model.selectedDay)}`,
                  removeLabel: 'Show every day',
                  onRemove: () => {
                    model.setSelectedDay(null);
                  },
                },
              ]
            : []
        }
      />

      {view === 'calendar' ? (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card padding="sm">
            <BookingCalendar
              month={month}
              onMonthChange={setMonth}
              selected={model.selectedDay !== null ? new Date(model.selectedDay) : undefined}
              onSelect={(date) => {
                model.setSelectedDay(date ? dayKey(date.getTime()) : null);
              }}
              bookingDays={model.bookingDays}
            />
          </Card>
          <BookingList
            rows={rows}
            outstanding={model.outstanding}
            onOpen={setSelected}
            emptyLabel={
              model.selectedDay !== null ? 'Nothing booked on this day.' : 'No bookings match yet.'
            }
          />
        </div>
      ) : (
        <BookingList
          rows={rows}
          outstanding={model.outstanding}
          onOpen={setSelected}
          emptyLabel="No bookings match yet."
        />
      )}

      <BookingDetailSheet
        appointment={selected ?? undefined}
        outstanding={selected ? (model.outstanding.get(selected.booking.id) ?? 0) : 0}
        onClose={() => {
          setSelected(null);
        }}
        onEdit={(a) => {
          setSelected(null);
          setEditing(a);
        }}
        onConfirm={(a) => {
          actions.confirmBooking(a.booking.id);
        }}
        onComplete={(a) => {
          actions.completeBooking(a.booking.id);
        }}
        onCancel={(a) => {
          setSelected(null);
          setCancelling(a);
        }}
      />

      <BookingFormDialog
        open={creating}
        appointment={null}
        leads={leads}
        now={model.now}
        onSave={actions.createBooking}
        onClose={() => {
          setCreating(false);
        }}
      />
      <BookingFormDialog
        open={editing !== null}
        appointment={editing}
        leads={leads}
        now={model.now}
        onSave={(_leadId, draft) => {
          if (editing) actions.updateBooking(editing.booking.id, draft);
        }}
        onClose={() => {
          setEditing(null);
        }}
      />

      <ReasonDialog
        open={cancelling !== null}
        title={`Cancel ${cancelling?.booking.title ?? 'this booking'}?`}
        description="The customer and the Today timeline will show it as cancelled."
        confirmLabel="Cancel booking"
        onConfirm={(reason) => {
          if (cancelling) actions.cancelBooking(cancelling.booking.id, reason);
        }}
        onClose={() => {
          setCancelling(null);
        }}
      />
    </div>
  );
}

function BookingList({
  rows,
  outstanding,
  onOpen,
  emptyLabel,
}: {
  rows: readonly Appointment[];
  outstanding: ReadonlyMap<string, number>;
  onOpen: (appointment: Appointment) => void;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <Card padding="lg" className="items-center text-center text-sm text-ink-3">
        {emptyLabel}
      </Card>
    );
  }
  return (
    <>
      <Card padding="none" className="hidden lg:flex">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>With</TableHead>
              <TableHead>When</TableHead>
              <TableHead numeric>Value</TableHead>
              <TableHead numeric>Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => {
              const status = bookingStatus(a.booking);
              const value = a.booking.value ?? a.lead.value;
              const due = outstanding.get(a.booking.id) ?? 0;
              return (
                <TableRow
                  key={a.booking.id}
                  className="cursor-pointer"
                  onClick={() => {
                    onOpen(a);
                  }}
                >
                  <TableCell>
                    <span className="font-semibold">{a.lead.latinName ?? a.lead.name}</span>
                    <span className="block text-xs text-ink-3">{a.lead.phone}</span>
                  </TableCell>
                  <TableCell>{a.booking.title}</TableCell>
                  <TableCell>{TEAM[a.booking.with].name}</TableCell>
                  <TableCell>
                    {dayMonth(a.booking.start)}, {time(a.booking.start)}
                  </TableCell>
                  <TableCell numeric>{value ? inr(value) : '—'}</TableCell>
                  <TableCell numeric>{due > 0 ? <Money amount={due} /> : '—'}</TableCell>
                  <TableCell>
                    <Badge tone={BOOKING_STATUS_TONE[status]}>{BOOKING_STATUS_LABEL[status]}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface shadow-ring lg:hidden">
        {rows.map((a) => {
          const status = bookingStatus(a.booking);
          return (
            <button
              key={a.booking.id}
              type="button"
              onClick={() => {
                onOpen(a);
              }}
              className="block w-full text-left"
            >
              <ListRow
                leading={
                  <Avatar name={a.lead.latinName ?? a.lead.name} seed={a.lead.id} size={36} />
                }
                title={a.booking.title}
                subtitle={`${a.lead.latinName ?? a.lead.name} · ${dayMonth(a.booking.start)}, ${time(a.booking.start)}`}
                trailing={
                  <Badge tone={BOOKING_STATUS_TONE[status]}>{BOOKING_STATUS_LABEL[status]}</Badge>
                }
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
