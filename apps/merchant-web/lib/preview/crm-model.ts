'use client';

import { useMemo, useState } from 'react';
import { PIPELINE, type Lead, type Stage } from './domain';
import {
  filterLeads,
  groupLeads,
  type LeadFilter,
  lastCustomerMessages,
  lastInteractions,
  leadsById,
  leadSignals,
  SAVED_VIEWS,
  type SavedView,
  viewColumns,
} from './selectors';
import { usePreview } from './store';
import { useLeadsQuery } from './url-state';

// One view-model for the CRM workspace (list + pipeline): the same leads, the same counts,
// whichever layout is on screen. Built from the same fixtures Today and Acquisition use, so a
// stage change or a new lead here is reflected there immediately.

export function useCrmModel(defaultView: 'list' | 'board') {
  const { state } = usePreview();
  const { query, setQuery } = useLeadsQuery(defaultView);
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const { data, now } = state;

  const model = useMemo(() => {
    const filter: LeadFilter = {
      view: query.saved,
      q: query.q,
      stages: query.stages,
      sources: query.sources,
      owners: query.owners,
    };
    const filtered = filterLeads(data.leads, filter, now);
    const counts = Object.fromEntries(
      SAVED_VIEWS.map((v) => [
        v.id,
        filterLeads(data.leads, { ...filter, view: v.id }, now).length,
      ]),
    ) as Record<SavedView, number>;
    const last = lastInteractions(data);
    const lastCustomer = lastCustomerMessages(data);
    const trials = new Set(data.activities.filter((a) => a.kind === 'trial').map((a) => a.leadId));
    const signals = new Map(
      data.leads.map((l) => [l.id, leadSignals(l, lastCustomer.get(l.id), trials.has(l.id), now)]),
    );
    const byId = leadsById(data);
    const openStages: readonly Stage[] = PIPELINE.slice(0, 4);
    return {
      filtered,
      groups: groupLeads(filtered, now),
      viewColumns: viewColumns(filtered, query.saved),
      counts,
      last,
      signals,
      byId,
      openValue: data.leads
        .filter((l) => openStages.includes(l.stage))
        .reduce((sum, l) => sum + l.value, 0),
      openCount: data.leads.filter((l) => openStages.includes(l.stage)).length,
      hasFilters:
        query.q !== '' ||
        query.stages.length > 0 ||
        query.sources.length > 0 ||
        query.owners.length > 0,
    };
  }, [data, now, query.saved, query.q, query.stages, query.sources, query.owners]);

  const leadId = query.lead;
  const selected = leadId ? model.byId.get(leadId) : undefined;

  const openLead = (leadIdToOpen: string) => {
    setQuery({ lead: leadIdToOpen }, 'push');
  };
  const closeLead = () => {
    setQuery({ lead: null }, 'replace');
  };
  const clearFilters = () => {
    setQuery({ q: '', stages: [], sources: [], owners: [] });
  };

  return {
    ...model,
    query,
    setQuery,
    selected,
    openLead,
    closeLead,
    clearFilters,
    lostLead,
    setLostLead,
    now,
    data,
  };
}

export type CrmModel = ReturnType<typeof useCrmModel>;
