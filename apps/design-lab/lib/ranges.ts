import { DAY, daysInMonth, shiftMonths, startOfDay, startOfMonth } from './clock';
import { monthName } from './format';

export type RangeId = 'today' | '7d' | 'month' | 'last-month';
export const RANGE_IDS: RangeId[] = ['today', '7d', 'month', 'last-month'];

export interface ResolvedRange {
  id: RangeId;
  /** Control label: "Today", "7 days", "This month", "October". */
  label: string;
  /** Phrase for sentences: "this month", "in October". */
  phrase: string;
  start: number;
  end: number;
  compareStart: number;
  compareEnd: number;
  /** "October by this date", "yesterday by this time". */
  compareLabel: string;
  /** Length of the full comparison period, for the ghost line on charts. */
  compareSpanEnd: number;
  bucket: 'hour' | 'day';
}

export function resolveRange(id: RangeId, now: number): ResolvedRange {
  switch (id) {
    case 'today': {
      const start = startOfDay(now);
      return {
        id,
        label: 'Today',
        phrase: 'today',
        start,
        end: now,
        compareStart: start - DAY,
        compareEnd: now - DAY,
        compareLabel: 'yesterday by this time',
        compareSpanEnd: start - 1,
        bucket: 'hour',
      };
    }
    case '7d': {
      const start = startOfDay(now) - 6 * DAY;
      return {
        id,
        label: '7 days',
        phrase: 'in the last 7 days',
        start,
        end: now,
        compareStart: start - 7 * DAY,
        compareEnd: now - 7 * DAY,
        compareLabel: 'the 7 days before',
        compareSpanEnd: start - 1,
        bucket: 'day',
      };
    }
    case 'month': {
      const start = startOfMonth(now);
      const prev = shiftMonths(start, -1);
      return {
        id,
        label: 'This month',
        phrase: 'this month',
        start,
        end: now,
        compareStart: prev,
        compareEnd: prev + (now - start),
        compareLabel: `${monthName(prev)} by this date`,
        compareSpanEnd: prev + daysInMonth(prev) * DAY - 1,
        bucket: 'day',
      };
    }
    case 'last-month': {
      const end = startOfMonth(now) - 1;
      const start = startOfMonth(end);
      const prev = shiftMonths(start, -1);
      return {
        id,
        label: monthName(start),
        phrase: `in ${monthName(start)}`,
        start,
        end,
        compareStart: prev,
        compareEnd: start - 1,
        compareLabel: monthName(prev),
        compareSpanEnd: start - 1,
        bucket: 'day',
      };
    }
  }
}

export function parseRange(value: string | null): RangeId {
  return RANGE_IDS.find((id) => id === value) ?? 'month';
}
