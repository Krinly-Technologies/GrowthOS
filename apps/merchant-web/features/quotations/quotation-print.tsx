'use client';

import { Button } from '@krinly/ui/components/button';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { quotationSubtotal, quotationTotal, type Lead, type Quotation } from '@/lib/preview/domain';
import { fullDate, inr } from '@/lib/preview/format';
import { BUSINESS } from '@/lib/preview/sample/scenario';

/**
 * The customer-facing quotation, styled to print or save as PDF from the browser (`window.print`).
 * A polished HTML preview is enough here — no PDF renderer is wired in for a prototype.
 */
export function QuotationPreviewDialog({
  quotation,
  lead,
  onClose,
}: {
  quotation: Quotation | null;
  lead: Lead | null;
  onClose: () => void;
}) {
  const subtotal = quotation ? quotationSubtotal(quotation) : 0;
  const total = quotation ? quotationTotal(quotation) : 0;

  return (
    <Dialog
      open={quotation !== null && lead !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {quotation && lead ? (
        <DialogContent
          size="lg"
          title="Quotation preview"
          footer={
            <>
              <Button variant="ghost" shape="pill" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="brand"
                shape="pill"
                onClick={() => {
                  window.print();
                }}
              >
                Print / save as PDF
              </Button>
            </>
          }
        >
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #quotation-print-area, #quotation-print-area * { visibility: visible; }
              #quotation-print-area { position: fixed; inset: 0; border: none; }
            }
          `}</style>
          <div
            id="quotation-print-area"
            className="rounded-2xl border border-line bg-white p-6 text-ink"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-4">
              <div>
                <p className="font-display text-xl font-bold">{BUSINESS.name}</p>
                <p className="text-sm text-ink-3">{BUSINESS.area}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-3">Quotation</p>
                <p className="tnum text-sm text-ink-3">{quotation.id.toUpperCase()}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold text-ink-3">Prepared for</p>
                <p className="font-semibold">{lead.latinName ?? lead.name}</p>
                <p className="text-ink-3">{lead.phone}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink-3">Valid until</p>
                <p>{fullDate(quotation.validUntil)}</p>
              </div>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold text-ink-3">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit price</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item) => (
                  <tr key={item.id} className="border-b border-line-soft">
                    <td className="py-2">{item.description}</td>
                    <td className="tnum py-2 text-right">{item.quantity}</td>
                    <td className="tnum py-2 text-right">{inr(item.unitPrice)}</td>
                    <td className="tnum py-2 text-right">{inr(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto grid w-56 gap-1 text-sm">
              <div className="flex justify-between text-ink-3">
                <span>Subtotal</span>
                <span className="tnum">{inr(subtotal)}</span>
              </div>
              {quotation.discount > 0 ? (
                <div className="flex justify-between text-ink-3">
                  <span>Discount</span>
                  <span className="tnum">− {inr(quotation.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-1 text-base font-bold">
                <span>Total</span>
                <span className="tnum">{inr(total)}</span>
              </div>
            </div>

            {quotation.note ? (
              <p className="mt-4 rounded-lg bg-canvas p-3 text-sm text-ink-2">{quotation.note}</p>
            ) : null}

            <p className="mt-6 text-xs text-ink-3">
              This is a preview from Krinly&rsquo;s development workspace — a prototype, not a sent
              or signed document.
            </p>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
