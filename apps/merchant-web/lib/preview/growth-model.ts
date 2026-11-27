'use client';

import { useMemo } from 'react';
import { resolveRange } from './ranges';
import {
  averageVerifiedTransaction,
  awaitingVerification,
  journey,
  lostOpportunities,
  outstandingTotal,
  revenueSeries,
  sourcePerformance,
  sumAmounts,
  verifiedBetween,
} from './selectors';
import { SOURCE_IDS, SOURCES } from './sample/scenario';
import type { SourceId } from './domain';
import { usePreview } from './store';
import { useParam, useRangeParam } from './url-state';

// One view-model for Revenue Intelligence: every figure here is derived from the same dataset
// Today and the CRM already read, so none of these numbers can disagree with theirs.

export function useGrowthModel() {
  const { state } = usePreview();
  const { range: rangeId, setRange } = useRangeParam();
  const { value: sourceParam, setValue: setSourceParam } = useParam('source', '');
  const { data, now } = state;
  const source = (sourceParam === '' ? null : (sourceParam as SourceId)) ?? null;

  const model = useMemo(() => {
    const range = resolveRange(rangeId, now);
    const verified = verifiedBetween(data, range.start, range.end);
    const previousVerified = verifiedBetween(data, range.compareStart, range.compareEnd);
    const verifiedTotal = sumAmounts(verified);
    const compareTotal = sumAmounts(previousVerified);
    const awaiting = awaitingVerification(data);
    const outstanding = outstandingTotal(data);
    const avgTransaction = averageVerifiedTransaction(data, range);
    const flow = journey(data, range.start, range.end);
    const lost = lostOpportunities(data, range);
    const lostValue = lost.reduce((sum, { lead }) => sum + lead.value, 0);
    const series = revenueSeries(data, range);
    const allSources = sourcePerformance(data, range);
    const sources = source ? allSources.filter((row) => row.source === source) : allSources;

    const steps = flow.steps;
    const bottleneck = steps.reduce<{
      from: (typeof steps)[number];
      to: (typeof steps)[number];
      lost: number;
    } | null>((worst, step, i) => {
      const prev = steps[i - 1];
      if (!prev || prev.count === 0) return worst;
      const drop = prev.count - step.count;
      if (!worst || drop > worst.lost) return { from: prev, to: step, lost: drop };
      return worst;
    }, null);

    return {
      range,
      revenue: {
        verified: verifiedTotal,
        unverified: sumAmounts(awaiting),
        outstanding,
        avgTransaction,
        compareTotal,
        delta: verifiedTotal - compareTotal,
      },
      awaitingCount: awaiting.length,
      journey: flow,
      bottleneck,
      lost,
      lostValue,
      series,
      sources,
      allSources,
      sourceOptions: SOURCE_IDS.map((id) => ({ value: id, label: SOURCES[id].label })),
      now,
    };
  }, [data, now, rangeId, source]);

  return {
    ...model,
    rangeId,
    setRange,
    source,
    setSource: (next: SourceId | null) => {
      setSourceParam(next ?? '', 'push');
    },
  };
}

export type GrowthModel = ReturnType<typeof useGrowthModel>;
