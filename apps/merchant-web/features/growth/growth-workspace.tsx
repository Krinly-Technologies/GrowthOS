'use client';

import type { GrowthModel } from '@/lib/preview/growth-model';
import { ConversionSection } from './conversion-section';
import { RevenueOverview } from './revenue-overview';
import { SourcePerformance } from './source-performance';

/**
 * Growth: revenue intelligence built entirely from data Today, the CRM, Bookings, Quotations and
 * Payments already produce. Nothing here is a second dataset — see `growth-model.ts`.
 */
export function GrowthWorkspace({
  model,
  onReviewPayments,
}: {
  model: GrowthModel;
  onReviewPayments: () => void;
}) {
  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <RevenueOverview model={model} onReviewPayments={onReviewPayments} />
      <ConversionSection model={model} />
      <SourcePerformance model={model} />
    </div>
  );
}
