import type { JourneyStep } from '@/lib/preview/selectors';
import { percent } from '@/lib/preview/format';

/**
 * How far a named cohort got, step by step. Each step says what share of the whole cohort and
 * what share of the step before it reached — so a drop is visible without a chart. Used on Today
 * beside The Flow and on the acquisition overview.
 */
export function CohortProgression({
  steps,
  headingId,
  label = 'How far this cohort got',
  insight,
}: {
  steps: readonly JourneyStep[];
  headingId: string;
  label?: string;
  insight?: string | null;
}) {
  const base = steps[0]?.count ?? 0;
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="font-display text-base font-semibold text-ink">
        {label}
      </h3>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" data-testid="cohort-steps">
        {steps.map((step, i) => {
          const previous = steps[i - 1]?.count;
          return (
            <li key={step.id} className="min-w-0 rounded-lg bg-canvas px-3 py-2.5">
              <p className="truncate text-[12.5px] font-semibold text-ink-3">{step.label}</p>
              <p className="tnum mt-0.5 text-lg font-bold text-ink">{step.count}</p>
              <p className="text-[12px] text-ink-3">
                {i === 0
                  ? 'the whole cohort'
                  : `${percent(step.count, base)} of enquiries${
                      previous !== undefined && previous > 0
                        ? ` · ${percent(step.count, previous)} of the step before`
                        : ''
                    }`}
              </p>
            </li>
          );
        })}
      </ol>
      {insight ? <p className="mt-3 text-[13.5px] text-ink-2">{insight}</p> : null}
    </section>
  );
}
