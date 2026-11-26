import { DAY, endOfDay, HOUR, startOfDay } from './clock';
import {
  type Activity,
  type Booking,
  isOpen,
  type LabData,
  type Lead,
  type MemberId,
  type NextActionKind,
  type Payment,
  type SourceId,
  type Stage,
  stageIndex,
} from './domain';
import { ago, inDays } from './format';
import type { ResolvedRange } from './ranges';
import { SERVICES, SOURCE_IDS, SOURCES } from './sample/scenario';

// Every figure on screen is derived here from one dataset, so numbers always agree.

const INTERACTION_KINDS = new Set<Activity['kind']>([
  'enquiry',
  'message_in',
  'message_out',
  'call',
  'visit',
  'note',
  'trial',
  'quotation',
]);
const FOLLOW_UP_KINDS = new Set<NextActionKind>(['follow_up', 'quotation', 'call']);

export function sumAmounts(payments: readonly Payment[]): number {
  return payments.reduce((total, p) => total + p.amount, 0);
}

export function verifiedBetween(data: LabData, start: number, end: number): Payment[] {
  return data.payments
    .filter(
      (p) =>
        p.status === 'verified' &&
        p.verifiedAt !== undefined &&
        p.verifiedAt >= start &&
        p.verifiedAt <= end,
    )
    .sort((a, b) => (b.verifiedAt ?? 0) - (a.verifiedAt ?? 0));
}

export function awaitingVerification(data: LabData): Payment[] {
  return data.payments
    .filter((p) => p.status === 'recorded')
    .sort((a, b) => b.recordedAt - a.recordedAt);
}

export function leadsById(data: LabData): Map<string, Lead> {
  return new Map(data.leads.map((lead) => [lead.id, lead]));
}

/** Most recent customer-facing activity per lead (activities are kept newest first). */
export function lastInteractions(data: LabData): Map<string, Activity> {
  const map = new Map<string, Activity>();
  for (const activity of data.activities) {
    if (INTERACTION_KINDS.has(activity.kind) && !map.has(activity.leadId))
      map.set(activity.leadId, activity);
  }
  return map;
}

/** Most recent message from the customer per lead. */
export function lastCustomerMessages(data: LabData): Map<string, Activity> {
  const map = new Map<string, Activity>();
  for (const activity of data.activities) {
    if (activity.by === 'customer' && !map.has(activity.leadId)) map.set(activity.leadId, activity);
  }
  return map;
}

export function timelineFor(data: LabData, leadId: string): Activity[] {
  return data.activities.filter((a) => a.leadId === leadId);
}

export function paymentsFor(data: LabData, leadId: string): Payment[] {
  return data.payments
    .filter((p) => p.leadId === leadId)
    .sort((a, b) => b.recordedAt - a.recordedAt);
}

export function furthestStage(lead: Lead): Stage {
  let best: Stage = 'new';
  for (const mark of lead.history) {
    if (mark.stage !== 'lost' && stageIndex(mark.stage) > stageIndex(best)) best = mark.stage;
  }
  return best;
}

export function stageEnteredAt(lead: Lead): number {
  return lead.history[lead.history.length - 1]?.at ?? lead.createdAt;
}

// ---------------------------------------------------------------- attention

export type Group = 'ready' | 'reply' | 'followup' | 'progress' | 'booked' | 'lost';

export const GROUP_LABEL: Record<Group, string> = {
  ready: 'Ready to book',
  reply: 'Waiting for your reply',
  followup: 'Follow-ups due',
  progress: 'In progress',
  booked: 'Booked',
  lost: 'Lost',
};

export function groupOf(lead: Lead, now: number): Group {
  if (lead.stage === 'lost') return 'lost';
  if (lead.stage === 'booked') return 'booked';
  if (lead.stage === 'ready') return 'ready';
  if (lead.awaitingReplySince !== undefined) return 'reply';
  if (lead.next && FOLLOW_UP_KINDS.has(lead.next.kind) && lead.next.due <= endOfDay(now))
    return 'followup';
  return 'progress';
}

export function needsReply(data: LabData): Lead[] {
  return data.leads
    .filter((l) => isOpen(l.stage) && l.stage !== 'ready' && l.awaitingReplySince !== undefined)
    .sort((a, b) => (a.awaitingReplySince ?? 0) - (b.awaitingReplySince ?? 0));
}

export function readyToBook(data: LabData): Lead[] {
  return data.leads.filter((l) => l.stage === 'ready').sort((a, b) => b.value - a.value);
}

export function followUpsDue(data: LabData, now: number): Lead[] {
  return data.leads
    .filter((l) => groupOf(l, now) === 'followup')
    .sort((a, b) => (a.next?.due ?? 0) - (b.next?.due ?? 0));
}

export interface Appointment {
  booking: Booking;
  lead: Lead;
}

export function appointmentsOn(data: LabData, day: number): Appointment[] {
  const start = startOfDay(day);
  const byId = leadsById(data);
  const out: Appointment[] = [];
  for (const booking of data.bookings) {
    const lead = byId.get(booking.leadId);
    if (lead && booking.start >= start && booking.start < start + DAY) out.push({ booking, lead });
  }
  return out.sort((a, b) => a.booking.start - b.booking.start);
}

// ---------------------------------------------------------------- journey & sources

export type JourneyStepId = 'enquired' | 'contacted' | 'interested' | 'ready' | 'booked' | 'paid';

export interface JourneyStep {
  id: JourneyStepId;
  label: string;
  count: number;
}

export function journey(
  data: LabData,
  start: number,
  end: number,
): { cohort: Lead[]; steps: JourneyStep[] } {
  const cohort = data.leads.filter((l) => l.createdAt >= start && l.createdAt <= end);
  const paidLeads = new Set(
    data.payments.filter((p) => p.status === 'verified').map((p) => p.leadId),
  );
  const reached = (stage: Stage) =>
    cohort.filter((l) => stageIndex(furthestStage(l)) >= stageIndex(stage)).length;
  return {
    cohort,
    steps: [
      { id: 'enquired', label: 'Enquired', count: cohort.length },
      { id: 'contacted', label: 'Replied to', count: reached('contacted') },
      { id: 'interested', label: 'Interested', count: reached('interested') },
      { id: 'ready', label: 'Ready to book', count: reached('ready') },
      { id: 'booked', label: 'Booked', count: reached('booked') },
      {
        id: 'paid',
        label: 'Paid & verified',
        count: cohort.filter((l) => paidLeads.has(l.id)).length,
      },
    ],
  };
}

export interface SourceRow {
  source: SourceId;
  enquiries: number;
  booked: number;
  /** Payments verified in the period, credited to each customer's first source (prototype rule). */
  revenue: number;
  payments: number;
  /** Distinct customers with a payment verified in the period. */
  customers: number;
}

export function sourcePerformance(data: LabData, range: ResolvedRange): SourceRow[] {
  const byId = leadsById(data);
  const verified = verifiedBetween(data, range.start, range.end);
  const rows = SOURCE_IDS.map((source): SourceRow => {
    const cohort = data.leads.filter(
      (l) => l.source === source && l.createdAt >= range.start && l.createdAt <= range.end,
    );
    const paid = verified.filter((p) => byId.get(p.leadId)?.source === source);
    return {
      source,
      enquiries: cohort.length,
      booked: cohort.filter((l) => stageIndex(furthestStage(l)) >= stageIndex('booked')).length,
      revenue: sumAmounts(paid),
      payments: paid.length,
      customers: new Set(paid.map((p) => p.leadId)).size,
    };
  });
  return rows
    .filter((r) => r.enquiries > 0 || r.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || b.enquiries - a.enquiries);
}

export interface SeriesPoint {
  t: number;
  value: number;
  total: number;
}

function series(data: LabData, from: number, to: number, step: number): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  let total = 0;
  for (let t = from; t <= to; t += step) {
    const value = sumAmounts(verifiedBetween(data, t, Math.min(t + step - 1, to)));
    total += value;
    points.push({ t, value, total });
  }
  return points;
}

/** Verified revenue per bucket for the period, and for the whole comparison period. */
export function revenueSeries(
  data: LabData,
  range: ResolvedRange,
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  const step = range.bucket === 'hour' ? HOUR : DAY;
  return {
    current: series(data, range.start, range.end, step),
    previous: series(data, range.compareStart, range.compareSpanEnd, step),
  };
}

// ---------------------------------------------------------------- lead signals & filters

export interface LeadSignals {
  /** 0–3, from transparent rules (provisional — not an AI score). */
  score: number;
  reasons: string[];
}

export function leadSignals(
  lead: Lead,
  lastCustomer: Activity | undefined,
  hadTrial: boolean,
  now: number,
): LeadSignals {
  if (!isOpen(lead.stage)) return { score: 0, reasons: [] };
  let score = 0;
  const reasons: string[] = [];
  if (lead.stage === 'ready') {
    score += 2;
    reasons.push('Ready to book');
  } else if (lead.stage === 'interested') {
    score += 1;
    reasons.push(hadTrial ? 'Trial done' : 'Interested');
  }
  if (lastCustomer && now - lastCustomer.at <= 48 * HOUR) {
    score += 1;
    reasons.push(`Messaged ${ago(lastCustomer.at, now).toLowerCase()}`);
  }
  if (lead.eventDate !== undefined && lead.eventDate - now <= 90 * DAY && lead.eventDate > now) {
    score += 1;
    reasons.push(`${lead.eventLabel} ${inDays(lead.eventDate, now)}`);
  }
  return { score: Math.min(3, score), reasons };
}

export type SavedView = 'open' | 'ready' | 'reply' | 'followup' | 'booked' | 'lost' | 'all';

export const SAVED_VIEWS: { id: SavedView; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'ready', label: 'Ready to book' },
  { id: 'reply', label: 'Needs reply' },
  { id: 'followup', label: 'Follow-ups' },
  { id: 'booked', label: 'Booked' },
  { id: 'lost', label: 'Lost' },
  { id: 'all', label: 'All' },
];

export interface LeadFilter {
  view: SavedView;
  q: string;
  stages: Stage[];
  sources: SourceId[];
  owners: MemberId[];
}

export function inSavedView(lead: Lead, view: SavedView, now: number): boolean {
  if (view === 'all') return true;
  if (view === 'open') return isOpen(lead.stage);
  return groupOf(lead, now) === view;
}

function matchesSearch(lead: Lead, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const digits = needle.replace(/\D/g, '');
  const haystack = [
    lead.name,
    lead.latinName ?? '',
    lead.area,
    SERVICES[lead.service].label,
    lead.eventLabel,
    SOURCES[lead.source].label,
  ]
    .join(' ')
    .toLowerCase();
  if (haystack.includes(needle)) return true;
  return digits.length >= 3 && lead.phone.replace(/\D/g, '').includes(digits);
}

export function filterLeads(
  leads: readonly Lead[],
  filter: LeadFilter,
  now: number,
  ignoreView = false,
): Lead[] {
  return leads.filter(
    (lead) =>
      (ignoreView || inSavedView(lead, filter.view, now)) &&
      (filter.stages.length === 0 || filter.stages.includes(lead.stage)) &&
      (filter.sources.length === 0 || filter.sources.includes(lead.source)) &&
      (filter.owners.length === 0 || filter.owners.includes(lead.owner)) &&
      matchesSearch(lead, filter.q),
  );
}

const GROUP_ORDER: Group[] = ['ready', 'reply', 'followup', 'progress', 'booked', 'lost'];

export function sortWithinGroup(group: Group, leads: Lead[]): Lead[] {
  const copy = [...leads];
  switch (group) {
    case 'ready':
      return copy.sort((a, b) => b.value - a.value);
    case 'reply':
      return copy.sort((a, b) => (a.awaitingReplySince ?? 0) - (b.awaitingReplySince ?? 0));
    case 'followup':
      return copy.sort((a, b) => (a.next?.due ?? 0) - (b.next?.due ?? 0));
    case 'progress':
      return copy.sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage) || b.value - a.value);
    case 'booked':
    case 'lost':
      return copy.sort((a, b) => stageEnteredAt(b) - stageEnteredAt(a));
  }
}

export function groupLeads(leads: readonly Lead[], now: number): { group: Group; leads: Lead[] }[] {
  const buckets = new Map<Group, Lead[]>();
  for (const lead of leads) {
    const group = groupOf(lead, now);
    const list = buckets.get(group) ?? [];
    list.push(lead);
    buckets.set(group, list);
  }
  return GROUP_ORDER.filter((g) => buckets.has(g)).map((group) => ({
    group,
    leads: sortWithinGroup(group, buckets.get(group) ?? []),
  }));
}

/** Leads per pipeline column. Booked shows the last 60 days; older bookings are counted. */
export function boardColumns(
  leads: readonly Lead[],
  now: number,
): { stage: Stage; leads: Lead[]; hidden: number }[] {
  const columns: Stage[] = ['new', 'contacted', 'interested', 'ready', 'booked'];
  return columns.map((stage) => {
    const all = leads.filter((l) => l.stage === stage);
    if (stage !== 'booked') {
      return {
        stage,
        leads: sortWithinGroup(stage === 'ready' ? 'ready' : 'progress', all),
        hidden: 0,
      };
    }
    const recent = all.filter((l) => stageEnteredAt(l) >= now - 60 * DAY);
    return { stage, leads: sortWithinGroup('booked', recent), hidden: all.length - recent.length };
  });
}

/** Board stages a saved view can contain (refined concept): columns always add up to the view. */
export function stagesForView(view: SavedView): Stage[] {
  switch (view) {
    case 'ready':
      return ['ready'];
    case 'booked':
      return ['booked'];
    case 'lost':
      return ['lost'];
    case 'all':
      return ['new', 'contacted', 'interested', 'ready', 'booked', 'lost'];
    default:
      return ['new', 'contacted', 'interested', 'ready'];
  }
}

/** Every lead in the view, in its stage column — no hidden rows, so counts always match. */
export function viewColumns(
  leads: readonly Lead[],
  view: SavedView,
): { stage: Stage; leads: Lead[] }[] {
  return stagesForView(view).map((stage) => {
    const inStage = leads.filter((l) => l.stage === stage);
    const group: Group =
      stage === 'ready'
        ? 'ready'
        : stage === 'booked'
          ? 'booked'
          : stage === 'lost'
            ? 'lost'
            : 'progress';
    return { stage, leads: sortWithinGroup(group, inStage) };
  });
}
