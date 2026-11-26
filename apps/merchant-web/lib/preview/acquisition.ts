// Provisional frontend models for customer acquisition: sources, lead-capture forms and
// tracking links.
//
// NOTHING HERE IS A CONTRACT. core-api exposes no acquisition endpoints
// (packages/contracts/openapi/core-api.json), and attribution rules are an open product
// question (issues #7–#12). These types are deliberately kept out of @krinly/contracts so the
// generated production contracts stay the single source of truth for what the API really
// supports. When the real contract lands, replace this module and the fixtures that feed it —
// the feature components in `features/acquisition/` take all of it as props.

import type { IconName } from '@krinly/ui/components/icon';
import type { SourceId } from './domain';

/* ── Sources ─────────────────────────────────────────────────────────────── */

/**
 * How enquiries from a source reach Krinly today. The distinction is the whole point of the
 * screen: a merchant must never be led to believe a channel is connected when it is not.
 */
export type SourceState =
  /** Krinly records these itself: a lead form submission or a tracking link. */
  | 'configured'
  /** Somebody types the enquiry in. Honest, and the only option until integrations exist. */
  | 'manual'
  /** Automatic capture needs an external integration that has not been built. */
  | 'needs-integration';

export const SOURCE_STATE_LABEL: Record<SourceState, string> = {
  configured: 'Capturing',
  manual: 'Recorded by hand',
  'needs-integration': 'Not connected',
};

export interface AcquisitionSource {
  id: string;
  label: string;
  icon: IconName;
  state: SourceState;
  /** One line, in the merchant's words, about how enquiries from here get recorded. */
  how: string;
  /** Which fixture source its historical numbers come from; absent means none yet. */
  leadSource?: SourceId;
  /** What would have to be built, when `state` is `needs-integration`. */
  integration?: string;
  active: boolean;
  /** True for sources the merchant added themselves. */
  custom?: boolean;
}

export const DEFAULT_SOURCES: readonly AcquisitionSource[] = [
  {
    id: 'instagram',
    label: 'Instagram profile',
    icon: 'camera',
    state: 'needs-integration',
    how: 'Someone writes down enquiries that come from your profile. Krinly cannot see them.',
    leadSource: 'instagram',
    integration: 'Instagram messaging integration',
    active: true,
  },
  {
    id: 'instagram_ads',
    label: 'Instagram ads',
    icon: 'megaphone',
    state: 'needs-integration',
    how: 'Lead-ad enquiries are recorded by hand until the Meta lead-ads connection is built.',
    leadSource: 'instagram_ads',
    integration: 'Meta lead-ads webhook (issue #11)',
    active: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'message',
    state: 'needs-integration',
    how: 'No enquiry is attributed to WhatsApp yet. Replies happen in WhatsApp itself.',
    integration: 'WhatsApp Business messaging integration',
    active: true,
  },
  {
    id: 'google',
    label: 'Google Search and Maps',
    icon: 'globe',
    state: 'manual',
    how: 'Recorded when a customer says they found you on Google. A tracking link attributes it for you.',
    leadSource: 'google',
    active: true,
  },
  {
    id: 'website',
    label: 'Website',
    icon: 'panel',
    state: 'configured',
    how: 'Your bridal enquiry form is live. Every submission becomes an enquiry automatically.',
    leadSource: 'website',
    active: true,
  },
  {
    id: 'referral',
    label: 'Referrals',
    icon: 'referral',
    state: 'manual',
    how: 'Add the customer who referred them when you record the enquiry.',
    leadSource: 'referral',
    active: true,
  },
  {
    id: 'wedding_fair',
    label: 'Campaigns and events',
    icon: 'ticket',
    state: 'manual',
    how: 'Recorded at the stall. A QR code on your banner attributes enquiries without typing.',
    leadSource: 'wedding_fair',
    active: true,
  },
  {
    id: 'walk_in',
    label: 'Offline enquiries',
    icon: 'store',
    state: 'manual',
    how: 'Walk-ins and phone calls, typed in by whoever took them.',
    leadSource: 'walk_in',
    active: true,
  },
  {
    id: 'custom-magazine',
    label: 'Bridal magazine feature',
    icon: 'note',
    state: 'manual',
    how: 'Added by you in March. Nothing has been attributed to it yet.',
    active: true,
    custom: true,
  },
];

/* ── Lead-capture forms ──────────────────────────────────────────────────── */

export type FormFieldId =
  | 'name'
  | 'phone'
  | 'email'
  | 'service'
  | 'event_date'
  | 'area'
  | 'budget'
  | 'referred_by'
  | 'message';

export interface FormFieldSpec {
  id: FormFieldId;
  label: string;
  /** Rendered control in the customer-facing form. */
  control: 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea';
  /** Why a merchant would ask for it. */
  hint?: string;
  /** Name and phone identify the customer, so they cannot be switched off. */
  locked?: boolean;
}

/** Every customer detail a Krinly lead form can ask for. */
export const FORM_FIELDS: readonly FormFieldSpec[] = [
  { id: 'name', label: 'Full name', control: 'text', locked: true },
  { id: 'phone', label: 'Phone number', control: 'tel', locked: true },
  { id: 'email', label: 'Email', control: 'email' },
  { id: 'service', label: 'Service they want', control: 'select' },
  { id: 'event_date', label: 'Event date', control: 'date' },
  { id: 'area', label: 'Area', control: 'text', hint: 'Helps you plan travel' },
  { id: 'budget', label: 'Budget', control: 'select' },
  { id: 'referred_by', label: 'Who referred you', control: 'text' },
  { id: 'message', label: 'Anything else', control: 'textarea' },
];

export interface FormFieldConfig {
  id: FormFieldId;
  enabled: boolean;
  required: boolean;
}

export interface LeadForm {
  id: string;
  title: string;
  description: string;
  /** Last path segment of the form's address. */
  slug: string;
  sourceId: string;
  fields: readonly FormFieldConfig[];
  /** What the customer sees after submitting. */
  confirmation: string;
  active: boolean;
  createdAt: number;
  /** Fictional counters so the list has something to compare. Never real. */
  views: number;
  submissions: number;
}

export function fieldSpec(id: FormFieldId): FormFieldSpec {
  const spec = FORM_FIELDS.find((f) => f.id === id);
  if (!spec) throw new Error(`Unknown form field: ${id}`);
  return spec;
}

export function enabledFields(form: LeadForm): FormFieldConfig[] {
  return FORM_FIELDS.flatMap((spec) => {
    const config = form.fields.find((f) => f.id === spec.id);
    return config?.enabled ? [config] : [];
  });
}

/* ── Tracking links ──────────────────────────────────────────────────────── */

export interface TrackingLink {
  id: string;
  campaign: string;
  sourceId: string;
  /** The form the link opens. */
  formId: string;
  /** Short code in the address. */
  code: string;
  createdAt: number;
  /** Fictional counters. */
  opens: number;
  enquiries: number;
  active: boolean;
}

/**
 * The development address a form or tracking link opens. Deliberately a localhost URL: the
 * preview must never show something that looks like a live public link, and the QR codes it
 * renders have to scan to a page that actually exists.
 */
export const PREVIEW_ORIGIN = 'http://localhost:3000';

export function formUrl(form: LeadForm): string {
  return `${PREVIEW_ORIGIN}/preview/f/${form.slug}`;
}

export function trackingUrl(link: TrackingLink, form: LeadForm | undefined): string {
  const slug = form?.slug ?? 'enquiry';
  return `${PREVIEW_ORIGIN}/preview/f/${slug}?k=${link.code}`;
}

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const ALL_ON = (ids: readonly FormFieldId[], required: readonly FormFieldId[]): FormFieldConfig[] =>
  FORM_FIELDS.map((spec) => ({
    id: spec.id,
    enabled: spec.locked === true || ids.includes(spec.id),
    required: spec.locked === true || required.includes(spec.id),
  }));

export function createForms(now: number): LeadForm[] {
  const DAY = 86_400_000;
  return [
    {
      id: 'form-bridal',
      title: 'Bridal enquiry',
      description:
        'Tell us about your wedding and we will send you package details within one working day.',
      slug: 'bridal-enquiry',
      sourceId: 'website',
      fields: ALL_ON(['service', 'event_date', 'area', 'budget', 'message'], ['service']),
      confirmation:
        'Thank you. Kesar Bridal Studio has your enquiry and will reply on WhatsApp within one working day.',
      active: true,
      createdAt: now - 96 * DAY,
      views: 1284,
      submissions: 96,
    },
    {
      id: 'form-party',
      title: 'Party and family makeup',
      description: 'Smaller bookings — parties, receptions and family packages.',
      slug: 'party-makeup',
      sourceId: 'instagram',
      fields: ALL_ON(['service', 'event_date', 'message'], []),
      confirmation: 'Thank you. We will call you to confirm the date.',
      active: false,
      createdAt: now - 21 * DAY,
      views: 143,
      submissions: 7,
    },
  ];
}

export function createLinks(now: number): TrackingLink[] {
  const DAY = 86_400_000;
  return [
    {
      id: 'link-ig-bio',
      campaign: 'Instagram bio link',
      sourceId: 'instagram',
      formId: 'form-bridal',
      code: 'ig-bio',
      createdAt: now - 88 * DAY,
      opens: 742,
      enquiries: 41,
      active: true,
    },
    {
      id: 'link-fair',
      campaign: 'Bengaluru Wedding Fair · stall QR',
      sourceId: 'wedding_fair',
      formId: 'form-bridal',
      code: 'fair-nov',
      createdAt: now - 26 * DAY,
      opens: 318,
      enquiries: 34,
      active: true,
    },
    {
      id: 'link-google',
      campaign: 'Google Business Profile',
      sourceId: 'google',
      formId: 'form-bridal',
      code: 'gbp',
      createdAt: now - 52 * DAY,
      opens: 206,
      enquiries: 18,
      active: true,
    },
  ];
}
