'use client';

import { Icon } from '@krinly/ui/components/icon';
import { DayButton, DayPicker } from 'react-day-picker';
import { dayKey } from '@/lib/preview/selectors';

/**
 * Month grid for Bookings. A straightforward calendar (react-day-picker, MIT) styled to the B+
 * system — not a resource-scheduling engine. Days with an appointment carry a dot; picking a day
 * filters the list below.
 */
export function BookingCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  bookingDays,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  bookingDays: ReadonlySet<number>;
}) {
  return (
    <DayPicker
      mode="single"
      month={month}
      onMonthChange={onMonthChange}
      selected={selected}
      onSelect={onSelect}
      showOutsideDays
      modifiers={{ hasBookings: (date) => bookingDays.has(dayKey(date.getTime())) }}
      components={{
        Chevron: ({ orientation }) => (
          <Icon name={orientation === 'left' ? 'chevron-left' : 'chevron-right'} size={16} />
        ),
        DayButton: (props) => {
          const { modifiers } = props;
          return (
            <span className="relative flex">
              <DayButton {...props} />
              {modifiers.hasBookings && !modifiers.selected ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent-strong"
                />
              ) : null}
            </span>
          );
        },
      }}
      classNames={{
        root: 'text-sm',
        months: 'flex flex-col',
        month: 'space-y-2',
        month_caption:
          'flex items-center justify-center py-1.5 font-display text-[15px] font-semibold',
        nav: 'flex items-center justify-between',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-full text-ink-3 outline-none hover:bg-canvas-2 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-40',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-full text-ink-3 outline-none hover:bg-canvas-2 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-40',
        weekdays: 'flex',
        weekday: 'flex-1 pb-1 text-center text-xs font-semibold text-ink-3',
        week: 'flex w-full',
        day: 'flex-1 p-0.5',
        day_button:
          'flex size-9 w-full items-center justify-center rounded-full text-[13.5px] font-medium text-ink outline-none hover:bg-canvas-2 focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-selected:bg-ink aria-selected:text-white aria-selected:hover:bg-ink',
        today: 'font-bold text-accent-strong',
        outside: 'text-ink-3/50',
        disabled: 'opacity-40',
      }}
    />
  );
}
