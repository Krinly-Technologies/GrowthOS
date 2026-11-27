// Automation, Knowledge Base and AI Assistant configuration — Phase 08. Fictional, provisional
// shapes for the development preview only, kept separate from `domain.ts` (the CRM/revenue
// dataset) because nothing here is read by Today, the CRM, Bookings, Quotations or Payments.
// See CLAUDE.md: AI output is a proposal, never a business mutation, and nothing here sends a
// real message, calls a real model, or processes a real payment.

export type AutomationStatus = 'active' | 'paused' | 'draft';

export type AutomationTriggerId =
  | 'new_enquiry'
  | 'no_reply_24h'
  | 'booking_upcoming'
  | 'lead_inactive'
  | 'payment_outstanding'
  | 'low_confidence_ai'
  | 'booking_confirmed';

export const TRIGGER_LABEL: Record<AutomationTriggerId, string> = {
  new_enquiry: 'A new enquiry arrives',
  no_reply_24h: 'A customer hasn’t heard back in 24 hours',
  booking_upcoming: 'A booking is coming up',
  lead_inactive: 'A lead has gone quiet',
  payment_outstanding: 'A payment is outstanding',
  low_confidence_ai: 'The AI assistant isn’t confident in a reply',
  booking_confirmed: 'A booking is confirmed',
};

export type AutomationActionKind =
  'send_whatsapp' | 'send_email' | 'notify_team' | 'create_task' | 'escalate_human';

export const ACTION_LABEL: Record<AutomationActionKind, string> = {
  send_whatsapp: 'Send a WhatsApp message',
  send_email: 'Send an email',
  notify_team: 'Notify the team',
  create_task: 'Create a follow-up task',
  escalate_human: 'Escalate to a human teammate',
};

export interface AutomationCondition {
  id: string;
  /** Said in words, e.g. "Lead value" — this is a preview, not a rule-builder. */
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string;
}

export interface AutomationActionConfig {
  id: string;
  kind: AutomationActionKind;
  /** The message, note or recipient — in words, never a real send target. */
  detail: string;
}

export interface AutomationRun {
  id: string;
  at: number;
  status: 'success' | 'skipped' | 'failed';
  /** What the simulated run would have done, or why it didn't. */
  summary: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  templateId: string | null;
  status: AutomationStatus;
  trigger: AutomationTriggerId;
  conditions: AutomationCondition[];
  actions: AutomationActionConfig[];
  createdAt: number;
  updatedAt: number;
  runs: AutomationRun[];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTriggerId;
  conditions: AutomationCondition[];
  actions: AutomationActionConfig[];
}

export const AUTOMATION_TEMPLATES: readonly AutomationTemplate[] = [
  {
    id: 'tpl-ack',
    name: 'New enquiry acknowledgement',
    description: 'Thank a new enquiry for reaching out while your team gets to them.',
    trigger: 'new_enquiry',
    conditions: [],
    actions: [
      {
        id: 'a1',
        kind: 'send_whatsapp',
        detail: 'Thanks for reaching out! Someone from our team will reply shortly.',
      },
    ],
  },
  {
    id: 'tpl-followup',
    name: 'Follow-up reminder',
    description: 'Remind your team to follow up when a customer hasn’t heard back.',
    trigger: 'no_reply_24h',
    conditions: [],
    actions: [{ id: 'a1', kind: 'create_task', detail: 'Follow up with this lead' }],
  },
  {
    id: 'tpl-booking-reminder',
    name: 'Booking reminder',
    description: 'Remind a customer ahead of their booking.',
    trigger: 'booking_upcoming',
    conditions: [],
    actions: [{ id: 'a1', kind: 'send_whatsapp', detail: 'Looking forward to seeing you soon!' }],
  },
  {
    id: 'tpl-reengage',
    name: 'Inactive lead re-engagement',
    description: 'Check back in with a lead who has gone quiet.',
    trigger: 'lead_inactive',
    conditions: [
      { id: 'c1', field: 'Days since last reply', operator: 'greater_than', value: '14' },
    ],
    actions: [{ id: 'a1', kind: 'send_whatsapp', detail: 'Just checking in — still interested?' }],
  },
  {
    id: 'tpl-payment-reminder',
    name: 'Outstanding payment reminder',
    description: 'Nudge a customer with money still owed on a confirmed booking.',
    trigger: 'payment_outstanding',
    conditions: [],
    actions: [
      { id: 'a1', kind: 'send_whatsapp', detail: 'A friendly reminder about your balance due.' },
    ],
  },
  {
    id: 'tpl-human-review',
    name: 'Human review escalation',
    description: 'Hand a conversation to a teammate when the assistant is unsure.',
    trigger: 'low_confidence_ai',
    conditions: [],
    actions: [{ id: 'a1', kind: 'escalate_human', detail: 'Route to the on-duty teammate' }],
  },
  {
    id: 'tpl-internal-notify',
    name: 'Internal team notification',
    description: 'Let the team know as soon as a booking is confirmed.',
    trigger: 'booking_confirmed',
    conditions: [],
    actions: [{ id: 'a1', kind: 'notify_team', detail: 'New booking confirmed' }],
  },
];

// ---------------------------------------------------------------- knowledge base

export type KnowledgeCategory =
  'business_info' | 'faq' | 'services_pricing' | 'policies' | 'article';

export const CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  business_info: 'Business information',
  faq: 'Frequently asked questions',
  services_pricing: 'Services & pricing',
  policies: 'Policies',
  article: 'Knowledge articles',
};

export type KnowledgeStatus = 'draft' | 'published';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  body: string;
  status: KnowledgeStatus;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  status: 'processing' | 'ready' | 'failed';
  uploadedAt: number;
}

// ---------------------------------------------------------------- AI assistant configuration

export type AssistantTone = 'friendly' | 'professional' | 'warm' | 'concise';

export const TONE_LABEL: Record<AssistantTone, string> = {
  friendly: 'Friendly',
  professional: 'Professional',
  warm: 'Warm',
  concise: 'Concise',
};

export interface AssistantConfig {
  name: string;
  purpose: string;
  tone: AssistantTone;
  languages: string[];
  businessContext: string;
  replyPreferences: string;
  qualificationQuestions: string[];
  handoffConditions: string[];
  /** Consequential action kinds that always need a human to approve first. */
  requireApprovalFor: string[];
}

// ---------------------------------------------------------------- workspace settings (preview)

export type NotificationKey =
  'new_enquiry' | 'payment_recorded' | 'booking_upcoming' | 'weekly_summary';

export const NOTIFICATION_LABEL: Record<NotificationKey, string> = {
  new_enquiry: 'A new enquiry arrives',
  payment_recorded: 'A payment is recorded',
  booking_upcoming: 'A booking is coming up',
  weekly_summary: 'Weekly performance summary',
};

export type ChannelKey = 'whatsapp' | 'email' | 'sms';

export const CHANNEL_LABEL: Record<ChannelKey, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
};

export type IntegrationKey = 'google_calendar' | 'instagram' | 'razorpay' | 'zapier';

export const INTEGRATION_LABEL: Record<IntegrationKey, string> = {
  google_calendar: 'Google Calendar',
  instagram: 'Instagram',
  razorpay: 'Razorpay',
  zapier: 'Zapier',
};

export interface RegionalPreferences {
  timezone: string;
  currency: string;
  dateFormat: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'resolved';
  updatedAt: number;
}

export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
}
