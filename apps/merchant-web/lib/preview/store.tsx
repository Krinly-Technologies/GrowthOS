'use client';

import { createContext, type Dispatch, type ReactNode, useContext, useReducer } from 'react';
import {
  type AcquisitionSource,
  createForms,
  createLinks,
  DEFAULT_SOURCES,
  type FormFieldConfig,
  type LeadForm,
  type TrackingLink,
} from './acquisition';
import { DAY, endOfDay, LAB_NOW, MINUTE } from './clock';
import {
  type Activity,
  type AiSuggestionStatus,
  type LabData,
  type Lead,
  type MemberId,
  type NextActionKind,
  type Payment,
  type ServiceId,
  type SourceId,
  type Stage,
  STAGE_LABEL,
} from './domain';
import { inr } from './format';
import { channelFor, messagesFor } from './inbox';
import { createSeed } from './sample';
import { SOURCES, TEAM, VIEWER } from './sample/scenario';

function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const keySet = new Set<keyof T>(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keySet.has(key as keyof T)),
  ) as Omit<T, K>;
}

// One in-memory store for the whole development preview, so a change made on Today (verifying a
// payment) or in Acquisition (editing a form) is reflected everywhere else immediately. Nothing
// is persisted: a reload restores the deterministic fixtures.

export interface PreviewState {
  /** Fixed clock; each change advances it a minute so new events sort and count correctly. */
  now: number;
  data: LabData;
  sources: readonly AcquisitionSource[];
  forms: readonly LeadForm[];
  links: readonly TrackingLink[];
  /** Inbox: who owns each conversation. `null` is unassigned — distinct from the CRM owner. */
  inboxAssignee: Record<string, MemberId | null>;
  /** Inbox: when each conversation was last opened, for the unread indicator. */
  inboxReadAt: Record<string, number>;
  /** Inbox: conversations a merchant has marked resolved, independent of the CRM stage. */
  inboxClosed: Record<string, boolean>;
  /** Inbox: the simulated AI suggestion's regenerate count and accept/dismiss/escalate state. */
  inboxSuggestion: Record<string, { version: number; status: AiSuggestionStatus }>;
  seq: number;
  undo: { label: string; state: PreviewState } | null;
}

export interface FormDraft {
  title: string;
  description: string;
  slug: string;
  sourceId: string;
  confirmation: string;
  fields: readonly FormFieldConfig[];
  active: boolean;
}

export interface LinkDraft {
  campaign: string;
  sourceId: string;
  formId: string;
}

/** Fields a person fills in to create or edit a lead by hand. */
export interface LeadDraft {
  name: string;
  phone: string;
  area: string;
  service: ServiceId;
  eventLabel: string;
  eventDate?: number;
  value: number;
  source: SourceId;
  sourceDetail?: string;
  owner: MemberId;
}

export type PreviewAction =
  | { type: 'verifyPayment'; paymentId: string }
  | { type: 'toggleSource'; sourceId: string }
  | { type: 'addSource'; label: string }
  | { type: 'createForm'; draft: FormDraft }
  | { type: 'updateForm'; formId: string; draft: FormDraft }
  | { type: 'toggleForm'; formId: string }
  | { type: 'createLink'; draft: LinkDraft }
  | { type: 'toggleLink'; linkId: string }
  | { type: 'createLead'; draft: LeadDraft }
  | { type: 'updateLead'; leadId: string; draft: LeadDraft }
  | { type: 'changeStage'; leadId: string; to: Stage; reason?: string }
  | { type: 'reopenLead'; leadId: string }
  | { type: 'assignOwner'; leadId: string; owner: MemberId }
  | { type: 'addNote'; leadId: string; text: string }
  | { type: 'logCall'; leadId: string; text: string }
  | { type: 'setFollowUp'; leadId: string; label: string; due: number; kind: NextActionKind }
  | { type: 'completeFollowUp'; leadId: string }
  | { type: 'openConversation'; leadId: string }
  | { type: 'sendReply'; leadId: string; text: string }
  | { type: 'assignConversation'; leadId: string; owner: MemberId | null }
  | { type: 'resolveConversation'; leadId: string }
  | { type: 'reopenConversation'; leadId: string }
  | { type: 'regenerateSuggestion'; leadId: string }
  | { type: 'dismissSuggestion'; leadId: string }
  | { type: 'escalateSuggestion'; leadId: string }
  | {
      type: 'applyAiFact';
      leadId: string;
      field: 'eventDate' | 'value';
      value: number;
      label: string;
    }
  | { type: 'undo' }
  | { type: 'reset' };

export function createInitialState(): PreviewState {
  const data = createSeed();
  const inboxAssignee: Record<string, MemberId | null> = {};
  const inboxClosed: Record<string, boolean> = {};
  for (const lead of data.leads) {
    // New, untriaged enquiries start unassigned — everything else keeps its CRM owner.
    inboxAssignee[lead.id] = lead.stage === 'new' ? null : lead.owner;
    inboxClosed[lead.id] = lead.stage === 'lost';
  }
  return {
    now: LAB_NOW,
    data,
    sources: DEFAULT_SOURCES,
    forms: createForms(LAB_NOW),
    links: createLinks(LAB_NOW),
    inboxAssignee,
    inboxReadAt: {},
    inboxClosed,
    inboxSuggestion: {},
    seq: 0,
    undo: null,
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'form'
  );
}

function uniqueSlug(forms: readonly LeadForm[], slug: string, skipId?: string): string {
  const taken = new Set(forms.filter((f) => f.id !== skipId).map((f) => f.slug));
  if (!taken.has(slug)) return slug;
  for (let n = 2; n < 100; n++) {
    const candidate = `${slug}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

function updateLeadData(data: LabData, leadId: string, update: (lead: Lead) => Lead): LabData {
  return { ...data, leads: data.leads.map((l) => (l.id === leadId ? update(l) : l)) };
}

function withActivity(data: LabData, activity: Activity): LabData {
  return { ...data, activities: [activity, ...data.activities] };
}

function moveStage(lead: Lead, to: Stage, at: number, reason?: string): Lead {
  const moved: Lead = {
    ...omit(lead, ['lostReason']),
    stage: to,
    history: [...lead.history, { stage: to, at }],
  };
  if (to === 'lost') {
    return {
      ...omit(moved, ['next', 'awaitingReplySince']),
      lostReason: reason ?? 'No reason given',
    };
  }
  if (
    to === 'ready' &&
    (!moved.next || moved.next.kind === 'reply' || moved.next.kind === 'follow_up')
  ) {
    return {
      ...moved,
      next: { kind: 'payment', label: 'Collect the advance', due: endOfDay(at + DAY) },
    };
  }
  if (to === 'booked') {
    return {
      ...moved,
      next: { kind: 'payment', label: 'Record the advance', due: endOfDay(at + DAY) },
    };
  }
  return moved;
}

function verify(state: PreviewState, payment: Payment, now: number, id: string): PreviewState {
  const verified: Payment = { ...payment, status: 'verified', verifiedAt: now };
  return {
    ...state,
    data: {
      ...state.data,
      payments: state.data.payments.map((p) => (p.id === payment.id ? verified : p)),
      activities: [
        {
          id,
          leadId: payment.leadId,
          at: now,
          kind: 'payment' as const,
          by: VIEWER,
          text: `Verified ${inr(payment.amount)} ${payment.kind.toLowerCase()}`,
          amount: payment.amount,
        },
        ...state.data.activities,
      ],
    },
  };
}

export function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
  const now = state.now + MINUTE;
  const seq = state.seq + 1;
  const id = `x${seq}`;
  const tick = { ...state, now, seq };

  switch (action.type) {
    case 'verifyPayment': {
      const payment = state.data.payments.find((p) => p.id === action.paymentId);
      if (payment?.status !== 'recorded') return state;
      return {
        ...verify(tick, payment, now, id),
        undo: { label: `${inr(payment.amount)} verified`, state },
      };
    }
    case 'toggleSource': {
      const source = state.sources.find((s) => s.id === action.sourceId);
      if (!source) return state;
      return {
        ...tick,
        sources: state.sources.map((s) => (s.id === source.id ? { ...s, active: !s.active } : s)),
        undo: { label: `${source.label} ${source.active ? 'turned off' : 'turned on'}`, state },
      };
    }
    case 'addSource': {
      const label = action.label.trim();
      if (!label) return state;
      const source: AcquisitionSource = {
        id: `custom-${seq}`,
        label,
        icon: 'note',
        state: 'manual',
        how: 'Added by you. Pick it when you record an enquiry by hand.',
        active: true,
        custom: true,
      };
      return {
        ...tick,
        sources: [...state.sources, source],
        undo: { label: `${label} added`, state },
      };
    }
    case 'createForm': {
      const { draft } = action;
      const form: LeadForm = {
        id: `form-${seq}`,
        title: draft.title.trim() || 'Untitled form',
        description: draft.description.trim(),
        slug: uniqueSlug(state.forms, slugify(draft.slug || draft.title)),
        sourceId: draft.sourceId,
        fields: draft.fields,
        confirmation: draft.confirmation.trim() || 'Thank you. We will be in touch shortly.',
        active: draft.active,
        createdAt: now,
        views: 0,
        submissions: 0,
      };
      return {
        ...tick,
        forms: [form, ...state.forms],
        undo: { label: `${form.title} created`, state },
      };
    }
    case 'updateForm': {
      const existing = state.forms.find((f) => f.id === action.formId);
      if (!existing) return state;
      const { draft } = action;
      const updated: LeadForm = {
        ...existing,
        title: draft.title.trim() || existing.title,
        description: draft.description.trim(),
        slug: uniqueSlug(state.forms, slugify(draft.slug || draft.title), existing.id),
        sourceId: draft.sourceId,
        fields: draft.fields,
        confirmation: draft.confirmation.trim() || existing.confirmation,
        active: draft.active,
      };
      return {
        ...tick,
        forms: state.forms.map((f) => (f.id === updated.id ? updated : f)),
        undo: { label: `${updated.title} saved`, state },
      };
    }
    case 'toggleForm': {
      const form = state.forms.find((f) => f.id === action.formId);
      if (!form) return state;
      return {
        ...tick,
        forms: state.forms.map((f) => (f.id === form.id ? { ...f, active: !f.active } : f)),
        undo: { label: `${form.title} ${form.active ? 'deactivated' : 'activated'}`, state },
      };
    }
    case 'createLink': {
      const { draft } = action;
      const campaign = draft.campaign.trim();
      if (!campaign) return state;
      const link: TrackingLink = {
        id: `link-${seq}`,
        campaign,
        sourceId: draft.sourceId,
        formId: draft.formId,
        code: uniqueCode(state.links, slugify(campaign).slice(0, 14)),
        createdAt: now,
        opens: 0,
        enquiries: 0,
        active: true,
      };
      return {
        ...tick,
        links: [link, ...state.links],
        undo: { label: `${campaign} created`, state },
      };
    }
    case 'toggleLink': {
      const link = state.links.find((l) => l.id === action.linkId);
      if (!link) return state;
      return {
        ...tick,
        links: state.links.map((l) => (l.id === link.id ? { ...l, active: !l.active } : l)),
        undo: { label: `${link.campaign} ${link.active ? 'turned off' : 'turned on'}`, state },
      };
    }
    case 'createLead': {
      const { draft } = action;
      const leadId = `lead-${seq.toString()}`;
      const lead: Lead = {
        id: leadId,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        area: draft.area.trim(),
        service: draft.service,
        eventLabel: draft.eventLabel.trim() || 'Event',
        ...(draft.eventDate !== undefined ? { eventDate: draft.eventDate } : {}),
        value: draft.value,
        stage: 'new',
        history: [{ stage: 'new', at: now }],
        source: draft.source,
        ...(draft.sourceDetail?.trim() ? { sourceDetail: draft.sourceDetail.trim() } : {}),
        owner: draft.owner,
        createdAt: now,
        next: { kind: 'follow_up', label: 'Follow up', due: endOfDay(now + DAY) },
      };
      const data = withActivity(
        { ...state.data, leads: [lead, ...state.data.leads] },
        {
          id,
          leadId,
          at: now,
          kind: 'enquiry',
          by: VIEWER,
          channel: SOURCES[draft.source].channel,
          text: `Added by ${TEAM[VIEWER].name}.`,
        },
      );
      return { ...tick, data, undo: { label: `${lead.name} added`, state } };
    }
    case 'updateLead': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const { draft } = action;
      const data = updateLeadData(state.data, lead.id, (l) => {
        const base = omit(l, ['eventDate', 'sourceDetail']);
        return {
          ...base,
          name: draft.name.trim() || l.name,
          phone: draft.phone.trim(),
          area: draft.area.trim(),
          service: draft.service,
          eventLabel: draft.eventLabel.trim() || l.eventLabel,
          ...(draft.eventDate !== undefined ? { eventDate: draft.eventDate } : {}),
          value: draft.value,
          source: draft.source,
          ...(draft.sourceDetail?.trim() ? { sourceDetail: draft.sourceDetail.trim() } : {}),
          owner: draft.owner,
        };
      });
      return {
        ...tick,
        data,
        undo: { label: `${draft.name.trim() || lead.name} updated`, state },
      };
    }
    case 'changeStage': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead || lead.stage === action.to) return state;
      const text =
        action.to === 'lost'
          ? `Marked lost — ${action.reason ?? 'No reason given'}`
          : action.to === 'booked'
            ? 'Booked'
            : `Moved to ${STAGE_LABEL[action.to]}`;
      let data = updateLeadData(state.data, lead.id, (l) =>
        moveStage(l, action.to, now, action.reason),
      );
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'stage',
        by: VIEWER,
        text,
        from: lead.stage,
        to: action.to,
      });
      const who = lead.latinName ?? lead.name;
      return {
        ...tick,
        data,
        undo: { label: `${who} moved to ${STAGE_LABEL[action.to]}`, state },
      };
    }
    case 'reopenLead': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead || lead.stage !== 'lost') return state;
      let data = updateLeadData(state.data, lead.id, (l) => moveStage(l, 'contacted', now));
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'stage',
        by: VIEWER,
        text: 'Reopened',
        from: 'lost',
        to: 'contacted',
      });
      const who = lead.latinName ?? lead.name;
      return { ...tick, data, undo: { label: `${who} reopened`, state } };
    }
    case 'assignOwner': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead || lead.owner === action.owner) return state;
      let data = updateLeadData(state.data, lead.id, (l) => ({ ...l, owner: action.owner }));
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: `Assigned to ${TEAM[action.owner].name}`,
      });
      return {
        ...tick,
        data,
        undo: { label: `Assigned to ${TEAM[action.owner].firstName}`, state },
      };
    }
    case 'addNote': {
      const text = action.text.trim();
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!text || !lead) return state;
      const data = withActivity(state.data, {
        id,
        leadId: action.leadId,
        at: now,
        kind: 'note',
        by: VIEWER,
        text,
      });
      return { ...tick, data, undo: null };
    }
    case 'logCall': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      let data = updateLeadData(state.data, lead.id, (l) => {
        const answered = omit(l, ['awaitingReplySince']);
        return l.next?.kind === 'reply' ? omit(answered, ['next']) : answered;
      });
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'call',
        by: VIEWER,
        channel: 'call',
        text: action.text.trim() || 'Called the customer.',
      });
      return { ...tick, data, undo: { label: 'Call logged', state } };
    }
    case 'setFollowUp': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const label = action.label.trim() || 'Follow up';
      let data = updateLeadData(state.data, lead.id, (l) => ({
        ...l,
        next: { kind: action.kind, label, due: action.due },
      }));
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: `Follow-up set: ${label}`,
      });
      return { ...tick, data, undo: { label: `Follow-up set for ${lead.name}`, state } };
    }
    case 'completeFollowUp': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead?.next) return state;
      const label = lead.next.label;
      const wasReply = lead.next.kind === 'reply';
      let data = updateLeadData(state.data, lead.id, (l) =>
        wasReply ? omit(l, ['next', 'awaitingReplySince']) : omit(l, ['next']),
      );
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: `Done: ${label}`,
      });
      return { ...tick, data, undo: { label: `Marked "${label}" done`, state } };
    }
    case 'openConversation': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      return {
        ...tick,
        inboxReadAt: { ...state.inboxReadAt, [lead.id]: now },
        undo: null,
      };
    }
    case 'sendReply': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      const text = action.text.trim();
      if (!lead || !text) return state;
      const channel = channelFor(lead, messagesFor(state.data, lead.id));
      let data = updateLeadData(state.data, lead.id, (l) => {
        const cleared = omit(l, ['awaitingReplySince']);
        return l.next?.kind === 'reply' ? omit(cleared, ['next']) : cleared;
      });
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'message_out',
        by: VIEWER,
        channel,
        text,
        delivery: 'sent',
      });
      // A sent reply makes any pending suggestion for this lead moot (whether or not it came
      // from the suggestion itself), so the AI assist panel doesn't offer to send it again.
      const pendingSuggestion = state.inboxSuggestion[lead.id] ?? {
        version: 0,
        status: 'open' as const,
      };
      return {
        ...tick,
        data,
        inboxReadAt: { ...state.inboxReadAt, [lead.id]: now },
        inboxSuggestion: {
          ...state.inboxSuggestion,
          [lead.id]: { ...pendingSuggestion, status: 'dismissed' },
        },
        undo: { label: 'Reply sent', state },
      };
    }
    case 'assignConversation': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead || state.inboxAssignee[lead.id] === action.owner) return state;
      const owner = action.owner;
      let data = state.data;
      if (owner) {
        data = updateLeadData(data, lead.id, (l) => ({ ...l, owner }));
        data = withActivity(data, {
          id,
          leadId: lead.id,
          at: now,
          kind: 'note',
          by: VIEWER,
          text: `Assigned to ${TEAM[owner].name}`,
        });
      } else {
        data = withActivity(data, {
          id,
          leadId: lead.id,
          at: now,
          kind: 'note',
          by: VIEWER,
          text: 'Unassigned',
        });
      }
      return {
        ...tick,
        data,
        inboxAssignee: { ...state.inboxAssignee, [lead.id]: owner },
        undo: { label: owner ? `Assigned to ${TEAM[owner].firstName}` : 'Unassigned', state },
      };
    }
    case 'resolveConversation': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead || state.inboxClosed[lead.id]) return state;
      const data = withActivity(state.data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: 'Marked resolved',
      });
      return {
        ...tick,
        data,
        inboxClosed: { ...state.inboxClosed, [lead.id]: true },
        undo: { label: 'Conversation resolved', state },
      };
    }
    case 'reopenConversation': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead || !state.inboxClosed[lead.id]) return state;
      const data = withActivity(state.data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: 'Reopened',
      });
      return {
        ...tick,
        data,
        inboxClosed: { ...state.inboxClosed, [lead.id]: false },
        undo: { label: 'Conversation reopened', state },
      };
    }
    case 'regenerateSuggestion': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const current = state.inboxSuggestion[lead.id] ?? { version: 0, status: 'open' as const };
      return {
        ...tick,
        inboxSuggestion: {
          ...state.inboxSuggestion,
          [lead.id]: { version: current.version + 1, status: 'open' },
        },
        undo: null,
      };
    }
    case 'dismissSuggestion': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const current = state.inboxSuggestion[lead.id] ?? { version: 0, status: 'open' as const };
      return {
        ...tick,
        inboxSuggestion: {
          ...state.inboxSuggestion,
          [lead.id]: { ...current, status: 'dismissed' },
        },
        undo: { label: 'Suggestion dismissed', state },
      };
    }
    case 'escalateSuggestion': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const current = state.inboxSuggestion[lead.id] ?? { version: 0, status: 'open' as const };
      const data = withActivity(state.data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: 'Requested human review',
      });
      return {
        ...tick,
        data,
        inboxSuggestion: {
          ...state.inboxSuggestion,
          [lead.id]: { ...current, status: 'escalated' },
        },
        undo: { label: 'Marked for review', state },
      };
    }
    case 'applyAiFact': {
      const lead = state.data.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const { field, value, label } = action;
      let data = updateLeadData(state.data, lead.id, (l) => ({ ...l, [field]: value }));
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: `Updated ${label} from the conversation`,
      });
      return { ...tick, data, undo: { label: `${label} updated`, state } };
    }
    case 'undo':
      return state.undo ? { ...state.undo.state, undo: null } : state;
    case 'reset':
      return createInitialState();
  }
}

function uniqueCode(links: readonly TrackingLink[], code: string): string {
  const taken = new Set(links.map((l) => l.code));
  if (code && !taken.has(code)) return code || 'link';
  for (let n = 2; n < 100; n++) {
    const candidate = `${code || 'link'}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `link-${Date.now()}`;
}

const PreviewContext = createContext<{
  state: PreviewState;
  dispatch: Dispatch<PreviewAction>;
} | null>(null);

export function PreviewStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(previewReducer, undefined, createInitialState);
  return <PreviewContext value={{ state, dispatch }}>{children}</PreviewContext>;
}

export function usePreview(): { state: PreviewState; dispatch: Dispatch<PreviewAction> } {
  const value = useContext(PreviewContext);
  if (!value) throw new Error('usePreview() must be used inside <PreviewStoreProvider>');
  return value;
}
