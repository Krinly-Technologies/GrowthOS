// Prototype domain model. Shapes are deliberately close to the Phase 01 draft but are NOT a
// contract: lead entities and stage values belong to issue #7, and verification/attribution
// rules are undecided. Everything here is fictional sample data.

/** Provisional stages (pending #7). */
export const STAGES = ['new', 'contacted', 'interested', 'ready', 'booked', 'lost'] as const;
export type Stage = (typeof STAGES)[number];

/** Board columns, in journey order. Lost is shown separately. */
export const PIPELINE: readonly Stage[] = ['new', 'contacted', 'interested', 'ready', 'booked'];
export const OPEN_STAGES: readonly Stage[] = ['new', 'contacted', 'interested', 'ready'];

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  ready: 'Ready to book',
  booked: 'Booked',
  lost: 'Lost',
};

export function stageIndex(stage: Stage): number {
  return PIPELINE.indexOf(stage);
}

export function isOpen(stage: Stage): boolean {
  return OPEN_STAGES.includes(stage);
}

export type SourceId =
  'instagram_ads' | 'instagram' | 'google' | 'referral' | 'wedding_fair' | 'website' | 'walk_in';

export type Channel = 'whatsapp' | 'instagram' | 'call' | 'email' | 'visit' | 'web';

export type MemberId = 'farah' | 'rohan' | 'divya' | 'lakshmi';

export type ServiceId =
  | 'bridal_signature'
  | 'bridal_classic'
  | 'engagement'
  | 'pre_bridal'
  | 'party'
  | 'mehendi'
  | 'family';

export type ActivityKind =
  | 'enquiry'
  | 'message_in'
  | 'message_out'
  | 'call'
  | 'visit'
  | 'note'
  | 'stage'
  | 'trial'
  | 'quotation'
  | 'payment'
  | 'suggestion';

export type Actor = MemberId | 'customer' | 'assistant';

export interface Suggestion {
  to: Stage;
  reason: string;
  status: 'open' | 'applied' | 'dismissed';
}

export interface Activity {
  id: string;
  leadId: string;
  at: number;
  kind: ActivityKind;
  by: Actor;
  channel?: Channel;
  text: string;
  from?: Stage;
  to?: Stage;
  amount?: number;
  suggestion?: Suggestion;
}

export type NextActionKind =
  'reply' | 'follow_up' | 'quotation' | 'call' | 'trial' | 'meeting' | 'payment';

export interface NextAction {
  kind: NextActionKind;
  label: string;
  due: number;
}

export interface StageMark {
  stage: Stage;
  at: number;
}

export interface Lead {
  id: string;
  /** Name as the customer wrote it — may be Devanagari or Tamil. */
  name: string;
  /** Latin transliteration for search, when `name` is not Latin. */
  latinName?: string;
  phone: string;
  area: string;
  service: ServiceId;
  eventLabel: string;
  eventDate?: number;
  /** Estimated or quoted package value, in rupees. */
  value: number;
  stage: Stage;
  history: StageMark[];
  source: SourceId;
  sourceDetail?: string;
  owner: MemberId;
  createdAt: number;
  awaitingReplySince?: number;
  next?: NextAction;
  lostReason?: string;
}

export type PaymentMethod = 'UPI' | 'Bank transfer' | 'Card' | 'Cash';
export type PaymentKind = 'Advance' | 'Balance' | 'Full payment';

export interface Payment {
  id: string;
  leadId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  kind: PaymentKind;
  recordedAt: number;
  recordedBy: MemberId;
  status: 'recorded' | 'verified';
  verifiedAt?: number;
}

export interface Booking {
  id: string;
  leadId: string;
  kind: 'trial' | 'consultation' | 'event';
  title: string;
  start: number;
  minutes: number;
  with: MemberId;
}

export interface LabData {
  leads: Lead[];
  activities: Activity[];
  payments: Payment[];
  bookings: Booking[];
}
