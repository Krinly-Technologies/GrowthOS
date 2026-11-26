'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Field } from '@krinly/ui/components/field';
import { EmptyState } from '@krinly/ui/components/feedback';
import { Icon } from '@krinly/ui/components/icon';
import { Input, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useToast } from '@krinly/ui/components/toast';
import { useState } from 'react';
import { type TrackingLink, trackingUrl } from '@/lib/preview/acquisition';
import type { AcquisitionModel } from '@/lib/preview/acquisition-model';
import { fullDate, percent, plural } from '@/lib/preview/format';
import type { LinkDraft } from '@/lib/preview/store';
import { QrCode, QrDownloads } from './qr-code';
import { CopyButton, DevUrl, ShareButton } from './share';

function slugFile(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tracking-link'
  );
}

/**
 * Tracking links and QR codes: one address per campaign, so an enquiry that arrives through it
 * is credited to that source without anybody typing it in.
 */
export function LinksPanel({
  model,
  onCreate,
  onToggle,
}: {
  model: AcquisitionModel;
  onCreate: (draft: LinkDraft) => void;
  onToggle: (linkId: string) => void;
}) {
  const toast = useToast();
  const firstForm = model.forms[0];
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<LinkDraft>({
    campaign: '',
    sourceId: 'instagram',
    formId: firstForm?.id ?? '',
  });
  const [showQr, setShowQr] = useState<TrackingLink | null>(null);

  const qrLink = showQr;
  const qrForm = qrLink ? model.forms.find((f) => f.id === qrLink.formId) : undefined;

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <Card padding="lg" aria-labelledby="links-heading" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle id="links-heading" className="text-xl">
              Tracking links and QR codes
            </CardTitle>
            <p className="mt-1 max-w-[76ch] text-sm text-ink-2">
              Give each campaign its own link. Put the link in your Instagram bio or print its QR
              code on a banner, and enquiries that come through it carry the source with them.
            </p>
          </div>
          <Button
            variant="brand"
            size="sm"
            shape="pill"
            disabled={model.forms.length === 0}
            onClick={() => {
              setCreating(true);
            }}
          >
            <Icon name="plus" size={15} />
            New tracking link
          </Button>
        </div>

        {model.forms.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="megaphone"
            title="Create a form first"
            description="A tracking link opens one of your lead capture forms, so there has to be a form to open."
          />
        ) : model.links.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="megaphone"
            title="No tracking links yet"
            description="One link per campaign is the simplest attribution there is."
          />
        ) : (
          <ul className="mt-6 grid gap-4">
            {model.links.map((link) => {
              const form = model.forms.find((f) => f.id === link.formId);
              const source = model.sources.find((s) => s.id === link.sourceId);
              const url = trackingUrl(link, form);
              return (
                <li
                  key={link.id}
                  className="grid min-w-0 gap-4 rounded-xl bg-canvas p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-bold text-ink">{link.campaign}</p>
                      <Badge tone={link.active ? 'verified' : 'neutral'}>
                        {link.active ? 'Active' : 'Off'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-3">
                      credited to {source?.label ?? 'no source'} · opens{' '}
                      {form?.title ?? 'a deleted form'} · created {fullDate(link.createdAt)}
                    </p>
                    <p className="tnum mt-1 text-[12.5px] text-ink-3">
                      {link.opens} opens · {plural(link.enquiries, 'enquiry', 'enquiries')}
                      {link.opens > 0 ? ` · ${percent(link.enquiries, link.opens)} filled in` : ''}
                    </p>
                    <DevUrl url={url} className="mt-2 block max-w-[420px]" />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <CopyButton value={url} what="Tracking link" />
                      <ShareButton value={url} title={link.campaign} />
                      <Button
                        variant="outline"
                        size="sm"
                        shape="pill"
                        onClick={() => {
                          setShowQr(link);
                        }}
                      >
                        <Icon name="ticket" size={15} />
                        QR code
                        <span className="sr-only">: {link.campaign}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="pill"
                        onClick={() => {
                          onToggle(link.id);
                        }}
                      >
                        {link.active ? 'Turn off' : 'Turn on'}
                        <span className="sr-only">: {link.campaign}</span>
                      </Button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQr(link);
                    }}
                    className="justify-self-start rounded-xl bg-surface p-2 shadow-ring hover:shadow-raised sm:justify-self-end"
                  >
                    <QrCode value={url} label={`QR code for ${link.campaign}`} size={108} />
                    <span className="sr-only">Show a larger QR code</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-3">
          These QR codes are real and will scan — to a development address on this machine. Counting
          opens and crediting the source to an enquiry both happen server-side, which is not built,
          so the figures above come from development fixtures.
        </p>
      </Card>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent
          title="New tracking link"
          description="Name the campaign, choose the source it should be credited to, and pick the form it opens."
          footer={
            <>
              <Button
                variant="ghost"
                shape="pill"
                onClick={() => {
                  setCreating(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                shape="pill"
                disabled={draft.campaign.trim() === '' || draft.formId === ''}
                onClick={() => {
                  onCreate(draft);
                  toast({
                    title: `${draft.campaign.trim()} created`,
                    description: 'Copy its link or download the QR code.',
                  });
                  setDraft({ campaign: '', sourceId: draft.sourceId, formId: draft.formId });
                  setCreating(false);
                }}
              >
                Create link
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Field
              label="Campaign name"
              hint="Only you see this. “Bengaluru Wedding Fair · stall QR” beats “link 3”."
            >
              <Input
                value={draft.campaign}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, campaign: event.target.value }));
                }}
              />
            </Field>
            <Field label="Credit enquiries to">
              <Select
                value={draft.sourceId}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, sourceId: event.target.value }));
                }}
              >
                {model.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Opens this form">
              <Select
                value={draft.formId}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, formId: event.target.value }));
                }}
              >
                {model.forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                    {form.active ? '' : ' (inactive)'}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qrLink !== null}
        onOpenChange={(open) => {
          if (!open) setShowQr(null);
        }}
      >
        {qrLink ? (
          <DialogContent
            title={qrLink.campaign}
            description="Print it, or send the image to whoever is making your banner."
          >
            <div className="grid justify-items-center gap-4">
              <div className="rounded-xl bg-surface p-3 shadow-ring">
                <QrCode
                  value={trackingUrl(qrLink, qrForm)}
                  label={`QR code for ${qrLink.campaign}`}
                  size={232}
                />
              </div>
              <DevUrl url={trackingUrl(qrLink, qrForm)} className="w-full" />
              <QrDownloads
                value={trackingUrl(qrLink, qrForm)}
                filename={`krinly-${slugFile(qrLink.campaign)}-qr`}
                onDone={(format) => {
                  toast({ title: `${format} downloaded`, description: qrLink.campaign });
                }}
              />
              <p className="text-center text-[12px] leading-relaxed text-ink-3">
                The code points at a development address on this machine, so only this computer can
                open it.
              </p>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
