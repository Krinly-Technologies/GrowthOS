import type { Activity, LabData } from '../domain';
import { inr } from '../format';
import { buildBackground } from './background';
import { buildStory } from './story';

export function paymentActivities(payment: LabData['payments'][number]): Activity[] {
  const entries: Activity[] = [
    {
      id: `${payment.id}-rec`,
      leadId: payment.leadId,
      at: payment.recordedAt,
      kind: 'payment',
      by: payment.recordedBy,
      text: `${payment.kind} of ${inr(payment.amount)} recorded · ${payment.method}`,
      amount: payment.amount,
    },
  ];
  if (payment.status === 'verified' && payment.verifiedAt !== undefined) {
    entries.push({
      id: `${payment.id}-ver`,
      leadId: payment.leadId,
      at: payment.verifiedAt,
      kind: 'payment',
      by: 'farah',
      text: `Verified ${inr(payment.amount)} ${payment.kind.toLowerCase()}`,
      amount: payment.amount,
    });
  }
  return entries;
}

/** The complete fictional dataset, identical on every load. */
export function createSeed(seed?: number): LabData {
  const story = buildStory();
  const background = buildBackground(seed);
  const data: LabData = {
    leads: [...story.leads, ...background.leads],
    activities: [...story.activities, ...background.activities],
    payments: [...story.payments, ...background.payments],
    bookings: [...story.bookings, ...background.bookings],
  };
  for (const payment of data.payments) data.activities.push(...paymentActivities(payment));
  data.activities.sort((a, b) => b.at - a.at);
  return data;
}
