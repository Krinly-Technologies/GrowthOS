'use client';

import { Icon } from '@krinly/ui/components/icon';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@krinly/ui/components/overlay';
import { ListRow } from '@krinly/ui/components/table';
import { InfoGrid } from '@krinly/ui/patterns/signals';
import { formUrl, trackingUrl } from '@/lib/preview/acquisition';
import type { AcquisitionModel, SourceStat } from '@/lib/preview/acquisition-model';
import { fullDate, inr, percent, plural } from '@/lib/preview/format';
import { CopyButton, DevUrl } from './share';
import { SourceStateBadge, SourceStateNote } from './source-state';

/** Everything about one source: how it is captured, how it performed, and what points at it. */
export function SourceDetailSheet({
  stat,
  model,
  onClose,
}: {
  stat: SourceStat | null;
  model: AcquisitionModel;
  onClose: () => void;
}) {
  const forms = stat ? model.forms.filter((f) => f.sourceId === stat.source.id) : [];
  const links = stat ? model.links.filter((l) => l.sourceId === stat.source.id) : [];

  return (
    <Sheet
      open={stat !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {stat ? (
        <SheetContent variant="floating" width="md" label={`${stat.source.label} in detail`}>
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <Icon name={stat.source.icon} size={18} className="text-ink-3" />
                {stat.source.label}
              </SheetTitle>
              <div className="mt-2">
                <SourceStateBadge source={stat.source} />
              </div>
            </div>
            <SheetClose
              aria-label="Close"
              className="-mt-1 -mr-1 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
            >
              <Icon name="close" size={18} />
            </SheetClose>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              <SourceStateNote source={stat.source} />
            </p>

            <h3 className="mt-6 text-[13px] font-bold text-ink-3">
              Figures for {model.range.phrase}
            </h3>
            <InfoGrid
              className="mt-2"
              columns={2}
              items={[
                {
                  label: 'New enquiries',
                  value: `${stat.enquiries} (${stat.previousEnquiries} in the period before)`,
                },
                {
                  label: 'Of those, booked',
                  value:
                    stat.conversion === null
                      ? 'No enquiries to measure'
                      : `${stat.booked} · ${percent(stat.booked, stat.enquiries)}`,
                },
                { label: 'Paying customers', value: stat.customers },
                { label: 'Verified revenue', value: inr(stat.revenue) },
                {
                  label: 'Per paying customer',
                  value: stat.perCustomer === null ? '–' : inr(stat.perCustomer),
                },
              ]}
            />

            <h3 className="mt-6 text-[13px] font-bold text-ink-3">
              {plural(forms.length, 'form')} and {plural(links.length, 'tracking link')} pointing
              here
            </h3>
            {forms.length === 0 && links.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">
                Nothing yet. A lead form or a tracking link would attribute enquiries from here
                without anyone typing them in.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line-soft">
                {forms.map((form) => (
                  <li key={form.id}>
                    <ListRow
                      className="px-0"
                      leading={<Icon name="panel" size={17} className="text-ink-3" />}
                      title={form.title}
                      subtitle={<DevUrl url={formUrl(form)} />}
                      trailing={<CopyButton value={formUrl(form)} what="Form link" />}
                    />
                  </li>
                ))}
                {links.map((link) => {
                  const form = model.forms.find((f) => f.id === link.formId);
                  const url = trackingUrl(link, form);
                  return (
                    <li key={link.id}>
                      <ListRow
                        className="px-0"
                        leading={<Icon name="megaphone" size={17} className="text-ink-3" />}
                        title={link.campaign}
                        subtitle={`created ${fullDate(link.createdAt)} · ${link.opens} opens`}
                        trailing={<CopyButton value={url} what="Tracking link" />}
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-6 rounded-lg bg-canvas px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-3">
              Figures come from development fixtures. First-source attribution is a provisional
              product rule, and no attribution runs server-side yet.
            </p>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
