// Every planned module, with an honest status. Nav items for modules outside this prototype
// open a short in-shell page built from this registry, so no navigation is a dead end.

export type ModuleStatus = 'documented' | 'proposed' | 'unconfirmed';

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  documented: 'Documented requirement',
  proposed: 'Proposed in Phase 01',
  unconfirmed: 'Unconfirmed product decision',
};

export type ModuleSlug =
  | 'today'
  | 'inbox'
  | 'leads'
  | 'bookings'
  | 'payments'
  | 'growth'
  | 'assistant'
  | 'automation'
  | 'knowledge'
  | 'integrations'
  | 'settings';

export interface ModuleInfo {
  slug: ModuleSlug;
  label: string;
  status: ModuleStatus;
  basis: string;
  purpose: string;
  /** What exists of this module in the prototype, if anything. */
  inPrototype?: string;
}

export const MODULES: Record<ModuleSlug, ModuleInfo> = {
  today: {
    slug: 'today',
    label: 'Today',
    status: 'proposed',
    basis:
      'Phase 01 proposal; the merchant overview promises enquiries, bookings, payments and revenue.',
    purpose:
      'What needs you now, how much verified revenue came in, and where customers came from.',
    inPrototype: 'Fully interactive in this prototype.',
  },
  inbox: {
    slug: 'inbox',
    label: 'Inbox',
    status: 'proposed',
    basis:
      'Landing copy (“every customer message, from every channel”) and the existing enquiry-triage endpoint.',
    purpose:
      'Every conversation in one place. The assistant can suggest a reply; a person always reviews it before anything is sent.',
    inPrototype: 'Enquiries waiting for a reply are surfaced on Today and in Leads → Needs reply.',
  },
  leads: {
    slug: 'leads',
    label: 'Leads',
    status: 'documented',
    basis: 'Issues #7 (data model), #9 (CRM APIs) and #10 (merchant CRM interface).',
    purpose:
      'Everyone who enquired, where they came from, what stage they are at and what to do next.',
    inPrototype: 'Fully interactive in this prototype (list, pipeline, details).',
  },
  bookings: {
    slug: 'bookings',
    label: 'Bookings',
    status: 'proposed',
    basis: 'Landing copy: “turn conversations into confirmed bookings”. No schema or ticket yet.',
    purpose:
      'Trials, consultations and event-day bookings, with availability that explains itself.',
    inPrototype: 'Today’s appointments appear on Today.',
  },
  payments: {
    slug: 'payments',
    label: 'Payments',
    status: 'proposed',
    basis:
      'Landing copy: “collected payments” and “verified revenue”. Verification policy is undecided.',
    purpose:
      'Record payments, verify them, and send quotations. Only verified money counts as revenue. Quotations are an unconfirmed part of this module.',
    inPrototype: 'Record a payment from Quick create or a lead; verify payments from Today.',
  },
  growth: {
    slug: 'growth',
    label: 'Growth',
    status: 'proposed',
    basis:
      'Landing copy: “know which efforts produced real, paid revenue”. Attribution rules are undecided.',
    purpose:
      'Which sources bring paying customers, how the journey converts, and verified revenue over time.',
    inPrototype: 'Source performance and the journey appear on Today.',
  },
  assistant: {
    slug: 'assistant',
    label: 'Assistant',
    status: 'documented',
    basis: 'Issue #12 (qualification proposals and human handoff) and architecture decision #8.',
    purpose:
      'How the assistant suggests stages and replies, and when it always hands over to a person. Its output is a proposal — never an action.',
    inPrototype:
      'One assistant suggestion appears on Kritika Bansal’s lead, with Apply and Dismiss.',
  },
  automation: {
    slug: 'automation',
    label: 'Automation',
    status: 'unconfirmed',
    basis: 'Requested in the master brief; not in any Phase 1 document or issue.',
    purpose:
      'Simple rules such as reminders before a trial or a follow-up when a quotation goes quiet.',
  },
  knowledge: {
    slug: 'knowledge',
    label: 'Knowledge',
    status: 'unconfirmed',
    basis: 'Requested in the master brief; not in any Phase 1 document or issue.',
    purpose:
      'Services, prices, hours and policies the assistant may draw on when suggesting replies.',
  },
  integrations: {
    slug: 'integrations',
    label: 'Integrations',
    status: 'documented',
    basis: 'Issue #11 covers Meta lead ads webhooks; other channels are proposed, not ticketed.',
    purpose: 'Connect the channels your customers use and see whether each connection is healthy.',
  },
  settings: {
    slug: 'settings',
    label: 'Settings',
    status: 'documented',
    basis:
      'Team and invitations exist today; issues #3 (support access) and #4 (member management).',
    purpose: 'Workspace details, team, Krinly support access and the activity log.',
  },
};

export function moduleFromSlug(slug: string): ModuleInfo | undefined {
  return Object.values(MODULES).find((m) => m.slug === slug);
}
