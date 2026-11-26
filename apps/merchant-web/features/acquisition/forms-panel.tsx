'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { Icon } from '@krinly/ui/components/icon';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@krinly/ui/components/overlay';
import { SegmentedControl } from '@krinly/ui/components/tabs';
import { useState } from 'react';
import { enabledFields, formUrl, type LeadForm } from '@/lib/preview/acquisition';
import type { AcquisitionModel } from '@/lib/preview/acquisition-model';
import { fullDate, percent, plural } from '@/lib/preview/format';
import { PublicForm } from './public-form';
import { CopyButton, DevUrl, ShareButton } from './share';

function FormPreviewSheet({ form, onClose }: { form: LeadForm | null; onClose: () => void }) {
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone');
  return (
    <Sheet
      open={form !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {form ? (
        <SheetContent variant="floating" width="md" label={`Customer preview of ${form.title}`}>
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <SheetTitle className="font-display text-lg font-semibold tracking-tight">
                Customer preview
              </SheetTitle>
              <p className="mt-1 text-[13px] text-ink-3">
                Exactly what a customer would see. Nothing submits.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SegmentedControl
                label="Preview width"
                value={device}
                onValueChange={setDevice}
                options={[
                  { value: 'phone', label: 'Phone' },
                  { value: 'desktop', label: 'Desktop' },
                ]}
              />
              <SheetClose
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
              >
                <Icon name="close" size={18} />
              </SheetClose>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-4">
            <div className="overflow-hidden rounded-xl shadow-ring">
              <PublicForm form={form} width={device === 'phone' ? 'narrow' : 'comfortable'} />
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

/** The forms list: what each one asks, where it points, and how to share it. */
export function FormsPanel({
  model,
  onNew,
  onEdit,
  onToggle,
}: {
  model: AcquisitionModel;
  onNew: () => void;
  onEdit: (formId: string) => void;
  onToggle: (formId: string) => void;
}) {
  const [previewing, setPreviewing] = useState<LeadForm | null>(null);

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <Card padding="lg" aria-labelledby="forms-heading" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle id="forms-heading" className="text-xl">
              Lead capture forms
            </CardTitle>
            <p className="mt-1 max-w-[76ch] text-sm text-ink-2">
              A page a customer fills in. Share its link anywhere — your Instagram bio, a WhatsApp
              reply, a QR code at an event — and the enquiry is credited to the source you chose.
            </p>
          </div>
          <Button variant="brand" size="sm" shape="pill" onClick={onNew}>
            <Icon name="plus" size={15} />
            New form
          </Button>
        </div>

        {model.forms.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="panel"
            title="No forms yet"
            description="A form is the simplest way to stop typing enquiries in by hand."
            action={
              <Button variant="brand" size="sm" shape="pill" onClick={onNew}>
                Create your first form
              </Button>
            }
          />
        ) : (
          <ul className="mt-6 grid gap-4">
            {model.forms.map((form) => {
              const source = model.sources.find((s) => s.id === form.sourceId);
              const fields = enabledFields(form);
              const needed = fields.filter((field) => field.required).length;
              const url = formUrl(form);
              return (
                <li key={form.id} className="min-w-0 rounded-xl bg-canvas p-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(form.id);
                          }}
                          className="rounded-md text-left text-[15px] font-bold text-ink hover:underline"
                        >
                          {form.title}
                        </button>
                        <Badge tone={form.active ? 'verified' : 'neutral'}>
                          {form.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {form.description ? (
                        <p className="mt-1 max-w-[76ch] truncate text-[13.5px] text-ink-2">
                          {form.description}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-[12.5px] text-ink-3">
                        {plural(fields.length, 'field')}, {needed} needed · credited to{' '}
                        {source?.label ?? 'no source'} · created {fullDate(form.createdAt)}
                      </p>
                      <p className="tnum mt-1 text-[12.5px] text-ink-3">
                        {form.views} opens · {plural(form.submissions, 'enquiry', 'enquiries')}
                        {form.views > 0
                          ? ` · ${percent(form.submissions, form.views)} filled in`
                          : ''}
                      </p>
                    </div>
                    <DevUrl url={url} className="w-full min-w-0 sm:max-w-[320px]" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      shape="pill"
                      onClick={() => {
                        onEdit(form.id);
                      }}
                    >
                      <Icon name="note" size={15} />
                      Edit
                      <span className="sr-only">: {form.title}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      shape="pill"
                      onClick={() => {
                        setPreviewing(form);
                      }}
                    >
                      <Icon name="camera" size={15} />
                      Preview
                      <span className="sr-only">: {form.title}</span>
                    </Button>
                    <CopyButton value={url} what="Form link" />
                    <ShareButton value={url} title={form.title} />
                    <Button
                      variant="ghost"
                      size="sm"
                      shape="pill"
                      onClick={() => {
                        onToggle(form.id);
                      }}
                    >
                      {form.active ? 'Deactivate' : 'Activate'}
                      <span className="sr-only">: {form.title}</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-3">
          Links point at a development preview on this machine. Publishing a form to the public
          internet needs a submission endpoint, spam protection and a workspace to attach the
          enquiry to — none of which exists yet, so the preview never submits.
        </p>
      </Card>

      <FormPreviewSheet
        form={previewing}
        onClose={() => {
          setPreviewing(null);
        }}
      />
    </div>
  );
}
