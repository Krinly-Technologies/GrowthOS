import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import Link from 'next/link';

const SCREENS = [
  {
    href: '/preview/today',
    icon: 'today',
    title: 'Today',
    what: 'Verified revenue against the previous period, the prioritised action queue, the customer journey, the shape of the day, and acquisition performance.',
    interactive:
      'Reporting periods, the Up next stack, the action queue, chart and source drill-downs, and verifying a payment (with Undo).',
  },
  {
    href: '/preview/inbox',
    icon: 'inbox',
    title: 'Inbox',
    what: 'A unified conversation view across WhatsApp, Instagram and website enquiries, with a simulated AI sales assistant and human handoff, linked to the same CRM customers.',
    interactive:
      'Switching conversations, accepting, editing, regenerating or dismissing a simulated AI reply, assigning or resolving a conversation, and the CRM and Today updates that follow.',
  },
  {
    href: '/preview/crm',
    icon: 'leads',
    title: 'Leads',
    what: 'Every enquiry and its journey through the pipeline, as a filterable list or a drag-free pipeline board, with the full activity history behind each one.',
    interactive:
      'Searching and filtering, switching list/pipeline layout, creating and editing leads, changing stage, assigning an owner, notes, calls and follow-ups.',
  },
  {
    href: '/preview/acquisition',
    icon: 'growth',
    title: 'Acquisition',
    what: 'Where customers come from, how each source is recorded, lead capture forms with a customer preview, and tracking links with scannable QR codes.',
    interactive:
      'Sorting and filtering, creating and editing forms, the live customer preview, creating tracking links, copy and share, QR download.',
  },
] as const;

export default function PreviewIndexPage() {
  return (
    <div className="grid max-w-[76ch] gap-5 sm:gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Development preview
      </h1>
      <Card padding="lg">
        <CardTitle className="text-xl">What this preview is</CardTitle>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Today and Acquisition are built, interactive and ready to connect — but core-api has no
          revenue, journey or acquisition endpoints yet, and attribution and verification are open
          product questions. So they run here on typed development fixtures instead of appearing in
          a merchant&rsquo;s workspace navigation.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          The screens are the production components: each one takes a view-model and emits changes
          through callbacks, so wiring them to a real API means replacing this caller, not
          rebuilding the interface.
        </p>
      </Card>

      {SCREENS.map((screen) => (
        <Card key={screen.href} padding="lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Icon name={screen.icon} size={19} className="text-ink-3" />
            {screen.title}
          </CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{screen.what}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
            <span className="font-semibold text-ink-2">Interactive:</span> {screen.interactive}
          </p>
          <div className="mt-4">
            <Button variant="brand" shape="pill" asChild>
              <Link href={screen.href}>
                Open {screen.title}
                <Icon name="arrow-right" size={16} />
              </Link>
            </Button>
          </div>
        </Card>
      ))}

      <Card padding="lg" variant="inset">
        <CardTitle className="text-base">Still simulated</CardTitle>
        <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-[13.5px] leading-relaxed text-ink-2">
          <li>Every figure comes from fictional fixtures held in memory for this tab.</li>
          <li>
            Instagram, WhatsApp and Google capture nothing: those channels need integrations that
            have not been built, and the Sources screen says so on every row.
          </li>
          <li>
            Lead forms never submit, and tracking links count nothing — both need server-side work
            that does not exist.
          </li>
          <li>
            Form and tracking addresses are development URLs on this machine. The QR codes are real
            and will scan, to those development addresses.
          </li>
          <li>
            The AI sales assistant is a simulated, rule-based classifier — not a model call. Every
            suggestion is labelled as a development-preview simulation and never sends or changes
            anything without the merchant accepting it.
          </li>
          <li>
            No WhatsApp, Instagram or website messaging is actually connected; conversations are the
            same fixture activity shown elsewhere, read as a chat thread.
          </li>
        </ul>
      </Card>
    </div>
  );
}
