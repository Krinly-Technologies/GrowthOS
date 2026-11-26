// All lab time is India Standard Time on a fixed clock, so every render and screenshot is
// deterministic. Formatting is hand-written (not Intl) to keep server and client output identical.

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
const IST_OFFSET = 330 * MINUTE;

/** Epoch ms for a wall-clock time in India Standard Time. `month` is 1–12. */
export function ist(year: number, month: number, day: number, hour = 0, minute = 0): number {
  return Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET;
}

/** The lab's fixed "now": Wednesday 25 November 2026, 10:30 IST. */
export const LAB_NOW = ist(2026, 11, 25, 10, 30);

export interface IstParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

export function istParts(ms: number): IstParts {
  const d = new Date(ms + IST_OFFSET);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

export function startOfDay(ms: number): number {
  const p = istParts(ms);
  return ist(p.year, p.month, p.day);
}

export function endOfDay(ms: number): number {
  return startOfDay(ms) + DAY - 1;
}

export function startOfMonth(ms: number): number {
  const p = istParts(ms);
  return ist(p.year, p.month, 1);
}

export function shiftMonths(ms: number, months: number): number {
  const p = istParts(ms);
  const index = p.year * 12 + (p.month - 1) + months;
  return ist(Math.floor(index / 12), (index % 12) + 1, p.day, p.hour, p.minute);
}

export function daysInMonth(ms: number): number {
  const p = istParts(ms);
  return new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
}

/** Whole calendar days from `from` to `to` (IST), e.g. tomorrow = 1. */
export function calendarDaysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY);
}
