'use client';

import { Button } from '@krinly/ui/components/button';
import { Choice, Field } from '@krinly/ui/components/field';
import { Icon } from '@krinly/ui/components/icon';
import { Input, InputGroup, Select, Textarea } from '@krinly/ui/components/input';
import { cn } from '@krinly/ui/lib/utils';
import { type SyntheticEvent, useState } from 'react';
import {
  enabledFields,
  type FormFieldId,
  type LeadForm,
  fieldSpec,
} from '@/lib/preview/acquisition';
import { BUSINESS, SERVICE_IDS, SERVICES } from '@/lib/preview/sample/scenario';

const BUDGETS = ['Under ₹25,000', '₹25,000 – ₹50,000', '₹50,000 – ₹1,00,000', 'Above ₹1,00,000'];

type Values = Partial<Record<FormFieldId, string>>;

/**
 * The right control for one field. `fieldId` is the field, not an element id: Field clones its
 * single child to set `id`, `aria-describedby` and `aria-invalid`, so those arrive through
 * `wiring` and are forwarded to the real input.
 */
function Control({
  fieldId,
  value,
  onChange,
  ...wiring
}: {
  fieldId: FormFieldId;
  value: string;
  onChange: (next: string) => void;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}) {
  const spec = fieldSpec(fieldId);
  const common = {
    ...wiring,
    value,
    onChange: (event: { target: { value: string } }) => {
      onChange(event.target.value);
    },
  };
  if (fieldId === 'phone')
    return <InputGroup prefix="+91" type="tel" inputMode="tel" autoComplete="tel" {...common} />;
  if (fieldId === 'service')
    return (
      <Select {...common}>
        <option value="">Not sure yet</option>
        {SERVICE_IDS.map((serviceId) => (
          <option key={serviceId} value={serviceId}>
            {SERVICES[serviceId].label}
          </option>
        ))}
      </Select>
    );
  if (fieldId === 'budget')
    return (
      <Select {...common}>
        <option value="">Prefer not to say</option>
        {BUDGETS.map((band) => (
          <option key={band} value={band}>
            {band}
          </option>
        ))}
      </Select>
    );
  if (spec.control === 'textarea') return <Textarea rows={3} {...common} />;
  return <Input type={spec.control} {...common} />;
}

/**
 * The form a customer fills in. The same component renders the editor's live preview and the
 * isolated preview page, so what a merchant sees while editing is what a customer would get.
 *
 * It never posts anywhere: public submission needs a real backend contract (an endpoint, spam
 * protection and a tenant to attach the enquiry to), none of which exists yet.
 */
export function PublicForm({
  form,
  width = 'comfortable',
  as: Heading = 'h2',
  className,
}: {
  form: LeadForm;
  /** `narrow` reproduces a phone; `comfortable` a desktop browser. */
  width?: 'narrow' | 'comfortable';
  /** `h1` when the form is the whole page; `h2` inside an editor or a preview panel. */
  as?: 'h1' | 'h2';
  className?: string;
}) {
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Partial<Record<FormFieldId, string>>>({});
  const [done, setDone] = useState(false);
  const fields = enabledFields(form);

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const next: Partial<Record<FormFieldId, string>> = {};
    for (const field of fields) {
      if (field.required && !(values[field.id] ?? '').trim())
        next[field.id] = `${fieldSpec(field.id).label} is needed`;
    }
    setErrors(next);
    if (Object.keys(next).length === 0) setDone(true);
  };

  return (
    <div
      className={cn(
        'mx-auto w-full bg-surface',
        width === 'narrow' ? 'max-w-[360px]' : 'max-w-[520px]',
        className,
      )}
    >
      <div className="border-b border-line px-5 py-4">
        <p className="font-display text-sm font-bold text-ink">{BUSINESS.name}</p>
        <p className="text-[12.5px] text-ink-3">{BUSINESS.area}</p>
      </div>

      {done ? (
        <div className="px-5 py-8 text-center" role="status">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-verified-soft text-verified">
            <Icon name="check" size={22} strokeWidth={2.2} />
          </span>
          <Heading className="mt-3 font-display text-lg font-semibold text-ink">
            Enquiry received
          </Heading>
          <p className="mx-auto mt-1 max-w-[40ch] text-sm leading-relaxed text-ink-2">
            {form.confirmation}
          </p>
          <Button
            variant="ghost"
            size="sm"
            shape="pill"
            className="mt-5"
            onClick={() => {
              setValues({});
              setErrors({});
              setDone(false);
            }}
          >
            Send another enquiry
          </Button>
          <p className="mt-6 text-[12px] text-ink-3">
            Preview only — nothing was sent and no record was created.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="px-5 py-5" noValidate>
          <Heading className="font-display text-xl font-semibold tracking-tight text-ink">
            {form.title}
          </Heading>
          {form.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{form.description}</p>
          ) : null}

          <div className="mt-5 grid gap-4">
            {fields.map((field) => {
              const spec = fieldSpec(field.id);
              return (
                <Field
                  key={field.id}
                  label={
                    <span>
                      {spec.label}
                      {field.required ? null : (
                        <span className="ml-1.5 font-normal text-ink-3">(optional)</span>
                      )}
                    </span>
                  }
                  {...(spec.hint ? { hint: spec.hint } : {})}
                  {...(errors[field.id] ? { error: errors[field.id] } : {})}
                >
                  <Control
                    fieldId={field.id}
                    value={values[field.id] ?? ''}
                    onChange={(next) => {
                      setValues((prev) => ({ ...prev, [field.id]: next }));
                    }}
                  />
                </Field>
              );
            })}
          </div>

          <Choice
            className="mt-4 px-0"
            label="You may contact me on WhatsApp"
            description="We only use your number to answer this enquiry."
            defaultChecked
          />

          <Button type="submit" variant="brand" size="lg" className="mt-5 w-full">
            Send enquiry
          </Button>
          <p className="mt-3 text-center text-[12px] text-ink-3">
            Preview only — this form does not submit anywhere yet.
          </p>
        </form>
      )}
    </div>
  );
}
