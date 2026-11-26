// Fictional, neutral sample data for the showcase only. Never import this from @krinly/ui.

import type { ChartPoint } from '@krinly/ui/patterns/comparison-chart';
import type { ThreadStep } from '@krinly/ui/patterns/thread';

export const STEPS: ThreadStep[] = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'interested', label: 'Interested' },
  { id: 'ready', label: 'Ready' },
  { id: 'booked', label: 'Booked' },
];

export const PEOPLE = [
  { name: 'Asha Menon' },
  { name: 'Rahul Verma' },
  { name: 'अनन्या मिश्रा' },
  { name: 'செல்வி ராஜன்' },
  { name: 'Imran Shaikh' },
  { name: 'Neha Kulkarni' },
];

/** Cumulative series that ends exactly on `total`. */
function cumulative(days: number, total: number, curve: number, month: string): ChartPoint[] {
  return Array.from({ length: days }, (_, i) => ({
    label: `${String(i + 1)} ${month}`,
    value:
      i === days - 1 ? total : Math.round((total * Math.pow((i + 1) / days, curve)) / 1000) * 1000,
  }));
}

// The fixed lab clock is Wed 25 Nov 2026, 10:30 IST. "This month" is 1–25 Nov; the headline
// compares with October up to the same moment (25 Oct, 10:30): ₹2,12,000, between the end of
// 24 Oct (₹2,11,000) and the end of 25 Oct (₹2,20,000). The chart marker must use ₹2,12,000,
// not the 25 Oct bucket — that was the Phase 02A bug.
export const CURRENT = cumulative(25, 301_000, 1.1, 'Nov');
export const PREVIOUS = cumulative(31, 276_000, 1.05, 'Oct');
export const SAME_POINT_LAST_MONTH = 212_000;

export const FLOW_SOURCES = [
  { id: 'ads', label: 'Instagram ads' },
  { id: 'search', label: 'Google search' },
  { id: 'referral', label: 'Referral' },
  { id: 'walk-in', label: 'Walk-in' },
];
export const FLOW_TARGETS = [
  { id: 'talking', label: 'Talking', color: 'var(--step-1)' },
  { id: 'interested', label: 'Interested', color: 'var(--step-2)' },
  { id: 'ready', label: 'Ready', color: 'var(--step-3)' },
  { id: 'booked', label: 'Booked', color: 'var(--step-4)' },
  { id: 'lost', label: 'Lost', color: 'var(--lost)' },
];
export const FLOW_LINKS = [
  { source: 'ads', target: 'talking', value: 9 },
  { source: 'ads', target: 'interested', value: 5 },
  { source: 'ads', target: 'ready', value: 2 },
  { source: 'ads', target: 'booked', value: 2 },
  { source: 'ads', target: 'lost', value: 4 },
  { source: 'search', target: 'talking', value: 3 },
  { source: 'search', target: 'interested', value: 3 },
  { source: 'search', target: 'booked', value: 2 },
  { source: 'search', target: 'lost', value: 1 },
  { source: 'referral', target: 'interested', value: 2 },
  { source: 'referral', target: 'ready', value: 2 },
  { source: 'referral', target: 'booked', value: 3 },
  { source: 'walk-in', target: 'talking', value: 1 },
  { source: 'walk-in', target: 'booked', value: 1 },
];

const HOUR = 3_600_000;
/** Midnight IST on 25 Nov 2026, as epoch ms. */
export const DAY_START = Date.UTC(2026, 10, 25) - 5.5 * HOUR;
export const NOW = DAY_START + 10.5 * HOUR;
export const at = (h: number, m = 0) => DAY_START + h * HOUR + m * 60_000;

const timeFormat = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
export const formatTime = (t: number) => timeFormat.format(t).replace(':00', '').toLowerCase();
