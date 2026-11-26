import type { Channel, MemberId, ServiceId, SourceId } from '../domain';

// Fictional business. Any resemblance to a real studio is coincidental.
export const BUSINESS = {
  name: 'Kesar Bridal Studio',
  shortName: 'Kesar',
  area: 'Jayanagar, Bengaluru',
  monogram: 'K',
} as const;

export interface Member {
  id: MemberId;
  name: string;
  firstName: string;
  role: string;
  initials: string;
  /** Avatar tint hue (OKLCH degrees); avatars are initials only, never photos. */
  hue: number;
}

export const TEAM: Record<MemberId, Member> = {
  farah: {
    id: 'farah',
    name: 'Farah Qureshi',
    firstName: 'Farah',
    role: 'Owner',
    initials: 'FQ',
    hue: 160,
  },
  rohan: {
    id: 'rohan',
    name: 'Rohan Pillai',
    firstName: 'Rohan',
    role: 'Sales',
    initials: 'RP',
    hue: 250,
  },
  divya: {
    id: 'divya',
    name: 'Divya Nair',
    firstName: 'Divya',
    role: 'Front desk',
    initials: 'DN',
    hue: 60,
  },
  lakshmi: {
    id: 'lakshmi',
    name: 'Lakshmi Rao',
    firstName: 'Lakshmi',
    role: 'Lead artist',
    initials: 'LR',
    hue: 330,
  },
};

export const MEMBER_IDS: MemberId[] = ['farah', 'rohan', 'divya', 'lakshmi'];

/** The person viewing the prototype. */
export const VIEWER: MemberId = 'farah';

export interface SourceInfo {
  id: SourceId;
  label: string;
  short: string;
  channel: Channel;
}

export const SOURCES: Record<SourceId, SourceInfo> = {
  instagram_ads: {
    id: 'instagram_ads',
    label: 'Instagram ads',
    short: 'IG ads',
    channel: 'whatsapp',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram profile',
    short: 'Instagram',
    channel: 'instagram',
  },
  google: { id: 'google', label: 'Google search', short: 'Google', channel: 'call' },
  referral: { id: 'referral', label: 'Referral', short: 'Referral', channel: 'whatsapp' },
  wedding_fair: { id: 'wedding_fair', label: 'Wedding fair', short: 'Fair', channel: 'visit' },
  website: { id: 'website', label: 'Website form', short: 'Website', channel: 'web' },
  walk_in: { id: 'walk_in', label: 'Walk-in', short: 'Walk-in', channel: 'visit' },
};

export const SOURCE_IDS: SourceId[] = [
  'instagram_ads',
  'referral',
  'wedding_fair',
  'google',
  'instagram',
  'website',
  'walk_in',
];

export interface ServiceInfo {
  id: ServiceId;
  label: string;
  short: string;
  price: number;
}

export const SERVICES: Record<ServiceId, ServiceInfo> = {
  bridal_signature: {
    id: 'bridal_signature',
    label: 'Signature bridal',
    short: 'Signature bridal',
    price: 72000,
  },
  bridal_classic: {
    id: 'bridal_classic',
    label: 'Classic bridal',
    short: 'Classic bridal',
    price: 48000,
  },
  engagement: { id: 'engagement', label: 'Engagement look', short: 'Engagement', price: 18000 },
  pre_bridal: {
    id: 'pre_bridal',
    label: 'Pre-bridal skin & hair',
    short: 'Pre-bridal',
    price: 24000,
  },
  party: { id: 'party', label: 'Party makeup', short: 'Party', price: 6500 },
  mehendi: { id: 'mehendi', label: 'Mehendi-day styling', short: 'Mehendi', price: 12000 },
  family: { id: 'family', label: 'Family package', short: 'Family', price: 45000 },
};

export const SERVICE_IDS: ServiceId[] = [
  'bridal_signature',
  'bridal_classic',
  'engagement',
  'pre_bridal',
  'party',
  'mehendi',
  'family',
];

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  call: 'Call',
  email: 'Email',
  visit: 'In person',
  web: 'Website',
};

export const LOST_REASONS = [
  'Chose another studio',
  'Over budget',
  'Date not available',
  'No response',
  'Plans changed',
] as const;
