'use client';

import { useCallback, useMemo, useState } from 'react';
import { endOfDay } from '@/lib/clock';
import { type Lead, PIPELINE, type Stage, STAGE_LABEL } from '@/lib/domain';
import { dueInfo, inr, percent, plural, time, waited } from '@/lib/format';
import { resolveRange } from '@/lib/ranges';
import {
  appointmentsOn,
  awaitingVerification,
  boardColumns,
  filterLeads,
  followUpsDue,
  groupLeads,
  journey,
  lastCustomerMessages,
  lastInteractions,
  type LeadFilter,
  leadsById,
  leadSignals,
  needsReply,
  readyToBook,
  revenueSeries,
  SAVED_VIEWS,
  type SavedView,
  sourcePerformance,
  sumAmounts,
  verifiedBetween,
  viewColumns,
} from '@/lib/selectors';
import { SOURCES } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';
import { useLeadsQuery, useRangeParam } from '@/lib/url-state';
import type { IconName } from './icons';
import { useToast } from './toast';

// Shared view-models: both concepts present exactly the same numbers from the same store.

export function useTodayModel() {
  const { state } = useLab();
  const { range: rangeId, setRange } = useRangeParam();
  const { data, now } = state;

  const model = useMemo(() => {
    const range = resolveRange(rangeId, now);
    const verified = verifiedBetween(data, range.start, range.end);
    const previous = verifiedBetween(data, range.compareStart, range.compareEnd);
    const total = sumAmounts(verified);
    const compareTotal = sumAmounts(previous);
    const awaiting = awaitingVerification(data);
    const reply = needsReply(data);
    const ready = readyToBook(data);
    const followUps = followUpsDue(data, now);
    const appointments = appointmentsOn(data, now).filter(
      (a) => a.booking.start + a.booking.minutes * 60_000 >= now - 60 * 60_000,
    );
    const flow = journey(data, range.start, range.end);
    const sources = sourcePerformance(data, range);
    const series = revenueSeries(data, range);
    const byId = leadsById(data);
    const enquiries = flow.cohort.length;
    const previousEnquiries = data.leads.filter(
      (l) => l.createdAt >= range.compareStart && l.createdAt <= range.compareEnd,
    ).length;

    // Journey insight: the largest drop between consecutive decision steps.
    const steps = flow.steps;
    let drop: { from: (typeof steps)[number]; to: (typeof steps)[number]; lost: number } | null =
      null;
    for (let i = 1; i < steps.length - 1; i++) {
      const from = steps[i];
      const to = steps[i + 1];
      if (!from || !to || from.count === 0) continue;
      const lost = from.count - to.count;
      if (!drop || lost > drop.lost) drop = { from, to, lost };
    }

    // Source insight: where enquiries come from vs where verified money comes from.
    const byEnquiries = [...sources].sort((a, b) => b.enquiries - a.enquiries)[0];
    const byRevenue = [...sources].sort((a, b) => b.revenue - a.revenue)[0];
    let sourceInsight = '';
    if (byEnquiries && byRevenue && byEnquiries.enquiries > 0 && byRevenue.revenue > 0) {
      const customers = byRevenue.customers === 1 ? 'customer' : 'customers';
      sourceInsight =
        byEnquiries.source === byRevenue.source
          ? `${SOURCES[byEnquiries.source].label} brings the most enquiries and the most verified revenue.`
          : `${SOURCES[byEnquiries.source].label} brings the most enquiries (${byEnquiries.enquiries.toString()}); ${SOURCES[byRevenue.source].label.toLowerCase()} brings the most verified revenue (${inr(byRevenue.revenue)} from ${byRevenue.customers.toString()} ${customers}).`;
    }

    return {
      range,
      revenue: { total, payments: verified, compareTotal, delta: total - compareTotal },
      awaiting: { payments: awaiting, total: sumAmounts(awaiting) },
      enquiries: { count: enquiries, previous: previousEnquiries },
      reply,
      ready,
      readyValue: ready.reduce((sum, l) => sum + l.value, 0),
      followUps,
      appointments,
      journey: flow,
      journeyInsight: drop
        ? {
            text: `The biggest drop is from ${drop.from.label.toLowerCase()} to ${drop.to.label.toLowerCase()}: ${drop.to.count.toString()} of ${drop.from.count.toString()} moved on (${percent(drop.to.count, drop.from.count)}).`,
            stage: (drop.from.id === 'enquired' || drop.from.id === 'paid'
              ? 'interested'
              : drop.from.id) as Stage,
          }
        : null,
      sources,
      sourceInsight,
      series,
      byId,
      now,
      endOfToday: endOfDay(now),
    };
  }, [data, now, rangeId]);

  return { ...model, rangeId, setRange };
}

export type TodayModel = ReturnType<typeof useTodayModel>;

export function useLeadsModel(defaultView: 'list' | 'board') {
  const { state, dispatch } = useLab();
  const notify = useToast();
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
    const withoutView = filterLeads(data.leads, filter, now, true);
    const counts = Object.fromEntries(
      SAVED_VIEWS.map((v) => [
        v.id,
        filterLeads(data.leads, { ...filter, view: v.id }, now).length,
      ]),
    ) as Record<SavedView, number>;
    // The board shows every pipeline stage, so "Open" spans all of them there (Lost stays in the list).
    const boardSource = query.saved === 'open' || query.saved === 'all' ? withoutView : filtered;
    const last = lastInteractions(data);
    const lastCustomer = lastCustomerMessages(data);
    const trials = new Set(data.activities.filter((a) => a.kind === 'trial').map((a) => a.leadId));
    const signals = new Map(
      data.leads.map((l) => [l.id, leadSignals(l, lastCustomer.get(l.id), trials.has(l.id), now)]),
    );
    const byId = leadsById(data);
    return {
      filtered,
      groups: groupLeads(filtered, now),
      columns: boardColumns(boardSource, now),
      viewColumns: viewColumns(filtered, query.saved),
      counts,
      last,
      signals,
      byId,
      openValue: data.leads
        .filter((l) => PIPELINE.slice(0, 4).includes(l.stage))
        .reduce((sum, l) => sum + l.value, 0),
      openCount: data.leads.filter((l) => PIPELINE.slice(0, 4).includes(l.stage)).length,
      hasFilters:
        query.q !== '' ||
        query.stages.length > 0 ||
        query.sources.length > 0 ||
        query.owners.length > 0,
    };
  }, [data, now, query.saved, query.q, query.stages, query.sources, query.owners]);

  // Opening/closing applies instantly via a local override; the URL (Back, deep links, command menu)
  // takes over as soon as it changes, because the override only holds while the URL still shows the
  // value it replaced.
  const [override, setOverride] = useState<{ from: string | null; to: string | null } | null>(null);
  const leadId = override && override.from === query.lead ? override.to : query.lead;
  const selected = leadId ? model.byId.get(leadId) : undefined;

  const openLead = useCallback(
    (id: string) => {
      setOverride({ from: query.lead, to: id });
      setQuery({ lead: id }, 'push');
    },
    [setQuery, query.lead],
  );
  const closeLead = useCallback(() => {
    setOverride({ from: query.lead, to: null });
    setQuery({ lead: null }, 'replace');
  }, [setQuery, query.lead]);

  const changeStage = useCallback(
    (lead: Lead, to: Stage) => {
      if (to === lead.stage) return;
      if (to === 'lost') {
        setLostLead(lead);
        return;
      }
      dispatch({ type: 'changeStage', leadId: lead.id, to });
      notify({
        title: `${lead.latinName ?? lead.name} moved to ${STAGE_LABEL[to]}`,
        action: {
          label: 'Undo',
          onClick: () => {
            dispatch({ type: 'undo' });
          },
        },
      });
    },
    [dispatch, notify],
  );

  const clearFilters = useCallback(() => {
    setQuery({ q: '', stages: [], sources: [], owners: [] });
  }, [setQuery]);

  return {
    ...model,
    query,
    setQuery,
    selected,
    openLead,
    closeLead,
    changeStage,
    lostLead,
    setLostLead,
    clearFilters,
    now,
    data,
  };
}

export type LeadsModel = ReturnType<typeof useLeadsModel>;

// ─────────────────────────────────────────────────────────────── attention

export interface AttentionItem {
  key: string;
  icon: IconName;
  tone: 'attention' | 'critical' | 'calm' | 'good';
  title: string;
  meta: string;
  /** Part of the meta to emphasise (e.g. "Overdue by 2 days"). */
  emphasis?: string;
  leadIds: string[];
  action: { label: string; kind: 'link'; href: string } | { label: string; kind: 'verify' };
}

const first = (lead: Lead) => (lead.latinName ?? lead.name).split(' ')[0] ?? lead.name;

/** What needs the owner, in order of what to do first. Shared by both concepts. */
export function buildAttention(model: TodayModel, concept: 'a' | 'b' | 'g'): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { reply, ready, followUps, appointments, awaiting, now } = model;
  const oldest = reply[0];
  if (oldest?.awaitingReplySince !== undefined) {
    const names = reply.slice(0, 3).map(first);
    items.push({
      key: 'reply',
      icon: 'message',
      tone: 'attention',
      title: `${plural(reply.length, 'enquiry', 'enquiries')} ${reply.length === 1 ? 'needs' : 'need'} a reply`,
      meta: `${first(oldest)} has waited ${waited(oldest.awaitingReplySince, now)} · ${names.join(', ')}${
        reply.length > 3 ? ` and ${(reply.length - 3).toString()} more` : ''
      }`,
      leadIds: reply.map((l) => l.id),
      action: { label: 'Reply', kind: 'link', href: `/${concept}/leads?show=reply` },
    });
  }
  if (ready.length > 0) {
    items.push({
      key: 'ready',
      icon: 'check',
      tone: 'good',
      title: `${plural(ready.length, 'customer')} ${ready.length === 1 ? 'is' : 'are'} ready to book`,
      meta: `${inr(model.readyValue)} in quotations · ${ready.map(first).join(', ')}`,
      leadIds: ready.map((l) => l.id),
      action: { label: 'See them', kind: 'link', href: `/${concept}/leads?show=ready` },
    });
  }
  const top = followUps[0];
  if (top?.next) {
    const due = dueInfo(top.next.due, now);
    items.push({
      key: 'follow-top',
      icon: 'clock',
      tone: due.tone === 'overdue' ? 'critical' : 'attention',
      title: `Follow up with ${first(top)}`,
      meta: top.next.label,
      emphasis: due.label,
      leadIds: [top.id],
      action: { label: 'Open', kind: 'link', href: `/${concept}/leads?lead=${top.id}` },
    });
  }
  if (followUps.length > 1) {
    const rest = followUps.slice(1);
    items.push({
      key: 'follow-more',
      icon: 'clock',
      tone: 'calm',
      title: `${plural(rest.length, 'more follow-up', 'more follow-ups')} due`,
      meta: rest.map(first).join(', '),
      leadIds: rest.map((l) => l.id),
      action: { label: 'See all', kind: 'link', href: `/${concept}/leads?show=followup` },
    });
  }
  if (awaiting.payments.length > 0) {
    items.push({
      key: 'verify',
      icon: 'seal',
      tone: 'calm',
      title: `Verify ${plural(awaiting.payments.length, 'payment')}`,
      meta: `${inr(awaiting.total)} recorded by your team, not yet counted as revenue`,
      leadIds: awaiting.payments.map((p) => p.leadId),
      action: { label: 'Review', kind: 'verify' },
    });
  }
  const next = appointments[0];
  if (next) {
    items.push({
      key: 'appointments',
      icon: 'calendar',
      tone: 'calm',
      title: `${plural(appointments.length, 'appointment')} today`,
      meta: appointments.map((a) => `${time(a.booking.start)} ${first(a.lead)}`).join(' · '),
      leadIds: appointments.map((a) => a.lead.id),
      action: { label: 'Open', kind: 'link', href: `/${concept}/leads?lead=${next.lead.id}` },
    });
  }
  return items;
}
