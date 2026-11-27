'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { CohortProgression } from '@/features/common/cohort-progression';
import { inr, plural } from '@/lib/preview/format';
import type { GrowthModel } from '@/lib/preview/growth-model';

/**
 * Customer conversion: the enquiry-to-booking funnel for this cohort, the single biggest
 * bottleneck named in words, and the opportunities lost in the same window.
 */
export function ConversionSection({ model }: { model: GrowthModel }) {
  const { journey, bottleneck, lost, lostValue } = model;

  return (
    <Card padding="lg" aria-labelledby="growth-conversion-heading" className="min-w-0">
      <CardTitle id="growth-conversion-heading" className="text-xl">
        Customer conversion
      </CardTitle>
      <p className="mt-1 text-sm text-ink-2">
        {plural(journey.cohort.length, 'person', 'people')} who first enquired {model.range.phrase},
        and how far each stage carried them.
      </p>

      <div className="mt-5">
        <CohortProgression
          steps={journey.steps}
          headingId="growth-progression"
          insight={
            bottleneck && bottleneck.lost > 0
              ? `The biggest bottleneck is between ${bottleneck.from.label.toLowerCase()} and ${bottleneck.to.label.toLowerCase()}: ${bottleneck.lost} of ${bottleneck.from.count} didn't move on.`
              : 'No stage lost more people than the others this period.'
          }
        />
      </div>

      <div className="mt-6 border-t border-line-soft pt-5">
        <h3 className="font-display text-base font-semibold text-ink">Lost opportunities</h3>
        {lost.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon="check"
            title="Nothing lost this period"
            description="Every enquiry from this cohort is still open, booked or paid."
          />
        ) : (
          <p className="mt-2 text-[13.5px] text-ink-2">
            {plural(lost.length, 'lead')} marked lost, worth {inr(lostValue)} in quoted or estimated
            value — never counted as revenue, since nothing was collected.
          </p>
        )}
      </div>
    </Card>
  );
}
