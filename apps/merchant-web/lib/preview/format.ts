// Date and duration formatting for the development preview. Money, plural and initials come
// from @krinly/ui/lib/format; the date helpers below are hand-written (not Intl) so server and
// client render identical strings — no hydration mismatches across ICU versions.

import {
  formatINR,
  formatINRCompact,
  formatPercent,
  initials as uiInitials,
  pluralize,
} from '@krinly/ui/lib/format';
import { calendarDaysBetween, DAY, HOUR, istParts, MINUTE } from './clock';

export const inr = formatINR;
export const inrCompact = formatINRCompact;
export const plural = pluralize;
export const percent = formatPercent;
export const initials = uiInitials;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function time(ms: number): string {
  const { hour, minute } = istParts(ms);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? 'am' : 'pm';
  return minute === 0
    ? `${h12} ${suffix}`
    : `${h12}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

/** "25 Nov" */
export function dayMonth(ms: number): string {
  const p = istParts(ms);
  return `${p.day} ${MONTHS[p.month - 1] ?? ''}`;
}

/** "Wed, 25 Nov" */
export function weekdayDayMonth(ms: number): string {
  const p = istParts(ms);
  return `${WEEKDAYS[p.weekday] ?? ''}, ${p.day} ${MONTHS[p.month - 1] ?? ''}`;
}

/** "Wednesday, 25 November" */
export function longDate(ms: number): string {
  const p = istParts(ms);
  return `${WEEKDAYS_LONG[p.weekday] ?? ''}, ${p.day} ${MONTHS_LONG[p.month - 1] ?? ''}`;
}

/** "14 Feb 2027" */
export function fullDate(ms: number): string {
  const p = istParts(ms);
  return `${p.day} ${MONTHS[p.month - 1] ?? ''} ${p.year}`;
}

export function monthName(ms: number): string {
  return MONTHS_LONG[istParts(ms).month - 1] ?? '';
}

/** Past-tense relative time: "just now", "12 min ago", "3 h ago", "Yesterday", "4 days ago", "2 Oct". */
export function ago(ms: number, now: number): string {
  const diff = now - ms;
  if (diff < 2 * MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  const days = calendarDaysBetween(ms, now);
  if (days === 0) return `${Math.floor(diff / HOUR)} h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return dayMonth(ms);
}

/** Duration since a moment, for waiting times: "40 min", "16 h", "3 days". */
export function waited(since: number, now: number): string {
  const diff = Math.max(0, now - since);
  if (diff < HOUR) return `${Math.max(1, Math.floor(diff / MINUTE))} min`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? '1 day' : `${days} days`;
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later';

export function dueInfo(due: number, now: number): { label: string; tone: DueTone } {
  const days = calendarDaysBetween(now, due);
  if (due < now && days < 0) {
    const late = -days;
    return { label: late === 1 ? 'Overdue by 1 day' : `Overdue by ${late} days`, tone: 'overdue' };
  }
  if (days <= 0)
    return { label: due < now ? 'Due earlier today' : `Today, ${time(due)}`, tone: 'today' };
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (days < 7) return { label: weekdayDayMonth(due), tone: 'later' };
  return { label: dayMonth(due), tone: 'later' };
}

/** "in 81 days", "tomorrow", "today", "3 days ago" */
export function inDays(ms: number, now: number): string {
  const days = calendarDaysBetween(now, ms);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}
