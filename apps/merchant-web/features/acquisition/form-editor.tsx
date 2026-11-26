'use client';

import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Choice, Field } from '@krinly/ui/components/field';
import { Icon } from '@krinly/ui/components/icon';
import { Input, Select, Textarea } from '@krinly/ui/components/input';
import { SegmentedControl } from '@krinly/ui/components/tabs';
import { useToast } from '@krinly/ui/components/toast';
import { useMemo, useState } from 'react';
import {
  FORM_FIELDS,
  type FormFieldConfig,
  formUrl,
  type LeadForm,
} from '@/lib/preview/acquisition';
import type { AcquisitionModel } from '@/lib/preview/acquisition-model';
import type { FormDraft } from '@/lib/preview/store';
import { PublicForm } from './public-form';
import { CopyButton, DevUrl } from './share';

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'form'
  );
}

function draftFor(form: LeadForm | undefined): FormDraft {
  if (form)
    return {
      title: form.title,
      description: form.description,
      slug: form.slug,
      sourceId: form.sourceId,
      confirmation: form.confirmation,
      fields: form.fields,
      active: form.active,
    };
  return {
    title: '',
    description: '',
    slug: '',
    sourceId: 'website',
    confirmation: 'Thank you. We will reply on WhatsApp within one working day.',
    fields: FORM_FIELDS.map((spec) => ({
      id: spec.id,
      enabled: spec.locked === true || spec.id === 'service',
      required: spec.locked === true,
    })),
    active: true,
  };
}

/**
 * Create and edit a lead-capture form: what it asks, which fields are needed, and what the
 * customer sees afterwards — beside a live preview of the real customer-facing form.
 *
 * Deliberately not a drag-and-drop builder: the field list is fixed by what a lead record can
 * hold, so a merchant only decides which of them to ask for.
 */
export function FormEditor({
  form,
  model,
  onSave,
  onCancel,
}: {
  /** Undefined creates a new form. */
  form: LeadForm | undefined;
  model: AcquisitionModel;
  onSave: (draft: FormDraft) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<FormDraft>(() => draftFor(form));
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone');

  const patch = (next: Partial<FormDraft>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  };
  const setField = (id: FormFieldConfig['id'], next: Partial<FormFieldConfig>) => {
    patch({
      fields: draft.fields.map((field) => (field.id === id ? { ...field, ...next } : field)),
    });
  };

  const slug = slugify(draft.slug || draft.title);
  const preview: LeadForm = useMemo(
    () => ({
      id: form?.id ?? 'preview',
      title: draft.title.trim() || 'Untitled form',
      description: draft.description,
      slug,
      sourceId: draft.sourceId,
      fields: draft.fields,
      confirmation: draft.confirmation.trim() || 'Thank you. We will be in touch shortly.',
      active: draft.active,
      createdAt: form?.createdAt ?? model.now,
      views: form?.views ?? 0,
      submissions: form?.submissions ?? 0,
    }),
    [draft, slug, form, model.now],
  );
  const url = formUrl(preview);

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
      <div className="grid min-w-0 gap-5 sm:gap-6">
        <Card padding="lg" aria-labelledby="editor-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="editor-heading" className="text-xl">
              {form ? `Edit ${form.title}` : 'New lead capture form'}
            </CardTitle>
            <Button variant="ghost" size="sm" shape="pill" onClick={onCancel}>
              <Icon name="chevron-left" size={15} />
              Back to forms
            </Button>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label="Form title" hint="The heading a customer reads first.">
              <Input
                value={draft.title}
                placeholder="Bridal enquiry"
                onChange={(event) => {
                  patch({ title: event.target.value });
                }}
              />
            </Field>
            <Field label="Description" hint="One or two lines on what happens after they send it.">
              <Textarea
                rows={2}
                value={draft.description}
                onChange={(event) => {
                  patch({ description: event.target.value });
                }}
              />
            </Field>
            <Field
              label="Web address"
              hint="Used in the form's link and in any tracking link that points at it."
            >
              <Input
                value={draft.slug}
                placeholder={slugify(draft.title) || 'bridal-enquiry'}
                onChange={(event) => {
                  patch({ slug: event.target.value });
                }}
              />
            </Field>
            <Field
              label="Attribute enquiries to"
              hint="Submissions from this form are credited to this source."
            >
              <Select
                value={draft.sourceId}
                onChange={(event) => {
                  patch({ sourceId: event.target.value });
                }}
              >
                {model.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Confirmation message"
              hint="Shown to the customer the moment they submit."
            >
              <Textarea
                rows={2}
                value={draft.confirmation}
                onChange={(event) => {
                  patch({ confirmation: event.target.value });
                }}
              />
            </Field>
            <Choice
              className="px-0"
              label="Form is active"
              description="Inactive forms keep their link but stop accepting enquiries."
              checked={draft.active}
              onChange={(event) => {
                patch({ active: event.target.checked });
              }}
            />
          </div>
        </Card>

        <Card padding="lg" aria-labelledby="fields-heading" className="min-w-0">
          <CardTitle id="fields-heading" className="text-xl">
            What the form asks for
          </CardTitle>
          <p className="mt-1 text-sm text-ink-2">
            Name and phone number identify the customer, so they are always asked for and always
            needed. Ask for as little else as you can — every extra field loses enquiries.
          </p>
          <ul className="mt-5 divide-y divide-line-soft">
            {FORM_FIELDS.map((spec) => {
              const config = draft.fields.find((field) => field.id === spec.id);
              if (!config) return null;
              return (
                <li
                  key={spec.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5"
                >
                  <div className="min-w-0">
                    <Choice
                      className="px-0"
                      label={spec.label}
                      {...(spec.locked
                        ? { description: 'Always asked for' }
                        : spec.hint
                          ? { description: spec.hint }
                          : {})}
                      checked={config.enabled}
                      disabled={spec.locked === true}
                      onChange={(event) => {
                        setField(spec.id, {
                          enabled: event.target.checked,
                          required: event.target.checked ? config.required : false,
                        });
                      }}
                    />
                  </div>
                  <Choice
                    type="checkbox"
                    className="px-0 text-[13px]"
                    label="Needed"
                    checked={config.required}
                    disabled={spec.locked === true || !config.enabled}
                    onChange={(event) => {
                      setField(spec.id, { required: event.target.checked });
                    }}
                  />
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              variant="brand"
              shape="pill"
              onClick={() => {
                onSave(draft);
                toast({
                  title: form ? `${preview.title} saved` : `${preview.title} created`,
                  description: 'Development fixtures only — nothing was published.',
                });
              }}
            >
              {form ? 'Save changes' : 'Create form'}
            </Button>
            <Button variant="ghost" shape="pill" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>

      <aside aria-labelledby="preview-heading" className="min-w-0">
        <Card padding="md" className="lg:sticky lg:top-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle id="preview-heading" className="text-base">
              Customer preview
            </CardTitle>
            <SegmentedControl
              label="Preview width"
              value={device}
              onValueChange={setDevice}
              options={[
                { value: 'phone', label: 'Phone' },
                { value: 'desktop', label: 'Desktop' },
              ]}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-xl bg-canvas p-3">
            <div className="max-h-[560px] overflow-y-auto rounded-lg shadow-ring">
              <PublicForm form={preview} width={device === 'phone' ? 'narrow' : 'comfortable'} />
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            <DevUrl url={url} />
            <div className="flex flex-wrap gap-2">
              <CopyButton value={url} what="Form link" />
              <Button variant="ghost" size="sm" shape="pill" asChild>
                <a href={`/preview/f/${slug}`} target="_blank" rel="noreferrer">
                  Open in a new tab
                  <Icon name="arrow-right" size={14} />
                </a>
              </Button>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-3">
              A development address on your own machine. A public form needs a real submission
              endpoint, which is not built.
            </p>
          </div>
        </Card>
      </aside>
    </div>
  );
}
