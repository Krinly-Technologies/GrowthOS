'use client';

import { useMemo } from 'react';
import type { AcquisitionSource } from './acquisition';
import type { Lead } from './domain';
import { stageIndex } from './domain';
import { resolveRange } from './ranges';
import { furthestStage, journey, leadsById, sumAmounts, verifiedBetween } from './selectors';
import { usePreview } from './store';
import { useRangeParam } from './url-state';

// One view-model for the acquisition workspace. Every figure comes from the same fixtures Today
// uses, so the two screens agree on enquiries, customers and verified revenue.

export interface SourceStat {
  source: AcquisitionSource;
  /** New enquiries first attributed to this source in the period. */
  enquiries: number;
  previousEnquiries: number;
  /** Of those enquiries, how many reached Booked. */
  booked: number;
  /** Distinct customers whose payment was verified in the period. */
  customers: number;
  /** Verified revenue in the period, credited to where the customer first came from. */
  revenue: number;
  /** booked ÷ enquiries, or null when there were no enquiries. */
  conversion: number | null;
  /** Verified revenue ÷ paying customers, or null when nobody paid. */
  perCustomer: number | null;
}

export function useAcquisitionModel() {
  const { state } = usePreview();
  const { range: rangeId, setRange } = useRangeParam();
  const { data, now, sources, forms, links } = state;

  const model = useMemo(() => {
    const range = resolveRange(rangeId, now);
    const byId = leadsById(data);
    const verified = verifiedBetween(data, range.start, range.end);
    const inRange = (lead: Lead) => lead.createdAt >= range.start && lead.createdAt <= range.end;
    const inPrevious = (lead: Lead) =>
      lead.createdAt >= range.compareStart && lead.createdAt <= range.compareEnd;

    const stats: SourceStat[] = sources.map((source) => {
      const ours = (lead: Lead) =>
        source.leadSource !== undefined && lead.source === source.leadSource;
      const cohort = data.leads.filter((l) => ours(l) && inRange(l));
      const paid = verified.filter((p) => {
        const lead = byId.get(p.leadId);
        return lead ? ours(lead) : false;
      });
      const customers = new Set(paid.map((p) => p.leadId)).size;
      const revenue = sumAmounts(paid);
      const booked = cohort.filter(
        (l) => stageIndex(furthestStage(l)) >= stageIndex('booked'),
      ).length;
      return {
        source,
        enquiries: cohort.length,
        previousEnquiries: data.leads.filter((l) => ours(l) && inPrevious(l)).length,
        booked,
        customers,
        revenue,
        conversion: cohort.length > 0 ? booked / cohort.length : null,
        perCustomer: customers > 0 ? Math.round(revenue / customers) : null,
      };
    });

    const flow = journey(data, range.start, range.end);
    const enquiries = flow.cohort.length;
    const previousEnquiries = data.leads.filter(inPrevious).length;
    const revenue = sumAmounts(verified);
    const payingCustomers = new Set(verified.map((p) => p.leadId)).size;
    const ranked = [...stats]
      .filter((s) => s.enquiries > 0 || s.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue || b.enquiries - a.enquiries);

    return {
      range,
      stats,
      ranked,
      /** Sources with nothing attributed in the period — still listed, never hidden. */
      quiet: stats.filter((s) => s.enquiries === 0 && s.revenue === 0),
      flow,
      totals: {
        enquiries,
        previousEnquiries,
        enquiryDelta: enquiries - previousEnquiries,
        revenue,
        payingCustomers,
        booked: flow.steps.find((s) => s.id === 'booked')?.count ?? 0,
      },
      forms,
      links,
      sources,
      byId,
      now,
    };
  }, [data, now, rangeId, sources, forms, links]);

  return { ...model, rangeId, setRange };
}

export type AcquisitionModel = ReturnType<typeof useAcquisitionModel>;
