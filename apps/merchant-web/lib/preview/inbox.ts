import {
  type Activity,
  type AiAssist,
  type AiIntent,
  type AiSuggestionStatus,
  type Channel,
  type DeliveryStatus,
  type LabData,
  type Lead,
  type MemberId,
} from './domain';
import { MINUTE } from './clock';
import { inr } from './format';
import { SERVICES, SOURCES } from './sample/scenario';

// The Inbox has no fixture of its own: a conversation is a lead's existing message-shaped
// activities (`enquiry`, `message_in`, `message_out`), already seeded for Today, Acquisition and
// the CRM. Nothing fictional is invented here beyond a deterministic, rule-based "AI" read of
// that same data — see `computeAiAssist`.

const MESSAGE_KINDS = new Set<Activity['kind']>(['enquiry', 'message_in', 'message_out']);

export interface ConversationMessage {
  activity: Activity;
  direction: 'in' | 'out';
  delivery?: DeliveryStatus;
}

export function messagesFor(data: LabData, leadId: string): ConversationMessage[] {
  return data.activities
    .filter((a) => a.leadId === leadId && MESSAGE_KINDS.has(a.kind))
    .slice()
    .sort((a, b) => a.at - b.at)
    .map((activity) => ({
      activity,
      direction: activity.by === 'customer' ? 'in' : 'out',
      delivery: activity.delivery,
    }));
}

export function channelFor(lead: Lead, messages: readonly ConversationMessage[]): Channel {
  for (let i = messages.length - 1; i >= 0; i--) {
    const channel = messages[i]?.activity.channel;
    if (channel) return channel;
  }
  return SOURCES[lead.source].channel;
}

/** Simulated delivery progress for one outgoing message, from elapsed time since it was sent. */
export function deliveryStatus(activity: Activity, now: number): DeliveryStatus {
  if (activity.delivery) return activity.delivery;
  const elapsed = now - activity.at;
  if (elapsed < MINUTE) return 'sent';
  if (elapsed < 3 * MINUTE) return 'delivered';
  return 'read';
}

// ---------------------------------------------------------------- simulated AI triage

/** Intents a person must always handle, regardless of confidence (mirrors `triage.py`). */
const HUMAN_ONLY_INTENTS: ReadonlySet<AiIntent> = new Set(['complaint', 'spam']);
const MIN_CONFIDENCE = 0.6;

const INTENT_LABEL: Record<AiIntent, string> = {
  booking_request: 'Ready to book',
  price_enquiry: 'Asking about pricing',
  support: 'Needs support',
  complaint: 'Complaint',
  spam: 'Looks like spam',
  other: 'General enquiry',
};

function hashOf(id: string, salt: number): number {
  let h = salt + 1;
  for (const char of id) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/** Deterministic pseudo-random in [0, 1) from a lead id and a salt — stable across renders. */
function pseudo(id: string, salt: number): number {
  return (hashOf(id, salt) % 1000) / 1000;
}

function intentFor(lead: Lead): AiIntent {
  if (lead.stage === 'ready' || lead.stage === 'booked') return 'booking_request';
  const r = pseudo(lead.id, 1);
  if (r < 0.04) return 'complaint';
  if (r < 0.07) return 'spam';
  if (r < 0.5) return 'price_enquiry';
  if (r < 0.8) return 'support';
  return 'other';
}

function missingInfoFor(lead: Lead): string[] {
  const missing: string[] = [];
  if (lead.value === 0) missing.push('Package budget');
  if (lead.eventDate === undefined) missing.push('Event date');
  if (lead.source === 'referral' && !lead.sourceDetail?.trim()) missing.push('Who referred them');
  return missing;
}

function recommendedActionFor(intent: AiIntent, reviewReason: string | null): string {
  if (reviewReason) {
    switch (intent) {
      case 'complaint':
        return 'Escalate to the owner before replying — do not offer a resolution yourself.';
      case 'spam':
        return 'Likely spam. Close the conversation without engaging.';
      default:
        return 'Confidence is too low to propose a reply. Read the thread and reply yourself.';
    }
  }
  switch (intent) {
    case 'booking_request':
      return 'Send the reply and confirm the booking details.';
    case 'price_enquiry':
      return 'Send the reply, then offer a trial once they share their date.';
    case 'support':
      return 'Send the reply to resolve their question.';
    default:
      return 'Send the reply and keep the thread moving.';
  }
}

const REPLY_TEMPLATES: ((firstName: string, serviceLabel: string, eventLabel: string) => string)[] =
  [
    (firstName, serviceLabel, eventLabel) =>
      `Hi ${firstName}, thank you for reaching out! We'd love to help with your ${eventLabel.toLowerCase()}. Could you share your date so we can check availability for ${serviceLabel.toLowerCase()}?`,
    (firstName, serviceLabel) =>
      `Hi ${firstName}! Thanks for your patience. I'll share our ${serviceLabel.toLowerCase()} options and pricing shortly — would a quick call work to go over what you need?`,
    (firstName, serviceLabel, eventLabel) =>
      `Hello ${firstName}, apologies for the delay! We're excited to help with your ${eventLabel.toLowerCase()}. Let us know a good time to call so we can confirm the details for ${serviceLabel.toLowerCase()}.`,
  ];

/**
 * Simulated development-preview AI triage for one lead's conversation. Deterministic (same input
 * → same output) and purely derived from existing fields — nothing here calls a model.
 * `version` cycles through the reply templates for "Regenerate".
 */
export function computeAiAssist(lead: Lead, version: number): AiAssist {
  const intent = intentFor(lead);
  const confidence = Math.round((0.55 + pseudo(lead.id, 2) * 0.44) * 100) / 100;
  const reviewReason = HUMAN_ONLY_INTENTS.has(intent)
    ? `Intent '${intent}' always requires human handling`
    : confidence < MIN_CONFIDENCE
      ? `Confidence ${confidence.toFixed(2)} is below ${MIN_CONFIDENCE.toFixed(2)}`
      : null;

  const firstName = (lead.latinName ?? lead.name).split(' ')[0] ?? 'there';
  const service = SERVICES[lead.service];
  const missingInfo = missingInfoFor(lead);
  const valueText = lead.value > 0 ? ` for ${inr(lead.value)}` : '';
  const summary = `${firstName} is asking about ${service.label.toLowerCase()} for their ${lead.eventLabel.toLowerCase()}${valueText}.`;

  const template = REPLY_TEMPLATES[version % REPLY_TEMPLATES.length];
  const suggestedReply =
    reviewReason || !template ? null : template(firstName, service.label, lead.eventLabel);

  return {
    intent,
    confidence,
    summary,
    missingInfo,
    suggestedReply,
    recommendedAction: recommendedActionFor(intent, reviewReason),
    reviewReason,
  };
}

export const AI_INTENT_LABEL = INTENT_LABEL;

// ---------------------------------------------------------------- conversations

export type InboxTab = 'all' | 'mine' | 'unassigned' | 'needs_review' | 'closed';

export interface Conversation {
  lead: Lead;
  messages: ConversationMessage[];
  channel: Channel;
  lastMessage: ConversationMessage | undefined;
  lastAt: number;
  unread: boolean;
  assignee: MemberId | null;
  closed: boolean;
  ai: AiAssist;
  aiStatus: AiSuggestionStatus;
  needsReview: boolean;
}

export function buildConversation(
  lead: Lead,
  data: LabData,
  opts: {
    assignee: MemberId | null;
    closed: boolean;
    readAt: number;
    suggestionVersion: number;
    suggestionStatus: AiSuggestionStatus;
  },
): Conversation {
  const messages = messagesFor(data, lead.id);
  const lastMessage = messages[messages.length - 1];
  const lastAt = lastMessage?.activity.at ?? lead.createdAt;
  const ai = computeAiAssist(lead, opts.suggestionVersion);
  return {
    lead,
    messages,
    channel: channelFor(lead, messages),
    lastMessage,
    lastAt,
    unread: lastMessage?.direction === 'in' && lastAt > opts.readAt,
    assignee: opts.assignee,
    closed: opts.closed,
    ai,
    aiStatus: opts.suggestionStatus,
    needsReview:
      !opts.closed &&
      opts.suggestionStatus !== 'dismissed' &&
      (ai.reviewReason !== null || opts.suggestionStatus === 'escalated'),
  };
}

export function matchesInboxTab(
  conversation: Conversation,
  tab: InboxTab,
  viewer: MemberId,
): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'mine':
      return !conversation.closed && conversation.assignee === viewer;
    case 'unassigned':
      return !conversation.closed && conversation.assignee === null;
    case 'needs_review':
      return conversation.needsReview;
    case 'closed':
      return conversation.closed;
  }
}

function matchesSearch(conversation: Conversation, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const lead = conversation.lead;
  const digits = needle.replace(/\D/g, '');
  const haystack = [lead.name, lead.latinName ?? '', lead.area, lead.eventLabel]
    .join(' ')
    .toLowerCase();
  if (haystack.includes(needle)) return true;
  return digits.length >= 3 && lead.phone.replace(/\D/g, '').includes(digits);
}

export interface InboxFilter {
  tab: InboxTab;
  q: string;
}

export function filterConversations(
  conversations: readonly Conversation[],
  filter: InboxFilter,
  viewer: MemberId,
): Conversation[] {
  return conversations
    .filter((c) => matchesInboxTab(c, filter.tab, viewer) && matchesSearch(c, filter.q))
    .sort((a, b) => b.lastAt - a.lastAt);
}
