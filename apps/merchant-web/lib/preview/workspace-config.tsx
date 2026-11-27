'use client';

import { createContext, type ReactNode, useCallback, useContext, useReducer } from 'react';
import { LAB_NOW } from './clock';
import {
  type Automation,
  type AutomationActionConfig,
  type AutomationCondition,
  AUTOMATION_TEMPLATES,
  type AutomationStatus,
  type AutomationTriggerId,
  type AssistantConfig,
  type ChannelKey,
  type IntegrationKey,
  type KnowledgeCategory,
  type KnowledgeDocument,
  type KnowledgeEntry,
  type KnowledgeStatus,
  type NotificationKey,
  type RegionalPreferences,
} from './workspace-domain';

// A second, deliberately small store, parallel to `store.tsx`. Automation, Knowledge Base and
// Assistant configuration don't feed or read from the CRM/revenue dataset, so they don't belong
// in that 1000+ line reducer — see `workspace-domain.ts` for why these are separate.

export interface WorkspaceConfigState {
  automations: Automation[];
  knowledge: KnowledgeEntry[];
  documents: KnowledgeDocument[];
  assistant: AssistantConfig;
  notifications: Record<NotificationKey, boolean>;
  channels: Record<ChannelKey, boolean>;
  integrations: Record<IntegrationKey, boolean>;
  regional: RegionalPreferences;
  seq: number;
}

function seedAutomations(): Automation[] {
  const [ack, followUp] = AUTOMATION_TEMPLATES;
  if (!ack || !followUp) return [];
  return [
    {
      id: 'auto-1',
      name: ack.name,
      description: ack.description,
      templateId: ack.id,
      status: 'active',
      trigger: ack.trigger,
      conditions: ack.conditions,
      actions: ack.actions,
      createdAt: LAB_NOW - 20 * 86_400_000,
      updatedAt: LAB_NOW - 20 * 86_400_000,
      runs: [
        {
          id: 'run-1',
          at: LAB_NOW - 3_600_000,
          status: 'success',
          summary: 'Sent the acknowledgement to a new enquiry from Instagram.',
        },
        {
          id: 'run-2',
          at: LAB_NOW - 7_200_000,
          status: 'success',
          summary: 'Sent the acknowledgement to a new enquiry from the website form.',
        },
      ],
    },
    {
      id: 'auto-2',
      name: followUp.name,
      description: followUp.description,
      templateId: followUp.id,
      status: 'paused',
      trigger: followUp.trigger,
      conditions: followUp.conditions,
      actions: followUp.actions,
      createdAt: LAB_NOW - 10 * 86_400_000,
      updatedAt: LAB_NOW - 2 * 86_400_000,
      runs: [
        {
          id: 'run-3',
          at: LAB_NOW - 86_400_000,
          status: 'skipped',
          summary: 'Paused before this would have run.',
        },
      ],
    },
  ];
}

function seedKnowledge(): KnowledgeEntry[] {
  const base: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      category: 'business_info',
      title: 'Studio hours & location',
      body: 'Open Tuesday–Sunday, 10am–7pm. Closed Mondays. Studio is in Jubilee Hills, Hyderabad.',
      status: 'published',
      archived: false,
    },
    {
      category: 'faq',
      title: 'Do you travel for destination weddings?',
      body: 'Yes — travel and stay are billed separately and quoted per event.',
      status: 'published',
      archived: false,
    },
    {
      category: 'services_pricing',
      title: 'Bridal signature package',
      body: 'Full bridal look with trial, starting ₹45,000. Includes touch-up kit for the event day.',
      status: 'published',
      archived: false,
    },
    {
      category: 'policies',
      title: 'Cancellation & rescheduling',
      body: 'Full refund up to 14 days before the event; 50% within 14 days; non-refundable within 72 hours.',
      status: 'draft',
      archived: false,
    },
    {
      category: 'article',
      title: 'What to bring to your trial',
      body: 'Reference photos, your outfit (or a swatch), and any jewellery you plan to wear.',
      status: 'published',
      archived: false,
    },
  ];
  return base.map((entry, i) => ({
    ...entry,
    id: `kb-${i + 1}`,
    createdAt: LAB_NOW - (30 - i) * 86_400_000,
    updatedAt: LAB_NOW - (10 - i) * 86_400_000,
  }));
}

function defaultAssistant(): AssistantConfig {
  return {
    name: 'Studio Assistant',
    purpose: 'Answer common questions and qualify new enquiries before a teammate steps in.',
    tone: 'warm',
    languages: ['English', 'Hindi'],
    businessContext:
      'A bridal makeup studio offering trials, bridal packages and party makeup, based in Hyderabad.',
    replyPreferences:
      'Keep replies short, ask one qualifying question at a time, never quote a final price.',
    qualificationQuestions: [
      'What is your event date?',
      'What is the event type?',
      'Which city/venue?',
    ],
    handoffConditions: [
      'Customer asks for a final price or discount',
      'Customer expresses frustration or complains',
      'The assistant is not confident in the right reply',
    ],
    requireApprovalFor: ['Sending a quotation', 'Confirming a booking', 'Recording a payment'],
  };
}

function initialState(): WorkspaceConfigState {
  return {
    automations: seedAutomations(),
    knowledge: seedKnowledge(),
    documents: [],
    assistant: defaultAssistant(),
    notifications: {
      new_enquiry: true,
      payment_recorded: true,
      booking_upcoming: true,
      weekly_summary: false,
    },
    channels: { whatsapp: true, email: true, sms: false },
    integrations: { google_calendar: false, instagram: false, razorpay: false, zapier: false },
    regional: { timezone: 'Asia/Kolkata', currency: 'INR', dateFormat: 'DD MMM YYYY' },
    seq: 1,
  };
}

export interface AutomationDraft {
  name: string;
  description: string;
  trigger: AutomationTriggerId;
  conditions: AutomationCondition[];
  actions: AutomationActionConfig[];
}

export type WorkspaceConfigAction =
  | { type: 'createAutomation'; draft: AutomationDraft; templateId: string | null }
  | { type: 'updateAutomation'; id: string; draft: AutomationDraft }
  | { type: 'setAutomationStatus'; id: string; status: AutomationStatus }
  | { type: 'deleteAutomation'; id: string }
  | { type: 'simulateAutomation'; id: string }
  | {
      type: 'createKnowledge';
      draft: { category: KnowledgeCategory; title: string; body: string; status: KnowledgeStatus };
    }
  | {
      type: 'updateKnowledge';
      id: string;
      draft: { category: KnowledgeCategory; title: string; body: string; status: KnowledgeStatus };
    }
  | { type: 'archiveKnowledge'; id: string }
  | { type: 'deleteKnowledge'; id: string }
  | { type: 'uploadDocument'; id: string; name: string }
  | { type: 'documentReady'; id: string }
  | { type: 'removeDocument'; id: string }
  | { type: 'updateAssistant'; config: AssistantConfig }
  | { type: 'toggleNotification'; key: NotificationKey }
  | { type: 'toggleChannel'; key: ChannelKey }
  | { type: 'toggleIntegration'; key: IntegrationKey }
  | { type: 'updateRegional'; regional: RegionalPreferences };

function simulateRun(automation: Automation, now: number): Automation['runs'][number] {
  if (automation.status !== 'active') {
    return {
      id: `run-${now}`,
      at: now,
      status: 'skipped',
      summary: `Not run — this automation is ${automation.status === 'paused' ? 'paused' : 'still a draft'}.`,
    };
  }
  const actionList = automation.actions.map((a) => a.detail || a.kind).join('; then ');
  return {
    id: `run-${now}`,
    at: now,
    status: 'success',
    summary: `Would trigger on "${automation.trigger}" and: ${actionList || 'take no configured action'}.`,
  };
}

function reducer(state: WorkspaceConfigState, action: WorkspaceConfigAction): WorkspaceConfigState {
  const now = LAB_NOW + state.seq * 60_000;
  switch (action.type) {
    case 'createAutomation': {
      const automation: Automation = {
        id: `auto-${state.seq}`,
        name: action.draft.name,
        description: action.draft.description,
        templateId: action.templateId,
        status: 'draft',
        trigger: action.draft.trigger,
        conditions: action.draft.conditions,
        actions: action.draft.actions,
        createdAt: now,
        updatedAt: now,
        runs: [],
      };
      return { ...state, automations: [automation, ...state.automations], seq: state.seq + 1 };
    }
    case 'updateAutomation':
      return {
        ...state,
        automations: state.automations.map((a) =>
          a.id === action.id ? { ...a, ...action.draft, updatedAt: now } : a,
        ),
        seq: state.seq + 1,
      };
    case 'setAutomationStatus':
      return {
        ...state,
        automations: state.automations.map((a) =>
          a.id === action.id ? { ...a, status: action.status, updatedAt: now } : a,
        ),
        seq: state.seq + 1,
      };
    case 'deleteAutomation':
      return { ...state, automations: state.automations.filter((a) => a.id !== action.id) };
    case 'simulateAutomation':
      return {
        ...state,
        automations: state.automations.map((a) =>
          a.id === action.id ? { ...a, runs: [simulateRun(a, now), ...a.runs] } : a,
        ),
        seq: state.seq + 1,
      };
    case 'createKnowledge': {
      const entry: KnowledgeEntry = {
        id: `kb-${state.seq}`,
        ...action.draft,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, knowledge: [entry, ...state.knowledge], seq: state.seq + 1 };
    }
    case 'updateKnowledge':
      return {
        ...state,
        knowledge: state.knowledge.map((k) =>
          k.id === action.id ? { ...k, ...action.draft, updatedAt: now } : k,
        ),
        seq: state.seq + 1,
      };
    case 'archiveKnowledge':
      return {
        ...state,
        knowledge: state.knowledge.map((k) =>
          k.id === action.id ? { ...k, archived: !k.archived, updatedAt: now } : k,
        ),
      };
    case 'deleteKnowledge':
      return { ...state, knowledge: state.knowledge.filter((k) => k.id !== action.id) };
    case 'uploadDocument': {
      const doc: KnowledgeDocument = {
        id: action.id,
        name: action.name,
        status: 'processing',
        uploadedAt: now,
      };
      return { ...state, documents: [doc, ...state.documents], seq: state.seq + 1 };
    }
    case 'documentReady':
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.id ? { ...d, status: 'ready' } : d)),
      };
    case 'removeDocument':
      return { ...state, documents: state.documents.filter((d) => d.id !== action.id) };
    case 'updateAssistant':
      return { ...state, assistant: action.config };
    case 'toggleNotification':
      return {
        ...state,
        notifications: { ...state.notifications, [action.key]: !state.notifications[action.key] },
      };
    case 'toggleChannel':
      return {
        ...state,
        channels: { ...state.channels, [action.key]: !state.channels[action.key] },
      };
    case 'toggleIntegration':
      return {
        ...state,
        integrations: { ...state.integrations, [action.key]: !state.integrations[action.key] },
      };
    case 'updateRegional':
      return { ...state, regional: action.regional };
    default:
      return state;
  }
}

const WorkspaceConfigContext = createContext<{
  state: WorkspaceConfigState;
  dispatch: (action: WorkspaceConfigAction) => void;
} | null>(null);

export function WorkspaceConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  return (
    <WorkspaceConfigContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceConfigContext.Provider>
  );
}

export function useWorkspaceConfig() {
  const ctx = useContext(WorkspaceConfigContext);
  if (!ctx) throw new Error('useWorkspaceConfig must be used within WorkspaceConfigProvider');
  return ctx;
}

/** Fires the "document ready" transition shortly after a simulated upload — preview only. */
export function useSimulateUploadDelay() {
  const { dispatch } = useWorkspaceConfig();
  return useCallback(
    (id: string) => {
      setTimeout(() => {
        dispatch({ type: 'documentReady', id });
      }, 1200);
    },
    [dispatch],
  );
}
