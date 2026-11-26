'use client';

import { Dialog } from 'radix-ui';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { ist, LAB_NOW } from '@/lib/clock';
import {
  isOpen,
  type Lead,
  type Payment,
  type PaymentKind,
  type PaymentMethod,
  type ServiceId,
  type SourceId,
} from '@/lib/domain';
import { ago, inr, time, weekdayDayMonth } from '@/lib/format';
import {
  LOST_REASONS,
  SERVICE_IDS,
  SERVICES,
  SOURCE_IDS,
  SOURCES,
  TEAM,
} from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';
import { DialogContent } from './sheet';
import { useToast } from './toast';

// ------------------------------------------------------------------ form primitives

const fieldClass =
  'block h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none aria-invalid:border-critical';

function Field({
  label,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-critical" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Actions({
  submit,
  onCancel,
  cancel = 'Cancel',
}: {
  submit: string;
  onCancel: () => void;
  cancel?: string;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-canvas-2"
      >
        {cancel}
      </button>
      <button
        type="submit"
        className="lab-primary h-10 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2"
      >
        {submit}
      </button>
    </div>
  );
}

function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              'cursor-pointer rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]',
              value === option ? 'border-ink bg-ink text-white' : 'border-line hover:bg-canvas-2',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => {
                onChange(option);
              }}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ------------------------------------------------------------------ new lead

const MOBILE = /^[6-9]\d{9}$/;

export function NewLeadDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (leadId: string) => void;
}) {
  const { state, dispatch } = useLab();
  const notify = useToast();
  const id = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<ServiceId>('bridal_classic');
  const [source, setSource] = useState<SourceId>('walk_in');
  const [eventDate, setEventDate] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; eventDate?: string }>({});

  function reset() {
    setName('');
    setPhone('');
    setService('bridal_classic');
    setSource('walk_in');
    setEventDate('');
    setNote('');
    setErrors({});
  }

  function submit() {
    const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter the customer’s name.';
    if (!MOBILE.test(digits)) next.phone = 'Enter a 10-digit mobile number, like 98450 12312.';
    let event: number | undefined;
    if (eventDate) {
      const [y, m, d] = eventDate.split('-').map(Number);
      if (y && m && d) event = ist(y, m, d);
      if (event !== undefined && event < LAB_NOW - 86_400_000)
        next.eventDate = 'The event date is in the past.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const leadId = `ld-new${(state.seq + 1).toString()}`;
    dispatch({
      type: 'addLead',
      input: {
        name,
        phone: `+91 ${digits.slice(0, 5)} ••${digits.slice(7)}`,
        service,
        source,
        ...(event !== undefined ? { eventDate: event } : {}),
        note,
      },
    });
    notify({
      title: `${name.trim()} added to Leads`,
      description: 'Next step: send package options by tomorrow.',
    });
    reset();
    onOpenChange(false);
    onCreated(leadId);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        title="New lead"
        description="Someone who called, walked in or messaged outside Krinly."
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="grid gap-4"
        >
          <Field label="Name" id={`${id}-name`} error={errors.name}>
            <input
              id={`${id}-name`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? `${id}-name-error` : undefined}
              className={fieldClass}
            />
          </Field>
          <Field
            label="Mobile number"
            id={`${id}-phone`}
            error={errors.phone}
            hint="Indian mobile number"
          >
            <div className="flex">
              <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-line bg-canvas px-3 text-sm text-ink-3">
                +91
              </span>
              <input
                id={`${id}-phone`}
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? `${id}-phone-error` : `${id}-phone-hint`}
                className={cn(fieldClass, 'rounded-l-none')}
              />
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Interested in" id={`${id}-service`}>
              <select
                id={`${id}-service`}
                value={service}
                onChange={(e) => {
                  setService(SERVICE_IDS.find((s) => s === e.target.value) ?? 'bridal_classic');
                }}
                className={fieldClass}
              >
                {SERVICE_IDS.map((s) => (
                  <option key={s} value={s}>
                    {SERVICES[s].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Where they came from" id={`${id}-source`}>
              <select
                id={`${id}-source`}
                value={source}
                onChange={(e) => {
                  setSource(SOURCE_IDS.find((s) => s === e.target.value) ?? 'walk_in');
                }}
                className={fieldClass}
              >
                {SOURCE_IDS.map((s) => (
                  <option key={s} value={s}>
                    {SOURCES[s].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Event date (optional)" id={`${id}-date`} error={errors.eventDate}>
            <input
              id={`${id}-date`}
              type="date"
              min="2026-11-25"
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
              }}
              aria-invalid={errors.eventDate ? true : undefined}
              className={fieldClass}
            />
          </Field>
          <Field label="Note (optional)" id={`${id}-note`}>
            <textarea
              id={`${id}-note`}
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
              }}
              placeholder="What they asked for"
              className={cn(fieldClass, 'h-auto py-2 leading-relaxed')}
            />
          </Field>
          <Actions
            submit="Add lead"
            onCancel={() => {
              reset();
              onOpenChange(false);
            }}
          />
        </form>
      </DialogContent>
    </Dialog.Root>
  );
}

// ------------------------------------------------------------------ record payment

const METHODS: readonly PaymentMethod[] = ['UPI', 'Bank transfer', 'Card', 'Cash'];
const KINDS: readonly PaymentKind[] = ['Advance', 'Balance', 'Full payment'];

export function RecordPaymentDialog({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
}) {
  const { state, dispatch } = useLab();
  const notify = useToast();
  const id = useId();
  const candidates = state.data.leads
    .filter((l) => isOpen(l.stage) || l.stage === 'booked')
    .sort((a, b) => (a.latinName ?? a.name).localeCompare(b.latinName ?? b.name));
  const [chosen, setChosen] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [kind, setKind] = useState<PaymentKind>('Advance');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<{ lead?: string; amount?: string }>({});
  const target = leadId ?? chosen;
  const targetLead = state.data.leads.find((l) => l.id === target);

  function reset() {
    setChosen('');
    setAmount('');
    setMethod('UPI');
    setKind('Advance');
    setReference('');
    setErrors({});
  }

  function submit() {
    const value = Number(amount.replace(/[^\d]/g, ''));
    const next: typeof errors = {};
    if (!targetLead) next.lead = 'Choose who paid.';
    if (!value) next.amount = 'Enter the amount received, in rupees.';
    setErrors(next);
    if (!targetLead || !value) return;
    dispatch({
      type: 'recordPayment',
      input: { leadId: targetLead.id, amount: value, method, reference, kind },
    });
    notify({
      title: `${inr(value)} recorded`,
      description: 'It counts as revenue once it is verified.',
      action: {
        label: 'Undo',
        onClick: () => {
          dispatch({ type: 'undo' });
        },
      },
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        title="Record a payment"
        description={
          targetLead && leadId
            ? `From ${targetLead.latinName ?? targetLead.name}. It counts as revenue once verified.`
            : 'Money you received outside Krinly. It counts as revenue once verified.'
        }
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="grid gap-4"
        >
          {leadId ? null : (
            <Field label="Who paid" id={`${id}-lead`} error={errors.lead}>
              <select
                id={`${id}-lead`}
                value={chosen}
                onChange={(e) => {
                  setChosen(e.target.value);
                }}
                aria-invalid={errors.lead ? true : undefined}
                className={fieldClass}
              >
                <option value="">Choose a customer</option>
                {candidates.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.latinName ?? l.name} — {SERVICES[l.service].label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Amount" id={`${id}-amount`} error={errors.amount}>
            <div className="flex">
              <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-line bg-canvas px-3 text-sm text-ink-3">
                ₹
              </span>
              <input
                id={`${id}-amount`}
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                placeholder="20,000"
                aria-invalid={errors.amount ? true : undefined}
                className={cn(fieldClass, 'tnum rounded-l-none')}
              />
            </div>
          </Field>
          <Choice legend="Payment for" options={KINDS} value={kind} onChange={setKind} />
          <Choice legend="Paid by" options={METHODS} value={method} onChange={setMethod} />
          <Field
            label={method === 'Cash' ? 'Note (optional)' : 'Reference (optional)'}
            id={`${id}-ref`}
            hint={method === 'Cash' ? 'Where it was paid' : 'UTR or transaction ID'}
          >
            <input
              id={`${id}-ref`}
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
              }}
              aria-describedby={`${id}-ref-hint`}
              className={fieldClass}
            />
          </Field>
          <Actions
            submit="Record payment"
            onCancel={() => {
              reset();
              onOpenChange(false);
            }}
          />
        </form>
      </DialogContent>
    </Dialog.Root>
  );
}

// ------------------------------------------------------------------ verify

export function VerifyPaymentDialog({
  payment,
  lead,
  onOpenChange,
}: {
  payment: Payment | null;
  lead: Lead | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, dispatch } = useLab();
  const notify = useToast();
  return (
    <Dialog.Root open={payment !== null} onOpenChange={onOpenChange}>
      {payment && lead ? (
        <DialogContent
          title={`Verify ${inr(payment.amount)} from ${lead.latinName ?? lead.name}?`}
          description="Verified payments count towards revenue. Check that the money has arrived in your account first."
        >
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-xl bg-canvas px-4 py-3 text-sm">
            <dt className="text-ink-3">For</dt>
            <dd>{payment.kind}</dd>
            <dt className="text-ink-3">Paid by</dt>
            <dd>{payment.method}</dd>
            <dt className="text-ink-3">Reference</dt>
            <dd>{payment.reference}</dd>
            <dt className="text-ink-3">Recorded</dt>
            <dd>
              {weekdayDayMonth(payment.recordedAt)}, {time(payment.recordedAt)} by{' '}
              {TEAM[payment.recordedBy].firstName}
              <span className="text-ink-3"> · {ago(payment.recordedAt, state.now)}</span>
            </dd>
          </dl>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'verifyPayment', paymentId: payment.id });
              notify({
                title: `${inr(payment.amount)} verified`,
                description: 'Added to verified revenue.',
                action: {
                  label: 'Undo',
                  onClick: () => {
                    dispatch({ type: 'undo' });
                  },
                },
              });
              onOpenChange(false);
            }}
          >
            <Actions
              submit="Mark as verified"
              cancel="Not now"
              onCancel={() => {
                onOpenChange(false);
              }}
            />
          </form>
        </DialogContent>
      ) : null}
    </Dialog.Root>
  );
}

// ------------------------------------------------------------------ mark lost

export function LostDialog({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { dispatch } = useLab();
  const notify = useToast();
  const [reason, setReason] = useState<string>(LOST_REASONS[0]);
  return (
    <Dialog.Root open={lead !== null} onOpenChange={onOpenChange}>
      {lead ? (
        <DialogContent
          title={`Mark ${lead.latinName ?? lead.name} as lost?`}
          description="Lost leads leave your open pipeline. You can reopen them at any time."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'changeStage', leadId: lead.id, to: 'lost', reason });
              notify({
                title: `${lead.latinName ?? lead.name} marked lost`,
                description: reason,
                action: {
                  label: 'Undo',
                  onClick: () => {
                    dispatch({ type: 'undo' });
                  },
                },
              });
              onOpenChange(false);
            }}
          >
            <fieldset className="grid gap-1">
              <legend className="mb-2 text-sm font-medium">Reason</legend>
              {LOST_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-canvas-2"
                >
                  <input
                    type="radio"
                    name="lost-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => {
                      setReason(r);
                    }}
                    className="size-4 accent-[var(--ink)]"
                  />
                  {r}
                </label>
              ))}
            </fieldset>
            <Actions
              submit="Mark as lost"
              onCancel={() => {
                onOpenChange(false);
              }}
            />
          </form>
        </DialogContent>
      ) : null}
    </Dialog.Root>
  );
}

// ------------------------------------------------------------------ keyboard shortcuts

const SHORTCUTS: [string, string][] = [
  ['Ctrl K', 'Search leads, pages and actions'],
  ['/', 'Search leads (on Leads)'],
  ['[', 'Collapse or expand the navigation'],
  ['Esc', 'Close a panel or dialog'],
  ['Ctrl Enter', 'Save a note'],
  ['?', 'Show these shortcuts'],
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Keyboard shortcuts" description="On a Mac, use ⌘ instead of Ctrl.">
        <dl className="divide-y divide-line text-sm">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-ink-2">{label}</dt>
              <dd className="flex gap-1">
                {keys.split(' ').map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-line bg-canvas px-1.5 py-0.5 text-xs font-medium text-ink"
                  >
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog.Root>
  );
}
