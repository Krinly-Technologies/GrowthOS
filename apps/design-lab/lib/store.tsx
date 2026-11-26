'use client';

import { createContext, type Dispatch, type ReactNode, useContext, useReducer } from 'react';
import { DAY, endOfDay, LAB_NOW, MINUTE } from './clock';
import {
  type Activity,
  type LabData,
  type Lead,
  type MemberId,
  type PaymentKind,
  type PaymentMethod,
  type ServiceId,
  type SourceId,
  type Stage,
  STAGE_LABEL,
} from './domain';
import { inr } from './format';
import { createSeed, paymentActivities } from './sample';
import { SOURCES, TEAM, VIEWER } from './sample/scenario';
import { omit } from './utils';

// One in-memory store for the whole lab (both concepts, both screens). Nothing is persisted:
// a reload or "Reset" restores the deterministic seed.

/** 'g' is the refined Growth Studio (Phase 02A+); it reuses Concept B's styles. */
export type Concept = 'a' | 'b' | 'g';

export interface LabState {
  /** Fixed lab clock; each change advances it by a minute so new events sort and count correctly. */
  now: number;
  data: LabData;
  seq: number;
  collapsed: Record<Concept, boolean>;
  undo: { label: string; data: LabData } | null;
}

export interface NewLeadInput {
  name: string;
  phone: string;
  service: ServiceId;
  source: SourceId;
  eventDate?: number;
  note: string;
}

export interface NewPaymentInput {
  leadId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  kind: PaymentKind;
}

export type LabAction =
  | { type: 'changeStage'; leadId: string; to: Stage; reason?: string }
  | { type: 'addNote'; leadId: string; text: string }
  | { type: 'logCall'; leadId: string; text: string }
  | { type: 'completeNext'; leadId: string }
  | { type: 'assignOwner'; leadId: string; owner: MemberId }
  | { type: 'applySuggestion'; activityId: string }
  | { type: 'dismissSuggestion'; activityId: string }
  | { type: 'addLead'; input: NewLeadInput }
  | { type: 'recordPayment'; input: NewPaymentInput }
  | { type: 'verifyPayment'; paymentId: string }
  | { type: 'toggleCollapsed'; concept: Concept }
  | { type: 'undo' }
  | { type: 'reset' };

export function createInitialState(): LabState {
  return {
    now: LAB_NOW,
    data: createSeed(),
    seq: 0,
    collapsed: { a: false, b: false, g: false },
    undo: null,
  };
}

function updateLead(data: LabData, leadId: string, update: (lead: Lead) => Lead): LabData {
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

export function labReducer(state: LabState, action: LabAction): LabState {
  const now = state.now + MINUTE;
  const seq = state.seq + 1;
  const id = `x${seq.toString()}`;
  const find = (leadId: string) => state.data.leads.find((l) => l.id === leadId);

  switch (action.type) {
    case 'changeStage': {
      const lead = find(action.leadId);
      if (!lead || lead.stage === action.to) return state;
      const text =
        action.to === 'lost'
          ? `Marked lost — ${action.reason ?? 'No reason given'}`
          : action.to === 'booked'
            ? 'Booked'
            : `Moved to ${STAGE_LABEL[action.to]}`;
      let data = updateLead(state.data, lead.id, (l) =>
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
        ...state,
        now,
        seq,
        data,
        undo: { label: `${who} moved to ${STAGE_LABEL[action.to]}`, data: state.data },
      };
    }
    case 'addNote': {
      const text = action.text.trim();
      if (!text || !find(action.leadId)) return state;
      const data = withActivity(state.data, {
        id,
        leadId: action.leadId,
        at: now,
        kind: 'note',
        by: VIEWER,
        text,
      });
      return { ...state, now, seq, data, undo: null };
    }
    case 'logCall': {
      const lead = find(action.leadId);
      if (!lead) return state;
      let data = updateLead(state.data, lead.id, (l) => {
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
      return { ...state, now, seq, data, undo: { label: 'Call logged', data: state.data } };
    }
    case 'completeNext': {
      const lead = find(action.leadId);
      if (!lead?.next) return state;
      const label = lead.next.label;
      const wasReply = lead.next.kind === 'reply';
      let data = updateLead(state.data, lead.id, (l) =>
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
      return {
        ...state,
        now,
        seq,
        data,
        undo: { label: `Marked “${label}” done`, data: state.data },
      };
    }
    case 'assignOwner': {
      const lead = find(action.leadId);
      if (!lead || lead.owner === action.owner) return state;
      let data = updateLead(state.data, lead.id, (l) => ({ ...l, owner: action.owner }));
      data = withActivity(data, {
        id,
        leadId: lead.id,
        at: now,
        kind: 'note',
        by: VIEWER,
        text: `Assigned to ${TEAM[action.owner].name}`,
      });
      return {
        ...state,
        now,
        seq,
        data,
        undo: { label: `Assigned to ${TEAM[action.owner].firstName}`, data: state.data },
      };
    }
    case 'applySuggestion':
    case 'dismissSuggestion': {
      const activity = state.data.activities.find((a) => a.id === action.activityId);
      const suggestion = activity?.suggestion;
      if (!activity || suggestion?.status !== 'open') return state;
      const status = action.type === 'applySuggestion' ? 'applied' : 'dismissed';
      const marked: LabState = {
        ...state,
        data: {
          ...state.data,
          activities: state.data.activities.map((a) =>
            a.id === activity.id ? { ...a, suggestion: { ...suggestion, status } } : a,
          ),
        },
      };
      if (status === 'dismissed') return { ...marked, now, seq, undo: null };
      const applied = labReducer(marked, {
        type: 'changeStage',
        leadId: activity.leadId,
        to: suggestion.to,
      });
      return { ...applied, undo: applied.undo ? { ...applied.undo, data: state.data } : null };
    }
    case 'addLead': {
      const { input } = action;
      const leadId = `ld-new${seq.toString()}`;
      const lead: Lead = {
        id: leadId,
        name: input.name.trim(),
        phone: input.phone,
        area: 'Bengaluru',
        service: input.service,
        eventLabel:
          input.service === 'engagement'
            ? 'Engagement'
            : input.service === 'party'
              ? 'Party'
              : 'Wedding',
        ...(input.eventDate !== undefined ? { eventDate: input.eventDate } : {}),
        value: 0,
        stage: 'new',
        history: [{ stage: 'new', at: now }],
        source: input.source,
        owner: VIEWER,
        createdAt: now,
        next: { kind: 'follow_up', label: 'Send package options', due: endOfDay(now + DAY) },
      };
      const data = withActivity(
        { ...state.data, leads: [lead, ...state.data.leads] },
        {
          id,
          leadId,
          at: now,
          kind: 'enquiry',
          by: VIEWER,
          channel: SOURCES[input.source].channel,
          text: input.note.trim() ? `Added by Farah: ${input.note.trim()}` : 'Added by Farah.',
        },
      );
      return { ...state, now, seq, data, undo: null };
    }
    case 'recordPayment': {
      const { input } = action;
      const lead = find(input.leadId);
      if (!lead || input.amount <= 0) return state;
      const payment = {
        id: `pay-new${seq.toString()}`,
        leadId: lead.id,
        amount: input.amount,
        method: input.method,
        reference:
          input.reference.trim() ||
          (input.method === 'Cash' ? 'Paid at the studio' : 'No reference'),
        kind: input.kind,
        recordedAt: now,
        recordedBy: VIEWER,
        status: 'recorded' as const,
      };
      const data: LabData = {
        ...state.data,
        payments: [payment, ...state.data.payments],
        activities: [...paymentActivities(payment), ...state.data.activities],
      };
      return {
        ...state,
        now,
        seq,
        data,
        undo: { label: `${inr(input.amount)} recorded`, data: state.data },
      };
    }
    case 'verifyPayment': {
      const payment = state.data.payments.find((p) => p.id === action.paymentId);
      if (payment?.status !== 'recorded') return state;
      const verified = { ...payment, status: 'verified' as const, verifiedAt: now };
      const data: LabData = {
        ...state.data,
        payments: state.data.payments.map((p) => (p.id === payment.id ? verified : p)),
        activities: [
          {
            id,
            leadId: payment.leadId,
            at: now,
            kind: 'payment',
            by: VIEWER,
            text: `Verified ${inr(payment.amount)} ${payment.kind.toLowerCase()}`,
            amount: payment.amount,
          },
          ...state.data.activities,
        ],
      };
      return {
        ...state,
        now,
        seq,
        data,
        undo: { label: `${inr(payment.amount)} verified`, data: state.data },
      };
    }
    case 'toggleCollapsed':
      return {
        ...state,
        collapsed: { ...state.collapsed, [action.concept]: !state.collapsed[action.concept] },
      };
    case 'undo':
      return state.undo ? { ...state, data: state.undo.data, undo: null } : state;
    case 'reset':
      return createInitialState();
  }
}

const LabContext = createContext<{ state: LabState; dispatch: Dispatch<LabAction> } | null>(null);

export function LabStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(labReducer, undefined, createInitialState);
  return <LabContext value={{ state, dispatch }}>{children}</LabContext>;
}

export function useLab(): { state: LabState; dispatch: Dispatch<LabAction> } {
  const value = useContext(LabContext);
  if (!value) throw new Error('useLab() must be used inside <LabStoreProvider>');
  return value;
}
