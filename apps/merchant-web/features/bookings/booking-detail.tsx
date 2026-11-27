'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@krinly/ui/components/overlay';
import { InfoGrid } from '@krinly/ui/patterns/signals';
import { Money } from '@krinly/ui/patterns/money';
import Link from 'next/link';
import { bookingStatus, type BookingStatus } from '@/lib/preview/domain';
import { fullDate, inr, time } from '@/lib/preview/format';
import type { Appointment } from '@/lib/preview/selectors';
import { TEAM } from '@/lib/preview/sample/scenario';

export const BOOKING_STATUS_TONE: Record<
  BookingStatus,
  'neutral' | 'info' | 'verified' | 'critical'
> = {
  scheduled: 'neutral',
  confirmed: 'info',
  completed: 'verified',
  cancelled: 'critical',
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function BookingDetailSheet({
  appointment,
  outstanding,
  onClose,
  onEdit,
  onConfirm,
  onComplete,
  onCancel,
}: {
  appointment: Appointment | undefined;
  outstanding: number;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onConfirm: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}) {
  return (
    <Sheet
      open={appointment !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {appointment ? (
        <SheetContent variant="floating" width="md" label={`Booking: ${appointment.booking.title}`}>
          <Panel
            appointment={appointment}
            outstanding={outstanding}
            onEdit={onEdit}
            onConfirm={onConfirm}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function Panel({
  appointment,
  outstanding,
  onEdit,
  onConfirm,
  onComplete,
  onCancel,
}: {
  appointment: Appointment;
  outstanding: number;
  onEdit: (appointment: Appointment) => void;
  onConfirm: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}) {
  const { booking, lead } = appointment;
  const status = bookingStatus(booking);
  const who = lead.latinName ?? lead.name;
  const value = booking.value ?? lead.value;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <Avatar name={who} seed={lead.id} size={44} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate font-display text-lg font-semibold tracking-tight">
              {booking.title}
            </SheetTitle>
            <p className="truncate text-[13px] text-ink-3">
              {who} · {lead.phone}
            </p>
          </div>
          <SheetClose
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </SheetClose>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone={BOOKING_STATUS_TONE[status]}>{BOOKING_STATUS_LABEL[status]}</Badge>
          {status === 'cancelled' && booking.cancelReason ? (
            <span className="text-xs text-ink-3">{booking.cancelReason}</span>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <InfoGrid
          columns={2}
          items={[
            { label: 'Date', value: fullDate(booking.start) },
            { label: 'Time', value: `${time(booking.start)} · ${booking.minutes} min` },
            { label: 'With', value: TEAM[booking.with].name },
            { label: 'Value', value: value ? inr(value) : 'Not quoted' },
            {
              label: 'Outstanding',
              value: outstanding > 0 ? <Money amount={outstanding} /> : 'Fully collected',
            },
          ]}
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" shape="pill">
            <Link href={`/preview/crm?lead=${lead.id}`}>
              <Icon name="list" size={15} />
              Open CRM record
            </Link>
          </Button>
          {status !== 'cancelled' && status !== 'completed' ? (
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              onClick={() => {
                onEdit(appointment);
              }}
            >
              <Icon name="note" size={15} />
              Edit & reschedule
            </Button>
          ) : null}
          {status === 'scheduled' ? (
            <Button
              size="sm"
              shape="pill"
              onClick={() => {
                onConfirm(appointment);
              }}
            >
              <Icon name="check" size={15} />
              Confirm booking
            </Button>
          ) : null}
          {status === 'confirmed' ? (
            <Button
              size="sm"
              shape="pill"
              onClick={() => {
                onComplete(appointment);
              }}
            >
              <Icon name="check" size={15} />
              Mark completed
            </Button>
          ) : null}
          {status !== 'cancelled' && status !== 'completed' ? (
            <Button
              variant="ghost"
              size="sm"
              shape="pill"
              className="text-critical hover:bg-critical-soft"
              onClick={() => {
                onCancel(appointment);
              }}
            >
              <Icon name="close" size={15} />
              Cancel booking
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
