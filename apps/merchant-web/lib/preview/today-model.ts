'use client';

import type { IconName } from '@krinly/ui/components/icon';
import { useMemo } from 'react';
import { bookingStatus, type Lead } from './domain';
import { dueInfo, inr, percent, plural, time, waited } from './format';
import { resolveRange } from './ranges';
import {
  appointmentsOn,
  awaitingVerification,
  followUpsDue,
  journey,
  leadsById,
  needsReply,
  readyToBook,
  revenueSeries,
  sourcePerformance,
  sumAmounts,
  verifiedBetween,
} from './selectors';
import { SOURCES } from './sample/scenario';
import { usePreview } from './store';
import { useRangeParam } from './url-state';

// One view-model for Today: every figure on the screen is derived here from one dataset, so the
// headline, the chart, the money split and the source table can never disagree.

export function useTodayModel() {
  const { state } = usePreview();
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
      (a) =>
        bookingStatus(a.booking) !== 'cancelled' &&
        a.booking.start + a.booking.minutes * 60_000 >= now - 60 * 60_000,
    );
    const flow = journey(data, range.start, range.end);
    const sources = sourcePerformance(data, range);
    const series = revenueSeries(data, range);
    const byId = leadsById(data);
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
      sourceInsight =
        byEnquiries.source === byRevenue.source
          ? `${SOURCES[byEnquiries.source].label} brings the most enquiries and the most verified revenue.`
          : `${SOURCES[byEnquiries.source].label} brings the most enquiries (${byEnquiries.enquiries}); ${SOURCES[byRevenue.source].label.toLowerCase()} brings the most verified revenue (${inr(byRevenue.revenue)} from ${plural(byRevenue.customers, 'customer')}).`;
    }

    return {
      range,
      revenue: { total, payments: verified, compareTotal, delta: total - compareTotal },
      /** Every payment in the workspace, for cohort questions that ignore the period. */
      allPayments: data.payments,
      awaiting: { payments: awaiting, total: sumAmounts(awaiting) },
      enquiries: { count: flow.cohort.length, previous: previousEnquiries },
      reply,
      ready,
      readyValue: ready.reduce((sum, l) => sum + l.value, 0),
      followUps,
      appointments,
      journey: flow,
      journeyInsight: drop
        ? `The biggest drop is from ${drop.from.label.toLowerCase()} to ${drop.to.label.toLowerCase()}: ${drop.to.count} of ${drop.from.count} moved on (${percent(drop.to.count, drop.from.count)}).`
        : null,
      sources,
      sourceInsight,
      series,
      byId,
      now,
    };
  }, [data, now, rangeId]);

  return { ...model, rangeId, setRange };
}

export type TodayModel = ReturnType<typeof useTodayModel>;

/* ── The prioritised action queue ────────────────────────────────────────── */

/** Which set of people an action is about. Opening one shows that list. */
export type AttentionGroup = 'reply' | 'ready' | 'followup' | 'appointments';

export interface AttentionItem {
  key: string;
  icon: IconName;
  tone: 'attention' | 'critical' | 'neutral' | 'verified';
  title: string;
  /** Why this is here, in words — never an unexplained score. */
  meta: string;
  /** Part of the meta to emphasise, e.g. "Overdue by 2 days". */
  emphasis?: string;
  leads: Lead[];
  action:
    { label: string; kind: 'group'; group: AttentionGroup } | { label: string; kind: 'verify' };
}

const first = (lead: Lead) => (lead.latinName ?? lead.name).split(' ')[0] ?? lead.name;

/** What needs the owner, in the order it should be done. */
export function buildAttention(model: TodayModel): AttentionItem[] {
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
        reply.length > 3 ? ` and ${reply.length - 3} more` : ''
      }`,
      leads: reply,
      action: { label: 'See who', kind: 'group', group: 'reply' },
    });
  }

  if (ready.length > 0) {
    items.push({
      key: 'ready',
      icon: 'check',
      tone: 'verified',
      title: `${plural(ready.length, 'customer')} ${ready.length === 1 ? 'is' : 'are'} ready to book`,
      meta: `${inr(model.readyValue)} in quotations · ${ready.map(first).join(', ')}`,
      leads: ready,
      action: { label: 'See them', kind: 'group', group: 'ready' },
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
      leads: [top],
      action: { label: 'Open', kind: 'group', group: 'followup' },
    });
  }
  if (followUps.length > 1) {
    const rest = followUps.slice(1);
    items.push({
      key: 'follow-more',
      icon: 'clock',
      tone: 'neutral',
      title: `${plural(rest.length, 'more follow-up')} due`,
      meta: rest.map(first).join(', '),
      leads: rest,
      action: { label: 'See all', kind: 'group', group: 'followup' },
    });
  }

  if (awaiting.payments.length > 0) {
    items.push({
      key: 'verify',
      icon: 'seal',
      tone: 'neutral',
      title: `Verify ${plural(awaiting.payments.length, 'payment')}`,
      meta: `${inr(awaiting.total)} recorded by your team, not yet counted as revenue`,
      leads: awaiting.payments.flatMap((p) => {
        const lead = model.byId.get(p.leadId);
        return lead ? [lead] : [];
      }),
      action: { label: 'Review', kind: 'verify' },
    });
  }

  if (appointments.length > 0) {
    items.push({
      key: 'appointments',
      icon: 'calendar',
      tone: 'neutral',
      title: `${plural(appointments.length, 'appointment')} today`,
      meta: appointments.map((a) => `${time(a.booking.start)} ${first(a.lead)}`).join(' · '),
      leads: appointments.map((a) => a.lead),
      action: { label: 'See the day', kind: 'group', group: 'appointments' },
    });
  }

  return items;
}
