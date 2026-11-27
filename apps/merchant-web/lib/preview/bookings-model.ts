'use client';

import { useMemo, useState } from 'react';
import { bookingStatus, type BookingStatus } from './domain';
import {
  allAppointments,
  type Appointment,
  appointmentsOn,
  dayKey,
  matchesCustomer,
  outstandingForBooking,
  upcomingAppointments,
} from './selectors';
import { usePreview } from './store';

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
];

// One view-model for Bookings: today's appointments, the upcoming list, the calendar's booked
// days, and the full filtered list — all derived from the same `data.bookings` the rest of the
// preview reads and writes.

export function useBookingsModel() {
  const { state } = usePreview();
  const { data, now } = state;
  const [q, setQ] = useState('');
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const model = useMemo(() => {
    const all = allAppointments(data);
    const matches = (a: Appointment) =>
      matchesCustomer(a.lead, q) &&
      (statuses.length === 0 || statuses.includes(bookingStatus(a.booking)));
    const filtered = all.filter(matches);
    const byDay =
      selectedDay !== null
        ? filtered.filter((a) => dayKey(a.booking.start) === selectedDay)
        : filtered;
    const bookingDays = new Set(
      all
        .filter((a) => bookingStatus(a.booking) !== 'cancelled')
        .map((a) => dayKey(a.booking.start)),
    );
    const today = appointmentsOn(data, now).filter((a) => bookingStatus(a.booking) !== 'cancelled');
    const upcoming = upcomingAppointments(data, now).filter(matches);
    const outstanding = new Map(
      all.map((a) => [a.booking.id, outstandingForBooking(data, a.booking, a.lead)]),
    );
    return { all, filtered: byDay, bookingDays, today, upcoming, outstanding };
  }, [data, now, q, statuses, selectedDay]);

  return {
    ...model,
    now,
    data,
    q,
    setQ,
    statuses,
    setStatuses,
    selectedDay,
    setSelectedDay,
  };
}

export type BookingsModel = ReturnType<typeof useBookingsModel>;
