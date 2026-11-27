'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { BookingsWorkspace } from '@/features/bookings/bookings-workspace';
import { useBookingsModel } from '@/lib/preview/bookings-model';
import { usePreview } from '@/lib/preview/store';

function Bookings() {
  const { state, dispatch } = usePreview();
  const model = useBookingsModel();

  return (
    <BookingsWorkspace
      model={model}
      leads={state.data.leads}
      actions={{
        createBooking: (leadId, draft) => {
          dispatch({ type: 'createBooking', leadId, draft, status: 'scheduled' });
        },
        updateBooking: (bookingId, draft) => {
          dispatch({ type: 'updateBooking', bookingId, draft });
        },
        confirmBooking: (bookingId) => {
          dispatch({ type: 'confirmBooking', bookingId });
        },
        completeBooking: (bookingId) => {
          dispatch({ type: 'completeBooking', bookingId });
        },
        cancelBooking: (bookingId, reason) => {
          dispatch({ type: 'cancelBooking', bookingId, reason });
        },
      }}
    />
  );
}

export default function BookingsPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Bookings />
    </Suspense>
  );
}
